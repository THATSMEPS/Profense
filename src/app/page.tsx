"use client";
import React, { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [query, setQuery] = useState('');

  const topics = [
    'Machine Learning Basics',
    'React Hooks',
    'Data Structures',
    'Quantum Physics',
    'Calculus',
    'Python Programming',
  ];

  const startHref = `/session${query ? `?topic=${encodeURIComponent(query)}` : ''}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-white px-4 py-10">
      {/* Hero */}
      <div className="max-w-3xl mx-auto text-center">
        <div className="flex items-center justify-center space-x-3 mb-3">
          <span className="text-3xl">📖</span>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800">AI Professor</h1>
        </div>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto">
          Tell me what you&apos;d like to learn, and I&apos;ll adapt my teaching to your understanding level
        </p>
      </div>

      {/* Search/Input Card */}
      <div className="max-w-3xl mx-auto mt-8">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          {/* Tabs */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setMode('text')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'text' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>🔍</span>
              <span>Text Input</span>
            </button>
            <button
              onClick={() => setMode('voice')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'voice' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>🎙️</span>
              <span>Voice Input</span>
            </button>
          </div>

          {/* Input */}
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What would you like to learn today?"
              className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Link
              href={startHref}
              className={`px-6 py-3 rounded-lg font-medium text-white text-center ${
                query ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 pointer-events-none'
              }`}
            >
              Start Learning
            </Link>
          </div>
        </div>
      </div>

      {/* Popular Topics */}
      <div className="max-w-4xl mx-auto mt-10">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-slate-800 font-semibold mb-4">Popular Topics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topics.map((t) => (
              <button
                key={t}
                onClick={() => setQuery(t)}
                className="text-left w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-700 hover:border-blue-400 hover:shadow transition"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
