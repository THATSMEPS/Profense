"use client";
import React, { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [selectedTopic, setSelectedTopic] = useState('');

  const topics = [
    'Neural Networks',
    'Machine Learning',
    'AI Ethics',
    'Deep Learning',
    'Computer Vision',
    'Natural Language Processing'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Profense</h1>
            <p className="text-blue-200 text-sm">The AI Professor that feels your mind.</p>
          </div>
        </div>
        <Link 
          href="/session" 
          className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium"
        >
          Start New Session
        </Link>
      </nav>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
            AI Learning That
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500"> Adapts </span>
            to You
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Experience personalized education powered by real-time emotion detection and adaptive AI responses.
          </p>
        </div>

        {/* Topic Selection Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20">
          <h3 className="text-2xl font-semibold text-white mb-6 text-center">Choose Your Topic</h3>
          
          <div className="space-y-3 mb-6">
            {topics.map((topic) => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`w-full p-4 rounded-lg text-left transition-all duration-200 ${
                  selectedTopic === topic
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'bg-white/5 text-blue-100 hover:bg-white/10 border border-white/10'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>

          <Link
            href={`/session${selectedTopic ? `?topic=${encodeURIComponent(selectedTopic)}` : ''}`}
            className={`w-full py-4 rounded-lg font-medium text-center block transition-all duration-200 ${
              selectedTopic
                ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white hover:from-green-600 hover:to-blue-700 shadow-lg'
                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
            }`}
          >
            {selectedTopic ? `Start Learning ${selectedTopic}` : 'Select a Topic First'}
          </Link>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-white font-bold">👁️</span>
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Emotion Detection</h4>
            <p className="text-blue-200 text-sm">Real-time facial emotion analysis adapts content to your feelings</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-white font-bold">🎙️</span>
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Voice Interaction</h4>
            <p className="text-blue-200 text-sm">Natural speech recognition for seamless conversation</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-white font-bold">🧠</span>
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Cognitive Load</h4>
            <p className="text-blue-200 text-sm">Live monitoring of learning intensity and comprehension</p>
          </div>
        </div>
      </div>
    </div>
  );
}
