import express, { Response } from 'express';
import { getAIService } from '../services/ai.service';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, APIResponse, CreateCourseRequest, ChatRequest } from '../types';
import { logger } from '../utils/logger';
import { checkBeforeCourseCreation } from '../services/courseDeduplication.service';

const router = express.Router();

/**
 * @route   POST /api/ai/generate-course
 * @desc    Generate a new course using AI (with deduplication)
 * @access  Private
 */
router.post('/generate-course', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { topic, subject, difficulty, userContext }: CreateCourseRequest = req.body;

  if (!topic || !subject) {
    throw new AppError('Topic and subject are required', 400);
  }

  // Get user info for context
  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const aiService = getAIService();

  // Generate course outline using AI
  const courseOutline = await aiService.generateCourseOutline(
    topic,
    subject,
    difficulty || 'beginner',
    user.educationLevel,
    {
      ...userContext,
      preferredSubjects: user.preferredSubjects,
      learningPreferences: user.learningPreferences
    }
  );

  // Prepare topics from outline
  const proposedTopics = courseOutline.topics.map((topic, index) => ({
    title: topic.title,
    description: topic.description,
    content: `Content for ${topic.title}`, // This would be generated in detail
    duration: topic.duration,
    difficulty: (difficulty as any) || 'beginner',
    subtopics: topic.subtopics.map(sub => ({
      title: sub,
      content: `Content for ${sub}`,
      examples: [],
      practiceQuestions: []
    })),
    resources: [],
    order: index,
    prerequisites: []
  }));

  // CHECK FOR DUPLICATES before creating
  const deduplicationCheck = await checkBeforeCourseCreation(
    courseOutline.title,
    courseOutline.subject,
    courseOutline.difficulty,
    proposedTopics
  );

  logger.info(`Deduplication check result: ${deduplicationCheck.action} - ${deduplicationCheck.message}`);

  let course: any;
  let actionTaken: string = 'new_course_created'; // Default action

  if (deduplicationCheck.action === 'use_existing') {
    // Use existing course - no need to create new one
    course = deduplicationCheck.existingCourse;
    actionTaken = 'existing_course_returned';
    
    logger.info(`Using existing course: ${course.title} (ID: ${course._id})`);

  } else if (deduplicationCheck.action === 'extend_existing') {
    // Extend existing course with new topics
    course = await Course.findById(deduplicationCheck.existingCourse._id);
    
    if (course && deduplicationCheck.newTopicsToAdd) {
      // Find the highest order number
      const maxOrder = course.topics.reduce((max, t) => Math.max(max, t.order), -1);
      
      // Add only truly new topics
      const newTopicsData = proposedTopics.filter(pt => 
        deduplicationCheck.newTopicsToAdd!.includes(pt.title)
      );

      newTopicsData.forEach((newTopic, idx) => {
        newTopic.order = maxOrder + 1 + idx;
        course.topics.push(newTopic);
      });

      await course.save();
      actionTaken = 'course_extended';
      
      logger.info(`Extended course "${course.title}" with ${newTopicsData.length} new topics`);
    }

  } else {
    // Create new course - no duplicates found
    course = new Course({
      title: courseOutline.title,
      description: `AI-generated course on ${topic}`,
      subject: courseOutline.subject,
      difficulty: courseOutline.difficulty as any,
      estimatedDuration: courseOutline.estimatedDuration,
      topics: proposedTopics,
      prerequisites: courseOutline.prerequisites,
      learningObjectives: courseOutline.learningObjectives,
      createdBy: 'ai'
    });

    await course.save();
    actionTaken = 'new_course_created';
    
    logger.info(`Created new course: ${course.title} for user: ${user.email}`);
  }

  const response: APIResponse = {
    success: true,
    data: {
      course: course.toJSON ? course.toJSON() : course,
      outline: courseOutline,
      deduplication: {
        action: actionTaken,
        message: deduplicationCheck.message,
        wasNewCourse: actionTaken === 'new_course_created',
        wasExtended: actionTaken === 'course_extended',
        topicsAdded: deduplicationCheck.newTopicsToAdd?.length || 0
      }
    },
    message: actionTaken === 'new_course_created' 
      ? 'New course generated successfully'
      : actionTaken === 'course_extended'
      ? 'Existing course extended with new topics'
      : 'Using existing similar course'
  };

  res.status(actionTaken === 'new_course_created' ? 201 : 200).json(response);
}));

/**
 * @route   POST /api/ai/chat
 * @desc    Chat with AI tutor
 * @access  Private
 */
