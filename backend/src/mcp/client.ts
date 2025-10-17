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
  private toolHandlers: Map<string, any> = new Map();

  constructor(private options: MCPClientOptions = {}) {}

  public setServerInstance(serverInstance: any, tools?: { [key: string]: any }) {
    this.mcpServerInstance = serverInstance;
    
    // Store tool handlers for direct access
    if (tools) {
      Object.entries(tools).forEach(([name, tool]) => {
        if (tool && tool.handler) {
          this.toolHandlers.set(tool.name, tool.handler);
        }
      });
    }
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
      // Get the manage_chat_context tool handler
      const handler = this.toolHandlers.get('manage_chat_context');
      if (!handler) {
        throw new Error('manage_chat_context tool handler not found');
      }

      const result = await handler({
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
      // Get the moderate_content tool handler
      const handler = this.toolHandlers.get('moderate_content');
      if (!handler) {
        throw new Error('moderate_content tool handler not found');
      }

      const result = await handler({
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
    userId: string,
    contextData?: {
      chatHistory?: any[];
      conceptsCovered?: string[];
      subject?: string;
      difficulty?: string;
    }
  ): Promise<QuizEvaluationResult> {
    if (!this.isConnected || !this.mcpServerInstance) {
      throw new Error('MCP Client not connected');
    }

    try {
      // The MCP server expects an array of answers with questionId and answer
      // Convert the answers object to the expected format
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer: typeof answer === 'object' ? JSON.stringify(answer) : String(answer)
      }));

      // Get the evaluate_quiz tool handler
      const evaluateQuizHandler = this.toolHandlers.get('evaluate_quiz');
      if (!evaluateQuizHandler) {
        throw new Error('evaluate_quiz tool handler not found');
      }

      // Call the tool handler directly
      const result = await evaluateQuizHandler({
        quizId,
        answers: answersArray,
        userId
      });

      logger.info('MCP evaluation result:', { result });

      // Transform the MCP result to match our QuizEvaluationResult interface
      if (result.success) {
        const detailedResults = result.feedback.map((item: any, index: number) => ({
          questionId: answersArray[index]?.questionId || String(index),
          question: item.question,
          userAnswer: item.userAnswer,
          correctAnswer: item.correctAnswer,
          isCorrect: item.isCorrect,
          score: item.isCorrect ? 1 : 0,
          feedback: item.isCorrect ? 'Correct!' : 'Incorrect',
          explanation: item.isCorrect 
            ? `Great job! ${item.correctAnswer} is correct.` 
            : `The correct answer is: ${item.correctAnswer}`
        }));

        const totalScore = detailedResults.filter((r: any) => r.isCorrect).length;
        const maxScore = detailedResults.length;
        const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
        
        // Calculate grade
        let grade = 'F';
        if (percentage >= 90) grade = 'A';
        else if (percentage >= 80) grade = 'B';
        else if (percentage >= 70) grade = 'C';
        else if (percentage >= 60) grade = 'D';

        return {
          quizId,
          totalScore,
          maxScore,
          percentage,
          grade,
          detailedResults,
          overallFeedback: result.detailedFeedback || 'Quiz completed successfully.',
          completedAt: new Date()
        };
      }

      throw new Error(result.message || 'Quiz evaluation failed');
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