import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, APIResponse } from '../types';
import { getAIService } from '../services/ai.service';
import { ChatSession } from '../models/ChatSession';

const router = express.Router();

/**
 * @route   POST /api/chat/session
 * @desc    Create new chat session
 * @access  Private
 */
router.post('/session', asyncHandler(async (req: AuthRequest, res) => {
  const { subject, topic, difficulty = 'normal' } = req.body;
  
  const chatSession = new ChatSession({
    userId: req.user!.id,
    subject: subject || 'General Discussion',
    currentTopic: topic,
    context: {
      difficulty: difficulty as any,
      teachingMode: difficulty as any,
      previousConcepts: [],
      sessionType: 'teaching',
      learningObjectives: []
    },
    messages: [],
    sessionStatus: 'active'
  });

  await chatSession.save();
  
  const response: APIResponse = {
    success: true,
    data: { 
      sessionId: chatSession._id,
      session: chatSession,
      createdAt: chatSession.createdAt
    },
    message: 'Chat session created successfully'
  };

  res.json(response);
}));

/**
 * @route   GET /api/chat/sessions
 * @desc    Get user's chat sessions
 * @access  Private
 */
router.get('/sessions', asyncHandler(async (req: AuthRequest, res) => {
  const { page = 1, limit = 20, status = 'all' } = req.query;
  
  const filter: any = { userId: req.user!.id };
  if (status !== 'all') {
    filter.sessionStatus = status;
  }
  
  const sessions = await ChatSession.find(filter)
    .sort({ lastActivity: -1 })
    .limit(parseInt(limit as string) * parseInt(page as string))
    .skip((parseInt(page as string) - 1) * parseInt(limit as string))
    .select('-messages'); // Exclude messages for list view
  
  const totalSessions = await ChatSession.countDocuments(filter);
  
  const response: APIResponse = {
    success: true,
    data: { 
      sessions,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: totalSessions,
        pages: Math.ceil(totalSessions / parseInt(limit as string))
      }
    },
    message: 'Chat sessions retrieved successfully'
  };

  res.json(response);
}));

/**
 * @route   GET /api/chat/session/:sessionId
 * @desc    Get specific chat session with messages
 * @access  Private
 */
router.get('/session/:sessionId', asyncHandler(async (req: AuthRequest, res) => {
  const { sessionId } = req.params;
  
  const session = await ChatSession.findOne({
    _id: sessionId,
    userId: req.user!.id
  });
  
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Chat session not found'
    });
  }
  
  const response: APIResponse = {
    success: true,
    data: { session },
    message: 'Chat session retrieved successfully'
  };

  res.json(response);
}));

/**
 * @route   POST /api/chat/message
 * @desc    Send message and get AI response
 * @access  Private
 */
