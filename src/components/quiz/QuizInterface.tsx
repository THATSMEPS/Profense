import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'text' | 'numerical';
  question: string;
  options?: { id: string; text: string; isCorrect?: boolean }[];
  correctAnswer?: string;
  points: number;
  timeEstimate: number;
  hints?: string[];
}

interface QuizInterfaceProps {
  quiz?: {
    id: string;
    title: string;
    description: string;
    questions: Question[];
    timeLimit: number;
  };
  onSubmit?: (answers: any[]) => void;
  onCancel?: () => void;
}

export const QuizInterface: React.FC<QuizInterfaceProps> = ({
  quiz,
  onSubmit,
  onCancel
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: any }>({});
  const [timeRemaining, setTimeRemaining] = useState(quiz?.timeLimit || 600);
  const [showHints, setShowHints] = useState<{ [key: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (timeRemaining <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  if (!quiz) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Quiz Available</h3>
          <p className="text-gray-500">Please select a quiz to begin.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const formattedAnswers = quiz.questions.map(question => ({
      questionId: question.id,
      userAnswer: answers[question.id] || null,
      timeSpent: 0
    }));

    if (onSubmit) {
      onSubmit(formattedAnswers);
    }
  };

  const toggleHint = (questionId: string) => {
    setShowHints(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const renderQuestion = (question: Question) => {
    const userAnswer = answers[question.id];

    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <label
                key={option.id}
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.id}
                  checked={userAnswer === option.id}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="mr-3"
                />
                <span className="text-gray-700">{option.text}</span>
              </label>
            ))}
          </div>
        );

      case 'true-false':
        return (
          <div className="space-y-3">
            <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name={`question-${question.id}`}
                value="true"
                checked={userAnswer === 'true'}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="mr-3"
              />
              <span className="text-gray-700">True</span>
            </label>
            <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name={`question-${question.id}`}
                value="false"
                checked={userAnswer === 'false'}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="mr-3"
              />
              <span className="text-gray-700">False</span>
            </label>
          </div>
        );

      case 'text':
        return (
          <textarea
            value={userAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer..."
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
          />
        );

      case 'numerical':
        return (
          <input
            type="number"
            value={userAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter a number..."
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
            <p className="text-gray-600">{quiz.description}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center text-lg font-medium text-gray-700">
              <Clock className="w-5 h-5 mr-2" />
              <span className={timeRemaining <= 60 ? 'text-red-600' : 'text-gray-700'}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            <p className="text-sm text-gray-500">Time remaining</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
      </div>

      {/* Question */}
      <motion.div
        key={currentQuestionIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="bg-white rounded-lg shadow-md p-6 mb-6"
      >
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex-1">
              {currentQuestion.question}
            </h2>
            <div className="flex items-center text-sm text-gray-500 ml-4">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                {currentQuestion.points} points
              </span>
            </div>
          </div>

          {/* Hints */}
          {currentQuestion.hints && currentQuestion.hints.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => toggleHint(currentQuestion.id)}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {showHints[currentQuestion.id] ? 'Hide Hint' : 'Show Hint'}
              </button>
              {showHints[currentQuestion.id] && (
                <div className="mt-2 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r">
                  <p className="text-blue-800 text-sm">{currentQuestion.hints[0]}</p>
                </div>
              )}
            </div>
          )}

          {/* Answer Options */}
          <div className="mb-6">
            {renderQuestion(currentQuestion)}
          </div>
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex space-x-3">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            )}

            {currentQuestionIndex === quiz.questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit Quiz
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            )}
          </div>
        </div>

        {/* Question Overview */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Question Overview:</h3>
          <div className="grid grid-cols-10 gap-2">
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`
                  w-8 h-8 rounded text-xs font-medium transition-colors
                  ${index === currentQuestionIndex
                    ? 'bg-blue-600 text-white'
                    : answers[quiz.questions[index].id]
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                  }
                `}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};