import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
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
    
    // Safety settings to prevent false positives
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ];
    
    this.model = this.genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192, // Increased for quiz generation
      },
      safetySettings,
    });
    this.chatModel = this.genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 4096,
      },
      safetySettings,
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
      let text = response.text();
      
      // Check for empty or problematic responses
      if (!text || text.trim().length === 0) {
        logger.warn('AI returned empty response, using fallback');
        text = "I'd be happy to help you with that! Could you please provide a bit more detail about what specifically you'd like to learn?";
      }
      
      // Check for very short responses that might be cut off
      if (text.trim().length < 50 && !message.toLowerCase().includes('hi') && !message.toLowerCase().includes('hello')) {
        logger.warn('AI returned unusually short response, attempting retry');
        // Try a simplified prompt for retry
        const simplePrompt = `You are a helpful AI tutor. The student asked: "${message}" about the topic "${context.currentTopic}". Please provide a detailed, educational response (at least 200 words) that fully explains the concept with examples.`;
        
        try {
          const retryResult = await this.chatModel.generateContent(simplePrompt);
          const retryResponse = await retryResult.response;
          const retryText = retryResponse.text();
          
          if (retryText && retryText.trim().length > text.trim().length) {
            text = retryText;
            logger.info('Retry produced better response');
          }
        } catch (retryError) {
          logger.warn('Retry failed, using original response:', retryError);
        }
      }
      
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
      logger.info('Quiz generation prompt created', { 
        subject: options.subject, 
        topic: options.topic,
        difficulty: options.difficulty,
        questionCount: options.questionCount,
        questionTypes: options.questionTypes 
      });
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      // Check if content was blocked
      if (response.promptFeedback?.blockReason) {
        logger.error('Content generation blocked:', {
          blockReason: response.promptFeedback.blockReason,
          safetyRatings: response.promptFeedback.safetyRatings
        });
        throw new Error(`Content was blocked: ${response.promptFeedback.blockReason}`);
      }
      
      const text = response.text();
      
      logger.info(`AI response received, length: ${text.length} characters`);
      logger.info(`AI response preview: ${text.substring(0, 200)}...`);
      
      if (!text || text.trim().length === 0) {
        logger.error('Empty response from AI model');
        throw new Error('AI model returned empty response');
      }
      
      return this.parseContextualQuiz(text, options);
    } catch (error: any) {
      logger.error('Error generating contextual quiz:', {
        error: error.message,
        stack: error.stack,
        subject: options.subject,
        topic: options.topic
      });
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
3. Provide COMPLETE explanations with relatable examples - don't cut off mid-sentence
4. Include ALL relevant formulas, concepts, and detailed explanations
5. Ask engaging questions to check understanding
6. Suggest concrete next steps or practice opportunities
7. Aim for comprehensive responses (400-800 words for complex topics)
8. Always finish your thoughts completely - never end abruptly
9. If explaining a topic like "ray optics", include ALL major concepts, formulas, and examples
10. If off-topic, gently redirect with: "That's an interesting question! Let's first master [current topic], then we can explore that..."

CRITICAL: Always provide complete, detailed explanations. Do not cut off explanations mid-sentence or leave concepts partially explained. If the student asks for detailed information, give them a thorough, comprehensive response that fully covers the topic.

Remember: You're not just providing information - you're inspiring learning and building confidence. Respond as Sarah would in her classroom, ensuring every explanation is complete and helpful.`;
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
    const questionTypeExamples = {
      'multiple-choice': `{
      "id": "q1",
      "type": "multiple-choice",
      "question": "What is a sorting algorithm?",
      "options": [
        {"id": "a", "text": "A way to search data", "isCorrect": false},
        {"id": "b", "text": "A method to arrange data in order", "isCorrect": true},
        {"id": "c", "text": "A data structure", "isCorrect": false},
        {"id": "d", "text": "A database query", "isCorrect": false}
      ],
      "correctAnswer": "b",
      "explanation": "A sorting algorithm is a method to arrange data in a specific order.",
      "difficulty": "${options.difficulty}",
      "points": 1,
      "concepts": ["sorting", "algorithms"],
      "timeEstimate": 60
    }`,
      'numerical': `{
      "id": "q2",
      "type": "numerical",
      "question": "What is the time complexity of bubble sort in worst case?",
      "correctAnswer": "O(n^2)",
      "acceptableRange": 0,
      "explanation": "Bubble sort has O(n²) time complexity in the worst case.",
      "difficulty": "${options.difficulty}",
      "points": 1,
      "concepts": ["time complexity", "bubble sort"],
      "timeEstimate": 90
    }`,
      'text': `{
      "id": "q3",
      "type": "text",
      "question": "Explain how merge sort works",
      "correctAnswer": "Merge sort divides the array into halves, recursively sorts them, and merges the sorted halves.",
      "keywords": ["divide", "conquer", "merge", "recursive"],
      "explanation": "Merge sort uses divide-and-conquer strategy.",
      "difficulty": "${options.difficulty}",
      "points": 2,
      "concepts": ["merge sort", "divide and conquer"],
      "timeEstimate": 120
    }`
    };

    return `Generate a quiz about ${options.topic} in ${options.subject}.

Difficulty: ${options.difficulty}
Number of questions: ${Math.min(options.questionCount, 10)}
Question types to include: ${options.questionTypes.join(', ')}

${options.conversationContext ? `Student's recent conversation:\n${options.conversationContext}\n` : ''}

Generate a JSON quiz with this EXACT structure:

{
  "title": "Quiz about ${options.topic}",
  "description": "Test your understanding",
  "questions": [
    ${options.questionTypes.map(type => questionTypeExamples[type as keyof typeof questionTypeExamples] || questionTypeExamples['multiple-choice']).join(',\n    ')}
  ]
}

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON starting with { and ending with }
2. NO markdown code blocks (no \`\`\`json)
3. NO comments in the JSON
4. Include ${Math.min(options.questionCount, 10)} questions total
5. Mix the question types: ${options.questionTypes.join(', ')}
6. All questions must have: id, type, question, correctAnswer, explanation, difficulty, points, concepts, timeEstimate
7. Multiple-choice questions need an "options" array
8. Numerical questions need "acceptableRange" 
9. Text questions need "keywords" array

Start your response with { now:`;
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
   * Cleans a JSON string by removing common syntax errors and handling truncation.
   */
  private cleanJsonString(jsonString: string): string {
    // Remove ```json and ``` if they exist
    let cleaned = jsonString.replace(/```json/g, '').replace(/```/g, '');

    // Remove trailing commas from objects and arrays that JSON.parse fails on.
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
    
    // Attempt to remove comments, though this is less reliable with regex
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

    // Handle incomplete JSON - if it looks like it was cut off, try to close it
    cleaned = cleaned.trim();
    
    // If JSON ends with an incomplete string, try to complete it
    if (cleaned.endsWith('"') === false && cleaned.lastIndexOf('"') > cleaned.lastIndexOf(':')) {
      // String was cut off, remove it back to the last complete field
      const lastColon = cleaned.lastIndexOf(':');
      const lastComma = cleaned.lastIndexOf(',', lastColon);
      if (lastComma > 0) {
        cleaned = cleaned.substring(0, lastComma);
        logger.warn('Removed incomplete field from truncated JSON');
      }
    }
    
    // Count opening and closing braces/brackets to detect incomplete JSON
    const openBraces = (cleaned.match(/\{/g) || []).length;
    const closeBraces = (cleaned.match(/\}/g) || []).length;
    const openBrackets = (cleaned.match(/\[/g) || []).length;
    const closeBrackets = (cleaned.match(/\]/g) || []).length;
    
    // Handle incomplete questions array
    if (openBraces > closeBraces || openBrackets > closeBrackets) {
      // Find the last complete question object
      let lastCompleteQuestion = -1;
      let braceCount = 0;
      let inQuestionsArray = false;
      
      for (let i = 0; i < cleaned.length; i++) {
        if (cleaned[i] === '{') braceCount++;
        if (cleaned[i] === '}') {
          braceCount--;
          // Check if this closes a question object (we're at brace level 2: root object > questions array > question object)
          if (braceCount === 2 && inQuestionsArray) {
            lastCompleteQuestion = i;
          }
        }
        // Detect if we're inside the questions array
        if (cleaned.substring(i, i + 12) === '"questions"') {
          inQuestionsArray = true;
        }
      }
      
      if (lastCompleteQuestion !== -1) {
        // Truncate to last complete question and close the array and root object
        cleaned = cleaned.substring(0, lastCompleteQuestion + 1) + ']}';
        logger.warn('Truncated incomplete JSON at last complete question');
      } else {
        // Fallback: just add missing closing braces/brackets
        const missingBraces = openBraces - closeBraces;
        const missingBrackets = openBrackets - closeBrackets;
        cleaned += ']'.repeat(missingBrackets) + '}'.repeat(missingBraces);
        logger.warn(`Added ${missingBrackets} brackets and ${missingBraces} braces to close JSON`);
      }
    }

    return cleaned.trim();
  }

  /**
   * Map difficulty levels from user-facing to database schema
   */
  private mapDifficulty(difficulty: string): 'easy' | 'medium' | 'hard' {
    const difficultyMap: Record<string, 'easy' | 'medium' | 'hard'> = {
      'beginner': 'easy',
      'intermediate': 'medium',
      'advanced': 'hard',
      'easy': 'easy',
      'medium': 'medium',
      'hard': 'hard'
    };
    return difficultyMap[difficulty.toLowerCase()] || 'medium';
  }

  /**
   * Parse contextual quiz response
   */
  private parseContextualQuiz(text: string, options: any): any {
    try {
      let jsonString = '';
      
      // Remove any markdown formatting
      let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // First, try to find a JSON block marked with ```json
      const jsonBlockMatch = text.match(/```json([\s\S]*)```/);
      
      if (jsonBlockMatch && jsonBlockMatch[1]) {
        jsonString = jsonBlockMatch[1];
      } else {
        // If no marked block, find the JSON object
        const startIndex = cleanText.indexOf('{');
        const lastIndex = cleanText.lastIndexOf('}');
        
        if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
          jsonString = cleanText.substring(startIndex, lastIndex + 1);
        } else {
          // Try to extract any JSON-like structure
          const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonString = jsonMatch[0];
          }
        }
      }

      if (jsonString) {
        const cleanedJson = this.cleanJsonString(jsonString);
        
        try {
          const parsed = JSON.parse(cleanedJson);
          
          // Validate and fix the parsed quiz
          if (!parsed.questions || !Array.isArray(parsed.questions)) {
            throw new Error('No questions array found in response');
          }
          
          // Ensure all questions have required fields
          parsed.questions = parsed.questions.map((q: any, index: number) => ({
            ...q,
            id: q.id || `q${index + 1}`,
            concepts: q.concepts || [options.topic],
            timeEstimate: q.timeEstimate || 60,
            difficulty: this.mapDifficulty(q.difficulty || options.difficulty),
            points: q.points || 1
          }));

          // Filter out incomplete questions
          parsed.questions = parsed.questions.filter((q: any) => 
            q.question && q.question.trim().length > 0
          );

          if (parsed.questions.length === 0) {
            throw new Error('No valid questions found in response');
          }

          logger.info(`Successfully parsed quiz with ${parsed.questions.length} questions`);
          return parsed;
        } catch (parseError: any) {
          logger.error('JSON parse error:', parseError.message);
          logger.error('Cleaned JSON string (first 1000 chars):', cleanedJson.substring(0, 1000));
          throw new Error('Invalid JSON structure in AI response');
        }
      }
      throw new Error('No valid JSON found in AI response');
    } catch (error) {
      logger.error('Error parsing contextual quiz:', {
        error,
        rawTextLength: text.length,
        rawTextFull: text,
        rawTextPreview: text.substring(0, 500) + '...',
      });
      throw new Error('Failed to parse quiz from AI response');
    }
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
