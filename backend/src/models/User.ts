import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '@/types';

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be longer than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  educationLevel: {
    type: String,
    required: [true, 'Education level is required'],
    enum: ['elementary', 'middle', 'high', 'college'],
    default: 'high'
  },
  preferredSubjects: [{
    type: String,
    trim: true
  }],
  avatar: {
    type: String,
    default: null
  },
  learningPreferences: {
    teachingMode: {
      type: String,
      enum: ['beginner', 'normal', 'advanced'],
      default: 'normal'
    },
    preferredLanguage: {
      type: String,
      default: 'english'
    },
    learningPace: {
      type: String,
      enum: ['slow', 'normal', 'fast'],
      default: 'normal'
    }
  },
  streakDays: {
    type: Number,
    default: 0,
    min: [0, 'Streak days cannot be negative']
  },
  totalLearningTime: {
    type: Number,
    default: 0,
    min: [0, 'Learning time cannot be negative']
  },
  achievements: [{
    type: String,
    trim: true
  }],
  enrolledCourses: [{
    type: Schema.Types.ObjectId,
    ref: 'Course'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Index for faster queries
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function(next: any) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Get full name (if needed)
userSchema.virtual('displayName').get(function() {
  return this.name || this.email.split('@')[0];
});

// Calculate learning level based on total time
userSchema.virtual('learningLevel').get(function() {
  const hours = this.totalLearningTime / 60;
  if (hours < 10) return 'Beginner';
  if (hours < 50) return 'Intermediate';
  if (hours < 100) return 'Advanced';
  return 'Expert';
});

export const User = mongoose.model<IUser>('User', userSchema);
