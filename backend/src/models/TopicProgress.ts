import mongoose, { Schema } from 'mongoose';
import { ITopicProgress, ITopicProgressModel } from '@/types';

const topicProgressSchema = new Schema<ITopicProgress>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  topicId: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started'
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0,
    min: 0
  },
  masteryLevel: {
    type: Number, // 0-100
    default: 0,
    min: 0,
    max: 100
  },
  activitiesCompleted: {
    contentRead: {
      type: Boolean,
      default: false
    },
    chatDiscussed: {
      type: Boolean,
      default: false
    },
    practiceDone: {
      type: Boolean,
      default: false
    },
    quizPassed: {
      type: Boolean,
      default: false
    }
  },
  quizScores: [{
    quizId: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz'
    },
    score: Number,
    attemptedAt: Date
  }],
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for unique user-course-topic combination
topicProgressSchema.index({ userId: 1, courseId: 1, topicId: 1 }, { unique: true });

// Method to calculate mastery level based on activities
topicProgressSchema.methods.calculateMasteryLevel = function() {
  const activities = this.activitiesCompleted;
  let score = 0;
  
  // Content Read: 25%
  if (activities.contentRead) score += 25;
  
  // Chat Discussed: 25%
  if (activities.chatDiscussed) score += 25;
  
  // Practice Done: 25%
  if (activities.practiceDone) score += 25;
  
  // Quiz Passed: 25% (use actual quiz score if available)
  if (activities.quizPassed && this.quizScores.length > 0) {
    const latestQuiz = this.quizScores[this.quizScores.length - 1];
    score += (latestQuiz.score / 100) * 25;
  }
  
  this.masteryLevel = Math.round(score);
  return this.masteryLevel;
};

// Method to mark topic as started
topicProgressSchema.methods.markAsStarted = function() {
  if (this.status === 'not-started') {
    this.status = 'in-progress';
    this.startedAt = new Date();
  }
  this.lastAccessedAt = new Date();
};

// Method to mark topic as completed
topicProgressSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  this.lastAccessedAt = new Date();
  this.calculateMasteryLevel();
};

// Static method to get or create progress
topicProgressSchema.statics.getOrCreate = async function(userId: string, courseId: string, topicId: string) {
  let progress = await this.findOne({ userId, courseId, topicId });
  
  if (!progress) {
    progress = await this.create({
      userId,
      courseId,
      topicId,
      status: 'not-started'
    });
  }
  
  return progress;
};

export const TopicProgress = mongoose.model<ITopicProgress, ITopicProgressModel>('TopicProgress', topicProgressSchema);
