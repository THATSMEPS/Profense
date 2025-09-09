import mongoose, { Schema } from 'mongoose';
import { ICourse, ITopic, ISubtopic, IResource } from '@/types';

const subtopicSchema = new Schema<ISubtopic>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  examples: [{
    type: String,
    trim: true
  }],
  practiceQuestions: [{
    type: String,
    trim: true
  }]
}, { _id: false });

const resourceSchema = new Schema<IResource>({
  type: {
    type: String,
    required: true,
    enum: ['video', 'article', 'interactive', 'document']
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, { _id: false });

const topicSchema = new Schema<ITopic>({
  title: {
    type: String,
    required: [true, 'Topic title is required'],
    trim: true,
    maxlength: [200, 'Topic title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Topic description is required'],
    maxlength: [1000, 'Topic description cannot exceed 1000 characters']
  },
  content: {
    type: String,
    required: [true, 'Topic content is required']
  },
  duration: {
    type: Number,
    required: [true, 'Topic duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  difficulty: {
    type: String,
    required: [true, 'Difficulty level is required'],
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  subtopics: [subtopicSchema],
  resources: [resourceSchema],
  quiz: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    default: null
  },
  order: {
    type: Number,
    required: true,
    min: [0, 'Order must be non-negative']
  },
  prerequisites: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

const courseSchema = new Schema<ICourse>({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [200, 'Course title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: [2000, 'Course description cannot exceed 2000 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    lowercase: true
  },
  difficulty: {
    type: String,
    required: [true, 'Difficulty level is required'],
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  estimatedDuration: {
    type: Number,
    required: [true, 'Estimated duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  topics: [topicSchema],
  prerequisites: [{
    type: String,
    trim: true
  }],
  learningObjectives: [{
    type: String,
    required: true,
    trim: true
  }],
  thumbnail: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: true,
    enum: ['ai', 'admin'],
    default: 'ai'
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc: any, ret: any) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better query performance
courseSchema.index({ subject: 1, difficulty: 1 });
courseSchema.index({ isActive: 1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ title: 'text', description: 'text' });

// Virtual for total topics count
courseSchema.virtual('totalTopics').get(function() {
  return this.topics?.length || 0;
});

// Virtual for total subtopics count
courseSchema.virtual('totalSubtopics').get(function() {
  return this.topics?.reduce((total: any, topic: any) => total + (topic.subtopics?.length || 0), 0) || 0;
});

// Method to get course progress for a user
courseSchema.methods.getProgressForUser = function(completedTopics: string[]) {
  if (!this.topics || this.topics.length === 0) return 0;
  
  const completedCount = this.topics.filter((topic: any) => 
    completedTopics.includes(topic._id.toString())
  ).length;
  
  return Math.round((completedCount / this.topics.length) * 100);
};

// Method to get next topic for a user
courseSchema.methods.getNextTopic = function(completedTopics: string[]) {
  if (!this.topics || this.topics.length === 0) return null;
  
  // Sort topics by order
  const sortedTopics = this.topics.sort((a: any, b: any) => a.order - b.order);
  
  // Find first uncompleted topic
  return sortedTopics.find((topic: any) => 
    !completedTopics.includes(topic._id.toString())
  ) || null;
};

// Method to validate topic order
courseSchema.methods.validateTopicOrder = function() {
  if (!this.topics || this.topics.length === 0) return true;
  
  const orders = this.topics.map((topic: any) => topic.order).sort((a: any, b: any) => a - b);
  
  // Check if orders are sequential starting from 0
  for (let i = 0; i < orders.length; i++) {
    if (orders[i] !== i) return false;
  }
  
  return true;
};

// Pre-save middleware to validate topic order
courseSchema.pre('save', function(next: any) {
  if (!this.validateTopicOrder()) {
    return next(new Error('Topic orders must be sequential starting from 0'));
  }
  next();
});

export const Course = mongoose.model<ICourse>('Course', courseSchema);
