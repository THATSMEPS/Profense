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
  content: string;
  isUser: boolean;
  messageType: 'text' | 'equation' | 'code' | 'image' | 'audio';
  timestamp: Date;
  aiModel?: string;
  processingTime?: number; // in milliseconds
  metadata?: {
    confidence: number;
    sentiment: 'positive' | 'negative' | 'neutral' | 'confused';
    conceptsIdentified: string[];
    suggestedActions: string[];
    nextTopics: string[];
    teachingMode: 'beginner' | 'normal' | 'advanced';
  };
}

export interface IChatSession extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  summary?: string;
  title?: string;
  subject?: string;
  currentTopic?: string;
  context: {
    difficulty: 'beginner' | 'normal' | 'advanced';
    teachingMode: 'beginner' | 'normal' | 'advanced';
    previousConcepts: string[];
    sessionType: 'teaching' | 'chat' | 'quiz-prep' | 'review';
    learningObjectives: string[];
    messageCount?: number;
  };
  messages: IChatMessage[];
  sessionStatus: 'active' | 'paused' | 'completed' | 'archived';
  startTime: Date;
  endTime?: Date;
  lastActivity: Date;
  messageCount: number;
  totalDuration: number;
  conceptsCovered: Array<{
    concept: string;
    confidence: number;
    timestamp: Date;
  }>;
  quizzesGenerated: Types.ObjectId[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  addMessage(messageData: Partial<IChatMessage>): Promise<any>;
  endSession(): Promise<any>;
  archiveSession(): Promise<any>;
  getContextSummary(): any;
}

// Quiz Types
export interface IQuiz extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  subject: string;
  topic?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questions: IQuestion[];
  timeLimit?: number; // in minutes
  passingScore: number;
  maxAttempts: number;
  createdBy: {
    userId?: Types.ObjectId;
    type: 'user' | 'ai' | 'admin';
  };
  generationContext?: {
    chatSessionId?: Types.ObjectId;
    conversationSummary?: string;
    conceptsCovered: string[];
    aiModel: string;
    generatedAt: Date;
  };
  attempts: IQuizAttempt[];
  isActive: boolean;
  tags: string[];
  statistics: {
    totalAttempts: number;
    averageScore?: number;
    passRate?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  addAttempt(userId: string, answers: any[]): Promise<any>;
  calculateScore(answers: any[]): { raw: number; percentage: number; grade: string };
  getUserAttempts(userId: string): IQuizAttempt[];
  canUserAttempt(userId: string): boolean;
  checkAnswer(questionId: string, userAnswer: string): boolean;
}

export interface IQuestion {
  id: string;
  type: 'multiple-choice' | 'numerical' | 'text' | 'true-false';
  question: string;
  options?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  correctAnswer?: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  concepts: string[];
  hints?: string[];
  timeEstimate: number; // in seconds
}

export interface IQuizAttempt extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  startedAt: Date;
  completedAt?: Date;
  answers: Array<{
    questionId: string;
    userAnswer: string;
    isCorrect: boolean;
    timeSpent: number;
    confidence?: number;
  }>;
  score: {
    raw?: number;
    percentage?: number;
    grade?: string;
  };
  totalTime?: number;
  status: 'in-progress' | 'completed' | 'abandoned' | 'timed-out';
  analysis?: IQuizAnalysis;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuizAnalysis {
  overallPerformance: {
    score: number;
    grade: string;
    percentile?: number;
  };
  strengths: Array<{
    concept: string;
    confidence: number;
    reasoning: string;
  }>;
  weaknesses: Array<{
    concept: string;
    severity: 'low' | 'medium' | 'high';
    reasoning: string;
    suggestions: string[];
  }>;
  conceptAnalysis: Array<{
    concept: string;
    questionsTotal: number;
    questionsCorrect: number;
    accuracy: number;
    averageTime: number;
  }>;
  timeAnalysis: {
    totalTime: number;
    averageTimePerQuestion: number;
    timeEfficiency: 'too-fast' | 'optimal' | 'too-slow';
  };
  recommendations: Array<{
    type: 'study-topic' | 'practice-more' | 'review-concept' | 'time-management';
    priority: 'low' | 'medium' | 'high';
    description: string;
    resources?: Array<{
      title: string;
      url: string;
      type: 'article' | 'video' | 'practice' | 'course';
    }>;
  }>;
  aiInsights: {
    learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing';
    cognitiveLoad?: 'low' | 'medium' | 'high';
    confidenceLevel?: 'low' | 'medium' | 'high';
    nextSteps: string[];
  };
  generatedAt: Date;
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
