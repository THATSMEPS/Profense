import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { quizService } from '../../services/quizService';
import { QuizHistoryItem } from '../../types';
import { QuizResultsDetail } from './QuizResultsDetail';

interface QuizHistoryProps {
  userId?: string;
  onStartQuiz?: (subject?: string, difficulty?: string, topic?: string, chatContext?: string) => Promise<void>;
  onRetakeQuiz?: (quizId: string) => Promise<void>;
}

export const QuizHistory: React.FC<QuizHistoryProps> = ({ 
  userId, 
  onStartQuiz, 
  onRetakeQuiz 
}) => {
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'subject'>('date');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [selectedAttempt, setSelectedAttempt] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadQuizHistory();
  }, [userId]);

  const loadQuizHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const history = await quizService.getQuizHistory();
      setQuizHistory(history);
    } catch (err) {
      setError('Failed to load quiz history');
      console.error('Error loading quiz history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (quizId: string, attemptId: string) => {
    try {
      setLoadingDetails(true);
      const details = await quizService.getAttemptDetails(quizId, attemptId);
      setSelectedAttempt(details);
    } catch (err) {
      console.error('Error loading attempt details:', err);
      setError('Failed to load quiz details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const sortedAndFilteredHistory = quizHistory
    .filter(item => {
      if (filterBy === 'all') return true;
      return item.subject?.toLowerCase().includes(filterBy.toLowerCase());
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.lastAttempt.completedAt).getTime() - new Date(a.lastAttempt.completedAt).getTime();
        case 'score':
          return (b.bestScore?.percentage || 0) - (a.bestScore?.percentage || 0);
        case 'subject':
          return (a.subject || '').localeCompare(b.subject || '');
        default:
          return 0;
      }
    });

  const subjects = [...new Set(quizHistory.map(item => item.subject).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading quiz history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadQuizHistory} variant="outline">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (quizHistory.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Quiz History</h3>
          <p className="text-gray-500 mb-4">You haven't taken any quizzes yet. Start learning to build your history!</p>
          {onStartQuiz && (
            <Button 
              onClick={() => onStartQuiz('Mathematics', 'intermediate')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Start Your First Quiz
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Detail Modal */}
      <AnimatePresence>
        {selectedAttempt && (
          <QuizResultsDetail
            quizData={selectedAttempt}
            onClose={() => setSelectedAttempt(null)}
          />
        )}
      </AnimatePresence>

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quiz History</h2>
          <p className="text-gray-600">Track your learning progress over time</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Filter by subject */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>

          {/* Sort by */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'score' | 'subject')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="score">Sort by Score</option>
            <option value="subject">Sort by Subject</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{quizHistory.length}</div>
          <div className="text-sm text-gray-600">Total Quizzes</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
                        {quizHistory.length ? Math.round(quizHistory.reduce((sum, item) => sum + (item.bestScore?.percentage || 0), 0) / quizHistory.length) : 0}%
          </div>
          <div className="text-sm text-gray-600">Average Score</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">{subjects.length}</div>
          <div className="text-sm text-gray-600">Subjects Covered</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">
                        {quizHistory.filter(item => (item.bestScore?.percentage || 0) >= 70).length}
          </div>
          <div className="text-sm text-gray-600">Passed Quizzes</div>
        </Card>
      </div>

      {/* Quiz History List */}
      <div className="space-y-4">
        <AnimatePresence>
          {sortedAndFilteredHistory.map((item, index) => (
            <motion.div
              key={item.quizId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(item.bestScore?.percentage || 0)}`}>
                        Grade: {getGrade(item.bestScore?.percentage || 0)}
                      </div>
                                            {(item.bestScore?.percentage || 0) >= 70 && (
                        <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Passed
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        {item.subject}
                      </span>
                      {item.topic && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {item.topic}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(item.lastAttempt.completedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {item.totalAttempts} attempt{item.totalAttempts !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Best Score:</span>{' '}
                        <span className="text-2xl font-bold text-gray-900">
                          {item.bestScore?.percentage || 0}%
                        </span>
                        <span className="text-gray-500 ml-1">
                                                    ({item.bestScore?.percentage || 0}% score)
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Average:</span>{' '}
                        <span className="font-bold">
                                                    {Math.round(item.bestScore?.percentage || 0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-0 sm:ml-6">
                    <div className="flex flex-col items-end gap-2">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                        item.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        item.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        item.difficulty === 'hard' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.difficulty || 'Unknown'}
                      </div>
                      
                      <div className="flex gap-2">
                                                {item.totalAttempts < 3 && onRetakeQuiz && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onRetakeQuiz(item.quizId)}
                          >
                            Retake
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(item.quizId, item.lastAttempt.attemptId)}
                          disabled={loadingDetails}
                        >
                          {loadingDetails ? 'Loading...' : 'View Details'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {sortedAndFilteredHistory.length === 0 && filterBy !== 'all' && (
        <Card className="p-8">
          <div className="text-center">
            <p className="text-gray-500">No quizzes found for the selected filter.</p>
            <Button 
              variant="outline" 
              onClick={() => setFilterBy('all')}
              className="mt-4"
            >
              Clear Filter
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};