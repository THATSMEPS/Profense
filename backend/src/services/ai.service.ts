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
    // Use a stable model name that's known to work
    const modelName = 'gemini-2.5-flash';
    this.model = this.genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });
    this.chatModel = this.genAI.getGenerativeModel({ 
      model: modelName,
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
    } catch (error: any) {
      logger.error('Error generating teaching response:', error);
      if (error.message && error.message.includes('404 Not Found')) {
        throw new Error('The selected AI model is not available. Please check your configuration or try again later.');
      }
      throw new Error('Failed to generate teaching response');
    }
  }

  /**
   * Generate quiz based on chat context and conversation
   */
  async generateQuiz(options: {
    subject: string;
    topic: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    questionCount: number;
    questionTypes: string[];
    conversationContext: string;
    conceptsCovered: string[];
    userId: string;
  }): Promise<any> {
    try {
      const prompt = this.buildContextualQuizPrompt(options);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      logger.info(`Generated contextual quiz for ${options.subject} - ${options.topic}`);
      return this.parseContextualQuiz(text, options);
    } catch (error) {
      logger.error('Error generating contextual quiz:', error);
      throw new Error('Failed to generate quiz based on conversation context');
    }
  }

  /**
   * Generate detailed quiz analysis and performance report
   */
  async generateQuizAnalysis(options: {
    quiz: any;
    answers: any[];
    score: any;
    timeSpent: number;
    userId: string;
  }): Promise<any> {
    try {
      const prompt = this.buildQuizAnalysisPrompt(options);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      logger.info(`Generated quiz analysis for user ${options.userId}`);
      return this.parseQuizAnalysis(text, options);
    } catch (error) {
      logger.error('Error generating quiz analysis:', error);
      throw new Error('Failed to generate quiz analysis');
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
      learningMode?: string;
      isConversational?: boolean;
    }
  ): string {
    // Handle conversational mode differently
    if (context.isConversational || context.learningMode === 'chat') {
      return `You are Sarah, a friendly and knowledgeable AI assistant who enjoys casual conversations about learning.

Student's message: "${message}"
Current topic context: ${context.currentTopic}
Difficulty level: ${context.difficulty}

Your Conversational Style:
- Be natural and friendly, like chatting with a knowledgeable friend
- Don't automatically assume they want a formal lesson
- Respond appropriately to their actual question or comment
- If they ask something educational, explain it clearly but conversationally
- If they're just chatting, chat back naturally while staying helpful
- Keep responses focused and not overly lengthy (100-300 words)
- Don't push formal teaching unless they specifically ask for it

Important: Respond to what they actually said, not what you think they might want to learn. If they say "hi", just say hi back and ask how you can help. If they ask about a topic, explain it naturally.`;
    }

    // Formal teaching mode
    const modeInstructions = {
      beginner: "Use simple, conversational language like a friendly teacher. Start with 'Let me explain this in simple terms...' or 'Think of it this way...' Provide lots of real-world examples and encourage questions.",
      normal: "Be like an experienced teacher who knows how to make complex topics accessible. Use phrases like 'You know how...' or 'This is similar to...' Balance theory with practical examples.",
      advanced: "Act like a knowledgeable professor who respects the student's intelligence. Use precise terminology but explain it clearly. Start with 'Let's dive deeper into...' or 'Consider this perspective...'",
      toddler: "Be like a patient kindergarten teacher. Use phrases like 'Imagine if...' or 'You know when you...' Make everything relatable to things they know from daily life."
    };

    const conversationalStarters = {
      beginner: ["Let me break this down for you", "Think of it this way", "Here's a simple way to understand this"],
      normal: ["You know how", "This is similar to", "Let me show you how this works"],
      advanced: ["Let's explore this concept", "Consider this perspective", "Here's what's really happening"],
      toddler: ["Imagine if", "You know when you", "Let's pretend that"]
    };

    const randomStarter = conversationalStarters[context.teachingMode][
      Math.floor(Math.random() * conversationalStarters[context.teachingMode].length)
    ];

    return `You are Sarah, an experienced and passionate teacher who genuinely cares about helping students succeed. You're currently helping a student understand "${context.currentTopic}".

Current Learning Session:
- Topic: ${context.currentTopic}
- Student's Level: ${context.difficulty}
- Teaching Mode: ${context.teachingMode}
- Previous Concepts Covered: ${context.previousConcepts.join(', ')}
- Student's Question/Message: "${message}"

Your Teaching Personality:
- Warm, encouraging, and patient - like the best teacher students remember
- Use natural, conversational language (start with "${randomStarter}...")
- Show genuine enthusiasm for the subject
- Celebrate small wins and progress
- Make connections to things students already know

Teaching Approach for ${context.teachingMode} mode:
${modeInstructions[context.teachingMode]}

Response Guidelines:
1. Start with a warm, encouraging tone
2. Use the suggested conversational starter naturally
3. Provide clear explanations with relatable examples
4. Ask engaging questions to check understanding
5. Suggest concrete next steps or practice opportunities
6. Keep responses focused but comprehensive (300-500 words)
7. If off-topic, gently redirect with: "That's an interesting question! Let's first master [current topic], then we can explore that..."

Remember: You're not just providing information - you're inspiring learning and building confidence. Respond as Sarah would in her classroom.`;
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
    // Check if this is context-based from a learning session
    const hasLearningContext = courseContent.includes('Learning Session Context:') || 
                               courseContent.includes('Recent Learning Context:');
    
    const basePrompt = `You are Sarah, an experienced teacher creating a ${hasLearningContext ? 'contextual review' : 'comprehensive'} quiz to assess student understanding.

Learning Context:
${courseContent}

Quiz Requirements:
- Generate EXACTLY ${questionCount} high-quality questions
- Difficulty Level: ${difficulty}
- Question Types: ${questionTypes.join(', ')}
- Focus on practical understanding, not just memorization`;

    const contextSpecificInstructions = hasLearningContext ? `

IMPORTANT - Learning Session Based Quiz:
Since this quiz is based on a specific learning session, create questions that:
1. Directly test concepts that were explained in the session
2. Reference examples, analogies, or scenarios discussed
3. Build on the teaching progression shown in the context
4. Focus on areas where the student engaged or asked questions
5. Test application of specifically taught methods or approaches
6. Avoid concepts not covered in the learning session

Question Strategy:
- 40% questions on core concepts explicitly taught
- 30% questions applying taught concepts to new scenarios  
- 20% questions connecting different parts of the lesson
- 10% questions testing deeper understanding of key points` : `

Standard Quiz Strategy:
Create a well-rounded assessment covering:
- Basic understanding and definitions (30%)
- Application and problem-solving (40%) 
- Analysis and critical thinking (30%)`;

    return `${basePrompt}${contextSpecificInstructions}

Create questions that:
1. Test real understanding of concepts (not just definitions)
2. Include scenario-based problems when appropriate  
3. Progress from basic recall to application/analysis
4. Are clearly worded and unambiguous
5. Have educational value beyond just testing
${hasLearningContext ? '6. Stay relevant to the specific learning session content' : ''}

Format as valid JSON:
{
  "questions": [
    {
      "type": "multiple-choice",
      "question": "Clear, specific question text that tests understanding",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Detailed explanation that teaches why this is correct and why others are wrong",
      "concept": "Specific concept being tested",
      "difficulty": "easy|medium|hard",
      "points": 1,
      ${hasLearningContext ? '"sessionRelevant": true,' : ''}
      "learningObjective": "What this question assesses"
    }
  ]
}

Quality Standards:
- Questions should feel like they come from a real teacher who cares about student learning
- Explanations should be educational, not just confirmatory
- Mix factual knowledge with application and critical thinking
- Ensure questions are appropriate for ${difficulty} level students
- Avoid trick questions or overly technical language unless at advanced level
${hasLearningContext ? '- Ensure questions directly relate to the learning session content' : ''}

Remember: This quiz should help students ${hasLearningContext ? 'review and reinforce what they just learned' : 'learn, not just test them'}.`;
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
      logger.info('Parsing AI response for quiz questions...');
      logger.debug('Raw AI response:', text.substring(0, 500) + '...');
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate the structure
        if (!parsed.questions || !Array.isArray(parsed.questions)) {
          logger.error('Invalid quiz format: missing questions array');
          throw new Error('AI response missing questions array');
        }
        
        if (parsed.questions.length === 0) {
          logger.error('Invalid quiz format: empty questions array');
          throw new Error('AI response contains no questions');
        }
        
        logger.info(`Successfully parsed ${parsed.questions.length} questions`);
        return parsed;
      }
      
      logger.error('No JSON found in AI response');
      throw new Error('No JSON found in response');
    } catch (error) {
      logger.error('Error parsing quiz questions:', error);
      logger.error('Failed response text:', text);
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

  /**
   * Build contextual quiz generation prompt
   */
  private buildContextualQuizPrompt(options: {
    subject: string;
    topic: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    questionCount: number;
    questionTypes: string[];
    conversationContext: string;
    conceptsCovered: string[];
    userId: string;
  }): string {
    return `You are an expert AI educator creating a personalized quiz based on a student's learning conversation.

CONTEXT:
- Subject: ${options.subject}
- Topic: ${options.topic}  
- Difficulty: ${options.difficulty}
- Required Questions: ${options.questionCount}
- Question Types: ${options.questionTypes.join(', ')}

STUDENT'S LEARNING CONVERSATION:
${options.conversationContext || 'No conversation context available'}

CONCEPTS COVERED:
${options.conceptsCovered.length > 0 ? options.conceptsCovered.join(', ') : 'General topics'}

TASK:
Generate a comprehensive quiz with exactly ${options.questionCount} questions that:
1. Tests understanding of concepts discussed in the conversation
2. Includes various question types: ${options.questionTypes.join(', ')}
3. Matches ${options.difficulty} difficulty level
4. Provides clear explanations for each answer
5. Focuses on practical application of learned concepts

CRITICAL JSON FORMATTING REQUIREMENTS:
- Return ONLY valid JSON, no additional text, no markdown formatting
- Do not use trailing commas anywhere in the JSON
- All strings must be properly quoted and escaped
- Arrays must be complete with proper closing brackets
- Object properties must be properly closed with braces

RESPONSE FORMAT:
{
  "title": "Quiz title based on conversation topics",
  "description": "Brief description of what this quiz tests",
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "Question text here",
      "options": [
        {"id": "a", "text": "Option A", "isCorrect": false},
        {"id": "b", "text": "Option B", "isCorrect": true},
        {"id": "c", "text": "Option C", "isCorrect": false},
        {"id": "d", "text": "Option D", "isCorrect": false}
      ],
      "correctAnswer": "b",
      "explanation": "Detailed explanation of why this answer is correct",
      "difficulty": "${options.difficulty}",
      "points": 1,
      "concepts": ["${options.topic}"],
      "timeEstimate": 60
    }
  ]
}

IMPORTANT: 
- Return ONLY the JSON object above, nothing else
- Ensure all ${options.questionCount} questions follow the exact format shown
- Double-check that all arrays and objects are properly closed
- No trailing commas after the last element in arrays or objects`;
  }

  /**
   * Build quiz analysis prompt
   */
  private buildQuizAnalysisPrompt(options: {
    quiz: any;
    answers: any[];
    score: any;
    timeSpent: number;
    userId: string;
  }): string {
    const questionDetails = options.quiz.questions.map((q: any, index: number) => {
      const answer = options.answers[index];
      return `Question ${index + 1}: ${q.question}
Type: ${q.type}
Correct: ${answer?.isCorrect ? 'Yes' : 'No'}
Time: ${answer?.timeSpent || 0}s`;
    }).join('\n\n');

    return `Analyze quiz performance and return JSON with performance insights, strengths, weaknesses, and recommendations.

QUIZ: ${options.quiz.subject} - ${options.quiz.topic}
SCORE: ${options.score.percentage}% 
TIME: ${Math.round(options.timeSpent / 60)} minutes

RESPONSES:
${questionDetails}

Return JSON with analysis structure including overallPerformance, strengths, weaknesses, recommendations, and aiInsights.`;
  }

  /**
   * Parse contextual quiz response
   */
  private parseContextualQuiz(text: string, options: any): any {
    try {
      // First try to extract JSON from the response
      let jsonText = this.extractJsonFromText(text);
      
      if (!jsonText) {
        throw new Error('No valid JSON found in AI response');
      }

      // Clean the JSON text to handle common AI formatting issues
      jsonText = this.cleanJsonText(jsonText);
      
      const parsed = JSON.parse(jsonText);
      
      // Validate the parsed structure
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid quiz structure: missing questions array');
      }

      // Ensure all questions have required fields
      parsed.questions = parsed.questions.map((q: any, index: number) => ({
        id: q.id || `q${index + 1}`,
        type: q.type || 'multiple-choice',
        question: q.question || `Question ${index + 1}`,
        options: q.options || [],
        correctAnswer: q.correctAnswer || (q.options && q.options.length > 0 ? q.options[0].id : 'a'),
        explanation: q.explanation || 'No explanation provided',
        difficulty: q.difficulty || options.difficulty || 'intermediate',
        points: q.points || 1,
        concepts: q.concepts || [options.topic],
        timeEstimate: q.timeEstimate || 60
      }));

      // Ensure the quiz has required metadata
      parsed.title = parsed.title || `${options.subject} Quiz: ${options.topic}`;
      parsed.description = parsed.description || `A quiz covering ${options.topic} concepts`;
      
      return parsed;
    } catch (error) {
      logger.error('Error parsing contextual quiz:', error);
      logger.error('AI Response text:', text.substring(0, 500) + '...');
      throw new Error('Failed to parse quiz from AI response');
    }
  }

  /**
   * Extract JSON from AI response text
   */
  private extractJsonFromText(text: string): string | null {
    // Try multiple patterns to extract JSON
    const patterns = [
      /\{[\s\S]*?\}/,  // Basic JSON object
      /```json\s*(\{[\s\S]*?\})\s*```/,  // JSON in code blocks
      /```\s*(\{[\s\S]*?\})\s*```/,  // JSON in generic code blocks
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }

    return null;
  }

  /**
   * Clean JSON text to handle common AI formatting issues
   */
  private cleanJsonText(jsonText: string): string {
    // Remove common issues that cause JSON parsing errors
    return jsonText
      // Remove trailing commas before closing brackets/braces
      .replace(/,(\s*[\}\]])/g, '$1')
      // Fix incomplete arrays (add closing bracket if missing)
      .replace(/,\s*$/, '')
      // Remove any text before the first {
      .replace(/^[^{]*/, '')
      // Remove any text after the last }
      .replace(/[^}]*$/, '');
  }

  /**
   * Parse quiz analysis response
   */
  private parseQuizAnalysis(text: string, options: any): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON found');
    } catch (error) {
      logger.error('Error parsing quiz analysis:', error);
      // Return basic analysis if parsing fails
      return {
        overallPerformance: {
          score: options.score.percentage,
          grade: options.score.grade,
          percentile: 50
        },
        strengths: [],
        weaknesses: [],
        conceptAnalysis: [],
        timeAnalysis: {
          totalTime: options.timeSpent,
          averageTimePerQuestion: Math.round(options.timeSpent / options.quiz.questions.length),
          timeEfficiency: "optimal"
        },
        recommendations: [{
          type: "study-topic",
          priority: "medium", 
          description: "Continue practicing with similar questions",
          resources: []
        }],
        aiInsights: {
          learningStyle: "mixed",
          cognitiveLoad: "medium",
          confidenceLevel: "medium", 
          nextSteps: ["Review incorrect answers", "Practice similar problems"]
        },
        generatedAt: new Date().toISOString()
      };
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
