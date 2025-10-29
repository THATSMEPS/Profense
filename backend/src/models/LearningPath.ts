import mongoose, { Schema } from 'mongoose';
import { ILearningPath, ILearningPathModel } from '@/types';

const learningPathSchema = new Schema<ILearningPath>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  goalTopic: {
    type: String,
    required: true,
    trim: true
  },
  timeframe: {
    type: String,
    required: true,
    trim: true
  },
  learningPath: {
    phases: [{
      week: {
        type: Number,
        required: true
      },
      topics: [{
        type: String
      }],
      focus: {
        type: String,
        required: true
      },
      resources: [{
        type: String
      }],
      completed: {
        type: Boolean,
        default: false
      }
    }],
    milestones: [{
      week: Number,
      description: String,
      achieved: {
        type: Boolean,
        default: false
      }
    }]
  },
  savedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active',
    index: true
  },
  progress: {
    phasesCompleted: {
      type: Number,
      default: 0,
      min: 0
    },
    totalPhases: {
      type: Number,
      required: true
    },
    percentComplete: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true
});

// Index for querying user's active learning paths
learningPathSchema.index({ userId: 1, status: 1 });

// Method to update progress
learningPathSchema.methods.updateProgress = function() {
  const completedCount = this.learningPath.phases.filter((p: any) => p.completed).length;
  this.progress.phasesCompleted = completedCount;
  this.progress.percentComplete = this.progress.totalPhases > 0 
    ? Math.round((completedCount / this.progress.totalPhases) * 100)
    : 0;
  
  // Auto-complete if all phases done
  if (completedCount === this.progress.totalPhases && this.progress.totalPhases > 0) {
    this.status = 'completed';
  }
};

// Static method to get or create
learningPathSchema.statics.getActivePaths = async function(userId: mongoose.Types.ObjectId) {
  return this.find({ userId, status: 'active' }).sort({ createdAt: -1 });
};

export const LearningPath = mongoose.model<ILearningPath, ILearningPathModel>('LearningPath', learningPathSchema);
