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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-white flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md border border-slate-200 shadow-lg text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Session Summary</h2>
          <div className="space-y-4 text-left">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-slate-500 text-sm">Topic</p>
              <p className="text-slate-800 font-medium">{session.topic || 'General'}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-slate-500 text-sm">Mode Changes</p>
              <p className="text-slate-800 font-medium">{adaptiveMode ? 'Analogy Mode Activated' : 'Normal Mode'}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-slate-500 text-sm">Quiz Score</p>
              <p className="text-slate-800 font-medium">{quizScore.correct}/{quizScore.total}</p>
            </div>
          </div>
          <Link
            href="/"
            className="w-full py-3 mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-center block"
          >
            Start New Topic
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-white">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-4 md:p-6">
        <Link href="/" className="text-slate-600 hover:text-slate-800 text-sm">← Back to Topic Selection</Link>
        <button
          onClick={endSession}
          className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
        >
          End Session
        </button>
      </nav>

      {/* Adaptive Mode Banner */}
      {adaptiveMode && (
        <div className="bg-orange-500 text-white py-2 px-6 text-center">Adaptive Mode Activated</div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 md:p-6">
        {/* Left: Lesson and chat (spans 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">{session.topic || 'Lesson'}</h2>
                  <p className="text-slate-500 text-sm">Section 1 of 5</p>
                </div>
                <span className="text-sm text-slate-500">Speed: normal</span>
              </div>
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-slate-700">
                {response?.message || "Welcome to learning. Let's start with the fundamentals and build your understanding step by step."}
              </div>
              {/* Progress */}
              <div className="mt-4">
                <p className="text-slate-500 text-sm mb-1">Progress</p>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full w-1/2 bg-gradient-to-r from-blue-500 to-indigo-600" />
                </div>
              </div>
              {/* Actions */}
              <div className="mt-4 flex gap-3">
                <button className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700">◀ Previous</button>
                <button className="px-4 py-2 rounded-lg bg-green-600 text-white">▶ Start Lesson</button>
                <button className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700">Next ▷</button>
              </div>
            </div>

            {/* Chat history */}
            <div className="max-h-[320px] overflow-y-auto p-6 space-y-4">
              {session.history.length === 0 && (
                <div className="text-center text-slate-500 py-6">
                  No messages yet. Ask a question to begin.
                </div>
              )}
              {session.history.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                    m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-slate-200">
              <div className="flex gap-3">
                <input
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendUser()}
                  placeholder="Ask your professor..."
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendUser}
                  disabled={loading || !userMessage.trim()}
                  className="px-5 py-3 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-50"
                >
                  {loading ? 'Thinking...' : 'Send'}
                </button>
              </div>
            </div>
          </div>

          {/* Voice feedback panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-slate-800 font-semibold mb-2">Voice Feedback</h3>
            <p className="text-slate-600 text-sm mb-4">
              Say things like "I understand", "I'm confused", "Got it", or "I don't understand" to help me adjust my teaching.
            </p>
            <VoiceSensor />
          </div>

          {/* Quiz Section */}
          {response?.action === 'quiz' && response.quiz && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <QuizPane quiz={response.quiz} onAnswer={handleQuizAnswer} />
            </div>
          )}
        </div>

        {/* Right: Sensors */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-slate-800 font-semibold mb-4">Expression Monitoring</h3>
            <WebcamEmotionSensor />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-slate-800 font-semibold mb-4">Recent Feedback</h3>
            <p className="text-slate-500 text-sm">No feedback recorded yet</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <PulseGauge load={pulse.cognitiveLoad} state={pulse.state} />
          </div>
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
