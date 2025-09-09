import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Quiz, QuizResult } from '../../types';
import { QuizResults } from './QuizResults';

interface QuizInterfaceProps {
  quiz: Quiz;
  onComplete: (result: QuizResult) => void;
  onExit: () => void;
}

export const QuizInterface: React.FC<QuizInterfaceProps> = ({ quiz, onComplete, onExit }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [timeLeft] = useState(quiz.timeLimit || 1800); // 30 minutes default
  const [showResults, setShowResults] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  // Safety check for quiz and questions
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quiz Not Available</h2>
          <p className="text-gray-600 mb-4">Sorry, this quiz is not available or has no questions.</p>
          <Button onClick={onExit}>Go Back</Button>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;

  const handleAnswerSelect = (answer: string | number) => {
    setAnswers(prev => ({
      ...prev,
      [question.id]: answer
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmitQuiz();
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    const questionAnswers = quiz.questions.map(q => ({
      questionId: q.id,
      answer: answers[q.id] || '',
      correct: answers[q.id] === q.correctAnswer
    }));

    const score = questionAnswers.filter(a => a.correct).length;
    const timeSpent = (quiz.timeLimit || 1800) - timeLeft;

    const result: QuizResult = {
      id: Date.now().toString(),
      quizId: quiz.id,
      score: Math.round((score / quiz.questions.length) * 100),
      totalQuestions: quiz.questions.length,
      completedAt: new Date(),
      timeSpent,
      answers: questionAnswers
    };

    try {
      // Log quiz completion for analytics - the backend will handle result storage
      console.log('Quiz completed:', result);
      
      // In a full implementation, we would:
      // 1. Start quiz attempt when component mounts: const attempt = await quizService.startQuiz(quiz.id)
      // 2. Submit each answer during quiz: await quizService.submitAnswer(attempt.id, questionId, answer)
      // 3. Submit final quiz: await quizService.submitQuiz(attempt.id, answers)
      
    } catch (error) {
      console.error('Failed to log quiz completion:', error);
    }

    setQuizResult(result);
    setShowResults(true);
    onComplete(result);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (showResults && quizResult) {
    return <QuizResults result={quizResult} quiz={quiz} onRetake={() => window.location.reload()} onExit={onExit} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Quiz Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={onExit} icon={ArrowLeft}>
              Exit Quiz
            </Button>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{formatTime(timeLeft)}</span>
              </div>
              <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-medium">
                {currentQuestion + 1} of {quiz.questions.length}
              </div>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
          
          <div className="bg-gray-200 rounded-full h-2 mt-4">
            <motion.div
              className="bg-blue-600 rounded-full h-2"
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>

        {/* Question Card */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 leading-relaxed">
              {question.question}
            </h2>

            {question.image && (
              <img 
                src={question.image} 
                alt="Question visual" 
                className="w-full max-w-md mx-auto mb-6 rounded-lg shadow-sm"
              />
            )}

            <div className="space-y-3">
              {question.type === 'multiple-choice' && question.options && (
                question.options.map((option, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswerSelect(option)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      answers[question.id] === option
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        answers[question.id] === option
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300'
                      }`}>
                        {answers[question.id] === option && (
                          <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                        )}
                      </div>
                      <span>{option}</span>
                    </div>
                  </motion.button>
                ))
              )}

              {question.type === 'numerical' && (
                <input
                  type="number"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerSelect(parseFloat(e.target.value))}
                  placeholder="Enter your numerical answer"
                  className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none transition-all"
                />
              )}

              {question.type === 'text' && (
                <textarea
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  placeholder="Write your detailed answer here..."
                  className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none transition-all resize-none"
                  rows={4}
                />
              )}
            </div>
          </Card>
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            icon={ArrowLeft}
          >
            Previous
          </Button>

          <div className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </div>

          <Button
            onClick={handleNext}
            disabled={!answers[question.id]}
            icon={ArrowRight}
          >
            {isLastQuestion ? 'Submit Quiz' : 'Next Question'}
          </Button>
        </div>
      </div>
    </div>
  );
};