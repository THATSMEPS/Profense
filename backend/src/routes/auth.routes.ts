import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { generateToken, generateRefreshToken, verifyRefreshToken, authMiddleware } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, APIResponse } from '../types';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, educationLevel, preferredSubjects } = req.body;

  // Validation
  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required', 400);
  }

  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  // Create new user
  const user = new User({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    educationLevel: educationLevel || 'high',
    preferredSubjects: preferredSubjects || []
  });

  await user.save();

  // Generate tokens
  const token = generateToken({ id: user._id, email: user.email });
  const refreshToken = generateRefreshToken({ id: user._id, email: user.email });

  logger.info(`New user registered: ${user.email}`);

  const response: APIResponse = {
    success: true,
    data: {
      user: user.toJSON(),
      token,
      refreshToken
    },
    message: 'User registered successfully'
  };

  res.status(201).json(response);
}));

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  // Find user and include password for comparison
  const user = await User.findOne({ 
    email: email.toLowerCase().trim(),
    isActive: true 
  }).select('+password');

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check password
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new AppError('Invalid credentials', 401);
  }

  // Update last login
  await user.updateLastLogin();

  // Generate tokens
  const token = generateToken({ id: user._id, email: user.email });
  const refreshToken = generateRefreshToken({ id: user._id, email: user.email });

  logger.info(`User logged in: ${user.email}`);

  const response: APIResponse = {
    success: true,
    data: {
      user: user.toJSON(),
      token,
      refreshToken
    },
    message: 'Login successful'
  };

  res.json(response);
}));

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Find user
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      throw new AppError('User not found', 404);
    }

    // Generate new tokens
    const newToken = generateToken({ id: user._id, email: user.email });
    const newRefreshToken = generateRefreshToken({ id: user._id, email: user.email });

    const response: APIResponse = {
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      },
      message: 'Token refreshed successfully'
    };

    res.json(response);
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }
}));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', asyncHandler(async (req: AuthRequest, res: Response) => {
  // In a production app, you might want to maintain a blacklist of tokens
  // For now, we'll rely on client-side token removal
  
  logger.info(`User logged out: ${req.user?.email}`);

  const response: APIResponse = {
    success: true,
    message: 'Logout successful'
  };

  res.json(response);
}));

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const user = await User.findOne({ 
    email: email.toLowerCase().trim(),
    isActive: true 
  });

  // Always return success to prevent email enumeration
  const response: APIResponse = {
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.'
  };

  if (user) {
    // TODO: Implement email sending logic
    // Generate reset token, save to database, send email
    logger.info(`Password reset requested for: ${email}`);
  }

  res.json(response);
}));

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new AppError('Token and new password are required', 400);
  }

  if (newPassword.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400);
  }

  // TODO: Implement password reset logic
  // Verify token, find user, update password
  
  const response: APIResponse = {
    success: true,
    message: 'Password reset successful'
  };

  res.json(response);
}));

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (authenticated user)
 * @access  Private
 */
router.post('/change-password', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400);
  }

  if (newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters long', 400);
  }

  // Find user with password
  const user = await User.findById(req.user!.id).select('+password');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordCorrect) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  logger.info(`Password changed for user: ${user.email}`);

  const response: APIResponse = {
    success: true,
    message: 'Password changed successfully'
  };

  res.json(response);
}));

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token and get user info
 * @access  Private
 */
router.get('/verify', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user || !user.isActive) {
    throw new AppError('User not found', 404);
  }

  const response: APIResponse = {
    success: true,
    data: {
      user: user.toJSON()
    },
    message: 'Token is valid'
  };

  res.json(response);
}));

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user || !user.isActive) {
    throw new AppError('User not found', 404);
  }

  const response: APIResponse = {
    success: true,
    data: user.toJSON(),
    message: 'User info retrieved successfully'
  };

  res.json(response);
}));

export default router;
