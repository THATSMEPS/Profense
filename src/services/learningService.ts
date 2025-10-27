import { apiClient } from './api';

export interface LearningPath {
  prerequisites?: string[];
  phases: Array<{
    phase: number;
    title: string;
    duration: string;
    topics: string[];
    objectives: string[];
  }>;
  estimatedTotalTime?: string;
  recommendations?: string[];
}

export interface PracticeProblem {
  question: string;
  type: 'multiple-choice' | 'numerical' | 'text';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
  hints?: string[];
}

export interface ConceptConnections {
  prerequisitesConcepts?: Array<{
    topic: string;
    reason: string;
    userKnows: boolean;
  }>;
  relatedConcepts?: Array<{
    topic: string;
    connection: string;
    userKnows: boolean;
  }>;
  nextTopics?: Array<{
    topic: string;
    reason: string;
  }>;
  practicalApplications?: string[];
}

class LearningService {
  /**
   * Generate a personalized learning path
   */
  async generateLearningPath(goalTopic: string, timeframe?: number): Promise<{
    learningPath: LearningPath;
    userContext: any;
  }> {
    const response = await apiClient.post<{
      learningPath: LearningPath;
      userContext: any;
    }>('/learning/path', {
      goalTopic,
      timeframe
    });
    return response.data!;
  }

  /**
   * Generate personalized practice problems
   */
  async generatePracticeProblems(
    topic: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
    count: number = 5
  ): Promise<{
    problems: PracticeProblem[];
    topic: string;
    difficulty: string;
    personalizedForWeaknesses: boolean;
  }> {
    const response = await apiClient.post<{
      problems: PracticeProblem[];
      topic: string;
      difficulty: string;
      personalizedForWeaknesses: boolean;
    }>('/learning/practice', {
      topic,
      difficulty,
      count
    });
    return response.data!;
  }

  /**
   * Find concept connections for a topic
   */
  async findConceptConnections(topic: string): Promise<{
    currentTopic: string;
    connections: ConceptConnections;
    knownTopicsCount: number;
  }> {
    const response = await apiClient.get<{
      currentTopic: string;
      connections: ConceptConnections;
      knownTopicsCount: number;
    }>(`/learning/connections/${encodeURIComponent(topic)}`);
    return response.data!;
  }
}

export const learningService = new LearningService();
