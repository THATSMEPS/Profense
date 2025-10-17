// quizservice.ts
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

  async getQuizResult(attemptId: string): Promise<QuizResult> {
    try {
      const response: ApiResponse<QuizResult> = await apiClient.get(`/quiz/result/${attemptId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch quiz result');
    } catch (error) {
      console.error('Get quiz result error:', error);
      throw error;
    }
  }

  // Updated: use /quiz/history endpoint implemented in quiz.routes
  async getQuizHistory(filters?: { page?: number; limit?: number }): Promise<QuizHistoryItem[]> {
    try {
      const response: ApiResponse<QuizHistoryItem[]> = 
        await apiClient.get('/quiz/history', filters);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch quiz history');
    } catch (error) {
      console.error('Get quiz history error:', error);
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

  async generateQuizFromContext(
    context: {
      sessionId?: string;
      subject?: string;
      topic?: string;
      difficulty?: 'beginner' | 'intermediate' | 'advanced';
      questionCount?: number;
      questionTypes?: ('multiple-choice' | 'numerical' | 'text')[];
    }
  ): Promise<Quiz> {
    try {
      console.log('Generating quiz with context:', context);
      
      // Updated endpoint to /quiz/generate
      const response: ApiResponse<{ quiz: Quiz }> = await apiClient.post('/quiz/generate', context);
      if (response.success && response.data && response.data.quiz) {
        return response.data.quiz;
      }
      throw new Error(response.error || 'Failed to generate quiz');
    } catch (error) {
      console.error('Error generating quiz from context:', error);
      throw error;
    }
  }

  async submitGeneratedQuiz(
    quizId: string,
    answers: Record<string, any>
  ): Promise<any> {
    try {
      // Updated endpoint to /quiz/:id/submit
      const response: ApiResponse<any> = await apiClient.post(`/quiz/${quizId}/submit`, { answers });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to submit generated quiz');
    } catch (error) {
      console.error('Error submitting generated quiz:', error);
      throw error;
    }
  }

  // Legacy method for backward compatibility
  async generateQuiz(
    subject: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    questionCount?: number,
    topic?: string,
    chatContext?: string
  ): Promise<Quiz> {
    const context: any = {
      subject,
      difficulty,
      topic,
      questionCount: questionCount || 10,
      questionTypes: ['multiple-choice', 'numerical', 'text']
    };
    
    if (chatContext) {
      context.chatContext = chatContext;
    }
    
    return this.generateQuizFromContext(context);
  }

  // Get recommended quizzes
  async getRecommendedQuizzes(): Promise<Quiz[]> {
    try {
      // best-effort: use /quiz/recommended if available; fallback to /quiz
      try {
        const response: ApiResponse<Quiz[]> = await apiClient.get('/quiz/recommended');
        if (response.success && response.data) return response.data;
      } catch (e) {
        // ignore and fallback
      }

      const quizzesResponse = await this.getQuizzes({ limit: 5 });
      return quizzesResponse.quizzes;
    } catch (error) {
      console.error('Error getting recommended quizzes:', error);
      return [];
    }
  }
}

export const quizService = new QuizService();
