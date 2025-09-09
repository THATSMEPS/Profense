import { apiClient, ApiResponse } from './api';
import { User } from '../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: 'student' | 'instructor';
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<User> {
    try {
      const response: ApiResponse<AuthResponse> = await apiClient.post('/auth/login', credentials);
      
      if (response.success && response.data) {
        // Store the token
        apiClient.setToken(response.data.token);
        return response.data.user;
      }
      
      throw new Error(response.error || 'Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(userData: RegisterRequest): Promise<User> {
    try {
      const response: ApiResponse<AuthResponse> = await apiClient.post('/auth/register', userData);
      
      if (response.success && response.data) {
        // Store the token
        apiClient.setToken(response.data.token);
        return response.data.user;
      }
      
      throw new Error(response.error || 'Registration failed');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate token on server
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear token locally regardless of server response
      apiClient.setToken(null);
    }
  }

  async refreshToken(): Promise<string | null> {
    try {
      const response: ApiResponse<{ token: string }> = await apiClient.post('/auth/refresh');
      
      if (response.success && response.data) {
        apiClient.setToken(response.data.token);
        return response.data.token;
      }
      
      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.logout(); // Clear invalid tokens
      return null;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = apiClient.getToken();
      if (!token) return null;

      const response: ApiResponse<User> = await apiClient.get('/auth/me');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      this.logout(); // Clear invalid tokens
      return null;
    }
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response: ApiResponse<User> = await apiClient.put('/auth/profile', userData);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Profile update failed');
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const response: ApiResponse = await apiClient.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Password change failed');
      }
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return !!apiClient.getToken();
  }
}

export const authService = new AuthService();