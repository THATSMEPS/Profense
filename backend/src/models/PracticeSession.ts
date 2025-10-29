import mongoose, { Schema } from 'mongoose';
import { IPracticeSession, IPracticeSessionModel } from '@/types';

const practiceSessionSchema = new Schema<IPracticeSession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  topic: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  problems: [{
    question: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['multiple-choice', 'numerical', 'text'],
      required: true
    },
    options: [String],
    correctAnswer: {
      type: String,
      required: true
    },
    explanation: String,
    hints: [String]
  }],
  answers: [{
    problemIndex: {
      type: Number,
      required: true
    },
    userAnswer: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    timeSpent: Number // in seconds
  }],
  score: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  totalTimeSpent: {
    type: Number, // in seconds
    default: 0
  }
}, {
  timestamps: true
});

// Index for querying user's practice sessions by topic
practiceSessionSchema.index({ userId: 1, topic: 1 });
practiceSessionSchema.index({ userId: 1, completedAt: -1 });

// Static method to get user's practice history
practiceSessionSchema.statics.getUserHistory = async function(
  userId: mongoose.Types.ObjectId,
  topic?: string
) {
  const query: any = { userId };
  if (topic) {
    query.topic = new RegExp(topic, 'i');
  }
  return this.find(query).sort({ completedAt: -1 }).lean();
};

// Static method to get practice stats for a topic
practiceSessionSchema.statics.getTopicStats = async function(
  userId: mongoose.Types.ObjectId,
  topic: string
) {
  const sessions = await this.find({ userId, topic }).lean();
  
  if (sessions.length === 0) {
    return {
      topic,
      sessionsCount: 0,
      averageScore: 0,
      bestScore: 0,
      totalProblems: 0,
      correctAnswers: 0,
      accuracy: 0
    };
  }

  const totalScore = sessions.reduce((sum, s) => sum + s.score, 0);
  const bestScore = Math.max(...sessions.map(s => s.score));
  const totalProblems = sessions.reduce((sum, s) => sum + s.problems.length, 0);
  const correctAnswers = sessions.reduce(
    (sum, s) => sum + s.answers.filter((a: any) => a.isCorrect).length,
    0
  );

  return {
    topic,
    sessionsCount: sessions.length,
    averageScore: Math.round(totalScore / sessions.length),
    bestScore,
    totalProblems,
    correctAnswers,
    accuracy: totalProblems > 0 ? Math.round((correctAnswers / totalProblems) * 100) : 0
  };
};

export const PracticeSession = mongoose.model<IPracticeSession, IPracticeSessionModel>(
  'PracticeSession',
  practiceSessionSchema
);
