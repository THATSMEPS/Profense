import React, { useState, useEffect } from 'react';
import { learningService, LearningPath, SavedLearningPath } from '../../services/learningService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Save, Trash2, Archive, CheckCircle, Circle, ChevronDown, ChevronUp } from 'lucide-react';

export const LearningPathGenerator: React.FC = () => {
  const [goalTopic, setGoalTopic] = useState('');
  const [timeframe, setTimeframe] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [savedPaths, setSavedPaths] = useState<SavedLearningPath[]>([]);
  const [loadingSavedPaths, setLoadingSavedPaths] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<'active' | 'completed' | 'archived' | 'all'>('active');

  // Load saved paths on mount
  useEffect(() => {
    loadSavedPaths();
  }, []);

  // Reload when filter changes
  useEffect(() => {
    loadSavedPaths();
  }, [statusFilter]);

  const loadSavedPaths = async () => {
    setLoadingSavedPaths(true);
    try {
      const paths = await learningService.getSavedPaths(statusFilter);
      setSavedPaths(paths);
    } catch (err) {
      console.error('Error loading saved paths:', err);
    } finally {
      setLoadingSavedPaths(false);
    }
  };

  const handleGenerate = async () => {
    if (!goalTopic.trim()) {
      setError('Please enter a topic to learn');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
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

  const handleSave = async () => {
    if (!learningPath || !goalTopic) return;

    setSaving(true);
    setError(null);
    
    try {
      // Transform the AI-generated learning path to match backend schema
      const transformedPath = {
        phases: learningPath.phases.map((phase: any) => ({
          week: phase.phase, // Map 'phase' number to 'week'
          topics: phase.topics || [],
          focus: phase.title || phase.focus || 'Learning Phase', // Use title as focus
          resources: [] // Backend expects resources array
        })),
        milestones: [] // Optional field
      };

      await learningService.saveLearningPath(
        goalTopic,
        `${timeframe} days`,
        transformedPath
      );
      setSuccessMessage('Learning path saved successfully!');
      await loadSavedPaths();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save learning path');
      console.error('Error saving learning path:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pathId: string) => {
    if (!confirm('Are you sure you want to delete this learning path?')) return;

    try {
      await learningService.deleteLearningPath(pathId);
      await loadSavedPaths();
      setSuccessMessage('Learning path deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete learning path');
    }
  };

  const handleArchive = async (pathId: string) => {
    try {
      await learningService.updatePathStatus(pathId, 'archived');
      await loadSavedPaths();
      setSuccessMessage('Learning path archived successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to archive learning path');
    }
  };

  const handleTogglePhase = async (pathId: string, phaseIndex: number, currentStatus: boolean) => {
    try {
      await learningService.togglePhaseComplete(pathId, phaseIndex, !currentStatus);
      await loadSavedPaths();
    } catch (err: any) {
      setError(err.message || 'Failed to update phase');
    }
  };

  const togglePathExpansion = (pathId: string) => {
    setExpandedPaths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pathId)) {
        newSet.delete(pathId);
      } else {
        newSet.add(pathId);
      }
      return newSet;
    });
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

        {successMessage && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {successMessage}
          </div>
        )}
      </Card>

      {/* Saved Learning Paths */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-2xl font-bold mb-4">My Learning Paths</h3>
          
          {/* Filter Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                statusFilter === 'active'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Active ({savedPaths.filter(p => p.status === 'active').length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                statusFilter === 'completed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Completed ({savedPaths.filter(p => p.status === 'completed').length})
            </button>
            <button
              onClick={() => setStatusFilter('archived')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                statusFilter === 'archived'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Archived ({savedPaths.filter(p => p.status === 'archived').length})
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                statusFilter === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              All ({savedPaths.length})
            </button>
          </div>
        </div>

        {loadingSavedPaths ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading paths...</p>
          </div>
        ) : savedPaths.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No {statusFilter !== 'all' ? statusFilter : ''} learning paths found</p>
            {statusFilter !== 'active' && (
              <button
                onClick={() => setStatusFilter('active')}
                className="text-blue-600 hover:underline text-sm mt-2"
              >
                View active paths
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {savedPaths.map((path) => (
              <div key={path._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{path.goalTopic}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        path.status === 'active' ? 'bg-green-100 text-green-700' :
                        path.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {path.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">Timeframe: {path.timeframe}</p>
                    <div className="mt-2 flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        Progress: {path.progress.percentComplete}% ({path.progress.phasesCompleted}/{path.progress.totalPhases} phases)
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${path.progress.percentComplete}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      onClick={() => togglePathExpansion(path._id)}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 border-blue-200"
                    >
                      {expandedPaths.has(path._id) ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-1" />
                          Details
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleArchive(path._id)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(path._id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Expandable Phases Section */}
                {expandedPaths.has(path._id) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-800 mb-3">Learning Phases:</p>
                      {path.learningPath.phases.map((phase, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                        >
                          <div
                            className="flex items-start gap-3 cursor-pointer"
                            onClick={() => handleTogglePhase(path._id, index, phase.completed || false)}
                          >
                            {phase.completed ? (
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className={`text-sm font-medium mb-1 ${phase.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                Week {phase.week}: {phase.focus}
                              </p>
                              {phase.topics && phase.topics.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-gray-600 mb-1">Topics to cover:</p>
                                  <ul className="ml-4 space-y-1">
                                    {phase.topics.map((topic, topicIndex) => (
                                      <li key={topicIndex} className="text-xs text-gray-600 list-disc">
                                        {topic}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {phase.resources && phase.resources.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-gray-600 mb-1">Resources:</p>
                                  <ul className="ml-4 space-y-1">
                                    {phase.resources.map((resource, resIndex) => (
                                      <li key={resIndex} className="text-xs text-blue-600 list-disc">
                                        {resource}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {learningPath && (
        <div className="space-y-4">
          {/* Save Button */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-blue-900">Save this learning path</h4>
                <p className="text-sm text-blue-700">Track your progress and mark phases as complete</p>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Path'}
              </Button>
            </div>
          </Card>

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
