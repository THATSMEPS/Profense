import React, { useState } from 'react';
import { learningService, PracticeProblem } from '../../services/learningService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const PracticeProblems: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [problems, setProblems] = useState<PracticeProblem[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [showAnswers, setShowAnswers] = useState<{ [key: number]: boolean }>({});
  const [personalizedForWeaknesses, setPersonalizedForWeaknesses] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setLoading(true);
    setError(null);
    setProblems([]);
    setSelectedAnswers({});
    setShowAnswers({});

    try {
      const result = await learningService.generatePracticeProblems(topic, difficulty, count);
      setProblems(result.problems);
      setPersonalizedForWeaknesses(result.personalizedForWeaknesses);
    } catch (err: any) {
      setError(err.message || 'Failed to generate practice problems');
      console.error('Error generating practice problems:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (problemIndex: number, answer: string) => {
    setSelectedAnswers({ ...selectedAnswers, [problemIndex]: answer });
  };

  const handleShowAnswer = (problemIndex: number) => {
    setShowAnswers({ ...showAnswers, [problemIndex]: true });
  };

  const isCorrect = (problemIndex: number) => {
    const problem = problems[problemIndex];
    const selected = selectedAnswers[problemIndex];
    return selected?.toLowerCase().trim() === problem.correctAnswer.toLowerCase().trim();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Practice Problems</h2>
        <p className="text-gray-600 mb-6">
          Generate personalized practice problems based on your learning history and weak areas.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Linear Algebra, Chemical Equations, React Hooks"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty Level
            </label>
            <div className="flex gap-2">
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  disabled={loading}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    difficulty === level
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Problems: {count}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full"
              disabled={loading}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Generating...' : 'Generate Problems'}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </Card>

      {problems && problems.length > 0 && (
        <div className="space-y-4">
          {personalizedForWeaknesses && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 flex items-center">
              <span className="mr-2">🎯</span>
              <span>These problems are personalized based on your past quiz performance!</span>
            </div>
          )}

          {problems.map((problem, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="mr-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                    Q{index + 1}
                  </span>
                  {problem.type === 'multiple-choice' && '📝 Multiple Choice'}
                  {problem.type === 'numerical' && '🔢 Numerical'}
                  {problem.type === 'text' && '✍️ Text Answer'}
                </h3>
                <span className={`text-xs px-2 py-1 rounded ${
                  problem.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                  problem.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {problem.difficulty}
                </span>
              </div>

              <p className="text-gray-800 mb-4">{problem.question}</p>

              {problem.type === 'multiple-choice' && problem.options && (
                <div className="space-y-2 mb-4">
                  {problem.options.map((option, optionIndex) => (
                    <button
                      key={optionIndex}
                      onClick={() => handleAnswerSelect(index, option)}
                      disabled={showAnswers[index]}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                        selectedAnswers[index] === option
                          ? showAnswers[index]
                            ? isCorrect(index)
                              ? 'border-green-500 bg-green-50'
                              : 'border-red-500 bg-red-50'
                            : 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {problem.type === 'numerical' && (
                <input
                  type="number"
                  value={selectedAnswers[index] || ''}
                  onChange={(e) => handleAnswerSelect(index, e.target.value)}
                  disabled={showAnswers[index]}
                  placeholder="Enter your answer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}

              {problem.type === 'text' && (
                <textarea
                  value={selectedAnswers[index] || ''}
                  onChange={(e) => handleAnswerSelect(index, e.target.value)}
                  disabled={showAnswers[index]}
                  placeholder="Type your answer here"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}

              {problem.hints && problem.hints.length > 0 && !showAnswers[index] && (
                <details className="mb-4">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm font-medium">
                    💡 Show Hints
                  </summary>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside">
                    {problem.hints.map((hint, hintIndex) => (
                      <li key={hintIndex}>{hint}</li>
                    ))}
                  </ul>
                </details>
              )}

              {!showAnswers[index] ? (
                <Button
                  onClick={() => handleShowAnswer(index)}
                  variant="secondary"
                  className="w-full"
                >
                  Show Answer & Explanation
                </Button>
              ) : (
                <div className={`p-4 rounded-lg ${
                  isCorrect(index) ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  {isCorrect(index) ? (
                    <p className="font-semibold text-green-700 mb-2">✅ Correct!</p>
                  ) : (
                    <p className="font-semibold text-yellow-700 mb-2">
                      ℹ️ Correct Answer: {problem.correctAnswer}
                    </p>
                  )}
                  <p className="text-gray-700 text-sm">{problem.explanation}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
