import express from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { AuthRequest, APIResponse } from '../types';
import { mcpClient } from '../mcp/client';
import { logger } from '../utils/logger';
import { LearningPath } from '../models/LearningPath';
import { PracticeSession } from '../models/PracticeSession';

const router = express.Router();

/**
 * @route   POST /api/learning/path
 * @desc    Generate personalized learning path
 * @access  Private
 */
router.post('/path', asyncHandler(async (req: AuthRequest, res) => {
  const { goalTopic, timeframe } = req.body;
  
  if (!goalTopic) {
    return res.status(400).json({
      success: false,
      error: 'Goal topic is required'
    });
  }

  try {
    // Ensure MCP client is connected
    if (!mcpClient.isClientConnected()) {
      await mcpClient.connect();
    }

    const result = await mcpClient.generateLearningPath(
      req.user!.id,
      goalTopic,
      timeframe
    );

    const response: APIResponse = {
      success: true,
      data: result,
      message: 'Learning path generated successfully'
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error generating learning path:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate learning path',
      message: error.message
    });
  }
}));

/**
 * @route   POST /api/learning/path/save
 * @desc    Save a generated learning path
 * @access  Private
 */
router.post('/path/save', asyncHandler(async (req: AuthRequest, res) => {
  const { goalTopic, timeframe, learningPath } = req.body;

  if (!goalTopic || !timeframe || !learningPath || !learningPath.phases) {
    throw new AppError('Missing required fields: goalTopic, timeframe, and learningPath are required', 400);
  }

  const userId = req.user!.id;

  // Calculate total phases
  const totalPhases = learningPath.phases?.length || 0;

  // Create new learning path
  const newPath = new LearningPath({
    userId,
    goalTopic,
    timeframe,
    learningPath: {
      phases: learningPath.phases.map((phase: any) => ({
        week: phase.week,
        topics: phase.topics || [],
        focus: phase.focus,
        resources: phase.resources || [],
        completed: false
      })),
      milestones: learningPath.milestones || []
    },
    savedAt: new Date(),
    status: 'active',
    progress: {
      phasesCompleted: 0,
      totalPhases,
      percentComplete: 0
    }
  });

  await newPath.save();

  logger.info(`Learning path saved for user ${userId}: ${goalTopic}`);

  const response: APIResponse = {
    success: true,
    data: { learningPath: newPath },
    message: 'Learning path saved successfully'
  };

  res.status(201).json(response);
}));

/**
 * @route   GET /api/learning/paths
 * @desc    Get user's saved learning paths
 * @access  Private
 */
router.get('/paths', asyncHandler(async (req: AuthRequest, res) => {
  const { status = 'active' } = req.query;
  const userId = req.user!.id;

  const query: any = { userId };
  
  if (status && status !== 'all') {
    query.status = status;
  }

  const paths = await LearningPath.find(query)
    .sort({ createdAt: -1 })
    .lean();

  logger.info(`Retrieved ${paths.length} learning paths for user ${userId}`);

  const response: APIResponse = {
    success: true,
    data: { 
      learningPaths: paths,
      total: paths.length
    },
    message: 'Learning paths retrieved successfully'
  };

  res.json(response);
}));

/**
 * @route   GET /api/learning/path/:pathId
 * @desc    Get a specific learning path
 * @access  Private
 */
router.get('/path/:pathId', asyncHandler(async (req: AuthRequest, res) => {
  const { pathId } = req.params;
  const userId = req.user!.id;

  const path = await LearningPath.findOne({ 
    _id: pathId, 
    userId 
  });

  if (!path) {
    throw new AppError('Learning path not found', 404);
  }

  const response: APIResponse = {
    success: true,
    data: { learningPath: path },
    message: 'Learning path retrieved successfully'
  };

  res.json(response);
}));

/**
 * @route   PUT /api/learning/path/:pathId/phase/:phaseIndex/complete
 * @desc    Mark a phase as complete/incomplete
 * @access  Private
 */
router.put('/path/:pathId/phase/:phaseIndex/complete', asyncHandler(async (req: AuthRequest, res) => {
  const { pathId, phaseIndex } = req.params;
  const { completed } = req.body;
  const userId = req.user!.id;

  const path = await LearningPath.findOne({ 
    _id: pathId, 
    userId 
  });

  if (!path) {
    throw new AppError('Learning path not found', 404);
  }

  const index = parseInt(phaseIndex);
  
  if (index < 0 || index >= path.learningPath.phases.length) {
    throw new AppError('Invalid phase index', 400);
  }

  // Update phase completion
  path.learningPath.phases[index].completed = completed !== false;
  
  // Recalculate progress
  path.updateProgress();
  
  await path.save();

  logger.info(`Phase ${index} of learning path ${pathId} marked as ${completed ? 'complete' : 'incomplete'}`);

  const response: APIResponse = {
    success: true,
    data: { learningPath: path },
    message: `Phase ${completed ? 'completed' : 'uncompleted'} successfully`
  };

  res.json(response);
}));

/**
 * @route   PUT /api/learning/path/:pathId/status
 * @desc    Update learning path status (active/completed/archived)
 * @access  Private
 */
