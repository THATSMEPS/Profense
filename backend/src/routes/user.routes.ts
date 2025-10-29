import express, { Response } from 'express';
import { User } from '../models/User';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, APIResponse } from '../types';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const response: APIResponse = {
    success: true,
    data: { user: user.toJSON() },
    message: 'Profile retrieved successfully'
  };

  res.json(response);
}));

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, educationLevel, preferredSubjects, learningPreferences } = req.body;

  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Update fields
  if (name) user.name = name.trim();
  if (educationLevel) user.educationLevel = educationLevel;
  if (preferredSubjects) user.preferredSubjects = preferredSubjects;
  if (learningPreferences) {
    user.learningPreferences = {
      ...user.learningPreferences,
      ...learningPreferences
    };
  }

  await user.save();

  logger.info(`Profile updated for user: ${user.email}`);

  const response: APIResponse = {
    success: true,
    data: { user: user.toJSON() },
    message: 'Profile updated successfully'
  };

  res.json(response);
}));

/**
 * @route   GET /api/users/stats
 * @desc    Get user learning statistics
 * @access  Private
 */
router.get('/stats', asyncHandler(async (req: AuthRequest, res) => {
  const user = await User.findById(req.user!.id).populate('enrolledCourses');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check and update streak
  await user.checkStreak();
  await user.updateActivity();

  // Import models for querying
  const { Quiz } = await import('../models/Quiz');
  const { ChatSession } = await import('../models/ChatSession');
  const { Course } = await import('../models/Course');

  // Get all user's quiz attempts
  const userQuizzes = await Quiz.find({ 'attempts.userId': req.user!.id });
  
  let totalQuizAttempts = 0;
  let totalScore = 0;
  let completedQuizzes = 0;
  
  userQuizzes.forEach(quiz => {
    const userAttempts = quiz.attempts.filter(attempt => 
      attempt.userId.toString() === req.user!.id
    );
    
    userAttempts.forEach(attempt => {
      totalQuizAttempts++;
      if (attempt.status === 'completed' && attempt.completedAt) {
        completedQuizzes++;
        totalScore += attempt.score.percentage || 0;
      }
    });
  });

  const averageScore = completedQuizzes > 0 ? totalScore / completedQuizzes : 0;

  // Get user's chat sessions to calculate learning time
  const chatSessions = await ChatSession.find({ 
    userId: req.user!.id,
    sessionStatus: { $in: ['active', 'completed'] }
  });

  // Calculate total study time from chat sessions (estimate based on message count and timestamps)
  let totalStudyTime = user.totalLearningTime || 0;
  chatSessions.forEach(session => {
    if (session.messages.length > 1) {
      const firstMsg = session.messages[0].timestamp;
      const lastMsg = session.messages[session.messages.length - 1].timestamp;
      const sessionDuration = (lastMsg.getTime() - firstMsg.getTime()) / (1000 * 60); // in minutes
      totalStudyTime += Math.min(sessionDuration, 120); // Cap at 2 hours per session
    }
  });

  // Get enrolled courses with progress
  const enrolledCourses = await Course.find({ 
    _id: { $in: user.enrolledCourses } 
  });

  // Calculate courses completed using TopicProgress
  const TopicProgressModule = await import('../models/TopicProgress');
  const TopicProgress = TopicProgressModule.TopicProgress;
  
  let coursesCompleted = 0;
  for (const course of enrolledCourses) {
    const totalTopics = course.topics?.length || 0;
    
    if (totalTopics === 0) continue;
    
    // Get all topic progress for this course
    const topicProgressList = await TopicProgress.find({
      userId: req.user!.id,
      courseId: course._id
    });
    
    // Count completed topics
    const completedTopics = topicProgressList.filter(
      tp => tp.status === 'completed'
    ).length;
    
    // Course is complete if all topics are completed
    if (completedTopics === totalTopics) {
      coursesCompleted++;
    }
  }

  // Calculate weekly progress
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const thisWeekSessions = await ChatSession.countDocuments({
    userId: req.user!.id,
    lastActivity: { $gte: oneWeekAgo }
  });

  const lastWeekSessions = await ChatSession.countDocuments({
    userId: req.user!.id,
    lastActivity: { $gte: twoWeeksAgo, $lt: oneWeekAgo }
  });

  const weeklyChange = lastWeekSessions > 0 
    ? ((thisWeekSessions - lastWeekSessions) / lastWeekSessions) * 100 
    : 0;

  // Calculate subject breakdown from chat sessions
  const subjectBreakdown: Record<string, number> = {};
  chatSessions.forEach(session => {
    if (session.subject) {
      subjectBreakdown[session.subject] = (subjectBreakdown[session.subject] || 0) + 1;
    }
  });

  const stats = {
    totalStudyTime: Math.round(totalStudyTime), // Total minutes spent learning
    streakDays: user.streakDays || 0,
    achievements: user.achievements || [],
    learningLevel: user.learningPreferences?.teachingMode || 'normal',
    coursesCompleted,
    quizzesTaken: totalQuizAttempts,
    averageScore: Math.round(averageScore),
    weeklyProgress: {
      thisWeek: thisWeekSessions,
      lastWeek: lastWeekSessions,
      change: Math.round(weeklyChange)
    },
    subjectBreakdown,
    enrolledCourses: enrolledCourses.length,
    preferredSubjects: user.preferredSubjects || [],
    joinedDate: user.createdAt,
    lastActive: user.lastLogin
  };

  logger.info(`Retrieved real stats for user: ${user.email}`);

  const response: APIResponse = {
    success: true,
    data: stats,
    message: 'User statistics retrieved successfully'
  };

  res.json(response);
}));

