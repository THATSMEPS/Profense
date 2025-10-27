import React from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, XCircle, Clock, Award } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface QuizResultsDetailProps {
  quizData: {
    quiz: {
      id: string;
      title: string;
      subject: string;
      topic?: string;
      difficulty: string;
    };
    attempt: {
      id: string;
      completedAt: Date;
      score: {
        raw: number;
        percentage: number;
        grade: string;
      };
      totalTime: number;
      status: string;
    };
    results: Array<{
      questionId: string;
      question: string;
      type: string;
      userAnswer: any;
      correctAnswer: string;
      isCorrect: boolean;
      explanation: string;
      points: number;
      earnedPoints: number;
      timeSpent: number;
      options?: Array<{
        id: string;
        text: string;
        isCorrect: boolean;
      }>;
    }>;
    analysis?: any;
    feedback?: string;
  };
  onClose: () => void;
}

export const QuizResultsDetail: React.FC<QuizResultsDetailProps> = ({ quizData, onClose }) => {
  const { quiz, attempt, results, feedback } = quizData;
  
  const correctCount = results.filter(r => r.isCorrect).length;
  const totalQuestions = results.length;
  const scorePercentage = attempt.score.percentage.toFixed(2);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Format feedback text with proper markdown-style rendering
  const formatFeedback = (text: string) => {
    if (!text) return null;
    
    // Split by paragraphs (double newlines or multiple spaces)
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
    
    return paragraphs.map((paragraph, idx) => {
      // Remove excessive whitespace
      let formatted = paragraph.trim().replace(/\s+/g, ' ');
      
      // Convert **text** to bold
      formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');
      
      // Convert *text* to italic
      formatted = formatted.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
      
      // Add bullet point styling for lines starting with -
      if (formatted.startsWith('- ')) {
        formatted = formatted.substring(2);
        return (
          <li key={idx} className="ml-4 mb-2 text-gray-700 leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: formatted }} />
          </li>
        );
      }
      
      return (
        <p key={idx} className="mb-3 text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{quiz.title}</h2>
              <p className="text-blue-100">
                {quiz.subject} {quiz.topic && `• ${quiz.topic}`} • {quiz.difficulty}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Score Overview */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-3xl font-bold">{scorePercentage}%</div>
              <div className="text-sm text-blue-100">Score</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-3xl font-bold">{attempt.score.grade}</div>
              <div className="text-sm text-blue-100">Grade</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-3xl font-bold">{correctCount}/{totalQuestions}</div>
              <div className="text-sm text-blue-100">Correct</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-3xl font-bold">{formatTime(attempt.totalTime)}</div>
              <div className="text-sm text-blue-100">Time</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overall Feedback */}
          {feedback && (
            <Card className="mb-6 p-5 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
                <Award className="w-6 h-6 mr-2 text-blue-600" />
                Overall Feedback & Analysis
              </h3>
              <div className="prose prose-sm max-w-none">
                {formatFeedback(feedback)}
              </div>
            </Card>
          )}

          {/* Question Results */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Question-by-Question Results</h3>
            
            {results.map((result, index) => (
              <div key={result.questionId} 
                className="bg-white rounded-lg shadow-md p-5 border-l-4" 
                style={{ borderLeftColor: result.isCorrect ? '#10b981' : '#ef4444' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start flex-1">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      result.isCorrect ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {result.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Question {index + 1}: {result.question}
                      </h4>
                      
                      {/* Multiple Choice Options */}
                      {result.type === 'multiple-choice' && result.options && (
                        <div className="space-y-2 mb-3">
                          {result.options.map(option => {
                            const isUserAnswer = result.userAnswer === option.id;
                            const isCorrectOption = option.isCorrect;
                            
                            return (
                              <div
                                key={option.id}
                                className={`p-3 rounded-lg border-2 ${
                                  isCorrectOption
                                    ? 'border-green-500 bg-green-50'
                                    : isUserAnswer
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-200 bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-900">{option.text}</span>
                                  {isCorrectOption && (
                                    <span className="text-green-600 text-sm font-medium">✓ Correct</span>
                                  )}
                                  {isUserAnswer && !isCorrectOption && (
                                    <span className="text-red-600 text-sm font-medium">✗ Your answer</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Text/Numerical Answer */}
                      {(result.type === 'text' || result.type === 'numerical') && (
                        <div className="space-y-2 mb-3">
                          <div className="p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                            <div className="text-sm text-gray-600 mb-1">Your Answer:</div>
                            <div className="font-medium text-gray-900">{result.userAnswer || '(No answer provided)'}</div>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg border-2 border-green-500">
                            <div className="text-sm text-gray-600 mb-1">Correct Answer:</div>
                            <div className="font-medium text-gray-900">{result.correctAnswer}</div>
                          </div>
                        </div>
                      )}

                      {/* Explanation */}
                      {result.explanation && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm font-medium text-blue-900 mb-1">Explanation:</div>
                          <div className="text-sm text-gray-700">{result.explanation}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="ml-4 text-right flex-shrink-0">
                    <div className="text-sm text-gray-600 flex items-center justify-end">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatTime(result.timeSpent)}
                    </div>
                    <div className="text-sm font-medium mt-1">
                      {result.earnedPoints}/{result.points} pts
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
