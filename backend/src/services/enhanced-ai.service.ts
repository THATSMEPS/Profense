import { AIService, getAIService } from './ai.service';
import { mcpClient } from '../mcp/client';
import { logger } from '../utils/logger';
import { Course } from '../models/Course';
import { TeachingMode } from '../types';

export class EnhancedAIService {
  private aiService: AIService;
  private allowedSubjects: string[] = [];

  constructor() {
    this.aiService = getAIService();
    this.initializeAllowedSubjects();
  }

  private async initializeAllowedSubjects() {
    try {
      const courses = await Course.find({}, 'subject title');
      this.allowedSubjects = [
        ...new Set(courses.map(course => course.subject))
      ];
      
      // Add common educational subjects as fallback
      const defaultSubjects = [
        'Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology',
        'Computer Science', 'Programming', 'History', 'Literature',
        'Geography', 'Economics', 'Engineering', 'Medicine',
        'Psychology', 'Sociology', 'Philosophy', 'Art', 'Music'
      ];

      this.allowedSubjects = [
        ...this.allowedSubjects,
        ...defaultSubjects.filter(subject => !this.allowedSubjects.includes(subject))
      ];

      logger.info(`Initialized ${this.allowedSubjects.length} allowed subjects for content moderation`);
    } catch (error) {
      logger.error('Error initializing allowed subjects:', error);
      // Use default subjects as fallback
      this.allowedSubjects = [
        'Mathematics', 'Science', 'Computer Science', 'Programming',
        'Physics', 'Chemistry', 'Biology', 'History', 'Literature'
      ];
    }
  }

  async generateModeratedResponse(
    prompt: string,
    context: any = {}, // Using 'any' for flexibility with different contexts
    options: any = {}
  ): Promise<any> {
    try {
      // Temporarily disable MCP moderation until implementation is fixed
      // if (!mcpClient.isClientConnected()) {
      //   await mcpClient.connect();
      // }

      // const moderationResult = await mcpClient.moderateContent(
      //   prompt,
      //   this.allowedSubjects,
      //   options.strictMode !== false // Default to true
      // );

      // Use basic content moderation for now
      const basicModeration = this.performBasicModeration(prompt);
      
      // If content is not approved, return moderation response
      if (!basicModeration.approved) {
        return {
          content: this.generateModerationResponse(basicModeration),
          type: 'moderation',
          moderation: basicModeration
        };
      }

      // If approved, generate AI response with educational focus
      const enhancedPrompt = this.enhancePromptForEducation(prompt, this.allowedSubjects);
      
      // Correctly call generateTeachingResponse
      const response = await this.aiService.generateTeachingResponse(enhancedPrompt, {
        ...context,
        difficulty: context.difficulty || 'normal',
        teachingMode: context.teachingMode || 'normal',
        previousConcepts: context.previousConcepts || [],
      });

      return {
        ...response,
        moderation: { approved: true, type: 'basic' }
      };

    } catch (error) {
      logger.error('Error generating moderated response:', error);
      
      // Fallback to original AI service if MCP fails
      try {
        // Correctly call generateTeachingResponse as a fallback
        return await this.aiService.generateTeachingResponse(prompt, {
          ...context,
          difficulty: context.difficulty || 'normal',
          teachingMode: context.teachingMode || 'normal',
          previousConcepts: context.previousConcepts || [],
        });
      } catch (fallbackError) {
        logger.error('Fallback AI service also failed:', fallbackError);
        throw fallbackError;
      }
    }
  }

  private generateModerationResponse(moderationResult: any): string {
    const responses = [
      `I'd be happy to help you learn! However, I notice your question might be outside our educational scope. ${moderationResult.reasoning}`,
      
      `Let's keep our discussion focused on learning! ${moderationResult.reasoning}`,
      
      `I'm here to help with your studies! ${moderationResult.reasoning}`
    ];

    let response = responses[Math.floor(Math.random() * responses.length)];

    if (moderationResult.suggestedQuery) {
      response += `\n\nMay I suggest asking: "${moderationResult.suggestedQuery}"`;
    }

    if (moderationResult.relevantSubjects.length > 0) {
      response += `\n\nI can help you with topics related to: ${moderationResult.relevantSubjects.join(', ')}`;
    }

    return response;
  }

