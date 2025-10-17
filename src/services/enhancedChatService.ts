import { apiClient, ApiResponse } from './api';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
  type?: 'text' | 'code' | 'equation' | 'image' | 'moderation';
  metadata?: {
    subject?: string;
    difficulty?: string;
    topic?: string;
    moderation?: {
      approved: boolean;
      reasoning: string;
      suggestedQuery?: string;
      relevantSubjects: string[];
      confidenceScore: number;
    };
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

export interface ModerationAlert {
  show: boolean;
  reasoning: string;
  suggestedQuery?: string;
  relevantSubjects: string[];
}

class EnhancedChatService {
  async sendMessage(request: SendMessageRequest): Promise<{
    message: ChatMessage;
    sessionId: string;
    moderationAlert?: ModerationAlert;
  }> {
    try {
      const response: ApiResponse<{ 
        message: ChatMessage; 
        sessionId: string; 
        session: any;
        moderation?: any;
      }> = await apiClient.post('/chat/message', request);
      
      if (response.success && response.data && response.data.message) {
        const result: {
          message: ChatMessage;
          sessionId: string;
          moderationAlert?: ModerationAlert;
        } = {
          message: response.data.message,
          sessionId: response.data.sessionId
        };

        // Check if there's moderation information
        if (response.data.moderation && !response.data.moderation.approved) {
          result.moderationAlert = {
            show: true,
            reasoning: response.data.moderation.reasoning,
            suggestedQuery: response.data.moderation.suggestedQuery,
            relevantSubjects: response.data.moderation.relevantSubjects
          };

          // Update message type to indicate moderation
          result.message.type = 'moderation';
          result.message.metadata = {
            ...result.message.metadata,
            moderation: response.data.moderation
          };
        }

        return result;
      }
      
      throw new Error(response.error || 'Failed to send message');
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  async createSession(subject?: string, topic?: string, difficulty?: string): Promise<{
    sessionId: string;
    session: ChatSession;
  }> {
    try {
      const response: ApiResponse<{ sessionId: string; session: ChatSession }> = await apiClient.post('/chat/session', {
        subject,
        topic,
        difficulty
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to create session');
    } catch (error) {
      console.error('Create session error:', error);
      throw error;
    }
  }

  async getSessions(): Promise<ChatSession[]> {
    try {
      const response: ApiResponse<ChatSession[]> = await apiClient.get('/chat/sessions');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to get sessions');
    } catch (error) {
      console.error('Get sessions error:', error);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<ChatSession> {
    try {
      const response: ApiResponse<{ session: ChatSession }> = await apiClient.get(`/chat/session/${sessionId}`);
      
      if (response.success && response.data && response.data.session) {
        return response.data.session;
      }
      
      throw new Error(response.error || 'Failed to get session');
    } catch (error) {
      console.error('Get session error:', error);
      throw error;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const response: ApiResponse<any> = await apiClient.delete(`/chat/session/${sessionId}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete session');
      }
    } catch (error) {
      console.error('Delete session error:', error);
      throw error;
    }
  }

  async generateCourseOutline(
    topic: string, 
    subject: string, 
    difficulty: string, 
    educationLevel: string
  ): Promise<any> {
    try {
      const response: ApiResponse<any> = await apiClient.post('/chat/course-outline', {
        topic,
        subject,
        difficulty,
        educationLevel
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

  async processVoiceInput(audioData: Blob): Promise<ChatMessage> {
    try {
      const formData = new FormData();
      formData.append('audio', audioData, 'voice-input.wav');
      
      const response: ApiResponse<{ message: ChatMessage }> = await apiClient.post('/chat/voice', formData);
      
      if (response.success && response.data && response.data.message) {
        return response.data.message;
      }
      
      throw new Error(response.error || 'Failed to process voice input');
    } catch (error) {
      console.error('Process voice input error:', error);
      throw error;
    }
  }

  // Helper method to check if a message was moderated
  isMessageModerated(message: ChatMessage): boolean {
    return message.type === 'moderation' || 
           Boolean(message.metadata?.moderation && !message.metadata.moderation.approved);
  }

  // Helper method to get moderation info from a message
  getModerationInfo(message: ChatMessage): ModerationAlert | null {
    if (!this.isMessageModerated(message) || !message.metadata?.moderation) {
      return null;
    }

    return {
      show: true,
      reasoning: message.metadata.moderation.reasoning,
      suggestedQuery: message.metadata.moderation.suggestedQuery,
      relevantSubjects: message.metadata.moderation.relevantSubjects
    };
  }

  // Helper method to format moderated response for display
  formatModeratedMessage(message: ChatMessage): string {
    const moderationInfo = this.getModerationInfo(message);
    if (!moderationInfo) return message.content;

    let formattedMessage = message.content;
    
    if (moderationInfo.suggestedQuery) {
      formattedMessage += `\n\n💡 **Suggested question**: "${moderationInfo.suggestedQuery}"`;
    }

    if (moderationInfo.relevantSubjects.length > 0) {
      formattedMessage += `\n\n📚 **Available topics**: ${moderationInfo.relevantSubjects.join(', ')}`;
    }

    return formattedMessage;
  }
}

export const enhancedChatService = new EnhancedChatService();

// Export both the enhanced service and original interface for backward compatibility
export const chatService = enhancedChatService;
export default enhancedChatService;