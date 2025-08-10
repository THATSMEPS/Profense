"use client";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PulseProvider, usePulse } from '@/store/pulseStore';
import WebcamEmotionSensor from '@/components/WebcamEmotionSensor';
import VoiceSensor from '@/components/VoiceSensor';
import LessonPane from '@/components/LessonPane';
import QuizPane from '@/components/QuizPane';
import PulseGauge from '@/components/PulseGauge';
import { AdaptiveResponse } from '@/lib/openai';
import { useSession } from '@/store/sessionStore';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function SessionInner() {
  const { pulse, dimEnvironment } = usePulse();
  const session = useSession();
  const searchParams = useSearchParams();
  const [userMessage, setUserMessage] = useState('');
  const [response, setResponse] = useState<AdaptiveResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoAdapt, setAutoAdapt] = useState(true);
  const [adaptiveMode, setAdaptiveMode] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
  const lastCallRef = useRef<number>(0);

  // Initialize topic from URL params
  useEffect(() => {
    const topicFromUrl = searchParams.get('topic');
    if (topicFromUrl && !session.topic) {
      session.setTopic(topicFromUrl);
    }
  }, [searchParams, session]);

  const fetchLesson = async (opts?: { force?: boolean }) => {
    const now = Date.now();
    const since = now - lastCallRef.current;
    if (!opts?.force && since < 3000) return;
    lastCallRef.current = now;
    setLoading(true);
    try {
      const res = await fetch('/api/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: session.topic, userMessage, pulse, history: session.history }),
      });
      const data = await res.json();
      setResponse(data);
      if (data?.message) session.addTurn({ role: 'assistant', content: data.message });
      
      // Check for mode change
      if (data?.mode && data.mode !== 'normal') {
        setAdaptiveMode(data.mode);
        setTimeout(() => setAdaptiveMode(null), 5000); // Hide banner after 5 seconds
      }
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    if (pulse.state === 'unfocused' || pulse.state === 'frustrated' || pulse.cognitiveLoad > 0.75) {
      dimEnvironment(true);
    } else {
      dimEnvironment(false);
    }
    if (autoAdapt) fetchLesson();
  }, [pulse, dimEnvironment, autoAdapt]);

  const sendUser = useCallback(() => {
    if (!userMessage.trim()) return;
    session.addTurn({ role: 'user', content: userMessage });
    fetchLesson({ force: true });
    setUserMessage('');
  }, [userMessage, session]);

  const handleQuizAnswer = (correct: boolean) => {
    setQuizScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1
    }));
  };

  const endSession = () => {
    setSessionEnded(true);
  };

  if (sessionEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center px-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20 text-center">
          <h2 className="text-2xl font-bold text-white mb-6">Session Summary</h2>
          <div className="space-y-4 text-left">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-blue-200 text-sm">Topic</p>
              <p className="text-white font-medium">{session.topic || 'General'}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-blue-200 text-sm">Mode Changes</p>
              <p className="text-white font-medium">{adaptiveMode ? 'Analogy Mode Activated' : 'Normal Mode'}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-blue-200 text-sm">Quiz Score</p>
              <p className="text-white font-medium">{quizScore.correct}/{quizScore.total}</p>
            </div>
          </div>
          <Link
            href="/"
            className="w-full py-4 mt-6 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg font-medium text-center block hover:from-green-600 hover:to-blue-700 transition-all duration-200"
          >
            Start New Topic
          </Link>
        </div>
      </div>
    );
  }

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
        <button
          onClick={endSession}
          className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 font-medium"
        >
          End Session
        </button>
      </nav>

      {/* Adaptive Mode Banner */}
      {adaptiveMode && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 animate-pulse">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-lg">🔄</span>
            <span className="font-medium">Adaptive Mode Activated: {adaptiveMode === 'analogy' ? 'Narrative Analogy' : adaptiveMode}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-[calc(100vh-120px)]">
        {/* Left Panel: Conversation */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 flex flex-col">
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Conversation</h2>
              {response?.mode && (
                <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm rounded-full">
                  {response.mode === 'normal' ? 'Normal Mode' : 'Analogy Mode'}
                </span>
              )}
            </div>
            {session.topic && (
              <p className="text-blue-200 text-sm mb-4">Topic: {session.topic}</p>
            )}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {session.history.length === 0 && (
              <div className="text-center text-blue-200 py-8">
                <p>Ask a question or say what you need. I'll adapt to your pulse.</p>
              </div>
            )}
            {session.history.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      : 'bg-white/10 text-blue-100'
                  }`}
                >
                  <p className="text-sm font-medium mb-1">
                    {message.role === 'user' ? 'You' : 'Profense'}
                  </p>
                  <p>{message.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-white/20">
            <div className="flex space-x-3">
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendUser()}
                placeholder="Ask your professor..."
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendUser}
                disabled={loading || !userMessage.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Thinking...' : 'Send'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Sensors */}
        <div className="space-y-6">
          {/* Sensors Grid */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Live Sensors</h3>
            <div className="space-y-4">
              <WebcamEmotionSensor />
              <VoiceSensor />
              <PulseGauge load={pulse.cognitiveLoad} state={pulse.state} />
            </div>
          </div>

          {/* Lesson Pane */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <LessonPane response={response} />
          </div>

          {/* Quiz Section */}
          {response?.action === 'quiz' && response.quiz && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
              <QuizPane quiz={response.quiz} onAnswer={handleQuizAnswer} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SessionPage() {
  return (
    <PulseProvider>
      <SessionInner />
    </PulseProvider>
  );
}
