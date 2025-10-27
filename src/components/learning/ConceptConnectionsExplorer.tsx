import React, { useState } from 'react';
import { learningService, ConceptConnections } from '../../services/learningService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const ConceptConnectionsExplorer: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connections, setConnections] = useState<ConceptConnections | null>(null);
  const [currentTopic, setCurrentTopic] = useState('');
  const [knownTopicsCount, setKnownTopicsCount] = useState(0);

  const handleExplore = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic to explore');
      return;
    }

    setLoading(true);
    setError(null);
    setConnections(null);

    try {
      const result = await learningService.findConceptConnections(topic);
      setConnections(result.connections);
      setCurrentTopic(result.currentTopic);
      setKnownTopicsCount(result.knownTopicsCount);
    } catch (err: any) {
      setError(err.message || 'Failed to find concept connections');
      console.error('Error finding concept connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicClick = async (newTopic: string) => {
    setTopic(newTopic);
    // Auto-explore when clicking a topic
    setLoading(true);
    setError(null);
    setConnections(null);

    try {
      const result = await learningService.findConceptConnections(newTopic);
      setConnections(result.connections);
      setCurrentTopic(result.currentTopic);
      setKnownTopicsCount(result.knownTopicsCount);
    } catch (err: any) {
      setError(err.message || 'Failed to find concept connections');
      console.error('Error finding concept connections:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Explore Concept Connections</h2>
        <p className="text-gray-600 mb-6">
          Discover how topics relate to each other and build a connected understanding of subjects.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter a Topic or Concept
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleExplore()}
                placeholder="e.g., Photosynthesis, Derivatives, React Context"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <Button
                onClick={handleExplore}
                disabled={loading}
              >
                {loading ? 'Exploring...' : 'Explore'}
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </Card>

      {connections && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">
              Connections for: <span className="text-blue-600">{currentTopic}</span>
            </h3>
            {knownTopicsCount > 0 && (
              <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
                ✓ You know {knownTopicsCount} related topic{knownTopicsCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Prerequisites */}
          {connections.prerequisitesConcepts && connections.prerequisitesConcepts.length > 0 && (
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">📚</span>
                Prerequisites (Learn These First)
              </h4>
              <div className="space-y-3">
                {connections.prerequisitesConcepts.map((prereq, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      prereq.userKnows
                        ? 'border-green-200 bg-green-50'
                        : 'border-yellow-200 bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <button
                          onClick={() => handleTopicClick(prereq.topic)}
                          className="font-semibold text-blue-600 hover:text-blue-800 text-left"
                        >
                          {prereq.topic}
                        </button>
                        <p className="text-sm text-gray-600 mt-1">{prereq.reason}</p>
                      </div>
                      <span className="ml-2 text-lg">
                        {prereq.userKnows ? '✅' : '⏳'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Related Concepts */}
          {connections.relatedConcepts && connections.relatedConcepts.length > 0 && (
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">🔗</span>
                Related Concepts (Same Level)
              </h4>
              <div className="space-y-3">
                {connections.relatedConcepts.map((related, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      related.userKnows
                        ? 'border-green-200 bg-green-50'
                        : 'border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <button
                          onClick={() => handleTopicClick(related.topic)}
                          className="font-semibold text-blue-600 hover:text-blue-800 text-left"
                        >
                          {related.topic}
                        </button>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Connection:</span> {related.connection}
                        </p>
                      </div>
                      <span className="ml-2 text-lg">
                        {related.userKnows ? '✅' : '🔵'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Next Topics */}
          {connections.nextTopics && connections.nextTopics.length > 0 && (
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">🚀</span>
                What to Learn Next
              </h4>
              <div className="space-y-3">
                {connections.nextTopics.map((next, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border-2 border-purple-200 bg-purple-50 transition-all"
                  >
                    <button
                      onClick={() => handleTopicClick(next.topic)}
                      className="font-semibold text-blue-600 hover:text-blue-800 text-left block mb-1"
                    >
                      {next.topic}
                    </button>
                    <p className="text-sm text-gray-600">{next.reason}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Practical Applications */}
          {connections.practicalApplications && connections.practicalApplications.length > 0 && (
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">🔧</span>
                Practical Applications
              </h4>
              <ul className="space-y-2">
                {connections.practicalApplications.map((application, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">▸</span>
                    <span className="text-gray-700">{application}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {connections && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Click on any topic to explore its connections and build your knowledge map!
          </p>
        </Card>
      )}
    </div>
  );
};
