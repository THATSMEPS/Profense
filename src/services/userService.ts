import { apiClient, ApiResponse } from './api';
import { User } from '../types';

export interface UserProfile extends User {
  preferences?: {
    subjects: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    learningGoals: string[];
    notifications: {
      email: boolean;
      push: boolean;
      reminders: boolean;
    };
  };
  stats?: {
    coursesCompleted: number;
    totalStudyTime: number;
    quizzesTaken: number;
    averageScore: number;
    streakDays: number;
    badgesEarned: string[];
  };
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  preferences?: UserProfile['preferences'];
}

export interface UserAnalytics {
  studyTime: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
  performance: {
    subjects: Record<string, number>;
    difficulty: Record<string, number>;
    improvement: number;
  };
  achievements: {
    badges: string[];
    milestones: string[];
    streaks: number;
  };
}

class UserService {
  async getProfile(): Promise<UserProfile> {
    try {
      const response: ApiResponse<UserProfile> = await apiClient.get('/users/profile');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch user profile');
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  async updateProfile(profileData: UpdateProfileRequest): Promise<UserProfile> {
    try {
      const response: ApiResponse<UserProfile> = await apiClient.put('/users/profile', profileData);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to update profile');
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response: ApiResponse<{ avatarUrl: string }> = await apiClient.post('/users/avatar', formData);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to upload avatar');
    } catch (error) {
      console.error('Upload avatar error:', error);
      throw error;
    }
  }

  async getUserAnalytics(timeRange: 'week' | 'month' | 'year' = 'month'): Promise<UserAnalytics> {
    try {
      const response: ApiResponse<UserAnalytics> = await apiClient.get('/users/analytics', { timeRange });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch user analytics');
    } catch (error) {
      console.error('Get user analytics error:', error);
      throw error;
    }
  }

  async updatePreferences(preferences: UserProfile['preferences']): Promise<UserProfile> {
    try {
      const response: ApiResponse<UserProfile> = await apiClient.put('/users/preferences', { preferences });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to update preferences');
    } catch (error) {
      console.error('Update preferences error:', error);
      throw error;
    }
  }

  async getUserStats(): Promise<UserProfile['stats']> {
    try {
      const response: ApiResponse<UserProfile['stats']> = await apiClient.get('/users/stats');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch user stats');
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }

  async getLeaderboard(category: 'points' | 'streaks' | 'courses' = 'points', limit: number = 10): Promise<any[]> {
    try {
      const response: ApiResponse<any[]> = await apiClient.get('/users/leaderboard', { category, limit });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch leaderboard');
    } catch (error) {
      console.error('Get leaderboard error:', error);
      throw error;
    }
  }

  async getUserAchievements(): Promise<any[]> {
    try {
      const response: ApiResponse<any[]> = await apiClient.get('/users/achievements');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to fetch achievements');
    } catch (error) {
      console.error('Get achievements error:', error);
      throw error;
    }
  }

  async updateStudyStreak(): Promise<{ streakDays: number }> {
    try {
      const response: ApiResponse<{ streakDays: number }> = await apiClient.post('/users/study-streak');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to update study streak');
    } catch (error) {
      console.error('Update study streak error:', error);
      throw error;
    }
  }

  async deleteAccount(): Promise<void> {
    try {
      const response: ApiResponse = await apiClient.delete('/users/account');
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  }

  async exportUserData(): Promise<Blob> {
    try {
      const response = await fetch(`${apiClient['baseURL']}/users/export`, {
        method: 'GET',
        headers: apiClient['getHeaders'](),
      });
      
      if (!response.ok) {
        throw new Error('Failed to export user data');
      }
      
      return response.blob();
    } catch (error) {
      console.error('Export user data error:', error);
      throw error;
    }
  }
}

export const userService = new UserService();