/**
 * @route   POST /api/users/update-learning-time
 * @desc    Update user's total learning time
 * @access  Private
 */
router.post('/update-learning-time', asyncHandler(async (req: AuthRequest, res) => {
  const { timeSpent } = req.body; // in minutes

  if (!timeSpent || timeSpent < 0) {
    throw new AppError('Valid time spent is required', 400);
  }

  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.totalLearningTime += timeSpent;
  await user.save();

  const response: APIResponse = {
    success: true,
    data: { 
      totalLearningTime: user.totalLearningTime,
      timeAdded: timeSpent
    },
    message: 'Learning time updated successfully'
  };

  res.json(response);
}));

/**
 * @route   POST /api/users/update-streak
 * @desc    Update user's learning streak
 * @access  Private
 */
router.post('/update-streak', asyncHandler(async (req: AuthRequest, res) => {
  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const lastLogin = user.lastLogin;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if user logged in today
  const isSameDay = lastLogin.toDateString() === today.toDateString();
  const isConsecutiveDay = lastLogin.toDateString() === yesterday.toDateString();

  if (isSameDay) {
    // Same day, no change to streak
  } else if (isConsecutiveDay) {
    // Consecutive day, increment streak
    user.streakDays += 1;
  } else {
    // Streak broken, reset to 1
    user.streakDays = 1;
  }

  user.lastLogin = today;
  await user.save();

  const response: APIResponse = {
    success: true,
    data: { 
      streakDays: user.streakDays,
      lastLogin: user.lastLogin
    },
    message: 'Streak updated successfully'
  };

  res.json(response);
}));

/**
 * @route   POST /api/users/add-achievement
 * @desc    Add achievement to user
 * @access  Private
 */
router.post('/add-achievement', asyncHandler(async (req: AuthRequest, res) => {
  const { achievement } = req.body;

  if (!achievement) {
    throw new AppError('Achievement is required', 400);
  }

  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if achievement already exists
  if (!user.achievements.includes(achievement)) {
    user.achievements.push(achievement);
    await user.save();

    logger.info(`Achievement added: ${achievement} for user: ${user.email}`);
  }

  const response: APIResponse = {
    success: true,
    data: { 
      achievements: user.achievements,
      newAchievement: achievement
    },
    message: 'Achievement added successfully'
  };

  res.json(response);
}));

/**
 * @route   DELETE /api/users/account
 * @desc    Deactivate user account
 * @access  Private
 */
router.delete('/account', asyncHandler(async (req: AuthRequest, res) => {
  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Soft delete - just deactivate the account
  user.isActive = false;
  await user.save();

  logger.info(`Account deactivated for user: ${user.email}`);

  const response: APIResponse = {
    success: true,
    message: 'Account deactivated successfully'
  };

  res.json(response);
}));

/**
 * @route   GET /api/users/preferences
 * @desc    Get user preferences
 * @access  Private
 */
router.get('/preferences', asyncHandler(async (req: AuthRequest, res) => {
  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const response: APIResponse = {
    success: true,
    data: {
      learningPreferences: user.learningPreferences,
      preferredSubjects: user.preferredSubjects,
      educationLevel: user.educationLevel
    },
    message: 'Preferences retrieved successfully'
  };

  res.json(response);
}));

