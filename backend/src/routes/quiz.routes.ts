import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, APIResponse, IChatSession } from '../types';
// import { getAIService } from '../services/ai.service';
import { getEnhancedAIService } from '../services/enhanced-ai.service';
import { mcpClient } from '../mcp/client';
import { logger } from '../utils/logger';
import { Quiz } from '../models/Quiz';
import { ChatSession } from '../models/ChatSession';
import { User } from '../models/User';
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
    // Update user activity and streak
    const user = await User.findById(req.user!.id);
    if (user) {
      await user.updateActivity();
    }
    
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
      req.user!.id,
      contextData
    );
    
    // Calculate time metrics
    const totalTime = timeSpent || 0;
    const questionCount = quiz.questions.length;
    const avgTimePerQuestion = questionCount > 0 ? totalTime / questionCount : 0;
    
    // Determine time efficiency
    let timeEfficiency: 'too-fast' | 'optimal' | 'too-slow' = 'optimal';
    if (avgTimePerQuestion < 10) {
      timeEfficiency = 'too-fast';
    } else if (avgTimePerQuestion > 180) {
      timeEfficiency = 'too-slow';
    }
    
    // Create quiz attempt with MCP results
    const attempt = {
      userId: req.user!.id,
      startedAt: new Date(Date.now() - totalTime * 1000),
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
      totalTime,
      status: 'completed' as const,
      analysis: {
        overallPerformance: {
          score: evaluationResult.percentage,
          grade: evaluationResult.grade,
          percentile: 50 // Default for now
        },
        strengths: evaluationResult.detailedResults
          .filter(r => r.score > 0)
          .map(r => ({
            concept: r.question.substring(0, 100),
            confidence: 0.8,
            reasoning: 'Correctly answered this question'
          })),
        weaknesses: evaluationResult.detailedResults
          .filter(r => r.score === 0)
          .map(r => ({
            concept: r.question.substring(0, 100),
            severity: 'medium' as const,
            reasoning: `Incorrect answer: ${r.userAnswer}`,
            suggestions: [r.explanation]
          })),
        timeAnalysis: {
          totalTime,
          averageTimePerQuestion: avgTimePerQuestion,
          timeEfficiency
        },
        recommendations: [{
          type: evaluationResult.percentage >= 70 ? 'practice-more' as const : 'study-topic' as const,
          priority: evaluationResult.percentage >= 70 ? 'low' as const : 'high' as const,
          description: evaluationResult.overallFeedback
        }],
        aiInsights: {
          confidenceLevel: evaluationResult.percentage >= 80 ? 'high' as const : 
                         evaluationResult.percentage >= 60 ? 'medium' as const : 'low' as const,
          nextSteps: [evaluationResult.overallFeedback]
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
      .sort({ createdAt: -1 })
      .select('title subject topic difficulty attempts questions');

    // Group attempts by quiz and calculate statistics
    const quizHistory = quizzes.map(quiz => {
      const userAttempts = quiz.attempts.filter(
        attempt => attempt.userId.toString() === req.user!.id.toString()
      );

      if (userAttempts.length === 0) {
        return null;
      }

      // Get best score
      const bestAttempt = userAttempts.reduce((best, current) => {
        const currentPercentage = current.score?.percentage || 0;
        const bestPercentage = best.score?.percentage || 0;
        return currentPercentage > bestPercentage ? current : best;
      }, userAttempts[0]);

      // Get last attempt
      const lastAttempt = userAttempts.reduce((latest, current) => {
        const currentTime = current.completedAt?.getTime() || 0;
        const latestTime = latest.completedAt?.getTime() || 0;
        return currentTime > latestTime ? current : latest;
      }, userAttempts[0]);

      return {
        quizId: quiz._id.toString(),
        attemptId: lastAttempt._id?.toString(),
        title: quiz.title,
        subject: quiz.subject,
        topic: quiz.topic,
        difficulty: quiz.difficulty,
        totalAttempts: userAttempts.length,
        bestScore: {
          percentage: bestAttempt.score?.percentage || 0,
          grade: bestAttempt.score?.grade || 'F',
          raw: bestAttempt.score?.raw || 0,
          maxScore: quiz.questions.length
        },
        lastAttempt: {
          attemptId: lastAttempt._id?.toString() || '',
          completedAt: lastAttempt.completedAt || new Date(),
          score: lastAttempt.score?.percentage || 0,
          answers: lastAttempt.answers?.length || 0,
          status: lastAttempt.status
        },
        questionCount: quiz.questions.length
      };
    }).filter(item => item !== null);
    
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

/**
 * @route   GET /api/quiz/:quizId/attempt/:attemptId
 * @desc    Get detailed results for a specific quiz attempt
 * @access  Private
 */
router.get('/:quizId/attempt/:attemptId', asyncHandler(async (req: AuthRequest, res) => {
  try {
    const { quizId, attemptId } = req.params;
    
    const quiz = await Quiz.findById(quizId);
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }
    
    // Find the specific attempt
    const attempt = quiz.attempts.find(
      att => att._id?.toString() === attemptId && 
             att.userId.toString() === req.user!.id.toString()
    );
    
    if (!attempt) {
      return res.status(404).json({
        success: false,
        error: 'Attempt not found'
      });
    }
    
    // Build detailed results with question information
    const detailedResults = quiz.questions.map((question, index) => {
      const answer = attempt.answers.find(ans => ans.questionId === question.id);
      
      return {
        questionId: question.id,
        question: question.question,
        type: question.type,
        userAnswer: answer?.userAnswer || null,
        correctAnswer: question.correctAnswer,
        isCorrect: answer?.isCorrect || false,
        explanation: question.explanation,
        points: question.points,
        earnedPoints: answer?.isCorrect ? question.points : 0,
        timeSpent: answer?.timeSpent || 0,
        options: question.options || []
      };
    });
    
    const response: APIResponse = {
      success: true,
      data: {
        quiz: {
          id: quiz._id,
          title: quiz.title,
          subject: quiz.subject,
          topic: quiz.topic,
          difficulty: quiz.difficulty
        },
        attempt: {
          id: attempt._id,
          completedAt: attempt.completedAt,
          score: attempt.score,
          totalTime: attempt.totalTime,
          status: attempt.status
        },
        results: detailedResults,
        analysis: attempt.analysis,
        feedback: attempt.feedback
      },
      message: 'Attempt details retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Error fetching attempt details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attempt details'
    });
  }
}));

export default router;

