export interface User {
  id: string;
  name: string;
  email: string;
  educationLevel: 'elementary' | 'middle' | 'high' | 'college';
  preferredSubjects: string[];
  avatar?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  progress: number;
  topics: Topic[];
  thumbnail: string;
  enrolledCount?: number;
  rating?: number;
  isEnrolled?: boolean;
}

export interface Topic {
  id: string;
  title: string;
  completed: boolean;
  duration: string;
  subtopics?: Subtopic[];
}

export interface Subtopic {
  id: string;
  title: string;
  completed: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'equation' | 'code';
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  timeLimit?: number;
  subject: string;
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'numerical' | 'text' | 'image-based' | 'true-false';
  question: string;
  options?: string[] | { id: string; text: string; isCorrect?: boolean }[];
  correctAnswer: string | number;
  explanation?: string;
  image?: string;
  points?: number;
  timeEstimate?: number;
  hints?: string[];
}

export interface QuizResult {
  id: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  completedAt: Date;
  timeSpent: number;
  answers: { questionId: string; answer: string | number; correct: boolean }[];
}

export interface QuizAttempt {
  id?: string;
  quizId: string;
  attemptId: string;
  title: string;
  subject: string;
  topic?: string;
  difficulty: 'easy' | 'intermediate' | 'hard';
  score: {
    raw: number;
    percentage: number;
    grade: string;
  };
  completedAt: Date;
  status: 'completed' | 'in-progress' | 'abandoned';
  userId?: string;
}

export interface QuizHistoryItem {
  quizId: string;
  title: string;
  subject: string;
  topic?: string;
  difficulty: 'easy' | 'intermediate' | 'hard';
  totalAttempts: number;
  bestScore: {
    percentage: number;
    grade: string;
  };
  lastAttempt: {
    attemptId: string;
    completedAt: Date;
    score: number;
  };
}

export type TeachingMode = 'beginner' | 'normal' | 'advanced';
export type LearningMode = 'teaching' | 'practice' | 'review' | 'chat';