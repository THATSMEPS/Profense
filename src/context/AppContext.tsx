import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Course, ChatMessage, TeachingMode, LearningMode } from '../types';
import { authService } from '../services/authService';
import { webSocketService } from '../services/webSocketService';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  currentCourse: Course | null;
  setCurrentCourse: (course: Course | null) => void;
  currentTopic: string | null;
  setCurrentTopic: (topic: string | null) => void;
  currentSubject: string | null;
  setCurrentSubject: (subject: string | null) => void;
  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  teachingMode: TeachingMode;
  setTeachingMode: (mode: TeachingMode) => void;
  learningMode: LearningMode;
  setLearningMode: (mode: LearningMode) => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  isOnline: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const [currentSubject, setCurrentSubject] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [teachingMode, setTeachingMode] = useState<TeachingMode>('normal');
  const [learningMode, setLearningMode] = useState<LearningMode>('teaching');
  const [isRecording, setIsRecording] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
    
    // Set up online/offline listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      webSocketService.disconnect();
    };
  }, []);

  // Set up WebSocket connection when user changes
  useEffect(() => {
    if (user && isOnline) {
      webSocketService.connect();
      
      // Set up WebSocket event handlers
      webSocketService.onNotification((notification) => {
        console.log('Received notification:', notification);
        // Handle notifications here
      });
      
      return () => {
        webSocketService.disconnect();
      };
    }
  }, [user, isOnline]);

  const initializeApp = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is already authenticated
      if (authService.isAuthenticated()) {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          // Token is invalid, clear it
          await authService.logout();
        }
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setError('Failed to initialize application');
      // Clear any invalid tokens
      await authService.logout();
    } finally {
      setLoading(false);
    }
  };

  const addChatMessage = (message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  };

  // Enhanced setUser function to handle authentication state
  const enhancedSetUser = (newUser: User | null) => {
    setUser(newUser);
    if (!newUser) {
      // User logged out, clean up
      setCurrentCourse(null);
      setChatMessages([]);
      webSocketService.disconnect();
    }
  };

  const value: AppContextType = {
    user,
    setUser: enhancedSetUser,
    currentCourse,
    setCurrentCourse,
    currentTopic,
    setCurrentTopic,
    currentSubject,
    setCurrentSubject,
    chatMessages,
    setChatMessages,
    addChatMessage,
    teachingMode,
    setTeachingMode,
    learningMode,
    setLearningMode,
    isRecording,
    setIsRecording,
    sidebarOpen,
    setSidebarOpen,
    loading,
    setLoading,
    error,
    setError,
    isOnline,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};