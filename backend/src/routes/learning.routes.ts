import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, APIResponse } from '../types';
import { mcpClient } from '../mcp/client';
import { logger } from '../utils/logger';

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