router.put('/path/:pathId/status', asyncHandler(async (req: AuthRequest, res) => {
  const { pathId } = req.params;
  const { status } = req.body;
  const userId = req.user!.id;

  if (!['active', 'completed', 'archived'].includes(status)) {
    throw new AppError('Invalid status. Must be active, completed, or archived', 400);
  }

  const path = await LearningPath.findOne({ 
    _id: pathId, 
    userId 
  });

  if (!path) {
    throw new AppError('Learning path not found', 404);
  }

  path.status = status;
  await path.save();

  logger.info(`Learning path ${pathId} status updated to ${status}`);

  const response: APIResponse = {
    success: true,
    data: { learningPath: path },
    message: `Learning path ${status} successfully`
  };

  res.json(response);
}));

/**
 * @route   DELETE /api/learning/path/:pathId
 * @desc    Delete a learning path
 * @access  Private
 */
router.delete('/path/:pathId', asyncHandler(async (req: AuthRequest, res) => {
  const { pathId } = req.params;
  const userId = req.user!.id;

  const path = await LearningPath.findOneAndDelete({ 
    _id: pathId, 
    userId 
  });

  if (!path) {
    throw new AppError('Learning path not found', 404);
  }

  logger.info(`Learning path ${pathId} deleted by user ${userId}`);

  const response: APIResponse = {
    success: true,
    message: 'Learning path deleted successfully'
  };

  res.json(response);
}));

/**
 * @route   POST /api/learning/practice
 * @desc    Generate personalized practice problems
 * @access  Private
 */
router.post('/practice', asyncHandler(async (req: AuthRequest, res) => {
  const { topic, difficulty = 'intermediate', count = 5 } = req.body;
  
  if (!topic) {
    return res.status(400).json({
      success: false,
      error: 'Topic is required'
    });
  }

  if (count < 1 || count > 10) {
    return res.status(400).json({
      success: false,
      error: 'Count must be between 1 and 10'
    });
  }

  try {
    // Ensure MCP client is connected
    if (!mcpClient.isClientConnected()) {
      await mcpClient.connect();
    }

    const result = await mcpClient.generatePracticeProblems(
      topic,
      difficulty as 'beginner' | 'intermediate' | 'advanced',
      count,
      req.user!.id
    );

    const response: APIResponse = {
      success: true,
      data: result,
      message: 'Practice problems generated successfully'
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error generating practice problems:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate practice problems',
      message: error.message
    });
  }
}));

/**
 * @route   POST /api/learning/practice/save
 * @desc    Save a practice session
 * @access  Private
 */
router.post('/practice/save', asyncHandler(async (req: AuthRequest, res) => {
  const { topic, difficulty, problems, answers, score, totalTimeSpent } = req.body;

  if (!topic || !difficulty || !problems || !answers || score === undefined) {
    throw new AppError('Missing required fields: topic, difficulty, problems, answers, and score are required', 400);
  }

  const userId = req.user!.id;

  // Create new practice session
  const session = new PracticeSession({
    userId,
    topic,
    difficulty,
    problems,
    answers,
    score,
    totalTimeSpent: totalTimeSpent || 0,
    completedAt: new Date()
  });

  await session.save();

  logger.info(`Practice session saved for user ${userId}: ${topic} (${score}%)`);

  const response: APIResponse = {
    success: true,
    data: { session },
    message: 'Practice session saved successfully'
  };

  res.status(201).json(response);
}));

/**
 * @route   GET /api/learning/practice/history
 * @desc    Get user's practice history
 * @access  Private
 */
router.get('/practice/history', asyncHandler(async (req: AuthRequest, res) => {
  const { topic } = req.query;
  const userId = req.user!.id;

  const history = await PracticeSession.getUserHistory(userId as any, topic as string);

  const response: APIResponse = {
    success: true,
    data: { 
      sessions: history,
      total: history.length
    },
    message: 'Practice history retrieved successfully'
  };

  res.json(response);
}));

/**
 * @route   GET /api/learning/practice/stats/:topic
 * @desc    Get practice statistics for a topic
 * @access  Private
 */
router.get('/practice/stats/:topic', asyncHandler(async (req: AuthRequest, res) => {
  const { topic } = req.params;
  const userId = req.user!.id;

  const stats = await PracticeSession.getTopicStats(userId as any, topic);

  const response: APIResponse = {
    success: true,
    data: { stats },
    message: 'Practice stats retrieved successfully'
  };

  res.json(response);
}));

/**
 * @route   GET /api/learning/connections/:topic
 * @desc    Find concept connections for a topic
 * @access  Private
 */
router.get('/connections/:topic', asyncHandler(async (req: AuthRequest, res) => {
  const { topic } = req.params;
  
  if (!topic) {
    return res.status(400).json({
      success: false,
      error: 'Topic is required'
    });
  }

  try {
    // Ensure MCP client is connected
    if (!mcpClient.isClientConnected()) {
      await mcpClient.connect();
    }

    const result = await mcpClient.findConceptConnections(
      decodeURIComponent(topic),
      req.user!.id
    );

    const response: APIResponse = {
      success: true,
      data: result,
      message: 'Concept connections found successfully'
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error finding concept connections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find concept connections',
      message: error.message
    });
  }
}));

export default router;
