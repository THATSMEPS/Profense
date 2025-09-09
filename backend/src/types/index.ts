import { Request } from 'express';
import { Document, Types } from 'mongoose';

// User Types
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  educationLevel: 'elementary' | 'middle' | 'high' | 'college';
  preferredSubjects: string[];
  avatar?: string;
  learningPreferences: {
    teachingMode: 'beginner' | 'normal' | 'advanced';
    preferredLanguage: string;
    learningPace: 'slow' | 'normal' | 'fast';
  };
  streakDays: number;
  totalLearningTime: number;
  achievements: string[];
  enrolledCourses: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastLogin: Date;
  
  // Virtual properties
  learningLevel: string;
  displayName: string;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateLastLogin(): Promise<any>;
}

// Course Types
export interface ICourse extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in minutes
  topics: ITopic[];
  prerequisites: string[];
  learningObjectives: string[];
  thumbnail: string;
  isActive: boolean;
  createdBy: 'ai' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  totalTopics: number;
  totalSubtopics: number;
  
  // Methods
  getProgressForUser(completedTopics: string[]): number;
  getNextTopic(completedTopics: string[]): ITopic | null;
  validateTopicOrder(): boolean;
}

export interface ITopic extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  content: string;
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  subtopics: ISubtopic[];
  resources: IResource[];
  quiz?: Types.ObjectId;
  order: number;
  prerequisites: string[];
}

export interface ISubtopic {
  title: string;
  content: string;
  examples: string[];
  practiceQuestions: string[];
}

export interface IResource {
  type: 'video' | 'article' | 'interactive' | 'document';
  title: string;
  url: string;
  description?: string;
}

// Learning Session Types
export interface ILearningSession extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  topicId: Types.ObjectId;
  sessionType: 'teaching' | 'practice' | 'review';
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  messagesCount: number;
  questionsAsked: number;
  conceptsLearned: string[];
  difficultyLevel: 'beginner' | 'normal' | 'advanced';
  adaptiveMode: boolean;
  satisfactionRating?: number;
  completionStatus: 'completed' | 'paused' | 'abandoned';
  nextRecommendedTopic?: Types.ObjectId;
  createdAt: Date;
}

// Chat Types
export interface IChatMessage extends Document {
  _id: Types.ObjectId;
  sessionId: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  isUser: boolean;
  messageType: 'text' | 'equation' | 'code' | 'image' | 'audio';
  timestamp: Date;
  aiModel?: string;
  processingTime?: number; // in milliseconds
  context?: {
    currentTopic: string;
    difficulty: string;
    teachingMode: string;
    previousConcepts: string[];
  };
  metadata?: {
    confidence: number;
    sentiment: 'positive' | 'negative' | 'neutral' | 'confused';
    conceptsIdentified: string[];
    suggestedActions: string[];
  };
}

// Quiz Types
export interface IQuiz extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  courseId: Types.ObjectId;
  topicId: Types.ObjectId;
  questions: IQuestion[];
  timeLimit?: number; // in minutes
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questionTypes: ('multiple-choice' | 'numerical' | 'text' | 'image-based')[];
  passingScore: number;
  maxAttempts: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuestion extends Document {
  _id: Types.ObjectId;
  type: 'multiple-choice' | 'numerical' | 'text' | 'image-based' | 'drag-drop';
  question: string;
  options?: string[];
  correctAnswer: string | number | string[];
  explanation: string;
  image?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  concept: string;
  points: number;
  hints?: string[];
  timeLimit?: number; // in seconds
}

// Quiz Result Types
export interface IQuizResult extends Document {
  _id: Types.ObjectId;
  quizId: Types.ObjectId;
  userId: Types.ObjectId;
  sessionId: Types.ObjectId;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: Date;
  timeSpent: number; // in seconds
  answers: IQuizAnswer[];
  performance: {
    strengths: string[];
    weaknesses: string[];
    recommendedTopics: string[];
    nextDifficultyLevel: string;
  };
  certificateEligible: boolean;
}

