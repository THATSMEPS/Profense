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

export interface SavedLearningPath {
  _id: string;
  userId: string;
  goalTopic: string;
  timeframe: string;
  learningPath: {
    phases: Array<{
      week: number;
      topics: string[];
      focus: string;
      resources?: string[];
      completed?: boolean;
    }>;
    milestones?: Array<{
      week: number;
      description: string;
      achieved?: boolean;
    }>;
  };
  savedAt: Date;
  status: 'active' | 'completed' | 'archived';
  progress: {
    phasesCompleted: number;
    totalPhases: number;
    percentComplete: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PracticeSession {
  _id: string;
  userId: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  problems: Array<{
    question: string;
    type: 'multiple-choice' | 'numerical' | 'text';
    options?: string[];
    correctAnswer: string;
    explanation: string;
    hints?: string[];
  }>;
  answers: Array<{
    problemIndex: number;
    userAnswer: string;
    isCorrect: boolean;
    timeSpent?: number;
  }>;
  score: number;
  completedAt: Date;
  totalTimeSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PracticeStats {
  topic: string;
  sessionsCount: number;
  averageScore: number;
  bestScore: number;
  totalProblems: number;
  correctAnswers: number;
  accuracy: number;
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

  /**
   * Save a generated learning path
   */
  async saveLearningPath(
    goalTopic: string,
    timeframe: string,
    learningPath: any
  ): Promise<SavedLearningPath> {
    const response = await apiClient.post<{ learningPath: SavedLearningPath }>(
      '/learning/path/save',
      {
        goalTopic,
        timeframe,
        learningPath
      }
    );
    return response.data!.learningPath;
  }

  /**
   * Get all saved learning paths
   */
  async getSavedPaths(status: 'active' | 'completed' | 'archived' | 'all' = 'active'): Promise<SavedLearningPath[]> {
    const response = await apiClient.get<{
      learningPaths: SavedLearningPath[];
      total: number;
    }>(`/learning/paths?status=${status}`);
    return response.data!.learningPaths;
  }

  /**
   * Get a specific learning path by ID
   */
  async getLearningPath(pathId: string): Promise<SavedLearningPath> {
    const response = await apiClient.get<{ learningPath: SavedLearningPath }>(
      `/learning/path/${pathId}`
    );
    return response.data!.learningPath;
  }

  /**
   * Mark a phase as complete or incomplete
   */
  async togglePhaseComplete(
    pathId: string,
    phaseIndex: number,
    completed: boolean
  ): Promise<SavedLearningPath> {
    const response = await apiClient.put<{ learningPath: SavedLearningPath }>(
      `/learning/path/${pathId}/phase/${phaseIndex}/complete`,
      { completed }
    );
    return response.data!.learningPath;
  }

  /**
   * Update learning path status
   */
  async updatePathStatus(
    pathId: string,
    status: 'active' | 'completed' | 'archived'
  ): Promise<SavedLearningPath> {
    const response = await apiClient.put<{ learningPath: SavedLearningPath }>(
      `/learning/path/${pathId}/status`,
      { status }
    );
    return response.data!.learningPath;
  }

  /**
   * Delete a learning path
   */
  async deleteLearningPath(pathId: string): Promise<void> {
    await apiClient.delete(`/learning/path/${pathId}`);
  }

  /**
   * Save a practice session
   */
  async savePracticeSession(
    topic: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    problems: any[],
    answers: any[],
    score: number,
    totalTimeSpent?: number
  ): Promise<PracticeSession> {
    const response = await apiClient.post<{ session: PracticeSession }>(
      '/learning/practice/save',
      {
        topic,
        difficulty,
        problems,
        answers,
        score,
        totalTimeSpent: totalTimeSpent || 0
      }
    );
    return response.data!.session;
  }

  /**
   * Get practice history
   */
  async getPracticeHistory(topic?: string): Promise<PracticeSession[]> {
    const url = topic 
      ? `/learning/practice/history?topic=${encodeURIComponent(topic)}`
      : '/learning/practice/history';
    
    const response = await apiClient.get<{
      sessions: PracticeSession[];
      total: number;
    }>(url);
    return response.data!.sessions;
  }

  /**
   * Get practice statistics for a topic
   */
  async getPracticeStats(topic: string): Promise<PracticeStats> {
    const response = await apiClient.get<{ stats: PracticeStats }>(
      `/learning/practice/stats/${encodeURIComponent(topic)}`
    );
    return response.data!.stats;
  }
}

export const learningService = new LearningService();
