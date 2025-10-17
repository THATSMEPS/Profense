import { FastMCP, type Tool } from 'fastmcp';
import { z } from 'zod';
import { Course } from '../models/Course';
import { ChatSession } from '../models/ChatSession';
import { Quiz } from '../models/Quiz';
import { getEnhancedAIService } from '../services/enhanced-ai.service';
import { logger } from '../utils/logger';

// Create the FastMCP server instance.
const mcpServer = new FastMCP({
    name: 'profense-mcp',
    version: '1.0.0',
});

// --- Tool 1: Manage Chat Context ---
const manageChatContextSchema = z.object({
    sessionId: z.string().describe("The ID of the chat session."),
    newMessage: z.string().describe("The new message to add to the context."),
    userId: z.string().describe("The ID of the user."),
});

const manageChatContextTool = {
    name: 'manage_chat_context',
    description: 'Manages chat history for a session, retains context, and creates summaries for long conversations.',
    schema: manageChatContextSchema,
    handler: async ({ sessionId, newMessage, userId }) => {
        const aiService = getEnhancedAIService();
        try {
            let session = await ChatSession.findById(sessionId);
            if (!session) {
                // If no session exists, create a new one.
                session = new ChatSession({ _id: sessionId, userId, messages: [], summary: '' });
            }
            // Cast to 'any' to satisfy Mongoose sub-document creation requirements
            session.messages.push({ isUser: true, content: newMessage, timestamp: new Date() } as any);

            // To keep the context manageable and efficient, summarize the conversation if it gets too long.
            if (session.messages.length > 20) {
                const history = session.messages.map(msg => `${msg.isUser ? 'User' : 'Assistant'}: ${msg.content}`).join('\n');
                const summaryPrompt = `Please summarize the following educational conversation concisely:\n\n${history}`;
                const summaryResponse = await aiService.generateTeachingResponse(summaryPrompt, { currentTopic: 'summary', sessionId });
                const summary = summaryResponse.content;
                (session as any).summary = summary;
                // Keep only the most recent messages to avoid an ever-growing context window.
                session.messages = session.messages.slice(-10);
            }

            await session.save();
            logger.info(`Chat context managed for session: ${sessionId}`);
            return { success: true, message: 'Chat context managed successfully.' };
        } catch (error: any) {
            logger.error(`Error managing chat context for session ${sessionId}:`, error);
            return { success: false, message: `Error managing chat context: ${error.message}` };
        }
    },
};

// --- Tool 2: Content Moderation ---
const moderateContentSchema = z.object({
    userInput: z.string().describe("The user's search query or message."),
    courseId: z.string().describe("The ID of the course to check against for relevance."),
});

const moderateContentTool = {
    name: 'moderate_content',
    description: 'Moderates user input to ensure it is relevant to the course content.',
    schema: moderateContentSchema,
    handler: async ({ userInput, courseId }) => {
        const aiService = getEnhancedAIService();
        try {
            const course = await Course.findById(courseId).select('topics.title');
            if (!course) {
                return { isRelevant: false, reason: 'Course not found.' };
            }

            const courseTopics = course.topics.map(t => t.title).join(', ');
            const prompt = `Is the following query: "${userInput}" directly related to these topics: "${courseTopics}"? Please answer with only "yes" or "no".`;

            const moderationResponse = await aiService.generateTeachingResponse(prompt, { currentTopic: 'moderation', courseId });

            if (moderationResponse.content.toLowerCase().trim().includes('no')) {
                logger.warn(`Off-topic query detected for course ${courseId}: "${userInput}"`);
                return {
                    isRelevant: false,
                    reason: 'The query appears to be off-topic. Please stick to subjects related to the course.',
                    suggestedTopics: course.topics.map(t => t.title).slice(0, 5),
                };
            }

            return { isRelevant: true };
        } catch (error: any) {
            logger.error(`Error during content moderation for course ${courseId}:`, error);
            return { isRelevant: false, reason: `An error occurred during moderation: ${error.message}` };
        }
    },
};

// --- Tool 3: Evaluate Quiz ---
const evaluateQuizSchema = z.object({
    quizId: z.string().describe("The ID of the quiz being evaluated."),
    answers: z.array(z.object({
        questionId: z.string(),
        answer: z.string(),
    })).describe("The user's answers to the quiz questions."),
     userId: z.string().describe("The ID of the user who took the quiz."),
});

const evaluateQuizTool = {
    name: 'evaluate_quiz',
    description: 'Evaluates a user\'s quiz submission, providing a score and detailed feedback.',
    schema: evaluateQuizSchema,
    handler: async ({ quizId, answers, userId }) => {
        const aiService = getEnhancedAIService();
        try {
            const quiz = await Quiz.findById(quizId).populate('questions');
            if (!quiz) {
                return { success: false, message: 'Quiz not found.' };
            }

            let score = 0;
            const feedbackItems: any[] = [];

            for (const userAnswer of answers) {
                const question = quiz.questions.find((q: any) => q._id.toString() === userAnswer.questionId);
                if (question && question.correctAnswer) {
                    const isCorrect = question.correctAnswer.trim().toLowerCase() === userAnswer.answer.trim().toLowerCase();
                    if (isCorrect) {
                        score++;
                    }
                    feedbackItems.push({
                        question: question.question,
                        userAnswer: userAnswer.answer,
                        correctAnswer: question.correctAnswer,
                        isCorrect,
                    });
                }
            }

            const finalScore = quiz.questions.length > 0 ? (score / quiz.questions.length) * 100 : 0;

            const feedbackPrompt = `A student with user ID ${userId} just completed the quiz "${quiz.title}" and scored ${finalScore.toFixed(2)}%. Here are their results: ${JSON.stringify(feedbackItems)}. Please provide brief, encouraging, and constructive feedback based on their performance.`;
            const detailedFeedbackResponse = await aiService.generateTeachingResponse(feedbackPrompt, { currentTopic: 'quiz_feedback', quizId });
            const detailedFeedback = detailedFeedbackResponse.content;
            
            logger.info(`Quiz ${quizId} evaluated for user ${userId}. Score: ${finalScore}`);

            return {
                success: true,
                score: finalScore,
                feedback: feedbackItems,
                detailedFeedback,
            };
        } catch (error: any) {
            logger.error(`Error evaluating quiz ${quizId} for user ${userId}:`, error);
            return { success: false, message: `Error evaluating quiz: ${error.message}` };
        }
    },
};

// Add all defined tools to the MCP server instance.
mcpServer.addTool(manageChatContextTool as any);
mcpServer.addTool(moderateContentTool as any);
mcpServer.addTool(evaluateQuizTool as any);

// Export the configured server instance for use in the main application.
export { mcpServer };
