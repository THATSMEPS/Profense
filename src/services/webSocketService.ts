import { io, Socket } from 'socket.io-client';
import { apiClient } from './api';

export interface SocketMessage {
  type: 'message' | 'typing' | 'connection' | 'error' | 'notification';
  data: any;
  userId?: string;
  sessionId?: string;
  timestamp: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = apiClient.getToken();
    const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

    this.socket = io(socketUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      retries: 3
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Handle authentication errors
    this.socket.on('auth_error', (error) => {
      console.error('WebSocket auth error:', error);
      // Redirect to login or refresh token
      this.disconnect();
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, delay);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
  }

  // Chat related events
  joinChatSession(sessionId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join-session', { sessionId });
    }
  }

  leaveChatSession(sessionId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave-session', { sessionId });
    }
  }

  sendChatMessage(sessionId: string, message: string): void {
    if (this.socket?.connected) {
      this.socket.emit('chat-message', { sessionId, message });
    }
  }

  onChatMessage(callback: (message: any) => void): void {
    if (this.socket) {
      this.socket.on('chat-message', callback);
    }
  }

  onTyping(callback: (data: { userId: string; sessionId: string; isTyping: boolean }) => void): void {
    if (this.socket) {
      this.socket.on('typing', callback);
    }
  }

  emitTyping(sessionId: string, isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('typing', { sessionId, isTyping });
    }
  }

  // Quiz related events
  joinQuizSession(quizId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join-quiz', { quizId });
    }
  }

  leaveQuizSession(quizId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave-quiz', { quizId });
    }
  }

  onQuizUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('quiz-update', callback);
    }
  }

  // Course related events
  joinCourseSession(courseId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join-course', { courseId });
    }
  }

  leaveCourseSession(courseId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave-course', { courseId });
    }
  }

  onCourseUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('course-update', callback);
    }
  }

  // Notification events
  onNotification(callback: (notification: any) => void): void {
    if (this.socket) {
      this.socket.on('notification', callback);
    }
  }

  // General purpose event listeners
  on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  off(event: string, callback?: (data: any) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  // Status methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Force reconnection
  forceReconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.reconnectAttempts = 0;
      setTimeout(() => this.connect(), 100);
    }
  }
}

export const webSocketService = new WebSocketService();