import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIResponse, CourseOutline, TeachingMode, VoiceProcessingResult } from '../types';
import { logger } from '../utils/logger';

class AIService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private chatModel: any;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });
    this.chatModel = this.genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
      }
    });
  }

  /**
   * Generate a comprehensive course outline based on user input
   */
  async generateCourseOutline(
    topic: string, 
    subject: string, 
    difficulty: string,
    educationLevel: string,
    userContext?: any
  ): Promise<CourseOutline> {
    try {
      const prompt = this.buildCourseOutlinePrompt(topic, subject, difficulty, educationLevel, userContext);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      logger.info(`Generated course outline for topic: ${topic}`);
      
      // Parse the structured response
      return this.parseCourseOutline(text, topic, subject, difficulty);
    } catch (error) {
      logger.error('Error generating course outline:', error);
      throw new Error('Failed to generate course outline');
    }
  }

  /**
   * Generate AI teaching response based on student message and context
   */
  async generateTeachingResponse(
    message: string,
    context: {
      currentTopic: string;
      difficulty: string;
      teachingMode: TeachingMode;
      previousConcepts: string[];
      userProgress: any;
    }
  ): Promise<AIResponse> {
    try {
      const prompt = this.buildTeachingPrompt(message, context);
      
      const result = await this.chatModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Analyze the response for adaptive features
      const aiResponse = await this.analyzeTeachingResponse(text, message, context);
      
      logger.info(`Generated teaching response for topic: ${context.currentTopic}`);
      return aiResponse;
    } catch (error) {
      logger.error('Error generating teaching response:', error);
      throw new Error('Failed to generate teaching response');
    }
  }

  /**
   * Generate quiz questions based on course content
   */
  async generateQuizQuestions(
    courseContent: string,
    difficulty: string,
    questionCount: number = 10,
    questionTypes: string[] = ['multiple-choice', 'numerical', 'text']
  ): Promise<any> {
    try {
      const prompt = this.buildQuizPrompt(courseContent, difficulty, questionCount, questionTypes);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      logger.info(`Generated ${questionCount} quiz questions`);
      return this.parseQuizQuestions(text);
    } catch (error) {
      logger.error('Error generating quiz questions:', error);
      throw new Error('Failed to generate quiz questions');
    }
  }

  /**
   * Evaluate quiz answers and provide detailed feedback
   */
  async evaluateQuizAnswers(
    questions: any[],
    userAnswers: any[],
    courseContext: string
  ): Promise<any> {
    try {
      const prompt = this.buildEvaluationPrompt(questions, userAnswers, courseContext);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      logger.info('Evaluated quiz answers with AI feedback');
      return this.parseEvaluationResults(text, questions, userAnswers);
    } catch (error) {
      logger.error('Error evaluating quiz answers:', error);
      throw new Error('Failed to evaluate quiz answers');
    }
  }

  /**
   * Analyze student sentiment and determine if mode switch is needed
   */
  async analyzeSentimentAndAdapt(
    message: string,
    context: any
  ): Promise<{ sentiment: string; shouldAdapt: boolean; newMode?: TeachingMode; reason?: string }> {
    try {
      const prompt = this.buildSentimentAnalysisPrompt(message, context);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseSentimentAnalysis(text);
    } catch (error) {
      logger.error('Error analyzing sentiment:', error);
      return { sentiment: 'neutral', shouldAdapt: false };
    }
  }

  /**
   * Process voice input and convert to text with intent analysis
   */
  async processVoiceInput(audioData: any): Promise<VoiceProcessingResult> {
    try {
      // This is a placeholder for voice processing
      // You would integrate with a speech-to-text service like Google Cloud Speech
      logger.info('Processing voice input (placeholder)');
      
      return {
        text: "Voice processing not implemented yet",
        confidence: 0.8,
        language: "en-US",
        sentiment: "neutral",
        intent: "question"
      };
    } catch (error) {
      logger.error('Error processing voice input:', error);
      throw new Error('Failed to process voice input');
    }
  }

  /**
   * Build course outline generation prompt
   */
  private buildCourseOutlinePrompt(
    topic: string, 
    subject: string, 
    difficulty: string,
    educationLevel: string,
    userContext?: any
  ): string {
    return `You are an expert AI educator creating a comprehensive course outline. 

Create a detailed course for:
- Topic: "${topic}"
- Subject: "${subject}"
- Difficulty: "${difficulty}"
- Education Level: "${educationLevel}"
- User Context: ${JSON.stringify(userContext || {})}

Requirements:
1. Create 5-10 well-structured topics
2. Each topic should have 3-5 subtopics
3. Include clear learning objectives
4. Provide realistic time estimates
5. Ensure logical progression
6. Include prerequisites if needed

Format your response as a JSON object with this structure:
{
  "title": "Course Title",
  "subject": "${subject}",
  "difficulty": "${difficulty}",
  "estimatedDuration": 300,
  "topics": [
    {
      "title": "Topic Title",
      "description": "Detailed description",
      "duration": 30,
      "subtopics": ["Subtopic 1", "Subtopic 2"],
      "learningObjectives": ["Objective 1", "Objective 2"]
    }
  ],
  "prerequisites": ["Prerequisite 1"],
  "learningObjectives": ["Overall Objective 1"]
}

Ensure the course is engaging, educational, and appropriate for the ${educationLevel} level.`;
  }

  /**
   * Build teaching response prompt
   */
  private buildTeachingPrompt(
    message: string,
    context: {
      currentTopic: string;
      difficulty: string;
      teachingMode: TeachingMode;
      previousConcepts: string[];
      userProgress: any;
    }
  ): string {
    const modeInstructions = {
      beginner: "Use simple language, provide lots of examples, and explain every concept step by step.",
      normal: "Balance between detailed explanations and practical examples. Assume some basic knowledge.",
      advanced: "Use technical language, focus on complex concepts, and provide challenging examples.",
      toddler: "Use extremely simple language, real-life analogies, and break everything down to the most basic level. Use stories and familiar objects to explain concepts."
    };

    return `You are an expert AI tutor helping a student learn "${context.currentTopic}".

Current Context:
- Topic: ${context.currentTopic}
- Difficulty: ${context.difficulty}
- Teaching Mode: ${context.teachingMode}
- Previous Concepts: ${context.previousConcepts.join(', ')}
- Student Message: "${message}"

Instructions:
${modeInstructions[context.teachingMode]}

Guidelines:
1. Be encouraging and supportive
2. Use real-world examples when possible
3. Check for understanding
4. Adapt your explanation if the student seems confused
5. Suggest practice problems or next steps
6. Keep responses concise but thorough (max 500 words)

If the student asks a question not related to the current topic, gently guide them back while still being helpful.

Respond as a knowledgeable, patient, and encouraging teacher would.`;
  }

  /**
   * Build quiz generation prompt
   */
  private buildQuizPrompt(
    courseContent: string,
    difficulty: string,
    questionCount: number,
    questionTypes: string[]
  ): string {
    return `Create a comprehensive quiz based on this course content:

Course Content:
${courseContent}

Requirements:
- Generate ${questionCount} questions
- Difficulty: ${difficulty}
- Question types: ${questionTypes.join(', ')}
- Cover all major concepts
- Include detailed explanations for answers
- Mix different difficulty levels within the specified range

Format as JSON:
{
  "questions": [
    {
      "type": "multiple-choice",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Detailed explanation",
      "concept": "Main concept being tested",
      "difficulty": "easy|medium|hard",
      "points": 1
    }
  ]
}

Ensure questions are:
1. Clear and unambiguous
2. Educational and meaningful
3. Appropriately challenging for ${difficulty} level
4. Cover different aspects of the content
5. Have detailed, educational explanations`;
  }

  /**
   * Build evaluation prompt
   */
  private buildEvaluationPrompt(questions: any[], userAnswers: any[], courseContext: string): string {
    return `Evaluate this student's quiz performance and provide detailed feedback:

Course Context: ${courseContext}

Questions and User Answers:
${JSON.stringify({ questions, userAnswers }, null, 2)}

Analyze and provide:
1. Overall performance assessment
2. Strengths and weaknesses
3. Specific feedback for wrong answers
4. Recommended topics to review
5. Next difficulty level recommendation
6. Encouraging but constructive feedback

Format as JSON:
{
  "score": 85,
  "totalQuestions": 10,
  "correctAnswers": 8,
  "performance": {
    "strengths": ["Area 1", "Area 2"],
    "weaknesses": ["Area 3", "Area 4"],
    "recommendedTopics": ["Topic to review"],
    "nextDifficultyLevel": "intermediate"
  },
  "detailedFeedback": "Comprehensive feedback text",
  "encouragement": "Motivational message"
}`;
  }

  /**
   * Build sentiment analysis prompt
   */
  private buildSentimentAnalysisPrompt(message: string, context: any): string {
    return `Analyze the sentiment and confusion level in this student message:

Student Message: "${message}"
Current Context: ${JSON.stringify(context)}

Determine:
1. Sentiment (positive, negative, neutral, confused)
2. Confusion level (1-10 scale)
3. Whether teaching mode should be switched
4. Recommended new mode if switch needed
5. Reason for recommendation

Format as JSON:
{
  "sentiment": "confused",
  "confusionLevel": 7,
  "shouldAdapt": true,
  "recommendedMode": "toddler",
  "reason": "Student is showing signs of confusion and needs simpler explanations"
}

Keywords indicating confusion: "don't understand", "confused", "lost", "hard", "difficult", "can't get it"
Keywords indicating frustration: "hate this", "stupid", "give up", "too hard"
Keywords indicating confidence: "got it", "easy", "understand", "clear", "makes sense"`;
  }

  /**
   * Parse course outline from AI response
   */
  private parseCourseOutline(text: string, topic: string, subject: string, difficulty: string): CourseOutline {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: create a basic outline
      return {
        title: `${topic} Course`,
        subject,
        difficulty,
        estimatedDuration: 180,
        topics: [
          {
            title: `Introduction to ${topic}`,
            description: `Basic concepts and fundamentals of ${topic}`,
            duration: 30,
            subtopics: ['Overview', 'Key Concepts', 'Basic Principles'],
            learningObjectives: [`Understand the basics of ${topic}`]
          }
        ],
        prerequisites: [],
        learningObjectives: [`Master ${topic} concepts`]
      };
    } catch (error) {
      logger.error('Error parsing course outline:', error);
      throw new Error('Failed to parse course outline');
    }
  }

  /**
   * Analyze teaching response for adaptive features
   */
  private async analyzeTeachingResponse(
    text: string, 
    originalMessage: string, 
    context: any
  ): Promise<AIResponse> {
    // Extract concepts mentioned in the response
    const concepts = this.extractConcepts(text);
    
    // Check if response suggests quiz
    const quizSuggestions = text.toLowerCase().includes('quiz') || 
                          text.toLowerCase().includes('test') ||
                          text.toLowerCase().includes('practice');

    return {
      content: text,
      confidence: 0.85,
      teachingMode: context.teachingMode,
      concepts,
      quizSuggestions,
      adaptiveFeedback: {
        shouldSwitchMode: false,
        recommendedMode: context.teachingMode,
        reason: 'Student seems to be following along well'
      }
    };
  }

  /**
   * Extract concepts from text (simple keyword matching)
   */
  private extractConcepts(text: string): string[] {
    // This is a simplified concept extraction
    const concepts: string[] = [];
    const words = text.toLowerCase().split(/\W+/);
    
    // Add logic to identify key concepts based on subject matter
    // This would be more sophisticated in a production system
    
    return concepts.filter(concept => concept.length > 3);
  }

  /**
   * Parse quiz questions from AI response
   */
  private parseQuizQuestions(text: string): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      logger.error('Error parsing quiz questions:', error);
      throw new Error('Failed to parse quiz questions');
    }
  }

  /**
   * Parse evaluation results
   */
  private parseEvaluationResults(text: string, questions: any[], userAnswers: any[]): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      logger.error('Error parsing evaluation results:', error);
      throw new Error('Failed to parse evaluation results');
    }
  }

  /**
   * Parse sentiment analysis results
   */
  private parseSentimentAnalysis(text: string): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          sentiment: result.sentiment || 'neutral',
          shouldAdapt: result.shouldAdapt || false,
          newMode: result.recommendedMode,
          reason: result.reason
        };
      }
      return { sentiment: 'neutral', shouldAdapt: false };
    } catch (error) {
      logger.error('Error parsing sentiment analysis:', error);
      return { sentiment: 'neutral', shouldAdapt: false };
    }
  }
}

// Singleton instance
let aiService: AIService;

export const initializeAI = async (): Promise<void> => {
  try {
    aiService = new AIService();
    logger.info('AI Service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize AI Service:', error);
    throw error;
  }
};

export const getAIService = (): AIService => {
  if (!aiService) {
    throw new Error('AI Service not initialized');
  }
  return aiService;
};

export { AIService };
