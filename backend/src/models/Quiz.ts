import mongoose, { Schema } from 'mongoose';
import { IQuiz, IQuestion, IQuizAttempt, IQuizAnalysis } from '@/types';

const questionSchema = new Schema<IQuestion>({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['multiple-choice', 'numerical', 'text', 'true-false']
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: [{
    id: String,
    text: String,
    isCorrect: Boolean
  }], // For multiple choice questions
  correctAnswer: {
    type: String, // For numerical and text questions
    trim: true
  },
  explanation: {
    type: String,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  points: {
    type: Number,
    default: 1,
    min: 1
  },
  concepts: [{
    type: String,
    trim: true
  }],
  hints: [{
    type: String,
    trim: true
  }],
  timeEstimate: {
    type: Number, // in seconds
    default: 60
  }
}, { _id: false });

const quizAnalysisSchema = new Schema<IQuizAnalysis>({
  overallPerformance: {
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'],
      required: true
    },
    percentile: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  strengths: [{
    concept: {
      type: String,
      trim: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    reasoning: {
      type: String,
      trim: true
    }
  }],
  weaknesses: [{
    concept: {
      type: String,
      trim: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    reasoning: {
      type: String,
      trim: true
    },
    suggestions: [{
      type: String,
      trim: true
    }]
  }],
  conceptAnalysis: [{
    concept: {
      type: String,
      trim: true
    },
    questionsTotal: {
      type: Number,
      min: 0
    },
    questionsCorrect: {
      type: Number,
      min: 0
    },
    accuracy: {
      type: Number,
      min: 0,
      max: 1
    },
    averageTime: {
      type: Number, // in seconds
      min: 0
    }
  }],
  timeAnalysis: {
    totalTime: {
      type: Number, // in seconds
      required: true
    },
    averageTimePerQuestion: {
      type: Number, // in seconds
      required: true
    },
    timeEfficiency: {
      type: String,
      enum: ['too-fast', 'optimal', 'too-slow'],
      required: true
    }
  },
  recommendations: [{
    type: {
      type: String,
      enum: ['study-topic', 'practice-more', 'review-concept', 'time-management'],
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    description: {
      type: String,
      trim: true
    },
    resources: [{
      title: String,
      url: String,
      type: {
        type: String,
        enum: ['article', 'video', 'practice', 'course']
      }
    }]
  }],
  aiInsights: {
    learningStyle: {
      type: String,
      enum: ['visual', 'auditory', 'kinesthetic', 'reading-writing'],
    },
    cognitiveLoad: {
      type: String,
      enum: ['low', 'medium', 'high'],
    },
    confidenceLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
    },
    nextSteps: [{
      type: String,
      trim: true
    }]
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const quizAttemptSchema = new Schema<IQuizAttempt>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  answers: [{
    questionId: {
      type: String,
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
    timeSpent: {
      type: Number, // in seconds
      min: 0
    },
    confidence: {
      type: Number,
      min: 1,
      max: 5
    }
  }],
  score: {
    raw: {
      type: Number,
      min: 0
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F']
    }
  },
  totalTime: {
    type: Number, // in seconds
    min: 0
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'abandoned', 'timed-out'],
    default: 'in-progress'
  },
  analysis: quizAnalysisSchema,
  feedback: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const quizSchema = new Schema<IQuiz>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  topic: {
    type: String,
    trim: true,
    index: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced'],
    index: true
  },
  questions: [questionSchema],
  timeLimit: {
    type: Number, // in minutes
    min: 1,
    max: 180
  },
  passingScore: {
    type: Number,
    default: 70,
    min: 0,
    max: 100
  },
  maxAttempts: {
    type: Number,
    default: 3,
    min: 1,
    max: 10
  },
  createdBy: {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['user', 'ai', 'admin'],
      default: 'ai'
    }
  },
  generationContext: {
    chatSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'ChatSession'
    },
    conversationSummary: {
      type: String,
      trim: true
    },
    conceptsCovered: [{
      type: String,
      trim: true
    }],
    aiModel: {
      type: String,
      default: 'gemini-2.5-flash'
    },
    generatedAt: {
      type: Date,
      default: Date.now
    }
  },
  attempts: [quizAttemptSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  statistics: {
    totalAttempts: {
      type: Number,
      default: 0,
      min: 0
    },
    averageScore: {
      type: Number,
      min: 0,
      max: 100
    },
    passRate: {
      type: Number,
      min: 0,
      max: 1
    }
  }
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
quizSchema.index({ subject: 1, difficulty: 1 });
quizSchema.index({ 'createdBy.userId': 1, createdAt: -1 });
quizSchema.index({ 'generationContext.chatSessionId': 1 });
quizSchema.index({ isActive: 1 });
quizSchema.index({ tags: 1 });

// Update statistics when attempts are added
quizSchema.pre('save', function(next) {
  if (this.isModified('attempts')) {
    const completedAttempts = this.attempts.filter(attempt => attempt.status === 'completed');
    this.statistics.totalAttempts = completedAttempts.length;
    
    if (completedAttempts.length > 0) {
      const totalScore = completedAttempts.reduce((sum, attempt) => sum + (attempt.score.percentage || 0), 0);
      this.statistics.averageScore = totalScore / completedAttempts.length;
      
      const passedAttempts = completedAttempts.filter(attempt => (attempt.score.percentage || 0) >= this.passingScore);
      this.statistics.passRate = passedAttempts.length / completedAttempts.length;
    }
  }
  next();
});

// Method to add attempt
quizSchema.methods.addAttempt = function(userId: string, answers: any[]) {
  const attempt = {
    userId,
    answers,
    startedAt: new Date()
  };
  
  this.attempts.push(attempt);
  return this.save();
};

// Method to calculate score
quizSchema.methods.calculateScore = function(answers: any[]) {
  let correctCount = 0;
  const totalQuestions = this.questions.length;
  
  answers.forEach((answer, index) => {
    const question = this.questions[index];
    if (question.type === 'multiple-choice') {
      const correctOption = question.options?.find(opt => opt.isCorrect);
      if (correctOption && answer.userAnswer === correctOption.id) {
        correctCount++;
      }
    } else if (question.type === 'numerical') {
      // For numerical questions, allow small tolerance
      const userNum = parseFloat(answer.userAnswer);
      const correctNum = parseFloat(question.correctAnswer || '0');
      if (Math.abs(userNum - correctNum) < 0.01) {
        correctCount++;
      }
    } else {
      // For text questions, exact match (case-insensitive)
      if (answer.userAnswer.toLowerCase().trim() === (question.correctAnswer || '').toLowerCase().trim()) {
        correctCount++;
      }
    }
  });
  
  const percentage = (correctCount / totalQuestions) * 100;
  let grade = 'F';
  
  if (percentage >= 97) grade = 'A+';
  else if (percentage >= 93) grade = 'A';
  else if (percentage >= 90) grade = 'A-';
  else if (percentage >= 87) grade = 'B+';
  else if (percentage >= 83) grade = 'B';
  else if (percentage >= 80) grade = 'B-';
  else if (percentage >= 77) grade = 'C+';
  else if (percentage >= 73) grade = 'C';
  else if (percentage >= 70) grade = 'C-';
  else if (percentage >= 60) grade = 'D';
  
  return {
    raw: correctCount,
    percentage: Math.round(percentage * 100) / 100,
    grade
  };
};

// Method to get user's attempts
quizSchema.methods.getUserAttempts = function(userId: string) {
  return this.attempts.filter(attempt => attempt.userId.toString() === userId.toString());
};

// Method to check if user can attempt
quizSchema.methods.canUserAttempt = function(userId: string) {
  const userAttempts = this.getUserAttempts(userId);
  const completedAttempts = userAttempts.filter(attempt => attempt.status === 'completed');
  
  return completedAttempts.length < this.maxAttempts;
};

export const Quiz = mongoose.model<IQuiz>('Quiz', quizSchema);