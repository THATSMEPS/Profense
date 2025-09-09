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
}

class ChatService {
  async sendMessage(request: SendMessageRequest): Promise<ChatMessage> {
    try {
      const response: ApiResponse<ChatMessage> = await apiClient.post('/chat/message', request);
      
      if (response.success && response.data) {
        return response.data;
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
}

export const chatService = new ChatService();