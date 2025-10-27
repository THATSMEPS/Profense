// index.tsx
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import courseRoutes from './routes/course.routes';
import chatRoutes from './routes/chat.routes';
import quizRoutes from './routes/quiz.routes';
import analyticsRoutes from './routes/analytics.routes';
import aiRoutes from './routes/ai.routes';
import learningRoutes from './routes/learning.routes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// Import services
import { initializeServices } from './services';
import { mcpClient } from './mcp/client';
import { logger } from './utils/logger';
import { seedDatabase } from './utils/seedData';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'middleware',
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000,
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting middleware
app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip || 'unknown');
    next();
  } catch (rejRes) {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/courses', authMiddleware, courseRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/quiz', authMiddleware, quizRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/learning', authMiddleware, learningRoutes);

// Socket.IO for real-time chat and learning
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Add token verification logic here
  next();
});

io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);

  socket.on('join-session', (sessionId) => {
    socket.join(`session-${sessionId}`);
    logger.info(`User ${socket.id} joined session ${sessionId}`);
  });

  socket.on('chat-message', async (data) => {
    try {
      // Handle real-time AI responses
      const { message, sessionId, userId } = data;
      
      // Process message through AI service
      // Emit response back to client
      socket.to(`session-${sessionId}`).emit('ai-response', {
        message: 'AI response will be here',
        timestamp: new Date(),
        sessionId
      });
    } catch (error) {
      logger.error('Chat message error:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  });

  socket.on('voice-data', async (audioData) => {
    try {
      // Handle voice-to-text conversion
      // Process through AI
      // Send back response
    } catch (error) {
      logger.error('Voice processing error:', error);
      socket.emit('error', { message: 'Failed to process voice input' });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The route ${req.originalUrl} does not exist on this server.`
  });
});

// Database connection
const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/profense';
    await mongoose.connect(mongoURI);
    logger.info('✅ Connected to MongoDB');
    
    // Seed database with sample data for development
    if (process.env.NODE_ENV === 'development') {
      await seedDatabase();
    }
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Initialize AI services and MCP
const initServices = async (): Promise<void> => {
  try {
    await initializeServices();
  } catch (error) {
    logger.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    await initServices();
    
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📱 Socket.IO enabled for real-time features`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('🔄 SIGTERM received, shutting down gracefully...');
  
  // Disconnect MCP client
  await mcpClient.disconnect();
  logger.info('✅ MCP Client disconnected');
  
  server.close(() => {
    mongoose.connection.close();
    logger.info('💤 Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('🔄 SIGINT received, shutting down gracefully...');
  
  // Disconnect MCP client
  await mcpClient.disconnect();
  logger.info('✅ MCP Client disconnected');
  
  server.close(() => {
    mongoose.connection.close();
    logger.info('💤 Server closed');
    process.exit(0);
  });
});

// Start the application
startServer();

export { app, io };
