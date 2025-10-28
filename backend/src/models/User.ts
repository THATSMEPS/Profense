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
  lastActivityDate: {
    type: Date,
    default: null
  },
  activityDates: [{
    type: Date
  }],
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

// Update activity and calculate streak
userSchema.methods.updateActivity = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  
  const lastActivity = this.lastActivityDate ? new Date(this.lastActivityDate) : null;
  if (lastActivity) {
    lastActivity.setHours(0, 0, 0, 0);
  }
  
  // Check if user was active today
  const todayTimestamp = today.getTime();
  const alreadyActiveToday = this.activityDates.some((date: Date) => {
    const activityDate = new Date(date);
    activityDate.setHours(0, 0, 0, 0);
    return activityDate.getTime() === todayTimestamp;
  });
  
  if (!alreadyActiveToday) {
    // Add today to activity dates
    this.activityDates.push(today);
    
    // Calculate streak
    if (!lastActivity) {
      // First activity
      this.streakDays = 1;
    } else {
      const daysDifference = Math.floor((todayTimestamp - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDifference === 1) {
        // Consecutive day - increment streak
        this.streakDays += 1;
      } else if (daysDifference > 1) {
        // Streak broken - reset to 1
        this.streakDays = 1;
      }
      // If daysDifference === 0, it means same day (shouldn't happen due to check above)
    }
    
    this.lastActivityDate = today;
    
    // Keep only last 365 days of activity for performance
    if (this.activityDates.length > 365) {
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      this.activityDates = this.activityDates.filter((date: Date) => 
        new Date(date) >= oneYearAgo
      );
    }
    
    await this.save({ validateBeforeSave: false });
  }
  
  return this.streakDays;
};

// Check and reset streak if broken
userSchema.methods.checkStreak = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActivity = this.lastActivityDate ? new Date(this.lastActivityDate) : null;
  if (lastActivity) {
    lastActivity.setHours(0, 0, 0, 0);
    
    const daysDifference = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference > 1) {
      // Streak broken - reset to 0
      this.streakDays = 0;
      await this.save({ validateBeforeSave: false });
    }
  }
  
  return this.streakDays;
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
