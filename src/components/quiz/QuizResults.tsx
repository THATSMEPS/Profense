import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Clock, RotateCcw, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ProgressRing } from '../ui/ProgressRing';
import { Quiz, QuizResult } from '../../types';

interface QuizResultsProps {
  result: QuizResult;
  quiz: Quiz;
  onRetake: () => void;
  onExit: () => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({ result, quiz, onRetake, onExit }) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return 'Excellent work! 🎉';
    if (score >= 70) return 'Good job! Keep it up! 👍';
    return 'Keep practicing! You\'ll get there! 💪';
  };

  const correctAnswers = result.answers.filter(a => a.correct).length;
  const incorrectAnswers = result.totalQuestions - correctAnswers;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="bg-white p-8 rounded-2xl shadow-lg mb-6">
            <div className="mb-6">
              <ProgressRing percentage={result.score} size={150} strokeWidth={10} />
            </div>
            
            <h1 className={`text-3xl font-bold mb-2 ${getScoreColor(result.score)}`}>
              {getScoreMessage(result.score)}
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              You scored {result.score}% on {quiz.title}
            </p>
            
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="bg-green-100 p-3 rounded-lg mb-2 mx-auto w-fit">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <p className="text-2xl font-bold text-green-600">{correctAnswers}</p>
                <p className="text-sm text-gray-600">Correct</p>
              </div>
              
              <div>
                <div className="bg-red-100 p-3 rounded-lg mb-2 mx-auto w-fit">
                  <XCircle className="text-red-600" size={24} />
                </div>
                <p className="text-2xl font-bold text-red-600">{incorrectAnswers}</p>
                <p className="text-sm text-gray-600">Incorrect</p>
              </div>
              
              <div>
                <div className="bg-blue-100 p-3 rounded-lg mb-2 mx-auto w-fit">
                  <Clock className="text-blue-600" size={24} />
                </div>
                <p className="text-2xl font-bold text-blue-600">{formatTime(result.timeSpent)}</p>
                <p className="text-sm text-gray-600">Time Spent</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={onRetake} icon={RotateCcw} variant="outline" size="lg">
              Retake Quiz
            </Button>
            <Button onClick={onExit} icon={ArrowRight} size="lg">
              Continue Learning
            </Button>
          </div>
        </motion.div>

        {/* Detailed Review */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Review Your Answers</h2>
          
          <div className="space-y-6">
            {quiz.questions.map((question, index) => {
              const userAnswer = result.answers.find(a => a.questionId === question.id);
              const isCorrect = userAnswer?.correct || false;
              
              return (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`border-l-4 pl-4 py-3 ${
                    isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    {isCorrect ? (
                      <CheckCircle className="text-green-600 mt-1" size={20} />
                    ) : (
                      <XCircle className="text-red-600 mt-1" size={20} />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-2">
                        Question {index + 1}: {question.question}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        Your answer: <span className="font-medium">{userAnswer?.answer}</span>
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-gray-600 mb-2">
                          Correct answer: <span className="font-medium text-green-600">{question.correctAnswer}</span>
                        </p>
                      )}
                      {question.explanation && (
                        <p className="text-sm text-gray-700 bg-white p-3 rounded-lg">
                          <strong>Explanation:</strong> {question.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};