/**
 * @route   PUT /api/users/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put('/preferences', asyncHandler(async (req: AuthRequest, res) => {
  const { learningPreferences, preferredSubjects } = req.body;

  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (learningPreferences) {
    user.learningPreferences = {
      ...user.learningPreferences,
      ...learningPreferences
    };
  }

  if (preferredSubjects) {
    user.preferredSubjects = preferredSubjects;
  }

  await user.save();

  logger.info(`Preferences updated for user: ${user.email}`);

  const response: APIResponse = {
    success: true,
    data: {
      learningPreferences: user.learningPreferences,
      preferredSubjects: user.preferredSubjects
    },
    message: 'Preferences updated successfully'
  };

  res.json(response);
}));

/**
 * @route   POST /api/users/track-quiz
 * @desc    Track quiz completion for user stats
 * @access  Private
 */
router.post('/track-quiz', asyncHandler(async (req: AuthRequest, res) => {
  const { score, subject, totalQuestions, timeSpent } = req.body;

  if (score === undefined || !subject || !totalQuestions) {
    throw new AppError('Score, subject, and total questions are required', 400);
  }

  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Add learning time from quiz
  if (timeSpent && timeSpent > 0) {
    user.totalLearningTime += timeSpent;
  }

  // Add subject to preferred subjects if not already there
  if (!user.preferredSubjects.includes(subject)) {
    user.preferredSubjects.push(subject);
  }

  // Add achievement for first quiz
  if (!user.achievements.includes('First Quiz')) {
    user.achievements.push('First Quiz');
  }

  // Add achievement for high scores
  if (score >= 90 && !user.achievements.includes('Quiz Master')) {
    user.achievements.push('Quiz Master');
  }

  await user.save();

  logger.info(`Quiz tracked for user ${user.email}: ${score}% in ${subject}`);

  const response: APIResponse = {
    success: true,
    data: { 
      message: 'Quiz completion tracked successfully',
      newAchievements: user.achievements.slice(-2) // Return last 2 achievements
    },
    message: 'Quiz completion tracked successfully'
  };

  res.json(response);
}));

/**
 * @route   POST /api/users/track-learning-session
 * @desc    Track learning session for user stats
 * @access  Private
 */
router.post('/track-learning-session', asyncHandler(async (req: AuthRequest, res) => {
  const { subject, topic, timeSpent } = req.body;

  if (!subject || !timeSpent) {
    throw new AppError('Subject and time spent are required', 400);
  }

  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Add learning time
  user.totalLearningTime += timeSpent;

  // Add subject to preferred subjects if not already there
  if (!user.preferredSubjects.includes(subject)) {
    user.preferredSubjects.push(subject);
  }

  // Add achievements based on learning time
  const totalHours = Math.floor(user.totalLearningTime / 60);
  
  if (totalHours >= 1 && !user.achievements.includes('Study Starter')) {
    user.achievements.push('Study Starter');
  }
  
  if (totalHours >= 5 && !user.achievements.includes('Dedicated Learner')) {
    user.achievements.push('Dedicated Learner');
  }
  
  if (totalHours >= 10 && !user.achievements.includes('Knowledge Seeker')) {
    user.achievements.push('Knowledge Seeker');
  }

  await user.save();

  logger.info(`Learning session tracked for user ${user.email}: ${timeSpent}min in ${subject}${topic ? ` - ${topic}` : ''}`);

  const response: APIResponse = {
    success: true,
    data: { 
      totalLearningTime: user.totalLearningTime,
      newAchievements: user.achievements.slice(-1) // Return last achievement
    },
    message: 'Learning session tracked successfully'
  };

  res.json(response);
}));

/**
 * @route   GET /api/users/quiz-history
 * @desc    Get user's quiz history
 * @access  Private
 */
router.get('/quiz-history', asyncHandler(async (req: AuthRequest, res) => {
  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // For now, return empty array since we don't have quiz history collection yet
  // In production, this would query a QuizAttempt collection
  const quizHistory: any[] = [];

  const response: APIResponse = {
    success: true,
    data: { quizHistory, total: quizHistory.length },
    message: 'Quiz history retrieved successfully'
  };

  res.json(response);
}));

/**
 * @route   GET /api/users/statistics
 * @desc    Get user statistics for quiz history
 * @access  Private
 */
router.get('/statistics', asyncHandler(async (req: AuthRequest, res) => {
  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Calculate stats from user data
  const stats = {
    averageScore: 0, // Would be calculated from quiz attempts
    totalQuizzes: 0, // Would be calculated from quiz attempts
    improvementTrend: 0, // Would be calculated from historical performance
    strongSubjects: user.preferredSubjects.slice(0, 2),
    weakSubjects: []
  };

  const response: APIResponse = {
    success: true,
    data: { stats },
    message: 'User statistics retrieved successfully'
  };

  res.json(response);
}));

export default router;
