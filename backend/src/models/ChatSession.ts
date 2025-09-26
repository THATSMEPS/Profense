import mongoose, { Schema } from 'mongoose';
import { IChatSession, IChatMessage } from '@/types';

const chatMessageSchema = new Schema<IChatMessage>({
  content: {
    type: String,
    required: true,
    trim: true
  },
  isUser: {
    type: Boolean,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'equation', 'code', 'image', 'audio'],
    default: 'text'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  aiModel: {
    type: String,
    default: 'gemini-2.5-flash'
  },
  processingTime: {
    type: Number, // in milliseconds
    min: 0
  },
  metadata: {
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral', 'confused']
    },
    conceptsIdentified: [{
      type: String,
      trim: true
    }],
    suggestedActions: [{
      type: String,
      trim: true
    }],
    nextTopics: [{
      type: String,
      trim: true
    }],
    teachingMode: {
      type: String,
      enum: ['beginner', 'normal', 'advanced'],
      default: 'normal'
    }
  }
}, { _id: true });

const chatSessionSchema = new Schema<IChatSession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: 200
  },
  subject: {
    type: String,
    trim: true
  },
  currentTopic: {
    type: String,
    trim: true
  },
  context: {
    difficulty: {
      type: String,
      enum: ['beginner', 'normal', 'advanced'],
      default: 'normal'
    },
    teachingMode: {
      type: String,
      enum: ['beginner', 'normal', 'advanced'],
      default: 'normal'
    },
    previousConcepts: [{
      type: String,
      trim: true
    }],
    sessionType: {
      type: String,
      enum: ['teaching', 'chat', 'quiz-prep', 'review'],
      default: 'teaching'
    },
    learningObjectives: [{
      type: String,
      trim: true
    }]
  },
  messages: [chatMessageSchema],
  sessionStatus: {
    type: String,
    enum: ['active', 'paused', 'completed', 'archived'],
    default: 'active'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  messageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalDuration: {
    type: Number, // in minutes
    default: 0,
    min: 0
  },
  conceptsCovered: [{
    concept: {
      type: String,
      trim: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  quizzesGenerated: [{
    type: Schema.Types.ObjectId,
    ref: 'Quiz'
  }],
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better performance
chatSessionSchema.index({ userId: 1, lastActivity: -1 });
chatSessionSchema.index({ userId: 1, subject: 1 });
chatSessionSchema.index({ sessionStatus: 1 });
chatSessionSchema.index({ createdAt: -1 });
chatSessionSchema.index({ 'context.sessionType': 1 });

// Update lastActivity when messages are added
chatSessionSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.lastActivity = new Date();
    this.messageCount = this.messages.length;
    
    // Auto-generate title if not set and we have messages
    if (!this.title && this.messages.length > 0) {
      const firstUserMessage = this.messages.find(msg => msg.isUser);
      if (firstUserMessage) {
        this.title = firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '');
      }
    }
  }
  next();
});

// Virtual to get session duration
chatSessionSchema.virtual('duration').get(function() {
  if (this.endTime) {
    return Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60)); // in minutes
  }
  return Math.round((this.lastActivity.getTime() - this.startTime.getTime()) / (1000 * 60));
});

// Method to add message to session
chatSessionSchema.methods.addMessage = function(messageData: Partial<IChatMessage>) {
  const message = {
    ...messageData,
    timestamp: new Date()
  };
  
  this.messages.push(message);
  this.lastActivity = new Date();
  this.messageCount = this.messages.length;
  
  return this.save();
};

// Method to end session
chatSessionSchema.methods.endSession = function() {
  this.sessionStatus = 'completed';
  this.endTime = new Date();
  this.totalDuration = Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
  
  return this.save();
};

// Method to archive session
chatSessionSchema.methods.archiveSession = function() {
  this.sessionStatus = 'archived';
  return this.save();
};

// Method to get context summary for AI
chatSessionSchema.methods.getContextSummary = function() {
  const recentMessages = this.messages.slice(-10); // Last 10 messages
  const concepts = this.conceptsCovered.map(c => c.concept);
  
  return {
    subject: this.subject,
    currentTopic: this.currentTopic,
    recentMessages: recentMessages.map(msg => ({
      content: msg.content,
      isUser: msg.isUser,
      timestamp: msg.timestamp
    })),
    conceptsCovered: concepts,
    difficulty: this.context.difficulty,
    teachingMode: this.context.teachingMode,
    sessionType: this.context.sessionType
  };
};

export const ChatSession = mongoose.model<IChatSession>('ChatSession', chatSessionSchema);