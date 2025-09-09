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
  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Calculate statistics
  const stats = {
    totalLearningTime: user.totalLearningTime,
    streakDays: user.streakDays,
    achievements: user.achievements,
    learningLevel: user.learningLevel,
    coursesCompleted: 0, // This would be calculated from course completion data
    quizzesTaken: 0, // This would be calculated from quiz data
    averageScore: 0, // This would be calculated from quiz results
    weeklyProgress: {
      thisWeek: 0,
      lastWeek: 0,
      change: 0
    },
    subjectBreakdown: user.preferredSubjects.reduce((acc, subject) => {
      acc[subject] = Math.floor(Math.random() * 100); // Placeholder data
      return acc;
    }, {} as Record<string, number>)
  };

  const response: APIResponse = {
    success: true,
    data: { stats },
    message: 'Statistics retrieved successfully'
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

export default router;