  private performBasicModeration(prompt: string): { approved: boolean; response?: string; reasoning?: string; relevantSubjects?: string[] } {
    // Explicit inappropriate content patterns that should definitely be blocked
    const explicitlyInappropriatePatterns = [
      /\b(explicit|pornographic|sexual|nude|xxx)\b/i,
      /\b(violence|kill|murder|harm|suicide|self[-\s]harm)\b/i,
      /\b(illegal|drugs|cocaine|heroin|marijuana sale|weapon)\b/i,
      /\b(hate speech|racist|discrimination|offensive slur)\b/i
    ];
    
    // Educational content patterns - much broader to catch more legitimate queries
    const educationalPatterns = [
      /\b(explain|tell|what|how|why|learn|study|teach|understand|help|question|homework|assignment|course|lesson|tutorial)\b/i,
      /\b(math|science|physics|chemistry|biology|history|literature|programming|computer|engineering|medicine|law|business)\b/i,
      /\b(formula|equation|theory|concept|principle|definition|example|problem|solution|analysis)\b/i,
      /\b(optics|ray|light|calculus|algebra|geometry|trigonometry|statistics|probability)\b/i,
      /\b(atom|molecule|cell|evolution|gravity|energy|force|motion|electricity|magnetism)\b/i,
      /\b(language|grammar|writing|reading|literature|poetry|essay|story|novel)\b/i
    ];
    
    // Questions and learning indicators
    const questionPatterns = [
      /\?/,
      /\b(give me|show me|can you|could you|would you|please)\b/i
    ];
    
    const isExplicitlyInappropriate = explicitlyInappropriatePatterns.some(pattern => pattern.test(prompt));
    const isEducational = educationalPatterns.some(pattern => pattern.test(prompt));
    const isQuestion = questionPatterns.some(pattern => pattern.test(prompt));
    
    // Only block explicitly inappropriate content
    if (isExplicitlyInappropriate) {
      return {
        approved: false,
        reasoning: "I'm designed to help with educational content and cannot assist with inappropriate topics.",
        response: "I'm here to help you learn! Let's focus on educational topics that can support your studies.",
        relevantSubjects: this.allowedSubjects.slice(0, 5)
      };
    }
    
    // Allow educational content, questions, and general queries
    if (isEducational || isQuestion || prompt.length < 100) {
      return {
        approved: true,
        relevantSubjects: this.allowedSubjects
      };
    }
    
    // For longer messages that aren't clearly educational, still allow but encourage educational focus
    return {
      approved: true,
      relevantSubjects: this.allowedSubjects
    };
  }

  private enhancePromptForEducation(prompt: string, relevantSubjects: string[]): string {
    const educationalContext = `
As an educational AI assistant, please provide a comprehensive and pedagogically sound response.
Focus on being informative, accurate, and encouraging for learning.

Relevant subjects for this query: ${relevantSubjects.join(', ')}

Student's question: ${prompt}

Please:
1. Provide accurate, educational content
2. Use clear explanations suitable for learning
3. Include examples when helpful
4. Encourage further exploration of the topic
5. Stay within the educational scope of the relevant subjects

Response:`;

    return educationalContext;
  }

  // Proxy methods to original AI service
  async generateCourseOutline(
    topic: string,
    subject: string,
    difficulty: string,
    educationLevel: string,
    userContext?: any
  ) {
    return this.aiService.generateCourseOutline(topic, subject, difficulty, educationLevel, userContext);
  }

  async generateQuiz(options: {
    subject: string;
    topic: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    questionCount: number;
    questionTypes: string[];
    conversationContext: string;
    conceptsCovered: string[];
    userId: string;
  }) {
    return this.aiService.generateQuiz(options);
  }

  async generateDetailedContent(
    topic: string,
    subtopic: string,
    difficulty: string,
    userContext?: any
  ) {
    // This method doesn't exist on AIService, so we'll use a general method
    const prompt = `Generate detailed content about the subtopic "${subtopic}" within the main topic of "${topic}". The target difficulty is ${difficulty}.`;
    return this.aiService.generateTeachingResponse(prompt, { currentTopic: topic, difficulty, teachingMode: 'normal', previousConcepts: [], ...userContext });
  }

  async generateTeachingResponse(prompt: string, context: any) {
    // Use moderated response for teaching
    return this.generateModeratedResponse(prompt, context, {
      strictMode: true
    });
  }

  /**
   * Generate raw JSON response from AI without teaching wrappers
   * Use this for structured data generation (learning paths, problems, etc.)
   */
  async generateStructuredJSON(prompt: string): Promise<{ content: string; confidence: number }> {
    try {
      // Call AI service directly without teaching context
      const result = await this.aiService['chatModel'].generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      logger.info(`Generated structured JSON response (${text.length} chars)`);
      
      return {
        content: text,
        confidence: 0.9
      };
    } catch (error) {
      logger.error('Error generating structured JSON:', error);
      throw error;
    }
  }

  async processVoiceInput(audioData: Buffer) {
    return this.aiService.processVoiceInput(audioData);
  }

  async getPersonalizedResponse(prompt: string, userProfile: any, chatHistory: any[]) {
    const context = {
        currentTopic: 'Personalized assistance',
        difficulty: userProfile.learningPace || 'normal',
        teachingMode: (userProfile.teachingMode as TeachingMode) || 'normal',
        previousConcepts: userProfile.completedTopics || [],
        userProgress: { history: chatHistory }
    };
    return this.aiService.generateTeachingResponse(prompt, context);
  }

  async updateAllowedSubjects() {
    await this.initializeAllowedSubjects();
  }

  getAllowedSubjects(): string[] {
    return [...this.allowedSubjects];
  }
}

// Export singleton instance
let enhancedAIService: EnhancedAIService | null = null;

export function getEnhancedAIService(): EnhancedAIService {
  if (!enhancedAIService) {
    enhancedAIService = new EnhancedAIService();
  }
  return enhancedAIService;
}