router.post('/message', asyncHandler(async (req: AuthRequest, res) => {
  const { 
    message, 
    sessionId, 
    subject, 
    currentTopic, 
    difficulty = 'normal',
    isGreeting = false,
    learningMode = 'teaching'
  } = req.body;
  
  if (!message) {
    const response: APIResponse = {
      success: false,
      error: 'Message is required'
    };
    return res.status(400).json(response);
  }

  try {
    let chatSession;
    
    // Find or create session
    if (sessionId) {
      chatSession = await ChatSession.findOne({
        _id: sessionId,
        userId: req.user!.id
      });
      
      if (!chatSession) {
        return res.status(404).json({
          success: false,
          error: 'Chat session not found'
        });
      }
    } else {
      // Create new session if none provided
      chatSession = new ChatSession({
        userId: req.user!.id,
        subject: subject || 'General Discussion',
        currentTopic: currentTopic || subject,
        context: {
          difficulty: difficulty as any,
          teachingMode: difficulty as any,
          previousConcepts: [],
          sessionType: learningMode as any,
          learningObjectives: []
        },
        messages: [],
        sessionStatus: 'active'
      });
    }
    
    // Add user message to session
    const userMessage = {
      content: message,
      isUser: true,
      messageType: 'text' as const,
      timestamp: new Date(),
      metadata: {
        confidence: 1.0,
        sentiment: 'neutral' as const,
        conceptsIdentified: [],
        suggestedActions: [],
        nextTopics: [],
        teachingMode: difficulty as any
      }
    };
    
    chatSession.messages.push(userMessage);
    
    const aiService = getAIService();
    
    // Handle simple greetings differently
    if (isGreeting) {
      const greetingResponses = [
        "Hello! I'm here to help you learn. What would you like to explore today?",
        "Hi there! Ready to dive into some learning? What topic interests you?",
        "Hey! Great to see you here. What would you like to learn about?",
        "Hello! I'm your AI tutor. How can I help you learn something new today?",
        "Hi! I'm excited to help you learn. What subject would you like to explore?"
      ];
      
      const randomResponse = greetingResponses[Math.floor(Math.random() * greetingResponses.length)];
      
      const aiMessage = {
        content: randomResponse,
        isUser: false,
        messageType: 'text' as const,
        timestamp: new Date(),
        aiModel: 'gemini-2.5-flash',
        processingTime: 100,
        metadata: {
          confidence: 1.0,
          sentiment: 'positive' as const,
          conceptsIdentified: [],
          suggestedActions: [],
          nextTopics: [],
          teachingMode: difficulty as any
        }
      };
      
      chatSession.messages.push(aiMessage);
      await chatSession.save();

      const response: APIResponse = {
        success: true,
        data: {
          message: aiMessage,
          sessionId: chatSession._id,
          session: {
            id: chatSession._id,
            title: chatSession.title,
            subject: chatSession.subject,
            messageCount: chatSession.messageCount,
            lastActivity: chatSession.lastActivity
          }
        },
        message: 'Greeting response sent successfully'
      };

      return res.json(response);
    }
    
    // Get conversation context for AI
    const conversationContext = chatSession.getContextSummary();
    
    // Create enhanced context for AI response
    const context = {
      currentTopic: chatSession.currentTopic || currentTopic || subject || 'General Discussion',
      difficulty: chatSession.context.difficulty,
      teachingMode: chatSession.context.teachingMode,
      previousConcepts: chatSession.context.previousConcepts,
      userProgress: {
        level: 'high', // Could be derived from user profile
        preferences: {} // Could be derived from user profile
      },
      learningMode: chatSession.context.sessionType,
      isConversational: chatSession.context.sessionType === 'chat',
      conversationHistory: conversationContext.recentMessages,
      conceptsCovered: conversationContext.conceptsCovered
    };

    const startTime = Date.now();
    
    // Generate AI response
    const aiResponse = await aiService.generateTeachingResponse(message, context);
    
    const processingTime = Date.now() - startTime;
    
    // Create AI message
    const aiMessage = {
      content: aiResponse.content,
      isUser: false,
      messageType: 'text' as const,
      timestamp: new Date(),
      aiModel: 'gemini-2.5-flash',
      processingTime,
      metadata: {
        confidence: aiResponse.confidence,
        sentiment: 'neutral' as const,
        conceptsIdentified: aiResponse.concepts,
        suggestedActions: [],
        nextTopics: aiResponse.nextTopics || [],
        teachingMode: aiResponse.teachingMode as any
      }
    };
    
    chatSession.messages.push(aiMessage);
    
    // Update session context based on AI response
    if (aiResponse.concepts && aiResponse.concepts.length > 0) {
      aiResponse.concepts.forEach(concept => {
        if (!chatSession.context.previousConcepts.includes(concept)) {
          chatSession.context.previousConcepts.push(concept);
        }
        
        // Add to conceptsCovered with confidence
        const existingConcept = chatSession.conceptsCovered.find(c => c.concept === concept);
        if (existingConcept) {
          existingConcept.confidence = Math.max(existingConcept.confidence, aiResponse.confidence);
          existingConcept.timestamp = new Date();
        } else {
          chatSession.conceptsCovered.push({
            concept,
            confidence: aiResponse.confidence,
            timestamp: new Date()
          });
        }
      });
    }
    
    // Update current topic if it changed
    if (currentTopic && currentTopic !== chatSession.currentTopic) {
      chatSession.currentTopic = currentTopic;
    }
    
    await chatSession.save();

    const response: APIResponse = {
      success: true,
      data: {
        message: aiMessage,
        sessionId: chatSession._id,
        session: {
          id: chatSession._id,
          title: chatSession.title || chatSession.subject,
          subject: chatSession.subject,
          currentTopic: chatSession.currentTopic,
          messageCount: chatSession.messageCount,
          lastActivity: chatSession.lastActivity,
          conceptsCovered: chatSession.conceptsCovered.slice(-5) // Last 5 concepts
        }
      },
      message: 'Message sent successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error processing message:', error);
    const response: APIResponse = {
      success: false,
      error: 'Failed to process message'
    };
    res.status(500).json(response);
  }
}));

/**
 * @route   PUT /api/chat/session/:sessionId
 * @desc    Update session (pause, resume, end, etc.)
 * @access  Private
 */
router.put('/session/:sessionId', asyncHandler(async (req: AuthRequest, res) => {
  const { sessionId } = req.params;
  const { status, title } = req.body;
  
  const session = await ChatSession.findOne({
    _id: sessionId,
    userId: req.user!.id
  });
  
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Chat session not found'
    });
  }
  
  if (status) {
    if (status === 'completed') {
      await session.endSession();
    } else if (status === 'archived') {
      await session.archiveSession();
    } else {
      session.sessionStatus = status;
      await session.save();
    }
  }
  
  if (title) {
    session.title = title;
    await session.save();
  }
  
  const response: APIResponse = {
    success: true,
    data: { session },
    message: 'Session updated successfully'
  };

  res.json(response);
}));

/**
 * @route   DELETE /api/chat/session/:sessionId
 * @desc    Delete a chat session
 * @access  Private
 */
router.delete('/session/:sessionId', asyncHandler(async (req: AuthRequest, res) => {
  const { sessionId } = req.params;
  
  const session = await ChatSession.findOneAndDelete({
    _id: sessionId,
    userId: req.user!.id
  });
  
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Chat session not found'
    });
  }
  
  const response: APIResponse = {
    success: true,
    message: 'Chat session deleted successfully'
  };

  res.json(response);
}));

export default router;
