import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { LearningPathGenerator, PracticeProblems, ConceptConnectionsExplorer } from './';
import { Card } from '../ui/Card';

type LearningTab = 'path' | 'practice' | 'connections';

interface LearningHubProps {
  onBack?: () => void;
}

export const LearningHub: React.FC<LearningHubProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<LearningTab>('path');

  const tabs = [
    { id: 'path' as LearningTab, label: '🗺️ Learning Path', description: 'Create personalized study plans' },
    { id: 'practice' as LearningTab, label: '📝 Practice', description: 'Generate custom problems' },
    { id: 'connections' as LearningTab, label: '🔗 Connections', description: 'Explore topic relationships' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
                aria-label="Go back to dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </button>
            )}
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Learning Hub</h1>
              <p className="text-lg text-gray-600">
                Powered by advanced AI to personalize your learning journey
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <Card className="p-2">
        <div className="grid grid-cols-3 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="font-semibold text-lg mb-1">{tab.label}</div>
              <div className={`text-sm ${activeTab === tab.id ? 'text-blue-100' : 'text-gray-500'}`}>
                {tab.description}
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'path' && <LearningPathGenerator />}
        {activeTab === 'practice' && <PracticeProblems />}
        {activeTab === 'connections' && <ConceptConnectionsExplorer />}
      </div>

      {/* Info Footer */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-start space-x-4">
          <div className="text-3xl">✨</div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">AI-Powered Learning Features</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Personalized paths</strong> based on your quiz history and knowledge gaps</li>
              <li>• <strong>Smart practice problems</strong> targeting your weak areas</li>
              <li>• <strong>Concept mapping</strong> to understand how topics interconnect</li>
              <li>• All powered by Google's Gemini AI with Model Context Protocol</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
