import express from 'express';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest, APIResponse } from '../types';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @route   GET /api/courses
 * @desc    Get all courses with filtering and pagination
 * @access  Private
 */
router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const { 
    page = 1, 
    limit = 10, 
    subject, 
    difficulty, 
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query as any;

  // Build filter object
  const filter: any = { isActive: true };
  
  if (subject) filter.subject = subject;
  if (difficulty) filter.difficulty = difficulty;
  if (search) {
    filter.$text = { $search: search };
  }

  // Build sort object
  const sort: any = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Execute query with pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const courses = await Course.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Get total count for pagination
  const total = await Course.countDocuments(filter);
  const pages = Math.ceil(total / parseInt(limit));

  const response: APIResponse = {
    success: true,
    data: { courses },
    message: 'Courses retrieved successfully',
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages
    }
  };

  res.json(response);
}));

/**
 * @route   GET /api/courses/enrolled
 * @desc    Get enrolled courses for current user
 * @access  Private
 */
router.get('/enrolled', asyncHandler(async (req: AuthRequest, res) => {
  const user = await User.findById(req.user!.id).populate('enrolledCourses');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const enrolledCourses = user.enrolledCourses.filter((course: any) => course.isActive);

  const response: APIResponse = {
    success: true,
    data: { 
      courses: enrolledCourses,
      total: enrolledCourses.length
    },
    message: 'Enrolled courses retrieved successfully'
  };

  res.json(response);
}));

/**
 * @route   GET /api/courses/recommended
 * @desc    Get recommended courses for current user
 * @access  Private
 */
router.get('/recommended', asyncHandler(async (req: AuthRequest, res) => {
  const user = await User.findById(req.user!.id);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Get courses based on user's preferred subjects and current level
  const filter: any = { 
    isActive: true,
    $or: [
      { subject: { $in: user.preferredSubjects } },
      { difficulty: 'beginner' } // Always include beginner courses
    ]
  };

  // Exclude already enrolled courses
  if (user.enrolledCourses.length > 0) {
    filter._id = { $nin: user.enrolledCourses };
  }

  const recommendedCourses = await Course.find(filter)
    .limit(6)
    .sort({ createdAt: -1 });

  const response: APIResponse = {
    success: true,
    data: { 
      courses: recommendedCourses,
      total: recommendedCourses.length
    },
    message: 'Recommended courses retrieved successfully'
  };

  res.json(response);
}));

/**
 * @route   GET /api/courses/:id
 * @desc    Get course by ID
 * @access  Private
 */
router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const course = await Course.findById(req.params.id);
  
  if (!course || !course.isActive) {
    throw new AppError('Course not found', 404);
  }

  const response: APIResponse = {
    success: true,
    data: { course },
    message: 'Course retrieved successfully'
  };

  res.json(response);
}));

/**
 * @route   GET /api/courses/:id/progress
 * @desc    Get course progress for current user
 * @access  Private
 */
router.get('/:id/progress', asyncHandler(async (req: AuthRequest, res) => {
  const course = await Course.findById(req.params.id);
  
  if (!course || !course.isActive) {
    throw new AppError('Course not found', 404);
  }

  // TODO: Get actual completed topics from learning sessions
  const completedTopics: string[] = []; // This would come from learning session data

  const progress = course.getProgressForUser(completedTopics);
  const nextTopic = course.getNextTopic(completedTopics);

  const response: APIResponse = {
    success: true,
    data: { 
      progress,
      completedTopics,
      nextTopic,
      totalTopics: course.topics.length
    },
    message: 'Course progress retrieved successfully'
  };

  res.json(response);
}));

/**
 * @route   POST /api/courses/:id/enroll
 * @desc    Enroll user in a course
 * @access  Private
 */
router.post('/:id/enroll', asyncHandler(async (req: AuthRequest, res) => {
  const course = await Course.findById(req.params.id);
  
  if (!course || !course.isActive) {
    throw new AppError('Course not found', 404);
  }

  // Check if user is already enrolled
  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.enrolledCourses.includes(course._id)) {
    throw new AppError('Already enrolled in this course', 400);
  }

  // Add course to user's enrolled courses
  user.enrolledCourses.push(course._id);
  await user.save();

  logger.info(`User ${req.user!.id} enrolled in course: ${course.title}`);

  const response: APIResponse = {
    success: true,
    data: { 
      course,
      enrolledAt: new Date()
    },
    message: 'Successfully enrolled in course'
  };

  res.json(response);
}));

/**
 * @route   POST /api/courses/:id/topics/:topicId/complete
 * @desc    Mark a topic as completed
 * @access  Private
 */
router.post('/:id/topics/:topicId/complete', asyncHandler(async (req: AuthRequest, res) => {
  const { timeSpent = 0 } = req.body;
  
  const course = await Course.findById(req.params.id);
  if (!course || !course.isActive) {
    throw new AppError('Course not found', 404);
  }

  const topic = course.topics.find(t => t._id.toString() === req.params.topicId);
  if (!topic) {
    throw new AppError('Topic not found', 404);
  }

  // TODO: Record topic completion in learning sessions
  // Update user's total learning time
  const user = await User.findById(req.user!.id);
  if (user && timeSpent > 0) {
    user.totalLearningTime += timeSpent;
    await user.save();
  }

  logger.info(`User ${req.user!.id} completed topic: ${topic.title}`);

  const response: APIResponse = {
    success: true,
    data: { 
      topicId: req.params.topicId,
      completedAt: new Date(),
      timeSpent
    },
    message: 'Topic marked as completed'
  };

  res.json(response);
}));

/**
 * @route   GET /api/courses/recommendations
 * @desc    Get personalized course recommendations
 * @access  Private
 */
router.get('/recommendations', asyncHandler(async (req: AuthRequest, res) => {
  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Build recommendation filter based on user preferences
  const filter: any = { isActive: true };
  
  if (user.preferredSubjects.length > 0) {
    filter.subject = { $in: user.preferredSubjects };
  }

  // Get courses matching user's difficulty level
  filter.difficulty = user.learningPreferences.teachingMode === 'beginner' ? 
    { $in: ['beginner', 'intermediate'] } : 
    { $in: ['intermediate', 'advanced'] };

  const recommendations = await Course.find(filter)
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const response: APIResponse = {
    success: true,
    data: { recommendations },
    message: 'Recommendations retrieved successfully'
  };

  res.json(response);
}));

/**
 * @route   GET /api/courses/subjects
 * @desc    Get all available subjects
 * @access  Private
 */
router.get('/subjects', asyncHandler(async (req: AuthRequest, res) => {
  const subjects = await Course.distinct('subject', { isActive: true });

  const response: APIResponse = {
    success: true,
    data: { subjects },
    message: 'Subjects retrieved successfully'
  };

  res.json(response);
}));

/**
 * @route   GET /api/courses/:id/topics/:topicId
 * @desc    Get specific topic content
 * @access  Private
 */
router.get('/:id/topics/:topicId', asyncHandler(async (req: AuthRequest, res) => {
  const course = await Course.findById(req.params.id);
  
  if (!course || !course.isActive) {
    throw new AppError('Course not found', 404);
  }

  const topic = course.topics.find(t => t._id.toString() === req.params.topicId);
  if (!topic) {
    throw new AppError('Topic not found', 404);
  }

  const response: APIResponse = {
    success: true,
    data: { 
      topic,
      course: {
        id: course._id,
        title: course.title,
        subject: course.subject,
        difficulty: course.difficulty
      }
    },
    message: 'Topic retrieved successfully'
  };

  res.json(response);
}));

export default router;