router.post('/chat', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { message, sessionId, context }: ChatRequest = req.body;

  if (!message) {
    throw new AppError('Message is required', 400);
  }

  // Get user info
  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const aiService = getAIService();

  // Prepare context for AI
  const aiContext = {
    currentTopic: context?.currentTopic || 'General',
    difficulty: context?.difficulty || user.learningPreferences.teachingMode,
    teachingMode: (context?.mode as any) || user.learningPreferences.teachingMode,
    previousConcepts: [], // This would be fetched from learning history
    userProgress: {
      educationLevel: user.educationLevel,
      totalLearningTime: user.totalLearningTime,
      preferredSubjects: user.preferredSubjects
    }
  };

  // Generate AI response
  const aiResponse = await aiService.generateTeachingResponse(message, aiContext);

  // Check if we need to analyze sentiment and adapt
  const sentimentAnalysis = await aiService.analyzeSentimentAndAdapt(message, aiContext);

  logger.info(`AI chat response generated for user: ${user.email}`);

  const response: APIResponse = {
    success: true,
    data: {
      aiResponse,
      sentimentAnalysis,
      sessionId: sessionId || `session-${Date.now()}`,
      timestamp: new Date()
    },
    message: 'Chat response generated'
  };

  res.json(response);
}));

/**
 * @route   POST /api/ai/generate-quiz
 * @desc    Generate quiz questions for a course/topic
 * @access  Private
 */
router.post('/generate-quiz', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { 
    courseId, 
    topicId, 
    difficulty = 'intermediate',
    questionCount = 10,
    questionTypes = ['multiple-choice', 'numerical', 'text']
  } = req.body;

  if (!courseId) {
    throw new AppError('Course ID is required', 400);
  }

  // Get course
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  let content = '';
  
  if (topicId) {
    // Generate quiz for specific topic
    const topic = course.topics.find((t: any) => t._id.toString() === topicId);
    if (!topic) {
      throw new AppError('Topic not found', 404);
    }
    content = `${topic.title}: ${topic.description}\n${topic.content}`;
  } else {
    // Generate quiz for entire course
    content = course.topics.map((topic: any) => 
      `${topic.title}: ${topic.description}\n${topic.content}`
    ).join('\n\n');
  }

  const aiService = getAIService();

  // Generate quiz questions
  const quiz = await aiService.generateQuizQuestions(
    content,
    difficulty,
    questionCount,
    questionTypes
  );

  logger.info(`AI generated quiz for course: ${course.title}`);

  const response: APIResponse = {
    success: true,
    data: {
      quiz,
      courseId,
      topicId,
      difficulty,
      questionCount
    },
    message: 'Quiz generated successfully'
  };

  res.json(response);
}));

/**
 * @route   POST /api/ai/evaluate-quiz
 * @desc    Evaluate quiz answers using AI
 * @access  Private
 */
router.post('/evaluate-quiz', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { questions, userAnswers, courseId } = req.body;

  if (!questions || !userAnswers || !courseId) {
    throw new AppError('Questions, user answers, and course ID are required', 400);
  }

  // Get course for context
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  const aiService = getAIService();

  // Evaluate answers
  const evaluation = await aiService.evaluateQuizAnswers(
    questions,
    userAnswers,
    `Course: ${course.title} - ${course.description}`
  );

  logger.info(`AI evaluated quiz for course: ${course.title}`);

  const response: APIResponse = {
    success: true,
    data: {
      evaluation,
      courseId,
      timestamp: new Date()
    },
    message: 'Quiz evaluated successfully'
  };

  res.json(response);
}));

/**
 * @route   POST /api/ai/voice-to-text
 * @desc    Convert voice input to text
 * @access  Private
 */
router.post('/voice-to-text', asyncHandler(async (req: AuthRequest, res: Response) => {
  // This would handle voice processing
  // For now, return a placeholder response
  
  const response: APIResponse = {
    success: true,
    data: {
      text: 'Voice to text processing not implemented yet',
      confidence: 0.8,
      language: 'en-US'
    },
    message: 'Voice processed (placeholder)'
  };

  res.json(response);
}));

/**
 * @route   POST /api/ai/analyze-learning-path
 * @desc    Analyze user's learning path and provide recommendations
 * @access  Private
 */
router.post('/analyze-learning-path', asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // This would analyze the user's learning pattern and provide recommendations
  // For now, return a basic analysis
  
  const recommendations = {
    suggestedTopics: user.preferredSubjects.slice(0, 3),
    difficultyLevel: user.learningPreferences.teachingMode,
    estimatedLearningTime: Math.max(30, 120 - user.totalLearningTime / 60),
    strengths: ['Problem solving', 'Critical thinking'],
    areasForImprovement: ['Time management', 'Concept retention'],
    nextCourseRecommendations: [
      {
        subject: user.preferredSubjects[0] || 'Mathematics',
        difficulty: user.learningPreferences.teachingMode,
        reason: 'Based on your learning preferences and progress'
      }
    ]
  };

  const response: APIResponse = {
    success: true,
    data: {
      analysis: recommendations,
      timestamp: new Date()
    },
    message: 'Learning path analyzed successfully'
  };

  res.json(response);
}));

export default router;
