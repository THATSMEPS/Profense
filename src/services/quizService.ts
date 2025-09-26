import { apiClient, ApiResponse } from './api';
import { Quiz, QuizResult, QuizAttempt, QuizHistoryItem } from '../types';

export interface QuizFilters {
  subject?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  type?: 'practice' | 'assessment';
  courseId?: string;
  page?: number;
  limit?: number;
}

export interface CreateQuizRequest {
  title: string;
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeLimit?: number;
  passingScore?: number;
  courseId?: string;
  topics?: string[];
  numQuestions?: number;
  questionTypes?: string[];
}

class QuizService {
  async getQuizzes(filters?: QuizFilters): Promise<{ quizzes: Quiz[]; total: number; pages: number }> {
    try {
      const response: ApiResponse<{ quizzes: Quiz[]; total: number; pages: number }> = 
        await apiClient.get('/quiz', filters);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch quizzes');
    } catch (error) {
      console.error('Get quizzes error:', error);
      throw error;
    }
  }

  async getQuizById(quizId: string): Promise<Quiz> {
    try {
      const response: ApiResponse<Quiz> = await apiClient.get(`/quiz/${quizId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch quiz');
    } catch (error) {
      console.error('Get quiz error:', error);
      throw error;
    }
  }

  async startQuiz(quizId: string): Promise<QuizAttempt> {
    try {
      const response: ApiResponse<QuizAttempt> = await apiClient.post(`/quiz/${quizId}/start`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to start quiz');
    } catch (error) {
      console.error('Start quiz error:', error);
      throw error;
    }
  }

  async submitAnswer(attemptId: string, questionId: string, answer: any): Promise<void> {
    try {
      const response: ApiResponse = await apiClient.post(`/quiz/attempt/${attemptId}/answer`, {
        questionId,
        answer
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to submit answer');
      }
    } catch (error) {
      console.error('Submit answer error:', error);
      throw error;
    }
  }

  async submitQuiz(attemptId: string, answers: Record<string, any>): Promise<QuizResult> {
    try {
      const response: ApiResponse<QuizResult> = await apiClient.post(`/quiz/attempt/${attemptId}/submit`, {
        answers
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to submit quiz');
    } catch (error) {
      console.error('Submit quiz error:', error);
      throw error;
    }
  }

  async getQuizAttempts(quizId?: string): Promise<QuizAttempt[]> {
    try {
      const endpoint = quizId ? `/quiz/${quizId}/attempts` : '/quiz/attempts';
      const response: ApiResponse<QuizAttempt[]> = await apiClient.get(endpoint);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch quiz attempts');
    } catch (error) {
      console.error('Get quiz attempts error:', error);
      throw error;
    }
  }

  async getQuizResults(quizId?: string): Promise<QuizResult[]> {
    try {
      const endpoint = quizId ? `/quiz/${quizId}/results` : '/quiz/results';
      const response: ApiResponse<QuizResult[]> = await apiClient.get(endpoint);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch quiz results');
    } catch (error) {
      console.error('Get quiz results error:', error);
      throw error;
    }
  }

  async createQuiz(quizData: CreateQuizRequest): Promise<Quiz> {
    try {
      const response: ApiResponse<Quiz> = await apiClient.post('/quiz/create', quizData);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to create quiz');
    } catch (error) {
      console.error('Create quiz error:', error);
      throw error;
    }
  }

  async generateQuiz(
    subject: string, 
    difficulty: string, 
    numQuestions: number = 5,
    topic?: string,
    chatContext?: string
  ): Promise<Quiz> {
    try {
      const requestBody: any = {
        subject,
        difficulty,
        numQuestions
      };

      // Add topic and chat context if provided for better contextual quiz generation
      if (topic) {
        requestBody.topic = topic;
      }
      
      if (chatContext) {
        requestBody.chatContext = chatContext;
      }

      const response: ApiResponse<{ quiz: Quiz }> = await apiClient.post('/quiz/generate', requestBody);
      
      if (response.success && response.data && response.data.quiz) {
        return response.data.quiz;
      }
      
      throw new Error(response.error || 'Failed to generate quiz');
    } catch (error) {
      console.error('Generate quiz error:', error);
      throw error;
    }
  }

  // New contextual quiz generation method
  async generateContextualQuiz(options: {
    sessionId: string;
    subject: string;
    topic?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    questionCount?: number;
    questionTypes?: string[];
  }): Promise<Quiz> {
    try {
      const response: ApiResponse<Quiz> = await apiClient.post('/quiz-new/generate', options);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to generate contextual quiz');
    } catch (error) {
      console.error('Generate contextual quiz error:', error);
      throw error;
    }
  }

  // Submit quiz with analysis
  async submitQuizWithAnalysis(quizId: string, answers: any[], timeSpent: number): Promise<any> {
    try {
      const response: ApiResponse<any> = await apiClient.post(`/quiz-new/${quizId}/submit`, {
        answers,
        timeSpent
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to submit quiz');
    } catch (error) {
      console.error('Submit quiz with analysis error:', error);
      throw error;
    }
  }

  // Get quiz by ID with detailed structure
  async getQuizDetails(quizId: string): Promise<Quiz> {
    try {
      const response: ApiResponse<Quiz> = await apiClient.get(`/quiz-new/${quizId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch quiz details');
    } catch (error) {
      console.error('Get quiz details error:', error);
      throw error;
    }
  }

  // Get user's quiz history with performance analysis
  async getQuizHistory(userId?: string): Promise<QuizHistoryItem[]> {
    try {
      const response: ApiResponse<{ history: QuizHistoryItem[], summary: any }> = await apiClient.get('/quiz-new/history');
      
      if (response.success && response.data && response.data.history) {
        return response.data.history;
      }
      
      throw new Error(response.error || 'Failed to fetch quiz history');
    } catch (error) {
      console.error('Get quiz history error:', error);
      throw error;
    }
  }

  // Get detailed analysis for a specific quiz attempt
  async getQuizAnalysis(quizId: string, attemptId: string): Promise<any> {
    try {
      const response: ApiResponse<any> = await apiClient.get(`/quiz-new/${quizId}/analysis/${attemptId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch quiz analysis');
    } catch (error) {
      console.error('Get quiz analysis error:', error);
      throw error;
    }
  }

  async getQuizStatistics(quizId: string): Promise<any> {
    try {
      const response: ApiResponse<any> = await apiClient.get(`/quiz/${quizId}/statistics`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch quiz statistics');
    } catch (error) {
      console.error('Get quiz statistics error:', error);
      throw error;
    }
  }

  async deleteQuiz(quizId: string): Promise<void> {
    try {
      const response: ApiResponse = await apiClient.delete(`/quiz/${quizId}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete quiz');
      }
    } catch (error) {
      console.error('Delete quiz error:', error);
      throw error;
    }
  }

  async getRecommendedQuizzes(): Promise<Quiz[]> {
    try {
      const response: ApiResponse<{ quizzes: Quiz[] }> = await apiClient.get('/quiz/recommended');
      
      if (response.success && response.data && response.data.quizzes) {
        return response.data.quizzes;
      }
      
      throw new Error(response.error || 'Failed to fetch recommended quizzes');
    } catch (error) {
      console.error('Get recommended quizzes error:', error);
      throw error;
    }
  }
}

export const quizService = new QuizService();