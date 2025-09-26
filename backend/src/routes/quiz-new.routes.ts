import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, APIResponse } from '../types';
import { getAIService } from '../services/ai.service';
import { logger } from '../utils/logger';
import { Quiz } from '../models/Quiz';
import { ChatSession } from '../models/ChatSession';

const router = express.Router();

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
    questionCount = 10,
    questionTypes = ['multiple-choice', 'numerical', 'text']
  } = req.body;
  
  if (!sessionId && !subject) {
    return res.status(400).json({
      success: false,
      error: 'Either sessionId or subject is required'
    });
  }
  
  try {
    let conversationContext = '';
    let conceptsCovered: string[] = [];
    let chatSession = null;
    
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
    
    const aiService = getAIService();
    
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
      tags: [subject, topic, difficulty].filter(Boolean).map(t => t!.toLowerCase())
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
    
    const startTime = Date.now();
    
    // Process answers and calculate score
    const processedAnswers = answers.map((answer: any, index: number) => {
      const question = quiz.questions[index];
      let isCorrect = false;
      
      if (question.type === 'multiple-choice') {
        const correctOption = question.options?.find(opt => opt.isCorrect);
        isCorrect = correctOption && answer.userAnswer === correctOption.id;
      } else if (question.type === 'numerical') {
        const userNum = parseFloat(answer.userAnswer);
        const correctNum = parseFloat(question.correctAnswer || '0');
        isCorrect = Math.abs(userNum - correctNum) < 0.01;
      } else if (question.type === 'text') {
        isCorrect = answer.userAnswer.toLowerCase().trim() === 
                   (question.correctAnswer || '').toLowerCase().trim();
      } else if (question.type === 'true-false') {
        isCorrect = answer.userAnswer.toLowerCase() === 
                   (question.correctAnswer || '').toLowerCase();
      }
      
      return {
        questionId: question.id,
        userAnswer: answer.userAnswer,
        isCorrect,
        timeSpent: answer.timeSpent || 0,
        confidence: answer.confidence || 3
      };
    });
    
    const score = quiz.calculateScore(answers);
    
    // Generate AI analysis
    const aiService = getAIService();
    const analysis = await aiService.generateQuizAnalysis({
      quiz,
      answers: processedAnswers,
      score,
      timeSpent: timeSpent || 0,
      userId: req.user!.id
    });
    
    // Create quiz attempt
    const attempt = {
      userId: req.user!.id,
      startedAt: new Date(Date.now() - (timeSpent || 0) * 1000),
      completedAt: new Date(),
      answers: processedAnswers,
      score,
      totalTime: timeSpent || 0,
      status: 'completed' as const,
      analysis,
      feedback: analysis.aiInsights.nextSteps.join(' ')
    };
    
    quiz.attempts.push(attempt);
    await quiz.save();
    
    const processingTime = Date.now() - startTime;
    
    logger.info(`Quiz submitted by user ${req.user!.id}:`, {
      quizId,
      score: score.percentage,
      grade: score.grade,
      timeSpent,
      processingTime
    });
    
    const response: APIResponse = {
      success: true,
      data: {
        attemptId: attempt._id,
        score,
        analysis,
        feedback: attempt.feedback,
        quiz: {
          id: quiz._id,
          title: quiz.title,
          subject: quiz.subject,
          difficulty: quiz.difficulty
        }
      },
      message: 'Quiz submitted and analyzed successfully'
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
 * @route   GET /api/quiz
 * @desc    Get all available quizzes for user
 * @access  Private
 */
router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const { page = 1, limit = 10, subject, difficulty } = req.query;
  
  const filter: any = { isActive: true };
  if (subject) filter.subject = subject;
  if (difficulty) filter.difficulty = difficulty;
  
  const quizzes = await Quiz.find(filter)
    .select('-questions.correctAnswer -questions.explanation') // Hide answers
    .sort({ createdAt: -1 })
    .limit(parseInt(limit as string) * parseInt(page as string))
    .skip((parseInt(page as string) - 1) * parseInt(limit as string));
  
  const totalQuizzes = await Quiz.countDocuments(filter);
  
  const response: APIResponse = {
    success: true,
    data: { 
      quizzes: quizzes.map(quiz => ({
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        subject: quiz.subject,
        topic: quiz.topic,
        difficulty: quiz.difficulty,
        questionCount: quiz.questions.length,
        timeLimit: quiz.timeLimit,
        passingScore: quiz.passingScore,
        statistics: quiz.statistics,
        createdAt: quiz.createdAt,
        tags: quiz.tags
      })),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: totalQuizzes,
        pages: Math.ceil(totalQuizzes / parseInt(limit as string))
      }
    },
    message: 'Quizzes retrieved successfully'
  };

  res.json(response);
}));

