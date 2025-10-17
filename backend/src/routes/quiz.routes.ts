import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, APIResponse, IChatSession } from '../types';
// import { getAIService } from '../services/ai.service';
import { getEnhancedAIService } from '../services/enhanced-ai.service';
import { mcpClient } from '../mcp/client';
import { logger } from '../utils/logger';
import { Quiz } from '../models/Quiz';
import { ChatSession } from '../models/ChatSession';
import { Document } from 'mongoose';

const router = express.Router();

// Helper function to get a grade from a percentage
const getGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};

/**
 * @route   POST /api/quiz/generate
 * @desc    Generate AI-powered quiz based on chat context
 * @access  Private
 */
router.post('/generate', asyncHandler(async (req: AuthRequest, res) => {
  const { 
    sessionId, 
    subject, 
    topic, 
    difficulty = 'intermediate', 
    questionCount: requestedQuestionCount = 5,
    questionTypes = ['multiple-choice', 'numerical', 'text']
  } = req.body;
  
  // Cap question count to prevent AI response truncation
  const questionCount = Math.min(requestedQuestionCount, 6);
  
  if (!sessionId && !subject) {
    return res.status(400).json({
      success: false,
      error: 'Either sessionId or subject is required'
    });
  }
  
  try {
    let conversationContext = '';
    let conceptsCovered: string[] = [];
    let chatSession: (Document<unknown, {}, IChatSession> & IChatSession) | null = null;
    
    // Get context from chat session if provided
    if (sessionId) {
      chatSession = await ChatSession.findOne({
        _id: sessionId,
        userId: req.user!.id
      });
      
      if (chatSession) {
        const contextSummary = chatSession.getContextSummary();
        conversationContext = contextSummary.recentMessages
          .map(msg => `${msg.isUser ? 'Student' : 'Tutor'}: ${msg.content}`)
          .join('\n');
        conceptsCovered = contextSummary.conceptsCovered || [];
      }
    }
    
    // Use enhanced AI service for quiz generation
    const aiService = getEnhancedAIService();
    
    // Ensure MCP client is connected for context management
    if (!mcpClient.isClientConnected()) {
      await mcpClient.connect();
    }
    
    // Generate quiz using AI
    const quizData = await aiService.generateQuiz({
      subject: subject || chatSession?.subject || 'General',
      topic: topic || chatSession?.currentTopic || 'Mixed Topics',
      difficulty: difficulty as any,
      questionCount,
      questionTypes: questionTypes as any[],
      conversationContext,
      conceptsCovered,
      userId: req.user!.id
    });
    
    // Create quiz in database
    const quiz = new Quiz({
      title: quizData.title || `${subject || 'Generated'} Quiz`,
      description: quizData.description || `AI-generated quiz based on your learning session`,
      subject: subject || chatSession?.subject || 'General',
      topic: topic || chatSession?.currentTopic,
      difficulty: difficulty as any,
      questions: quizData.questions,
      timeLimit: questionCount * 2, // 2 minutes per question
      passingScore: 70,
      maxAttempts: 3,
      createdBy: {
        userId: req.user!.id,
        type: 'ai'
      },
      generationContext: {
        chatSessionId: sessionId || undefined,
        conversationSummary: conversationContext.substring(0, 1000), // Limit length
        conceptsCovered,
        aiModel: 'gemini-2.5-flash',
        generatedAt: new Date()
      },
      isActive: true,
      tags: [subject, topic, difficulty].filter(Boolean).map(t => t.toLowerCase())
    });
    
    await quiz.save();
    
    // Update chat session to reference this quiz
    if (chatSession) {
      chatSession.quizzesGenerated.push(quiz._id);
      await chatSession.save();
    }
    
    logger.info(`Quiz generated for user ${req.user!.id}:`, {
      quizId: quiz._id,
      sessionId,
      questionCount: quiz.questions.length,
      difficulty,
      subject
    });
    
    const response: APIResponse = {
      success: true,
      data: {
        quiz: {
          id: quiz._id,
          title: quiz.title,
          description: quiz.description,
          subject: quiz.subject,
          topic: quiz.topic,
          difficulty: quiz.difficulty,
          questionCount: quiz.questions.length,
          timeLimit: quiz.timeLimit,
          questions: quiz.questions.map(q => ({
            id: q.id,
            type: q.type,
            question: q.question,
            options: q.options,
            difficulty: q.difficulty,
            points: q.points,
            timeEstimate: q.timeEstimate,
            hints: q.hints
          })) // Don't send correct answers to frontend
        }
      },
      message: 'Quiz generated successfully'
    };
    
    res.json(response);
    
  } catch (error) {
    logger.error('Error generating quiz:', error);
    const response: APIResponse = {
      success: false,
      error: 'Failed to generate quiz'
    };
    res.status(500).json(response);
  }
}));

/**
 * @route   POST /api/quiz/:quizId/submit
 * @desc    Submit quiz answers and get AI analysis
 * @access  Private
 */
