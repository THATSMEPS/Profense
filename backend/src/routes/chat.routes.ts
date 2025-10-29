import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, APIResponse } from '../types';
import { getAIService } from '../services/ai.service';
import { getEnhancedAIService } from '../services/enhanced-ai.service';
import { getTopicModerationService } from '../services/topicModeration.service';
import { mcpClient } from '../mcp/client';
import { ChatSession } from '../models/ChatSession';
import { User } from '../models/User';
import { logger } from '../utils/logger';

const router = express.Router();

// Content moderation function
async function performContentModeration(message: string) {
  // Only block explicitly inappropriate content
  const explicitlyInappropriatePatterns = [
    /\b(explicit|pornographic|sexual|nude|xxx)\b/i,
    /\b(violence|kill|murder|harm|suicide|self[-\s]harm)\b/i,
    /\b(illegal|drugs|cocaine|heroin|marijuana sale|weapon)\b/i,
    /\b(hate speech|racist|discrimination|offensive slur)\b/i
  ];
  
  // Educational content patterns - broader to catch legitimate queries
  const educationalPatterns = [
    /\b(explain|tell|what|how|why|learn|study|teach|understand|help|question|homework|assignment|course|lesson|tutorial)\b/i,
    /\b(math|science|physics|chemistry|biology|history|literature|programming|computer|engineering|medicine|law|business)\b/i,
    /\b(formula|equation|theory|concept|principle|definition|example|problem|solution|analysis)\b/i,
    /\b(optics|ray|light|calculus|algebra|geometry|trigonometry|statistics|probability)\b/i,
    /\b(atom|molecule|cell|evolution|gravity|energy|force|motion|electricity|magnetism)\b/i
  ];
  
  const questionPatterns = [
    /\?/,
    /\b(give me|show me|can you|could you|would you|please)\b/i
  ];
  
  const isExplicitlyInappropriate = explicitlyInappropriatePatterns.some(pattern => pattern.test(message));
  const isEducational = educationalPatterns.some(pattern => pattern.test(message));
  const isQuestion = questionPatterns.some(pattern => pattern.test(message));
  
  // Only block explicitly inappropriate content
  if (isExplicitlyInappropriate) {
    return {
      approved: false,
      reasoning: "I'm designed to help with educational content and cannot assist with inappropriate topics.",
      suggestedQuery: "How can I help you learn something new today?",
      relevantSubjects: ['Mathematics', 'Science', 'Programming', 'Literature', 'Physics'],
      confidenceScore: 0.9
    };
  }
  
  // Allow educational content, questions, and most other content
  return {
    approved: true,
    reasoning: "Content is appropriate for educational discussion.",
    confidenceScore: 0.8
  };
}

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
 * @route   GET /api/chat/sessions/course/:courseId
 * @desc    Get all chat sessions for a specific course
 * @access  Private
 */
router.get('/sessions/course/:courseId', asyncHandler(async (req: AuthRequest, res) => {
  const { courseId } = req.params;
  const { topicId } = req.query;
  
  const filter: any = { 
    userId: req.user!.id,
    courseId,
    sessionStatus: { $ne: 'archived' }
  };
  
  if (topicId) {
    filter.topicId = topicId;
  }
  
  const sessions = await ChatSession.find(filter)
    .sort({ lastActivity: -1 })
    .select('title subject currentTopic lastActivity messageCount totalDuration sessionStatus');
  
  const response: APIResponse = {
    success: true,
    data: { sessions },
    message: 'Course chat sessions retrieved successfully'
  };

  res.json(response);
}));

/**
 * @route   POST /api/chat/session/create
 * @desc    Create a new chat session for a course/topic
 * @access  Private
 */
router.post('/session/create', asyncHandler(async (req: AuthRequest, res) => {
  const { courseId, topicId, subject, title } = req.body;
  
  if (!courseId) {
    return res.status(400).json({
      success: false,
      error: 'courseId is required'
    });
  }
  
  const session = new ChatSession({
    userId: req.user!.id,
    courseId,
    topicId,
    subject: subject || 'General',
    title: title || `${subject || 'General'} Discussion`,
    currentTopic: topicId,
    sessionStatus: 'active',
    context: {
      difficulty: 'normal',
      teachingMode: 'normal',
      previousConcepts: [],
      sessionType: 'teaching',
      learningObjectives: []
    }
  });
  
  await session.save();
  
  // Update topic progress - mark chatDiscussed as true
  if (topicId) {
    try {
      const TopicProgressModule = await import('../models/TopicProgress');
      const TopicProgress = TopicProgressModule.TopicProgress;
      
      const topicProgress = await TopicProgress.getOrCreate(
        req.user!.id,
        courseId,
        topicId
      );
      
      topicProgress.activitiesCompleted.chatDiscussed = true;
      topicProgress.calculateMasteryLevel();
      await topicProgress.save();
    } catch (error) {
      logger.error('Failed to update topic progress:', error);
    }
  }
  
  const response: APIResponse = {
    success: true,
    data: { session },
    message: 'Chat session created successfully'
  };

  res.json(response);
}));

