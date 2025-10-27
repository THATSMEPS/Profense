import React, { useState } from 'react';
import { learningService, LearningPath } from '../../services/learningService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const LearningPathGenerator: React.FC = () => {
  const [goalTopic, setGoalTopic] = useState('');
  const [timeframe, setTimeframe] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);

  const handleGenerate = async () => {
    if (!goalTopic.trim()) {
      setError('Please enter a topic to learn');
      return;
    }

    setLoading(true);
    setError(null);
    setLearningPath(null);

    try {
      const result = await learningService.generateLearningPath(goalTopic, timeframe);
      setLearningPath(result.learningPath);
    } catch (err: any) {
      setError(err.message || 'Failed to generate learning path');
      console.error('Error generating learning path:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Generate Your Learning Path</h2>
        <p className="text-gray-600 mb-6">
          Get a personalized step-by-step plan to master any topic based on your current knowledge.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What do you want to learn?
            </label>
            <input
              type="text"
              value={goalTopic}
              onChange={(e) => setGoalTopic(e.target.value)}
              placeholder="e.g., Machine Learning, Quantum Physics, React.js"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timeframe (days): {timeframe}
            </label>
            <input
              type="range"
              min="7"
              max="180"
              value={timeframe}
              onChange={(e) => setTimeframe(Number(e.target.value))}
              className="w-full"
              disabled={loading}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 week</span>
              <span>6 months</span>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Generating...' : 'Generate Learning Path'}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </Card>

      {learningPath && (
        <div className="space-y-4">
          {learningPath.prerequisites && learningPath.prerequisites.length > 0 && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3 flex items-center">
                <span className="mr-2">📚</span>
                Prerequisites
              </h3>
              <ul className="list-disc list-inside space-y-2">
                {learningPath.prerequisites.map((prereq, index) => (
                  <li key={index} className="text-gray-700">{prereq}</li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold flex items-center">
                <span className="mr-2">🗺️</span>
                Your Learning Journey
              </h3>
              {learningPath.estimatedTotalTime && (
                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  ⏱️ {learningPath.estimatedTotalTime}
                </span>
              )}
            </div>

            <div className="space-y-6">
              {learningPath.phases && learningPath.phases.map((phase, index) => (
                <div key={index} className="relative pl-6 pb-6 border-l-2 border-blue-200 last:border-l-0 last:pb-0">
                  <div className="absolute -left-3 top-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {phase.phase}
                  </div>
                  
                  <div className="ml-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-800">{phase.title}</h4>
                      <span className="text-sm text-gray-500">{phase.duration}</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Topics to cover:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                          {phase.topics && phase.topics.map((topic, idx) => (
                            <li key={idx}>{topic}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Learning objectives:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                          {phase.objectives && phase.objectives.map((objective, idx) => (
                            <li key={idx}>{objective}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {learningPath.recommendations && learningPath.recommendations.length > 0 && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3 flex items-center">
                <span className="mr-2">💡</span>
                Recommendations
              </h3>
              <ul className="space-y-2">
                {learningPath.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span className="text-gray-700">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