router.post('/:quizId/submit', asyncHandler(async (req: AuthRequest, res) => {
  const { quizId } = req.params;
  const { answers, timeSpent } = req.body;
  
  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({
      success: false,
      error: 'Answers array is required'
    });
  }
  
  try {
    const quiz = await Quiz.findById(quizId);
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }
    
    // Check if user can attempt this quiz
    if (!quiz.canUserAttempt(req.user!.id)) {
      return res.status(400).json({
        success: false,
        error: 'Maximum attempts reached for this quiz'
      });
    }
    
    // Ensure MCP client is connected
    if (!mcpClient.isClientConnected()) {
      await mcpClient.connect();
    }
    
    const startTime = Date.now();
    
    // Prepare answers object for MCP evaluation
    const answersObject: Record<string, any> = {};
    answers.forEach((answer: any, index: number) => {
      const question = quiz.questions[index];
      if (question) {
        answersObject[question.id] = answer.userAnswer;
      }
    });
    
    // Get context data for enhanced evaluation
    let contextData: any = {};
    if (quiz.generationContext?.chatSessionId) {
      try {
        const chatSession = await ChatSession.findById(quiz.generationContext.chatSessionId);
        if (chatSession) {
          contextData = {
            chatHistory: chatSession.messages.slice(-10), // Last 10 messages
            conceptsCovered: chatSession.conceptsCovered.map(c => c.concept),
            subject: chatSession.subject,
            difficulty: chatSession.context.difficulty
          };
        }
      } catch (error) {
        logger.warn('Failed to get chat context for quiz evaluation:', error);
      }
    }
    
    // Use MCP for quiz evaluation
    const evaluationResult = await mcpClient.evaluateQuiz(
      quizId,
      answersObject,
      contextData
    );
    
    // Create quiz attempt with MCP results
    const attempt = {
      userId: req.user!.id,
      startedAt: new Date(Date.now() - (timeSpent || 0) * 1000),
      completedAt: new Date(),
      answers: evaluationResult.detailedResults.map(result => ({
        questionId: result.questionId,
        userAnswer: result.userAnswer,
        isCorrect: result.score > 0,
        timeSpent: answers.find((a: any, i: number) => 
          quiz.questions[i]?.id === result.questionId
        )?.timeSpent || 0,
        confidence: answers.find((a: any, i: number) => 
          quiz.questions[i]?.id === result.questionId
        )?.confidence || 3,
        feedback: result.feedback,
        explanation: result.explanation
      })),
      score: {
        raw: evaluationResult.totalScore,
        percentage: evaluationResult.percentage,
        grade: evaluationResult.grade,
        maxScore: evaluationResult.maxScore
      },
      totalTime: timeSpent || 0,
      status: 'completed' as const,
      analysis: {
        strengths: evaluationResult.detailedResults
          .filter(r => r.score > 0)
          .map(r => `Correctly answered: ${r.question.substring(0, 50)}...`),
        weaknesses: evaluationResult.detailedResults
          .filter(r => r.score === 0)
          .map(r => `Needs improvement: ${r.question.substring(0, 50)}...`),
        recommendations: [evaluationResult.overallFeedback],
        aiInsights: {
          conceptsLearned: contextData.conceptsCovered || [],
          nextSteps: [evaluationResult.overallFeedback],
          difficulty: quiz.difficulty,
          timeAnalysis: `Completed in ${Math.round((timeSpent || 0) / 60)} minutes`
        }
      },
      feedback: evaluationResult.overallFeedback
    };
    
    quiz.attempts.push(attempt as any);
    await quiz.save();
    
    const newAttempt = quiz.attempts[quiz.attempts.length - 1];
    const processingTime = Date.now() - startTime;
    
    logger.info(`Quiz evaluated with MCP by user ${req.user!.id}:`, {
      quizId,
      score: evaluationResult.percentage,
      grade: evaluationResult.grade,
      timeSpent,
      processingTime
    });
    
    const response: APIResponse = {
      success: true,
      data: {
        attemptId: newAttempt._id,
        score: {
          raw: evaluationResult.totalScore,
          percentage: evaluationResult.percentage,
          grade: evaluationResult.grade,
          maxScore: evaluationResult.maxScore
        },
        analysis: attempt.analysis,
        feedback: evaluationResult.overallFeedback,
        detailedResults: evaluationResult.detailedResults,
        quiz: {
          id: quiz._id,
          title: quiz.title,
          subject: quiz.subject,
          difficulty: quiz.difficulty
        }
      },
      message: 'Quiz submitted and evaluated with enhanced AI analysis'
    };
    
    res.json(response);
    
  } catch (error) {
    logger.error('Error submitting quiz:', error);
    const response: APIResponse = {
      success: false,
      error: 'Failed to submit quiz'
    };
    res.status(500).json(response);
  }
}));

/**
 * @route   GET /api/quiz/history
 * @desc    Get user's quiz history
 * @access  Private
 */
router.get('/history', asyncHandler(async (req: AuthRequest, res) => {
  try {
    const quizzes = await Quiz.find({ 'attempts.userId': req.user!.id })
      .sort({ 'attempts.completedAt': -1 })
      .select('title subject topic difficulty attempts');

    const quizHistory = quizzes.flatMap(quiz => 
      quiz.attempts
        .filter(attempt => attempt.userId.toString() === req.user!.id.toString())
        .map(attempt => ({
          quizId: quiz._id,
          attemptId: attempt._id,
          title: quiz.title,
          subject: quiz.subject,
          topic: quiz.topic,
          difficulty: quiz.difficulty,
          score: attempt.score,
          completedAt: attempt.completedAt,
          status: attempt.status
        }))
    ).sort((a, b) => {
      const aTime = a.completedAt?.getTime() || 0;
      const bTime = b.completedAt?.getTime() || 0;
      return bTime - aTime;
    });
    
    const response: APIResponse = {
      success: true,
      data: quizHistory,
      message: 'Quiz history retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching quiz history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz history'
    });
  }
}));

export default router;