/**
 * @route   GET /api/quiz/history
 * @desc    Get user's quiz history with detailed analytics
 * @access  Private
 */
router.get('/history', asyncHandler(async (req: AuthRequest, res) => {
  const { page = 1, limit = 10, subject, difficulty } = req.query;
  
  const filter: any = {
    'attempts.userId': req.user!.id,
    'attempts.status': 'completed'
  };
  
  if (subject) filter.subject = subject;
  if (difficulty) filter.difficulty = difficulty;
  
  const quizzes = await Quiz.find(filter)
    .sort({ 'attempts.completedAt': -1 })
    .limit(parseInt(limit as string) * parseInt(page as string))
    .skip((parseInt(page as string) - 1) * parseInt(limit as string));
  
  const history = quizzes.map(quiz => {
    const userAttempts = quiz.getUserAttempts(req.user!.id)
      .filter(attempt => attempt.status === 'completed')
      .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());
    
    const bestAttempt = userAttempts.reduce((best, current) => 
      (current.score.percentage || 0) > (best.score.percentage || 0) ? current : best
    );
    
    return {
      quizId: quiz._id,
      title: quiz.title,
      subject: quiz.subject,
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      totalAttempts: userAttempts.length,
      bestScore: bestAttempt.score,
      lastAttempt: userAttempts[0],
      averageScore: userAttempts.reduce((sum, attempt) => 
        sum + (attempt.score.percentage || 0), 0) / userAttempts.length,
      passed: (bestAttempt.score.percentage || 0) >= quiz.passingScore,
      canRetake: quiz.canUserAttempt(req.user!.id)
    };
  });
  
  const response: APIResponse = {
    success: true,
    data: { 
      history,
      summary: {
        totalQuizzes: history.length,
        passedQuizzes: history.filter(h => h.passed).length,
        averageScore: history.reduce((sum, h) => sum + h.averageScore, 0) / history.length || 0,
        totalAttempts: history.reduce((sum, h) => sum + h.totalAttempts, 0)
      }
    },
    message: 'Quiz history retrieved successfully'
  };

  res.json(response);
}));

/**
 * @route   GET /api/quiz/:quizId
 * @desc    Get specific quiz for taking (without answers)
 * @access  Private
 */
router.get('/:quizId', asyncHandler(async (req: AuthRequest, res) => {
  const { quizId } = req.params;
  
  const quiz = await Quiz.findById(quizId);
  
  if (!quiz || !quiz.isActive) {
    return res.status(404).json({
      success: false,
      error: 'Quiz not found'
    });
  }
  
  // Check if user can attempt this quiz
  const canAttempt = quiz.canUserAttempt(req.user!.id);
  
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
        timeLimit: quiz.timeLimit,
        passingScore: quiz.passingScore,
        questionCount: quiz.questions.length,
        questions: quiz.questions.map(q => ({
          id: q.id,
          type: q.type,
          question: q.question,
          options: q.options,
          difficulty: q.difficulty,
          points: q.points,
          timeEstimate: q.timeEstimate,
          hints: q.hints,
          concepts: q.concepts
        }))
      },
      userInfo: {
        canAttempt,
        remainingAttempts: quiz.maxAttempts - quiz.getUserAttempts(req.user!.id).length,
        previousAttempts: quiz.getUserAttempts(req.user!.id).map(attempt => ({
          id: attempt._id,
          completedAt: attempt.completedAt,
          score: attempt.score,
          status: attempt.status
        }))
      }
    },
    message: 'Quiz retrieved successfully'
  };

  res.json(response);
}));

export default router;