import { logger } from '../utils/logger';

/**
 * Topic Moderation Service
 * Keeps users focused on their current learning topic
 * Prevents distraction by detecting and managing topic shifts
 */

interface TopicContext {
  currentTopic: string;
  subject: string;
  difficulty: string;
  sessionType: string;
  conversationHistory?: string[]; // Recent messages for context
  conceptsCovered?: string[]; // Topics already discussed
}

interface ModerationResult {
  allowed: boolean;
  relevanceScore: number;
  detectedTopic: string;
  actionType: 'allow' | 'remind' | 'redirect';
  message?: string;
  suggestions?: string[];
}

export class TopicModerationService {
  
  /**
   * Check if user's message is relevant to current topic
   */
  async checkTopicRelevance(
    userMessage: string,
    context: TopicContext
  ): Promise<ModerationResult> {
    
    // Check for contextual references (pronouns, "it", "this", "that", etc.)
    const hasContextualReference = this.hasContextualReference(userMessage);
    
    // If message has contextual references, check recent conversation
    if (hasContextualReference && context.conversationHistory && context.conversationHistory.length > 0) {
      // Get last 3 messages for context
      const recentContext = context.conversationHistory.slice(-3).join(' ');
      
      // Combine with current message for better understanding
      const messageWithContext = `${recentContext} ${userMessage}`;
      
      // Check if recent conversation was about the current topic
      const contextKeywords = this.extractKeywords(recentContext);
      const topicKeywords = this.extractKeywords(context.currentTopic);
      const subjectKeywords = this.extractKeywords(context.subject);
      
      // If recent context mentions the topic, allow the contextual follow-up
      const contextMatchScore = this.calculateRelevance(
        contextKeywords,
        topicKeywords,
        subjectKeywords
      );
      
      if (contextMatchScore >= 0.4) {
        logger.info(`Contextual follow-up detected, allowing based on conversation history (context score: ${contextMatchScore.toFixed(2)})`);
        return {
          allowed: true,
          relevanceScore: contextMatchScore,
          detectedTopic: context.currentTopic,
          actionType: 'allow'
        };
      }
    }
    
    // Extract keywords from current topic and subject
    const topicKeywords = this.extractKeywords(context.currentTopic);
    const subjectKeywords = this.extractKeywords(context.subject);
    
    // Also consider concepts already covered in the session
    if (context.conceptsCovered && context.conceptsCovered.length > 0) {
      context.conceptsCovered.forEach(concept => {
        const conceptKeywords = this.extractKeywords(concept);
        conceptKeywords.forEach(kw => topicKeywords.add(kw));
      });
    }
    
    // Extract keywords from user message
    const messageKeywords = this.extractKeywords(userMessage);
    
    // Calculate relevance score
    const relevanceScore = this.calculateRelevance(
      messageKeywords,
      topicKeywords,
      subjectKeywords
    );
    
    logger.info(`Topic relevance check: ${relevanceScore.toFixed(2)} for "${context.currentTopic}"`);
    
    // Determine action based on score
    if (relevanceScore >= 0.6) {
      // High relevance - allow without warning
      return {
        allowed: true,
        relevanceScore,
        detectedTopic: context.currentTopic,
        actionType: 'allow'
      };
    } else if (relevanceScore >= 0.3) {
      // Medium relevance - allow with gentle reminder
      return {
        allowed: true,
        relevanceScore,
        detectedTopic: 'related',
        actionType: 'remind',
        message: this.generateReminder(context),
        suggestions: this.generateSuggestions(context)
      };
    } else {
      // Low relevance - redirect to current topic
      return {
        allowed: false,
        relevanceScore,
        detectedTopic: 'unrelated',
        actionType: 'redirect',
        message: this.generateRedirect(context),
        suggestions: this.generateSuggestions(context)
      };
    }
  }
  
