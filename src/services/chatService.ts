import { apiClient, ApiResponse } from './api';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
  type?: 'text' | 'code' | 'equation' | 'image';
  metadata?: {
    subject?: string;
    difficulty?: string;
    topic?: string;
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  courseId?: string;
  subject?: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface SendMessageRequest {
  message: string;
  sessionId?: string;
  subject?: string;
  currentTopic?: string;
  difficulty?: string;
  type?: 'text' | 'code' | 'equation' | 'image';
  isGreeting?: boolean;
  learningMode?: 'teaching' | 'chat';
}

class ChatService {
  async sendMessage(request: SendMessageRequest): Promise<ChatMessage> {
    try {
      const response: ApiResponse<{ message: ChatMessage; sessionId: string; session: any }> = await apiClient.post('/chat/message', request);
      
      if (response.success && response.data && response.data.message) {
        return response.data.message;
      }
      
      throw new Error(response.error || 'Failed to send message');
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  async createSession(subject?: string, courseId?: string, title?: string): Promise<ChatSession> {
    try {
      const response: ApiResponse<ChatSession> = await apiClient.post('/chat/session', {
        subject,
        courseId,
        title: title || `${subject || 'General'} Chat - ${new Date().toLocaleDateString()}`
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to create chat session');
    } catch (error) {
      console.error('Create session error:', error);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<ChatSession> {
    try {
      const response: ApiResponse<ChatSession> = await apiClient.get(`/chat/session/${sessionId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch chat session');
    } catch (error) {
      console.error('Get session error:', error);
      throw error;
    }
  }

  async getUserSessions(): Promise<ChatSession[]> {
    try {
      const response: ApiResponse<ChatSession[]> = await apiClient.get('/chat/sessions');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch chat sessions');
    } catch (error) {
      console.error('Get user sessions error:', error);
      throw error;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const response: ApiResponse = await apiClient.delete(`/chat/session/${sessionId}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete chat session');
      }
    } catch (error) {
      console.error('Delete session error:', error);
      throw error;
    }
  }

  async updateSessionTitle(sessionId: string, title: string): Promise<ChatSession> {
    try {
      const response: ApiResponse<ChatSession> = await apiClient.put(`/chat/session/${sessionId}`, {
        title
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to update session title');
    } catch (error) {
      console.error('Update session title error:', error);
      throw error;
    }
  }

  async generateQuizFromChat(sessionId: string, numQuestions?: number): Promise<{ quizId: string }> {
    try {
      const response: ApiResponse<{ quizId: string }> = await apiClient.post(`/chat/session/${sessionId}/generate-quiz`, {
        numQuestions: numQuestions || 5
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to generate quiz from chat');
    } catch (error) {
      console.error('Generate quiz from chat error:', error);
      throw error;
    }
  }

  async generateCourseOutline(subject: string, difficulty?: string, topics?: string[]): Promise<any> {
    try {
      const response: ApiResponse<any> = await apiClient.post('/chat/generate-outline', {
        subject,
        difficulty: difficulty || 'intermediate',
        topics
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to generate course outline');
    } catch (error) {
      console.error('Generate course outline error:', error);
      throw error;
    }
  }

  async exportChatHistory(sessionId: string, format: 'pdf' | 'txt' | 'md'): Promise<Blob> {
    try {
      const response = await fetch(`${apiClient['baseURL']}/chat/session/${sessionId}/export?format=${format}`, {
        method: 'GET',
        headers: apiClient['getHeaders'](),
      });
      
      if (!response.ok) {
        throw new Error('Failed to export chat history');
      }
      
      return response.blob();
    } catch (error) {
      console.error('Export chat history error:', error);
      throw error;
    }
  }

  async getChatSessions(options?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<{
    sessions: ChatSession[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    try {
      const params = new URLSearchParams();
      if (options?.page) params.append('page', options.page.toString());
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.status) params.append('status', options.status);
      if (options?.search) params.append('search', options.search);

      const response: ApiResponse<any> = await apiClient.get(`/chat/sessions?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Get chat sessions error:', error);
      throw error;
    }
  }

  async updateChatSession(sessionId: string, updates: {
    status?: 'active' | 'paused' | 'completed' | 'archived';
    title?: string;
  }): Promise<ApiResponse<ChatSession>> {
    try {
      const response: ApiResponse<ChatSession> = await apiClient.put(`/chat/session/${sessionId}`, updates);
      return response;
    } catch (error) {
      console.error('Update chat session error:', error);
      throw error;
    }
  }

  async deleteChatSession(sessionId: string): Promise<ApiResponse<void>> {
    try {
      const response: ApiResponse<void> = await apiClient.delete(`/chat/session/${sessionId}`);
      return response;
    } catch (error) {
      console.error('Delete chat session error:', error);
      throw error;
    }
  }

  async getChatSession(sessionId: string): Promise<ApiResponse<{ session: ChatSession }>> {
    try {
      const response: ApiResponse<{ session: ChatSession }> = await apiClient.get(`/chat/session/${sessionId}`);
      return response;
    } catch (error) {
      console.error('Get chat session error:', error);
      throw error;
    }
  }

  // NEW: Get chat sessions for a specific course/topic
  async getCourseSessionsCall(courseId: string, topicId?: string): Promise<ApiResponse<{ sessions: ChatSession[] }>> {
    try {
      const params = topicId ? `?topicId=${topicId}` : '';
      const response: ApiResponse<{ sessions: ChatSession[] }> = await apiClient.get(`/chat/sessions/course/${courseId}${params}`);
      return response;
    } catch (error) {
      console.error('Get course sessions error:', error);
      throw error;
    }
  }

  // NEW: Create a new chat session for a course/topic
  async createCourseSession(courseId: string, topicId?: string, subject?: string, title?: string): Promise<ApiResponse<{ session: ChatSession }>> {
    try {
      const response: ApiResponse<{ session: ChatSession }> = await apiClient.post('/chat/session/create', {
        courseId,
        topicId,
        subject,
        title
      });
      return response;
    } catch (error) {
      console.error('Create course session error:', error);
      throw error;
    }
  }

  // NEW: Resume a previous chat session
  async resumeSession(sessionId: string): Promise<ApiResponse<{ session: ChatSession }>> {
    try {
      const response: ApiResponse<{ session: ChatSession }> = await apiClient.post(`/chat/session/${sessionId}/resume`);
      return response;
    } catch (error) {
      console.error('Resume session error:', error);
      throw error;
    }
  }
}

export const chatService = new ChatService();