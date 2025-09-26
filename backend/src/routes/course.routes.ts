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

  // For demo purposes, return sample courses
  // In production, this would query the database
  const sampleCourses = [
    {
      id: '1',
      title: 'Calculus Fundamentals',
      subject: 'Mathematics',
      difficulty: 'intermediate',
      description: 'Master the basics of differential and integral calculus',
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300',
      duration: '6 weeks',
      topics: ['Limits', 'Derivatives', 'Integrals', 'Applications'],
      enrolledCount: 1240,
      rating: 4.8,
      progress: 0,
      isEnrolled: false
    },
    {
      id: '2',
      title: 'Physics - Mechanics',
      subject: 'Physics',
      difficulty: 'intermediate',
      description: 'Understand motion, forces, and energy in classical mechanics',
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300',
      duration: '8 weeks',
      topics: ['Kinematics', 'Newton\'s Laws', 'Work & Energy', 'Momentum'],
      enrolledCount: 890,
      rating: 4.7,
      progress: 0,
      isEnrolled: false
    },
    {
      id: '3',
      title: 'Organic Chemistry Basics',
      subject: 'Chemistry',
      difficulty: 'intermediate',
      description: 'Learn the fundamentals of organic compounds and reactions',
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300',
      duration: '10 weeks',
      topics: ['Hydrocarbons', 'Functional Groups', 'Reactions', 'Mechanisms'],
      enrolledCount: 675,
      rating: 4.6,
      progress: 0,
      isEnrolled: false
    },
    {
      id: '4',
      title: 'Cell Biology',
      subject: 'Biology',
      difficulty: 'intermediate',
      description: 'Explore the structure and function of cells',
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300',
      duration: '7 weeks',
      topics: ['Cell Structure', 'Organelles', 'Cell Division', 'Metabolism'],
      enrolledCount: 1120,
      rating: 4.9,
      progress: 0,
      isEnrolled: false
    },
    {
      id: '5',
      title: 'Data Structures & Algorithms',
      subject: 'Computer Science',
      difficulty: 'intermediate',
      description: 'Master fundamental programming concepts and problem-solving',
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300',
      duration: '12 weeks',
      topics: ['Arrays', 'Linked Lists', 'Trees', 'Graphs', 'Sorting', 'Searching'],
      enrolledCount: 2340,
      rating: 4.8,
      progress: 0,
      isEnrolled: false
    },
    {
      id: '6',
      title: 'English Literature Analysis',
      subject: 'Literature',
      difficulty: 'intermediate',
      description: 'Analyze classic and modern literary works',
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300',
      duration: '9 weeks',
      topics: ['Poetry Analysis', 'Prose Studies', 'Drama', 'Literary Devices'],
      enrolledCount: 560,
      rating: 4.5,
      progress: 0,
      isEnrolled: false
    }
  ];

  // Apply filters
  let filteredCourses = sampleCourses;
  
  if (subject) {
    filteredCourses = filteredCourses.filter(course => 
      course.subject.toLowerCase() === subject.toLowerCase()
    );
  }
  
  if (difficulty) {
    filteredCourses = filteredCourses.filter(course => 
      course.difficulty.toLowerCase() === difficulty.toLowerCase()
    );
  }
  
  if (search) {
    const searchTerm = search.toLowerCase();
    filteredCourses = filteredCourses.filter(course => 
      course.title.toLowerCase().includes(searchTerm) ||
      course.description.toLowerCase().includes(searchTerm) ||
      course.subject.toLowerCase().includes(searchTerm)
    );
  }

  // Apply pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const paginatedCourses = filteredCourses.slice(skip, skip + parseInt(limit));
  const total = filteredCourses.length;
  const pages = Math.ceil(total / parseInt(limit));

  const response: APIResponse = {
    success: true,
    data: { 
      courses: paginatedCourses,
      total
    },
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

  // Return sample recommended courses based on popular subjects
  const recommendedCourses = [
    {
      id: 'rec-1',
      title: 'Linear Algebra Essentials',
      subject: 'Mathematics',
      difficulty: 'intermediate',
      description: 'Master vectors, matrices, and linear transformations',
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300',
      duration: '8 weeks',
      topics: ['Vectors', 'Matrices', 'Eigenvalues', 'Linear Transformations'],
      enrolledCount: 980,
      rating: 4.7,
      progress: 0,
      isEnrolled: false,
      recommendationReason: 'Based on your math interest'
    },
    {
      id: 'rec-2',
      title: 'Quantum Physics Introduction',
      subject: 'Physics',
      difficulty: 'advanced',
      description: 'Dive into the fascinating world of quantum mechanics',
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300',
      duration: '10 weeks',
      topics: ['Wave-Particle Duality', 'Uncertainty Principle', 'Quantum States'],
      enrolledCount: 450,
      rating: 4.9,
      progress: 0,
      isEnrolled: false,
      recommendationReason: 'Popular among advanced students'
    },
    {
      id: 'rec-3',
      title: 'Python Programming Fundamentals',
      subject: 'Computer Science',
      difficulty: 'beginner',
      description: 'Learn programming with Python from scratch',
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300',
      duration: '6 weeks',
      topics: ['Variables', 'Functions', 'Classes', 'File I/O'],
      enrolledCount: 3240,
      rating: 4.8,
      progress: 0,
      isEnrolled: false,
      recommendationReason: 'Great for beginners'
    }
  ];

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

import mongoose from 'mongoose';

router.post('/:id/enroll', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid course ID', 400);
  }
  const course = await Course.findById(id);
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