  /**
   * Extract keywords from text (normalized and filtered)
   */
  private extractKeywords(text: string): Set<string> {
    if (!text) return new Set();
    
    // Common stop words to ignore
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do',
      'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'can', 'what', 'how', 'why', 'when', 'where', 'which', 'who'
    ]);
    
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/) // Split on whitespace
      .filter(word => word.length > 2 && !stopWords.has(word)); // Filter short words and stop words
    
    return new Set(words);
  }
  
  /**
   * Calculate relevance between message and topic using Jaccard similarity
   */
  private calculateRelevance(
    messageKeywords: Set<string>,
    topicKeywords: Set<string>,
    subjectKeywords: Set<string>
  ): number {
    
    if (messageKeywords.size === 0) return 0;
    
    // Calculate Jaccard similarity for topic
    const topicIntersection = new Set(
      [...messageKeywords].filter(x => topicKeywords.has(x))
    );
    const topicUnion = new Set([...messageKeywords, ...topicKeywords]);
    const topicScore = topicUnion.size > 0 ? topicIntersection.size / topicUnion.size : 0;
    
    // Calculate Jaccard similarity for subject
    const subjectIntersection = new Set(
      [...messageKeywords].filter(x => subjectKeywords.has(x))
    );
    const subjectUnion = new Set([...messageKeywords, ...subjectKeywords]);
    const subjectScore = subjectUnion.size > 0 ? subjectIntersection.size / subjectUnion.size : 0;
    
    // Check for common educational keywords (questions are usually on-topic)
    const questionIndicators = ['what', 'how', 'why', 'explain', 'tell', 'show', 'help', 
                                'understand', 'learn', 'teach', 'define', 'describe'];
    const hasQuestionIndicator = questionIndicators.some(indicator => 
      messageKeywords.has(indicator)
    );
    
    // Boost score if message contains question indicators
    const questionBoost = hasQuestionIndicator ? 0.2 : 0;
    
    // Weighted average (topic 60%, subject 30%, question boost 10%)
    const baseScore = (topicScore * 0.6) + (subjectScore * 0.3);
    return Math.min(1.0, baseScore + questionBoost);
  }
  
  /**
   * Generate gentle reminder message
   */
  private generateReminder(context: TopicContext): string {
    const messages = [
      `I'll help with that! Just a reminder - we're focusing on **${context.currentTopic}** in ${context.subject}. Let's keep building on what you're learning!`,
      
      `Sure! Quick note: We're currently studying **${context.currentTopic}**. I'll answer your question, but let's try to stay focused on our main topic.`,
      
      `I can help with that, though I notice it's slightly off our main focus of **${context.currentTopic}**. Let me answer, and then we can return to ${context.currentTopic}!`
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  /**
   * Generate redirect message
   */
  private generateRedirect(context: TopicContext): string {
    return `🎯 **Let's stay focused on ${context.currentTopic}!**

I notice your question is about a different topic. To help you learn more effectively, let's keep our attention on **${context.currentTopic}** in ${context.subject}.

📚 **Why stay focused?**
- Better retention and understanding
- Faster mastery of concepts
- More structured learning path

💡 **What would you like to know about ${context.currentTopic}?**

If you'd like to learn about a different topic, you can start a new learning session anytime!`;
  }
  
  /**
   * Generate topic-relevant suggestions
   */
  private generateSuggestions(context: TopicContext): string[] {
    return [
      `What are the key concepts in ${context.currentTopic}?`,
      `Can you explain ${context.currentTopic} with examples?`,
      `What are practical applications of ${context.currentTopic}?`,
      `How does ${context.currentTopic} relate to other topics in ${context.subject}?`,
      `Can you give me practice problems for ${context.currentTopic}?`
    ];
  }
  
  /**
   * Check if message has contextual references (pronouns, "it", "this", etc.)
   */
  private hasContextualReference(message: string): boolean {
    const contextualPatterns = [
      /\b(it|this|that|these|those|them|they)\b/i,
      /\b(above|previous|earlier|before|mentioned)\b/i,
      /\b(same|such)\b/i,
      /^(continue|more|explain|elaborate|tell me more)/i,
      /\b(for (it|this|that|these|those))\b/i,
    ];
    
    return contextualPatterns.some(pattern => pattern.test(message));
  }
  
  /**
   * Check if message is a general greeting or meta question
   * These should always be allowed
   */
  isGeneralMessage(message: string): boolean {
    const generalPatterns = [
      /^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/i,
      /^(thanks|thank you|thx)/i,
      /^(bye|goodbye|see you)/i,
      /can you help/i,
      /what can you (do|teach)/i,
      /who are you/i,
      /how does this work/i
    ];
    
    return generalPatterns.some(pattern => pattern.test(message.trim()));
  }
}

// Singleton export
let topicModerationService: TopicModerationService | null = null;

export function getTopicModerationService(): TopicModerationService {
  if (!topicModerationService) {
    topicModerationService = new TopicModerationService();
  }
  return topicModerationService;
}