/**
 * @route   POST /api/chat/session/:sessionId/resume
 * @desc    Resume a previous chat session
 * @access  Private
 */
router.post('/session/:sessionId/resume', asyncHandler(async (req: AuthRequest, res) => {
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
  
  // Reactivate the session
  session.sessionStatus = 'active';
  session.lastActivity = new Date();
  await session.save();
  
  const response: APIResponse = {
    success: true,
    data: { session },
    message: 'Chat session resumed successfully'
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
    learningMode = 'teaching',
    courseId, // NEW: Link to course
    topicId // NEW: Link to topic
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
    
    // Update user activity and streak
    const user = await User.findById(req.user!.id);
    if (user) {
      await user.updateActivity();
    }
    
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
        courseId, // NEW: Save course context
        topicId, // NEW: Save topic context
        subject: subject || 'General Discussion',
        currentTopic: currentTopic || subject,
        context: {
          difficulty: difficulty as any,
          teachingMode: difficulty as any,
          previousConcepts: [],
          sessionType: learningMode as any,
          learningObjectives: [],
          messageCount: 0
        },
        messages: [],
        sessionStatus: 'active'
      });
    }
    
    // Increment message count for topic discovery phase
    chatSession.context.messageCount = (chatSession.context.messageCount || 0) + 1;
    
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
    
    let aiResponse;
    
    // FIRST: Topic relevance check (prioritize staying on topic!)
    const topicModerationService = getTopicModerationService();
    let topicCheck: Awaited<ReturnType<typeof topicModerationService.checkTopicRelevance>> | null = null;
    
    // Discovery phase: First 3 messages skip strict topic moderation
    const isInDiscoveryPhase = (chatSession.context.messageCount || 0) <= 3;
    
    if (isInDiscoveryPhase) {
      logger.info(`Discovery phase active (message ${chatSession.context.messageCount}/3) - skipping strict topic moderation`);
    }
    
    // Only check topic relevance if:
    // 1. We have a defined current topic
    // 2. We're past the discovery phase (message 4+)
    // 3. Message is not a general greeting/question
    if (chatSession.currentTopic && !isInDiscoveryPhase && !topicModerationService.isGeneralMessage(message)) {
      // Get recent conversation history for context
      const recentMessages = chatSession.messages
        .slice(-5) // Last 5 messages
        .filter(msg => msg.isUser) // Only user messages
        .map(msg => msg.content);
      
      // Get concepts covered in this session
      const conceptsCovered = chatSession.conceptsCovered?.map(c => c.concept) || [];
      
      topicCheck = await topicModerationService.checkTopicRelevance(message, {
        currentTopic: chatSession.currentTopic,
        subject: chatSession.subject || 'General',
        difficulty: chatSession.context.difficulty,
        sessionType: chatSession.context.sessionType,
        conversationHistory: recentMessages,
        conceptsCovered: conceptsCovered
      });
      
      logger.info(`Topic check for "${chatSession.currentTopic}": ${topicCheck.actionType} (score: ${topicCheck.relevanceScore.toFixed(2)})`);
      
      // If topic relevance is below 60%, block the question (don't send to Gemini)
      if (topicCheck.actionType === 'redirect' || topicCheck.actionType === 'remind') {
        // Generate blocking message
        const blockMessage = topicCheck.actionType === 'redirect' 
          ? topicCheck.message!
          : `I notice your question seems to be drifting away from our current topic: **${chatSession.currentTopic}**.

To help you learn effectively, please stay focused on ${chatSession.currentTopic}. Here are some questions you could ask instead:

${topicCheck.suggestions?.map(s => `• ${s}`).join('\n') || `• What is ${chatSession.currentTopic}?\n• How does ${chatSession.currentTopic} work?\n• Can you explain ${chatSession.currentTopic}?`}

Let's continue with ${chatSession.currentTopic}! 📚`;

        aiResponse = {
          content: blockMessage,
          isUser: false,
          messageType: 'text' as const,
          timestamp: new Date(),
          aiModel: 'topic-moderation',
          processingTime: 50,
          metadata: {
            confidence: 0.95,
            sentiment: 'neutral' as const,
            conceptsIdentified: [chatSession.currentTopic],
            suggestedActions: topicCheck.suggestions || [],
            nextTopics: [chatSession.currentTopic],
            teachingMode: difficulty as any
          }
        };
        
        chatSession.messages.push(aiResponse);
        await chatSession.save();

        const response: APIResponse = {
          success: true,
          data: {
            message: aiResponse,
            sessionId: chatSession._id,
            session: {
              id: chatSession._id,
              title: chatSession.title || chatSession.subject,
              subject: chatSession.subject,
              messageCount: chatSession.messageCount,
              lastActivity: chatSession.lastActivity
            },
            topicModeration: {
              type: topicCheck.actionType === 'redirect' ? 'redirect' : 'blocked',
              relevanceScore: topicCheck.relevanceScore,
              suggestions: topicCheck.suggestions,
              currentTopic: chatSession.currentTopic
            }
          },
          message: 'Off-topic question blocked'
        };

        return res.json(response);
      }
    }
    
    // SECOND: Content moderation check (only for explicit inappropriate content)
    const moderationResult = await performContentModeration(message);
    
    if (!moderationResult.approved) {
      // If content is explicitly inappropriate, provide moderated response
      aiResponse = {
        content: `I notice your message might not be directly related to learning. ${moderationResult.reasoning} Let me help you with educational content instead.`,
        isUser: false,
        messageType: 'text' as const,
        timestamp: new Date(),
        aiModel: 'content-moderation',
        metadata: {
          confidence: 1.0,
          sentiment: 'neutral' as const,
          conceptsIdentified: [],
          suggestedActions: [],
          nextTopics: moderationResult.relevantSubjects || [],
          teachingMode: difficulty as any,
          moderation: moderationResult
        }
      };
      
      chatSession.messages.push(aiResponse);
      await chatSession.save();

      const response: APIResponse = {
        success: true,
        data: {
          message: aiResponse,
          sessionId: chatSession._id,
          session: {
            id: chatSession._id,
            title: chatSession.title || chatSession.subject,
            subject: chatSession.subject,
            messageCount: chatSession.messageCount,
            lastActivity: chatSession.lastActivity
          },
          moderation: moderationResult
        },
        message: 'Moderated response sent successfully'
      };

      return res.json(response);
    }
    
    // Continue with AI response generation
    chatSession.messages.push(userMessage);
    
    const aiService = getEnhancedAIService();

    // Ensure MCP client is connected
    if (!mcpClient.isClientConnected()) {
      await mcpClient.connect();
    }
    
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
        
        aiResponse = {
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
        
        chatSession.messages.push(aiResponse);
        await chatSession.save();

        const response: APIResponse = {
          success: true,
          data: {
            message: aiResponse,
            sessionId: chatSession._id,
            session: {
              id: chatSession._id,
              title: chatSession.title,
              subject: chatSession.subject,
              messageCount: chatSession.messageCount,
              lastActivity: chatSession.lastActivity
            },
            moderation: moderationResult.approved ? undefined : moderationResult
          },
          message: 'Greeting response sent successfully'
        };

        return res.json(response);
      } else {
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
    const aiResponseData = await aiService.generateTeachingResponse(message, context);

    if (!aiResponseData.content || aiResponseData.content.trim() === '') {
      logger.warn('AI returned an empty response, sending a fallback message.');
      aiResponseData.content = "I'm not sure how to respond to that. Could you please rephrase your question?";
    }
    
    // Note: Topic check already blocked off-topic questions before reaching here
    // Only on-topic questions (score >= 60%) reach Gemini
    
    const processingTime = Date.now() - startTime;
    
    // Create AI message
    const aiMessage = {
      content: aiResponseData.content,
      isUser: false,
      messageType: 'text' as const,
      timestamp: new Date(),
      aiModel: 'gemini-2.5-flash',
      processingTime,
      metadata: {
        confidence: aiResponseData.confidence,
        sentiment: 'neutral' as const,
        conceptsIdentified: aiResponseData.concepts,
        suggestedActions: [],
        nextTopics: aiResponseData.nextTopics || [],
        teachingMode: aiResponseData.teachingMode as any
      }
    };
    
    chatSession.messages.push(aiMessage);
    
    // Update session context based on AI response
    if (aiResponseData.concepts && aiResponseData.concepts.length > 0) {
      aiResponseData.concepts.forEach(concept => {
        if (!chatSession.context.previousConcepts.includes(concept)) {
          chatSession.context.previousConcepts.push(concept);
        }
        
        // Add to conceptsCovered with confidence
        const existingConcept = chatSession.conceptsCovered.find(c => c.concept === concept);
        if (existingConcept) {
          existingConcept.confidence = Math.max(existingConcept.confidence, aiResponseData.confidence);
          existingConcept.timestamp = new Date();
        } else {
          chatSession.conceptsCovered.push({
            concept,
            confidence: aiResponseData.confidence,
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
        },
        // No topic moderation needed here - off-topic questions are blocked before reaching Gemini
        topicModeration: undefined
      },
      message: 'Message sent successfully'
    };

    res.json(response);
    }
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
