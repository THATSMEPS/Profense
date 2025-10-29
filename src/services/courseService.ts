import { apiClient, ApiResponse } from './api';
import { Course } from '../types';

export interface CourseFilters {
  subject?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  search?: string;
  page?: number;
  limit?: number;
}

export interface CourseProgress {
  courseId: string;
  completedTopics: string[];
  totalTopics: number;
  progressPercentage: number;
  lastAccessed: string;
  timeSpent: number;
}

class CourseService {
  async getCourses(filters?: CourseFilters): Promise<{ courses: Course[]; total: number; pages: number }> {
    try {
      const response: ApiResponse<{ courses: Course[]; total: number; pages: number }> = 
        await apiClient.get('/courses', filters);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch courses');
    } catch (error) {
      console.error('Get courses error:', error);
      throw error;
    }
  }

  async getCourseById(courseId: string): Promise<Course> {
    try {
      const response: ApiResponse<Course> = await apiClient.get(`/courses/${courseId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch course');
    } catch (error) {
      console.error('Get course error:', error);
      throw error;
    }
  }

  async getEnrolledCourses(): Promise<Course[]> {
    try {
      const response: ApiResponse<{ courses: Course[]; total: number }> = await apiClient.get('/courses/enrolled');
      
      if (response.success && response.data) {
        const courses = response.data.courses;
        
        // Fetch progress for each course and update the progress property
        const coursesWithProgress = await Promise.all(
          courses.map(async (course) => {
            try {
              const progressData = await this.getTopicProgress(course.id);
              return {
                ...course,
                progress: progressData.progressPercentage
              };
            } catch (error) {
              console.error(`Failed to fetch progress for course ${course.id}:`, error);
              return course; // Return course with existing progress if fetch fails
            }
          })
        );
        
        return coursesWithProgress;
      }
      
      throw new Error(response.error || 'Failed to fetch enrolled courses');
    } catch (error) {
      console.error('Get enrolled courses error:', error);
      throw error;
    }
  }

  async enrollInCourse(courseId: string): Promise<void> {
    try {
      const response: ApiResponse = await apiClient.post(`/courses/${courseId}/enroll`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to enroll in course');
      }
    } catch (error) {
      console.error('Enroll in course error:', error);
      throw error;
    }
  }

  async unenrollFromCourse(courseId: string): Promise<void> {
    try {
      const response: ApiResponse = await apiClient.delete(`/courses/${courseId}/enroll`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to unenroll from course');
      }
    } catch (error) {
      console.error('Unenroll from course error:', error);
      throw error;
    }
  }

  async getCourseProgress(courseId: string): Promise<CourseProgress> {
    try {
      const response: ApiResponse<CourseProgress> = await apiClient.get(`/courses/${courseId}/progress`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch course progress');
    } catch (error) {
      console.error('Get course progress error:', error);
      throw error;
    }
  }

  async updateCourseProgress(courseId: string, topicId: string, completed: boolean): Promise<CourseProgress> {
    try {
      const response: ApiResponse<CourseProgress> = await apiClient.put(`/courses/${courseId}/progress`, {
        topicId,
        completed
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to update course progress');
    } catch (error) {
      console.error('Update course progress error:', error);
      throw error;
    }
  }

  async searchCourses(query: string): Promise<Course[]> {
    try {
      const response: ApiResponse<Course[]> = await apiClient.get('/courses/search', { q: query });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to search courses');
    } catch (error) {
      console.error('Search courses error:', error);
      throw error;
    }
  }

  async getRecommendedCourses(): Promise<Course[]> {
    try {
      const response: ApiResponse<{ courses: Course[]; total: number }> = await apiClient.get('/courses/recommended');
      
      if (response.success && response.data) {
        return response.data.courses;
      }
      
      throw new Error(response.error || 'Failed to fetch recommended courses');
    } catch (error) {
      console.error('Get recommended courses error:', error);
      throw error;
    }
  }

  async rateCourse(courseId: string, rating: number, review?: string): Promise<void> {
    try {
      const response: ApiResponse = await apiClient.post(`/courses/${courseId}/rating`, {
        rating,
        review
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to rate course');
      }
    } catch (error) {
      console.error('Rate course error:', error);
      throw error;
    }
  }

  // Topic Progress Methods
  async getTopicProgress(courseId: string): Promise<any> {
    try {
      const response: ApiResponse<any> = await apiClient.get(`/courses/${courseId}/progress`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch topic progress');
    } catch (error) {
      console.error('Get topic progress error:', error);
      throw error;
    }
  }

  async markTopicAsStarted(courseId: string, topicId: string): Promise<any> {
    try {
      const response: ApiResponse<any> = await apiClient.post(`/courses/${courseId}/topics/${topicId}/start`);
      
      if (response.success && response.data) {
        return response.data.progress;
      }
      
      throw new Error(response.error || 'Failed to mark topic as started');
    } catch (error) {
      console.error('Mark topic as started error:', error);
      throw error;
    }
  }

  async markTopicAsCompleted(courseId: string, topicId: string): Promise<any> {
    try {
      const response: ApiResponse<any> = await apiClient.post(`/courses/${courseId}/topics/${topicId}/complete`);
      
      if (response.success && response.data) {
        return response.data.progress;
      }
      
      throw new Error(response.error || 'Failed to mark topic as completed');
    } catch (error) {
      console.error('Mark topic as completed error:', error);
      throw error;
    }
  }

  async updateTopicActivity(
    courseId: string, 
    topicId: string, 
    activityType: 'contentRead' | 'chatDiscussed' | 'practiceDone' | 'quizPassed',
    timeSpent?: number
  ): Promise<any> {
    try {
      const response: ApiResponse<any> = await apiClient.put(`/courses/${courseId}/topics/${topicId}/activity`, {
        activityType,
        timeSpent
      });
      
      if (response.success && response.data) {
        return response.data.progress;
      }
      
      throw new Error(response.error || 'Failed to update topic activity');
    } catch (error) {
      console.error('Update topic activity error:', error);
      throw error;
    }
  }

  async getTopic(courseId: string, topicId: string): Promise<any> {
    try {
      const response: ApiResponse<any> = await apiClient.get(`/courses/${courseId}/topics/${topicId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch topic');
    } catch (error) {
      console.error('Get topic error:', error);
      throw error;
    }
  }
}

export const courseService = new CourseService();