export interface IQuizAnswer {
  questionId: Types.ObjectId;
  userAnswer: string | number | string[];
  correctAnswer: string | number | string[];
  isCorrect: boolean;
  timeSpent: number; // in seconds
  concept: string;
  difficulty: string;
}

// AI Service Types
export interface AIResponse {
  content: string;
  confidence: number;
  teachingMode: 'beginner' | 'normal' | 'advanced' | 'toddler';
  concepts: string[];
  nextTopics?: string[];
  quizSuggestions?: boolean;
  adaptiveFeedback?: {
    shouldSwitchMode: boolean;
    recommendedMode: string;
    reason: string;
  };
}

export interface CourseOutline {
  title: string;
  subject: string;
  difficulty: string;
  estimatedDuration: number;
  topics: {
    title: string;
    description: string;
    duration: number;
    subtopics: string[];
    learningObjectives: string[];
  }[];
  prerequisites: string[];
  learningObjectives: string[];
}

// Analytics Types
export interface ILearningAnalytics extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  period: 'daily' | 'weekly' | 'monthly';
  date: Date;
  metrics: {
    learningTime: number; // in minutes
    sessionsCompleted: number;
    conceptsLearned: number;
    quizzesAttempted: number;
    averageScore: number;
    streakDays: number;
    preferredSubjects: string[];
    difficultyProgression: string;
    engagementLevel: number; // 1-10 scale
  };
  insights: {
    learningPattern: string;
    recommendations: string[];
    achievements: string[];
    areasForImprovement: string[];
  };
  createdAt: Date;
}

// Voice Processing Types
export interface VoiceData {
  audioBuffer: Buffer;
  format: string;
  sampleRate: number;
  channels: number;
  duration: number;
}

export interface VoiceProcessingResult {
  text: string;
  confidence: number;
  language: string;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'confused';
  intent?: string;
  entities?: string[];
}

// Express Request Extensions
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  body: any;
  params: any;
  query: any;
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Error Types
export interface APIError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// Socket Event Types
export interface SocketEvents {
  'join-session': (sessionId: string) => void;
  'chat-message': (data: {
    message: string;
    sessionId: string;
    userId: string;
    messageType?: string;
  }) => void;
  'ai-response': (data: {
    message: string;
    timestamp: Date;
    sessionId: string;
    metadata?: any;
  }) => void;
  'voice-data': (audioData: VoiceData) => void;
  'voice-response': (response: VoiceProcessingResult) => void;
  'quiz-start': (quizId: string) => void;
  'quiz-answer': (data: {
    questionId: string;
    answer: any;
    timeSpent: number;
  }) => void;
  'quiz-complete': (results: IQuizResult) => void;
  'learning-progress': (progress: {
    topicId: string;
    progress: number;
    timeSpent: number;
  }) => void;
  'adaptive-mode-switch': (data: {
    newMode: string;
    reason: string;
  }) => void;
}

// Validation Schemas
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  educationLevel: string;
  preferredSubjects: string[];
}

export interface CreateCourseRequest {
  topic: string;
  subject: string;
  difficulty: string;
  userContext?: {
    educationLevel: string;
    previousKnowledge: string[];
  };
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: {
    currentTopic?: string;
    difficulty?: string;
    mode?: string;
  };
}

export interface QuizRequest {
  courseId: string;
  topicId: string;
  difficulty: string;
  questionCount: number;
  questionTypes: string[];
}

// Configuration Types
export interface AppConfig {
  port: number;
  mongoUri: string;
  jwtSecret: string;
  geminiApiKey: string;
  corsOrigin: string;
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
  };
  upload: {
    maxFileSize: number;
    allowedTypes: string[];
  };
  ai: {
    model: string;
    maxTokens: number;
    temperature: number;
  };
}

export type TeachingMode = 'beginner' | 'normal' | 'advanced' | 'toddler';
export type LearningMode = 'teaching' | 'chat' | 'practice' | 'review';
export type QuestionType = 'multiple-choice' | 'numerical' | 'text' | 'image-based' | 'drag-drop';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type SessionStatus = 'active' | 'completed' | 'paused' | 'abandoned';
