import { FastMCP, type Tool } from 'fastmcp';
import { z } from 'zod';
import { Course } from '../models/Course';
import { Quiz } from '../models/Quiz';
import { User } from '../models/User';
import { getEnhancedAIService } from '../services/enhanced-ai.service';
import { logger } from '../utils/logger';

// Create the FastMCP server instance.
const mcpServer = new FastMCP({
    name: 'profense-mcp',
    version: '1.0.0',
});

// --- Tool 1: Evaluate Quiz ---
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
                // Questions use 'id' field, not '_id'
                const question = quiz.questions.find((q: any) => q.id === userAnswer.questionId);
                if (question) {
                    let isCorrect = false;
                    let correctAnswer = '';

                    // Handle different question types
                    if (question.type === 'multiple-choice') {
                        // For multiple choice, find the correct option
                        const correctOption = question.options?.find((opt: any) => opt.isCorrect);
                        correctAnswer = correctOption?.text || correctOption?.id || '';
                        isCorrect = userAnswer.answer === correctOption?.id || userAnswer.answer === correctOption?.text;
                    } else {
                        // For other types (numerical, text, true-false), use correctAnswer field
                        correctAnswer = question.correctAnswer || '';
                        isCorrect = correctAnswer.trim().toLowerCase() === userAnswer.answer.trim().toLowerCase();
                    }

                    if (isCorrect) {
                        score++;
                    }
                    
                    feedbackItems.push({
                        question: question.question,
                        userAnswer: userAnswer.answer,
                        correctAnswer: correctAnswer,
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

// --- Tool 2: Generate Personalized Learning Path ---
const generateLearningPathSchema = z.object({
    userId: z.string().describe("The ID of the user."),
    goalTopic: z.string().describe("The topic the user wants to learn."),
    timeframe: z.number().optional().describe("Days available for learning (optional)."),
});

const generateLearningPathTool = {
    name: 'generate_learning_path',
    description: 'Generates a personalized learning path based on user\'s current knowledge, goals, and weak areas.',
    schema: generateLearningPathSchema,
    handler: async ({ userId, goalTopic, timeframe }) => {
        const aiService = getEnhancedAIService();
        try {
            // Get user's knowledge and progress
            const user = await User.findById(userId).populate('enrolledCourses');
            if (!user) {
                return { success: false, message: 'User not found.' };
            }

            // Get user's quiz history to identify weak areas
            const quizAttempts = await Quiz.find({ userId }).sort({ createdAt: -1 }).limit(10);
            
            // Analyze weak areas from quiz performance
            const weakAreas: string[] = [];
            quizAttempts.forEach((quiz: any) => {
                if (quiz.score && quiz.score.percentage < 70) {
                    weakAreas.push(quiz.subject || quiz.title);
                }
            });

            // Get enrolled courses for context
            const enrolledCourses = user.enrolledCourses.map((course: any) => ({
                title: course.title,
                subject: course.subject,
                difficulty: course.difficulty
            }));

            // Build context for AI
            const context = {
                currentKnowledge: enrolledCourses.map((c: any) => c.title).join(', '),
                weakAreas: weakAreas.join(', ') || 'None identified',
                goalTopic,
                timeframe: timeframe || 'flexible',
                educationLevel: user.educationLevel,
                preferredSubjects: user.preferredSubjects.join(', ')
            };

            const prompt = `You are an expert educational advisor. Create a personalized learning path for a student.

**Student Profile:**
- Current Knowledge: ${context.currentKnowledge || 'Beginner level'}
- Weak Areas: ${context.weakAreas}
- Goal: Learn ${goalTopic}
- Timeframe: ${timeframe ? `${timeframe} days` : 'Flexible schedule'}
- Education Level: ${context.educationLevel}
- Interests: ${context.preferredSubjects || 'General'}

IMPORTANT: Return ONLY a valid JSON object with NO additional text before or after. Do not include explanations, greetings, or any text outside the JSON structure.

Required JSON structure:
{
  "prerequisites": ["topic1", "topic2"],
  "phases": [
    {
      "phase": 1,
      "title": "Foundation",
      "duration": "X days",
      "topics": ["topic1", "topic2"],
      "objectives": ["objective1", "objective2"]
    }
  ],
  "estimatedTotalTime": "X days",
  "recommendations": ["tip1", "tip2"]
}`;

            const aiResponse = await aiService.generateStructuredJSON(prompt);

            // Parse AI response - extract JSON more robustly
            let learningPath;
            try {
                // Try to find JSON in the response using multiple patterns
                let jsonText = aiResponse.content.trim();
                
                // Remove markdown code blocks if present
                jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
                
                // Find the first { and last } to extract JSON
                const firstBrace = jsonText.indexOf('{');
                const lastBrace = jsonText.lastIndexOf('}');
                
                if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                    jsonText = jsonText.substring(firstBrace, lastBrace + 1);
                    learningPath = JSON.parse(jsonText);
                    
                    // Validate required fields
                    if (!learningPath.phases || !Array.isArray(learningPath.phases)) {
                        throw new Error('Invalid learning path structure: missing phases array');
                    }
                } else {
                    throw new Error('No valid JSON found in response');
                }
            } catch (parseError: any) {
                logger.error('Failed to parse learning path JSON:', parseError);
                // Return a fallback structure
                learningPath = {
                    prerequisites: [],
                    phases: [
                        {
                            phase: 1,
                            title: `Introduction to ${goalTopic}`,
                            duration: `${Math.ceil((timeframe || 7) / 3)} days`,
                            topics: [`Fundamentals of ${goalTopic}`, `Key concepts and terminology`],
                            objectives: [`Understand basic ${goalTopic} principles`, `Build foundational knowledge`]
                        },
                        {
                            phase: 2,
                            title: `Core ${goalTopic} Concepts`,
                            duration: `${Math.ceil((timeframe || 7) / 3)} days`,
                            topics: [`Advanced topics in ${goalTopic}`, `Practical applications`],
                            objectives: [`Apply ${goalTopic} concepts`, `Develop problem-solving skills`]
                        },
                        {
                            phase: 3,
                            title: `Mastering ${goalTopic}`,
                            duration: `${Math.ceil((timeframe || 7) / 3)} days`,
                            topics: [`Expert-level ${goalTopic}`, `Real-world projects`],
                            objectives: [`Master ${goalTopic} techniques`, `Complete practical projects`]
                        }
                    ],
                    estimatedTotalTime: `${timeframe || 7} days`,
                    recommendations: [`Practice regularly`, `Review fundamentals`, `Apply concepts to real problems`]
                };
            }

            logger.info(`Learning path generated for user ${userId}, goal: ${goalTopic}`);

            return {
                success: true,
                learningPath,
                userContext: context
            };
        } catch (error: any) {
            logger.error(`Error generating learning path for user ${userId}:`, error);
            return { success: false, message: `Error generating learning path: ${error.message}` };
        }
    },
};

// --- Tool 3: Generate Practice Problems ---
const generatePracticeProblemsSchema = z.object({
    topic: z.string().describe("The topic for which to generate practice problems."),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe("Difficulty level."),
    count: z.number().min(1).max(10).describe("Number of problems to generate (1-10)."),
    userId: z.string().describe("The ID of the user (to personalize based on past performance)."),
});

const generatePracticeProblemsTool = {
    name: 'generate_practice_problems',
    description: 'Generates personalized practice problems targeting student\'s weak areas.',
    schema: generatePracticeProblemsSchema,
    handler: async ({ topic, difficulty, count, userId }) => {
        const aiService = getEnhancedAIService();
        try {
            // Get user's past quiz performance on this topic
            const pastQuizzes = await Quiz.find({
                userId,
                $or: [
                    { subject: new RegExp(topic, 'i') },
                    { title: new RegExp(topic, 'i') }
                ]
            }).sort({ createdAt: -1 }).limit(5);

            // Identify common mistakes
            const commonMistakes: string[] = [];
            pastQuizzes.forEach((quiz: any) => {
                if (quiz.questions) {
                    quiz.questions.forEach((q: any) => {
                        if (q.userAnswer && q.userAnswer !== q.correctAnswer) {
                            commonMistakes.push(q.question);
                        }
                    });
                }
            });

            const prompt = `Generate ${count} practice problems about "${topic}" at ${difficulty} level.

${commonMistakes.length > 0 ? `Focus on these areas where the student struggled:
${commonMistakes.slice(0, 3).map((m, i) => `${i + 1}. ${m}`).join('\n')}` : ''}

Return ONLY a JSON array. No other text.

Example format:
[
  {
    "question": "Solve: dy/dx + 2y = 4x",
    "type": "multiple-choice",
    "options": ["y = 2x - 1 + Ce^(-2x)", "y = 2x + Ce^(2x)", "y = x^2 + C", "y = 4x + C"],
    "correctAnswer": "y = 2x - 1 + Ce^(-2x)",
    "explanation": "Using integrating factor method: μ(x) = e^(2x), multiply both sides, integrate.",
    "difficulty": "${difficulty}",
    "hints": ["Find the integrating factor", "Multiply through and integrate"]
  }
]

Generate ${count} unique, solvable problems with real mathematical content.`;

            const aiResponse = await aiService.generateStructuredJSON(prompt);

            logger.info(`AI Response for practice problems (first 200 chars): ${aiResponse.content.substring(0, 200)}`);

            // Parse AI response - extract JSON array more robustly
            let problems;
            let usedFallback = false;
            try {
                let jsonText = aiResponse.content.trim();
                
                // Remove markdown code blocks
                jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
                
                // Find the first [ and last ] to extract JSON array
                const firstBracket = jsonText.indexOf('[');
                const lastBracket = jsonText.lastIndexOf(']');
                
                if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                    jsonText = jsonText.substring(firstBracket, lastBracket + 1);
                    problems = JSON.parse(jsonText);
                    
                    // Validate array
                    if (!Array.isArray(problems) || problems.length === 0) {
                        throw new Error('Invalid problems structure');
                    }
                    
                    logger.info(`Successfully parsed ${problems.length} practice problems`);
                } else {
                    throw new Error('No valid JSON array found');
                }
            } catch (parseError: any) {
                logger.error('Failed to parse practice problems JSON:', parseError);
                logger.error('Raw AI response:', aiResponse.content);
                usedFallback = true;
                
                // Return fallback problems
                problems = Array.from({ length: count }, (_, i) => ({
                    question: `Practice problem ${i + 1} for ${topic}`,
                    type: 'multiple-choice',
                    options: ['Option A', 'Option B', 'Option C', 'Option D'],
                    correctAnswer: 'Option A',
                    explanation: `This is a ${difficulty} level problem about ${topic}.`,
                    difficulty: difficulty,
                    hints: [`Review ${topic} fundamentals`, 'Consider the key concepts']
                }));
            }

            logger.info(`Generated ${problems.length} practice problems for ${topic} (${difficulty})${usedFallback ? ' (USING FALLBACK)' : ''}`);

            return {
                success: true,
                problems,
                topic,
                difficulty,
                personalizedForWeaknesses: commonMistakes.length > 0,
                usingFallback: usedFallback
            };
        } catch (error: any) {
            logger.error(`Error generating practice problems:`, error);
            return { success: false, message: `Error: ${error.message}` };
        }
    },
};

// --- Tool 4: Find Concept Connections ---
const findConceptConnectionsSchema = z.object({
    currentTopic: z.string().describe("The topic the user is currently studying."),
    userId: z.string().describe("The ID of the user."),
});

const findConceptConnectionsTool = {
    name: 'find_concept_connections',
    description: 'Finds connections between the current topic and other topics the user knows or should learn.',
    schema: findConceptConnectionsSchema,
    handler: async ({ currentTopic, userId }) => {
        const aiService = getEnhancedAIService();
        try {
            // Get user's knowledge base
            const user = await User.findById(userId).populate('enrolledCourses');
            if (!user) {
                return { success: false, message: 'User not found.' };
            }

            // Get courses user has completed or is enrolled in
            const knownTopics = user.enrolledCourses
                .map((course: any) => course.topics?.map((t: any) => t.title) || [])
                .flat();

            const prompt = `You are an expert educational advisor. Analyze the topic **"${currentTopic}"** and find connections.

**Student's Known Topics**: ${knownTopics.length > 0 ? knownTopics.join(', ') : 'Beginner level'}

IMPORTANT: Return ONLY valid JSON with NO text before or after. No explanations.

Required JSON structure:
{
  "prerequisitesConcepts": [
    {"topic": "Topic name", "reason": "Why needed first", "userKnows": true}
  ],
  "relatedConcepts": [
    {"topic": "Topic name", "connection": "How it relates", "userKnows": false}
  ],
  "nextTopics": [
    {"topic": "Topic name", "reason": "Why learn this next"}
  ],
  "practicalApplications": ["Real-world use 1", "Real-world use 2"]
}`;

            const aiResponse = await aiService.generateStructuredJSON(prompt);

            // Parse AI response - extract JSON robustly
            let connections;
            try {
                let jsonText = aiResponse.content.trim();
                
                // Remove markdown code blocks
                jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
                
                // Find the first { and last }
                const firstBrace = jsonText.indexOf('{');
                const lastBrace = jsonText.lastIndexOf('}');
                
                if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                    jsonText = jsonText.substring(firstBrace, lastBrace + 1);
                    connections = JSON.parse(jsonText);
                } else {
                    throw new Error('No valid JSON found');
                }
            } catch (parseError: any) {
                logger.error('Failed to parse concept connections JSON:', parseError);
                // Return fallback structure
                connections = {
                    prerequisitesConcepts: [
                        { topic: 'Basic concepts', reason: 'Foundation for understanding', userKnows: false }
                    ],
                    relatedConcepts: [
                        { topic: `Related to ${currentTopic}`, connection: 'Similar concepts', userKnows: false }
                    ],
                    nextTopics: [
                        { topic: `Advanced ${currentTopic}`, reason: 'Natural progression' }
                    ],
                    practicalApplications: [`Apply ${currentTopic} in real projects`]
                };
            }

            logger.info(`Found concept connections for ${currentTopic}, user ${userId}`);

            return {
                success: true,
                currentTopic,
                connections,
                knownTopicsCount: knownTopics.length
            };
        } catch (error: any) {
            logger.error(`Error finding concept connections:`, error);
            return { success: false, message: `Error: ${error.message}` };
        }
    },
};

// Add tools to MCP server
mcpServer.addTool(evaluateQuizTool as any);
mcpServer.addTool(generateLearningPathTool as any);
mcpServer.addTool(generatePracticeProblemsTool as any);
mcpServer.addTool(findConceptConnectionsTool as any);

// Export the configured server instance and tool handlers
export { 
    mcpServer,
    evaluateQuizTool,
    generateLearningPathTool,
    generatePracticeProblemsTool,
    findConceptConnectionsTool
};
