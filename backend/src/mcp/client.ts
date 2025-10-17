import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { logger } from '../utils/logger';

export interface MCPClientOptions {
  serverPort?: number;
  serverHost?: string;
}

export interface ChatContextResult {
  success: boolean;
  contextSummary?: string;
  keyPoints?: string[];
  learningObjectives?: string[];
  sessionId: string;
}

export interface ContentModerationResult {
  query: string;
  approved: boolean;
  reasoning: string;
  suggestedQuery?: string;
  relevantSubjects: string[];
  confidenceScore: number;
}

export interface QuizEvaluationResult {
  quizId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: string;
  detailedResults: any[];
  overallFeedback: string;
  completedAt: Date;
}

export class MCPClientService {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private isConnected: boolean = false;
  private mcpServerInstance: any = null;

  constructor(private options: MCPClientOptions = {}) {}

  public setServerInstance(serverInstance: any) {
    this.mcpServerInstance = serverInstance;
  }

  async connect(): Promise<void> {
    try {
      if (!this.mcpServerInstance) {
        throw new Error("MCP Server instance has not been set. Call setServerInstance first.");
      }
      this.isConnected = true;
      logger.info('MCP Client connected successfully');
    } catch (error) {
      logger.error('Failed to connect MCP client:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      this.mcpServerInstance = null;
      this.isConnected = false;
      logger.info('MCP Client disconnected');
    } catch (error) {
      logger.error('Error disconnecting MCP client:', error);
    }
  }

  async manageChatContext(
    sessionId: string,
    summary?: string,
    keyPoints?: string[],
    learningObjectives?: string[]
  ): Promise<ChatContextResult> {
    if (!this.isConnected || !this.mcpServerInstance) {
      throw new Error('MCP Client not connected');
    }

    try {
      const result = await this.mcpServerInstance.run('manage_chat_context', {
        sessionId,
        summary,
        keyPoints,
        learningObjectives
      });

      return result as ChatContextResult;
    } catch (error) {
      logger.error('Error managing chat context:', error);
      throw error;
    }
  }

  async moderateContent(
    query: string,
    allowedSubjects: string[] = [],
    strictMode: boolean = true
  ): Promise<ContentModerationResult> {
    if (!this.isConnected || !this.mcpServerInstance) {
      throw new Error('MCP Client not connected');
    }

    try {
      const result = await this.mcpServerInstance.run('moderate_content', {
        query,
        allowedSubjects,
        strictMode
      });

      return result as ContentModerationResult;
    } catch (error) {
      logger.error('Error moderating content:', error);
      throw error;
    }
  }

  async evaluateQuiz(
    quizId: string,
    answers: Record<string, any>,
    contextData?: {
      chatHistory?: any[];
      conceptsCovered?: string[];
    }
  ): Promise<QuizEvaluationResult> {
    if (!this.isConnected || !this.mcpServerInstance) {
      throw new Error('MCP Client not connected');
    }

    try {
      const result = await this.mcpServerInstance.evaluateQuizDirect({
        quizId,
        answers,
        contextData
      });

      return result as QuizEvaluationResult;
    } catch (error) {
      logger.error('Error evaluating quiz:', error);
      throw error;
    }
  }

  async trackLearningProgress(
    userId: string,
    action: 'get_progress' | 'update_progress' | 'get_recommendations',
    sessionId?: string
  ): Promise<any> {
    if (!this.isConnected || !this.mcpServerInstance) {
      throw new Error('MCP Client not connected');
    }

    try {
      // For now, implement basic tracking directly
      switch (action) {
        case 'get_progress':
          return await this.getLearningProgress(userId);
        case 'update_progress':
          return { success: true, message: 'Progress updated' };
        case 'get_recommendations':
          return { recommendations: [] };
        default:
          throw new Error('Invalid action');
      }
    } catch (error) {
      logger.error('Error tracking learning progress:', error);
      throw error;
    }
  }

  isClientConnected(): boolean {
    return this.isConnected;
  }

  private async getLearningProgress(userId: string) {
    try {
      const ChatSession = (await import('../models/ChatSession')).ChatSession;
      const Quiz = (await import('../models/Quiz')).Quiz;
      
      const sessions = await ChatSession.find({ userId }).sort({ createdAt: -1 }).limit(10);
      const quizzes = await Quiz.find({ userId }).sort({ createdAt: -1 }).limit(10);
      
      const subjectsStudied = [...new Set(sessions.map(s => s.subject))];
      const averageQuizScore = quizzes.length > 0 
        ? quizzes.reduce((sum, q) => {
            const lastAttempt = q.attempts && q.attempts.length > 0 ? q.attempts[q.attempts.length - 1] : null;
            return sum + (lastAttempt?.score?.percentage || 0);
          }, 0) / quizzes.length 
        : 0;

      return {
        userId,
        totalSessions: sessions.length,
        subjectsStudied,
        averageQuizScore,
        recentActivity: sessions.slice(0, 5).map(s => ({
          subject: s.subject,
          topic: s.currentTopic,
          date: s.createdAt
        }))
      };
    } catch (error) {
      logger.error('Error getting learning progress:', error);
      return {
        userId,
        totalSessions: 0,
        subjectsStudied: [],
        averageQuizScore: 0,
        recentActivity: []
      };
    }
  }
}

// Singleton instance
export const mcpClient = new MCPClientService();