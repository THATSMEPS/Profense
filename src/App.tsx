import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { LandingPage } from './components/landing/LandingPage';
import { AuthForm } from './components/auth/AuthForm';
import { Dashboard } from './components/dashboard/Dashboard';
import { ChatInterface } from './components/chat/ChatInterface';
import { QuizInterface } from './components/quiz/QuizInterface';
import { QuizHistory } from './components/quiz/QuizHistory';
import { CourseLibrary } from './components/courses/CourseLibrary';
import { ProfilePage } from './components/profile/ProfilePage';
import { User, Course, Quiz } from './types';
import { authService } from './services/authService';
import { quizService } from './services/quizService';

type Page = 'landing' | 'auth' | 'dashboard' | 'chat' | 'quiz' | 'quiz-history' | 'courses' | 'profile';

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading Profense...</p>
    </div>
  </div>
);

// Error component
const ErrorDisplay: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center max-w-md mx-4">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
      <button
        onClick={onRetry}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Retry
      </button>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { user, setUser, setCurrentCourse, loading, error, setError, isOnline } = useApp();
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [isSignUp, setIsSignUp] = useState(true);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [pageLoading, setPageLoading] = useState(false);

  // Show loading spinner during app initialization
  if (loading) {
    return <LoadingSpinner />;
  }

  // Show error if app failed to initialize
  if (error) {
    return <ErrorDisplay error={error} onRetry={() => window.location.reload()} />;
  }

  // Show offline indicator
  if (!isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">📡</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">You're offline</h2>
          <p className="text-gray-600">Please check your internet connection and try again.</p>
        </div>
      </div>
    );
  }

  const handleAuth = async (userData: { email: string; password: string; name?: string }) => {
    try {
      setPageLoading(true);
      setError(null);
      
      let authenticatedUser: User;
      
      if (isSignUp && userData.name) {
        // Register new user
        authenticatedUser = await authService.register({
          name: userData.name,
          email: userData.email,
          password: userData.password
        });
      } else {
        // Login existing user
        authenticatedUser = await authService.login({
          email: userData.email,
          password: userData.password
        });
      }
      
      setUser(authenticatedUser);
      setCurrentPage('dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setPageLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setCurrentPage('landing');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout on error
      setUser(null);
      setCurrentPage('landing');
    }
  };

  const handleStartLearning = (course: Course) => {
    setCurrentCourse(course);
    setCurrentPage('chat');
  };

  const handleStartQuiz = async (subject?: string, difficulty?: string, topic?: string, chatContext?: string) => {
    try {
      setPageLoading(true);
      
      // Check if user is authenticated
      if (!user) {
        setError('Please log in to start a quiz');
        setCurrentPage('auth');
        return;
      }
      
      console.log('Starting quiz with user:', user);
      console.log('Quiz parameters:', { subject, difficulty, topic, chatContext });
      
      let quiz: Quiz;
      
      if (subject && difficulty) {
        const validDifficulty = difficulty as 'beginner' | 'intermediate' | 'advanced';
        quiz = await quizService.generateQuiz(subject, validDifficulty, 10, topic, chatContext);
      } else {
        // Get recommended quiz or show quiz selection
        const quizzes = await quizService.getRecommendedQuizzes();
        if (quizzes.length > 0) {
          quiz = quizzes[0];
        } else {
          // Fallback: generate a general quiz
          quiz = await quizService.generateQuiz('Mathematics', 'intermediate');
        }
      }
      
      setCurrentQuiz(quiz);
      setCurrentPage('quiz');
    } catch (error) {
      console.error('Quiz generation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load quiz');
    } finally {
      setPageLoading(false);
    }
  };

  const handleQuizComplete = async (answers: any) => {
    try {
      console.log('Quiz completed with answers:', answers);
      
      if (!currentQuiz || !currentQuiz.id) {
        setError('Quiz information missing');
        return;
      }

      setPageLoading(true);

      // Calculate total time spent (sum of all question times or default)
      const timeSpent = answers.reduce((total: number, answer: any) => 
        total + (answer.timeSpent || 0), 0);

      // Submit the quiz to the backend
      const result = await quizService.submitGeneratedQuiz(
        currentQuiz.id,
        answers,  // Pass answers array directly
        timeSpent || 60 // Pass timeSpent as separate parameter
      );

      console.log('Quiz submission result:', result);
      
      // Navigate to quiz history to see the results
      setCurrentPage('quiz-history');
      setCurrentQuiz(null);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit quiz');
    } finally {
      setPageLoading(false);
    }
  };

  const handleRetakeQuiz = async (quizId: string) => {
    try {
      setPageLoading(true);
      // For now, generate a new quiz of the same type
      // In production, you'd load the exact same quiz by ID
      console.log('Retaking quiz with ID:', quizId);
      const quiz = await quizService.generateQuiz('Mathematics', 'intermediate');
      setCurrentQuiz(quiz);
      setCurrentPage('quiz');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load quiz');
    } finally {
      setPageLoading(false);
    }
  };

  // Handle pages for non-authenticated users
  if (!user) {
    if (currentPage === 'auth') {
      return (
        <div className="min-h-screen bg-gray-50">
          {pageLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <LoadingSpinner />
            </div>
          )}
          <AuthForm
            isSignUp={isSignUp}
            onSubmit={handleAuth}
            onToggleMode={() => setIsSignUp(!isSignUp)}
            onBack={() => setCurrentPage('landing')}
            loading={pageLoading}
            error={error}
          />
        </div>
      );
    }
    
    return (
      <LandingPage
        onGetStarted={() => {
          setIsSignUp(true);
          setCurrentPage('auth');
        }}
        onSignIn={() => {
          setIsSignUp(false);
          setCurrentPage('auth');
        }}
      />
    );
  }

  const renderPage = () => {
    if (pageLoading) {
      return <LoadingSpinner />;
    }

    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            onStartLearning={handleStartLearning}
            onViewCourses={() => setCurrentPage('courses')}
            onStartQuiz={handleStartQuiz}
          />
        );
      case 'chat':
        return <ChatInterface onGenerateQuiz={handleStartQuiz} />;
      case 'quiz':
        return currentQuiz ? (
          <QuizInterface
            quiz={{
              ...currentQuiz,
              description: currentQuiz.description || 'Test your knowledge with this quiz',
              timeLimit: currentQuiz.timeLimit || 600 // Default to 10 minutes
            }}
            onComplete={handleQuizComplete}
            onExit={() => setCurrentPage('quiz-history')}
          />
        ) : (
          <QuizHistory 
            onStartQuiz={handleStartQuiz} 
            onRetakeQuiz={handleRetakeQuiz}
          />
        );
      case 'quiz-history':
        return (
          <QuizHistory 
            onStartQuiz={handleStartQuiz} 
            onRetakeQuiz={handleRetakeQuiz}
          />
        );
      case 'courses':
        return <CourseLibrary onSelectCourse={handleStartLearning} />;
      case 'profile':
        return <ProfilePage onLogout={handleLogout} />;
      default:
        return (
          <Dashboard 
            onStartLearning={handleStartLearning} 
            onViewCourses={() => setCurrentPage('courses')}
            onStartQuiz={handleStartQuiz}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLogout={handleLogout} />
      
      {/* Navigation */}
      {currentPage !== 'chat' && (
        <nav className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex gap-6">
            {[
              { key: 'dashboard', label: 'Dashboard' },
              { key: 'courses', label: 'Courses' },
              { key: 'chat', label: 'Learn' },
              { key: 'quiz-history', label: 'Quiz History' },
              { key: 'profile', label: 'Profile' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setCurrentPage(key as Page)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === key 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </nav>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mx-4 mt-4 rounded">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <main>
        {renderPage()}
      </main>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;