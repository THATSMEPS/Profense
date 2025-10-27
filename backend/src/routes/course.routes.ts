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

  // Build database query
  const query: any = { isActive: true };
  
  // Apply filters
  if (subject) {
    query.subject = { $regex: new RegExp(subject as string, 'i') };
  }
  
  if (difficulty) {
    query.difficulty = difficulty.toLowerCase();
  }
  
  if (search) {
    query.$text = { $search: search as string };
  }

  // Build sort object
  const sort: any = {};
  sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

  // Calculate pagination
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  // Get total count
  const total = await Course.countDocuments(query);
  
  // Query courses from database
  const dbCourses = await Course.find(query)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit as string))
    .lean();

  // Get current user to check enrollment status
  const user = await User.findById(req.user!.id).select('enrolledCourses');
  const enrolledCourseIds = user?.enrolledCourses.map(id => id.toString()) || [];

  // Format courses with additional data
  const courses = dbCourses.map(course => ({
    id: course._id.toString(),
    _id: course._id,
    title: course.title,
    subject: course.subject,
    difficulty: course.difficulty,
    description: course.description,
    thumbnail: course.thumbnail,
    estimatedDuration: course.estimatedDuration,
    topics: course.topics.map(t => t.title),
    topicsCount: course.topics.length,
    prerequisites: course.prerequisites,
    learningObjectives: course.learningObjectives,
    createdBy: course.createdBy,
    createdAt: course.createdAt,
    isEnrolled: enrolledCourseIds.includes(course._id.toString()),
    progress: 0 // TODO: Calculate actual progress from learning sessions
  }));

  const pages = Math.ceil(total / parseInt(limit as string));

  logger.info(`Retrieved ${courses.length} courses from database`);

  const response: APIResponse = {
    success: true,
    data: { 
      courses,
      total
    },
    message: 'Courses retrieved successfully',
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
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

  const { ChatSession } = await import('../models/ChatSession');

  const enrolledCourses = user.enrolledCourses.filter((course: any) => course.isActive);

  // Enhance courses with progress data from chat sessions
  const coursesWithProgress = await Promise.all(
    enrolledCourses.map(async (course: any) => {
      // Get chat sessions for this course subject
      const sessions = await ChatSession.find({
        userId: req.user!.id,
        subject: course.subject,
        sessionStatus: { $in: ['active', 'completed'] }
      });

      // Extract covered topics from chat sessions
      const coveredTopics = new Set<string>();
      sessions.forEach(session => {
        if (session.currentTopic) {
          coveredTopics.add(session.currentTopic.toLowerCase());
        }
        session.conceptsCovered?.forEach(c => coveredTopics.add(c.concept.toLowerCase()));
      });

      // Calculate progress based on topics covered
      const totalTopics = course.topics?.length || 1;
      let completedTopics = 0;
      
      course.topics?.forEach((topic: any) => {
        if (coveredTopics.has(topic.title.toLowerCase())) {
          completedTopics++;
        }
      });

      const progress = Math.round((completedTopics / totalTopics) * 100);

      // Calculate estimated time spent
      let timeSpent = 0;
      sessions.forEach(session => {
        if (session.messages.length > 1) {
          const firstMsg = session.messages[0].timestamp;
          const lastMsg = session.messages[session.messages.length - 1].timestamp;
          const duration = (lastMsg.getTime() - firstMsg.getTime()) / (1000 * 60); // minutes
          timeSpent += Math.min(duration, 60); // Cap at 1 hour per session
        }
      });

      return {
        ...course.toObject(),
        progress,
        completedTopics,
        totalTopics,
        timeSpent: Math.round(timeSpent),
        lastAccessed: sessions.length > 0 
          ? sessions[sessions.length - 1].lastActivity 
          : course.enrolledAt || course.createdAt
      };
    })
  );

  const response: APIResponse = {
    success: true,
    data: { 
      courses: coursesWithProgress,
      total: coursesWithProgress.length
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
  const user = await User.findById(req.user!.id).select('preferredSubjects learningPreferences enrolledCourses educationLevel');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Build recommendation filter based on user preferences
  const filter: any = { isActive: true };
  
  // Filter by user's preferred subjects (if any)
  if (user.preferredSubjects && user.preferredSubjects.length > 0) {
    filter.subject = { 
      $in: user.preferredSubjects.map(s => new RegExp(s, 'i'))
    };
  }

  // Match difficulty to user's teaching mode
  const teachingMode = user.learningPreferences?.teachingMode || 'normal';
  if (teachingMode === 'beginner') {
    filter.difficulty = { $in: ['beginner', 'intermediate'] };
  } else if (teachingMode === 'advanced') {
    filter.difficulty = { $in: ['intermediate', 'advanced'] };
  }

  // Exclude already enrolled courses
  if (user.enrolledCourses && user.enrolledCourses.length > 0) {
    filter._id = { $nin: user.enrolledCourses };
  }

  // Query recommended courses from database
  const dbCourses = await Course.find(filter)
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();

  // Format courses
  const recommendedCourses = dbCourses.map(course => ({
    id: course._id.toString(),
    _id: course._id,
    title: course.title,
    subject: course.subject,
    difficulty: course.difficulty,
    description: course.description,
    thumbnail: course.thumbnail,
    estimatedDuration: course.estimatedDuration,
    topics: course.topics.map(t => t.title),
    topicsCount: course.topics.length,
    prerequisites: course.prerequisites,
    learningObjectives: course.learningObjectives,
    isEnrolled: false,
    progress: 0,
    recommendationReason: user.preferredSubjects?.includes(course.subject) 
      ? `Based on your interest in ${course.subject}`
      : 'Popular course for your level'
  }));

  logger.info(`Retrieved ${recommendedCourses.length} recommended courses for user ${user._id}`);

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
 * @route   POST /api/courses/:courseId/enroll
 * @desc    Enroll user in a course
 * @access  Private
 */
router.post('/:courseId/enroll', asyncHandler(async (req: AuthRequest, res) => {
  const { courseId } = req.params;
  
  // Validate ObjectId format
  if (!courseId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new AppError('Invalid course ID format', 400);
  }

  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course || !course.isActive) {
    throw new AppError('Course not found', 404);
  }

  // Get user and check if already enrolled
  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if already enrolled
  const isAlreadyEnrolled = user.enrolledCourses.some(
    id => id.toString() === courseId
  );

  if (isAlreadyEnrolled) {
    throw new AppError('Already enrolled in this course', 400);
  }

  // Add course to user's enrolled courses
  user.enrolledCourses.push(course._id);
  await user.save();

  logger.info(`User ${user.email} enrolled in course: ${course.title}`);

  const response: APIResponse = {
    success: true,
    data: { 
      courseId,
      courseTitle: course.title,
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
