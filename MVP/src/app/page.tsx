"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PulseProvider, usePulse } from '@/store/pulseStore';
import WebcamEmotionSensor from '@/components/WebcamEmotionSensor';
import VoiceSensor from '@/components/VoiceSensor';
import LessonPane from '@/components/LessonPane';
import QuizPane from '@/components/QuizPane';
import { AdaptiveResponse } from '@/lib/openai';

function Classroom() {
  const { pulse, dimEnvironment } = usePulse();
  const [topic, setTopic] = useState('Neural Networks');
  const [userMessage, setUserMessage] = useState('Teach me the basics.');
  const [response, setResponse] = useState<AdaptiveResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLesson = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, userMessage, pulse }),
      });
      const data = await res.json();
      setResponse(data);
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
  }, [pulse, dimEnvironment]);

  return (
    <div className="container">
      <header className="header">
        <h1>SynapSense</h1>
        <p>The AI Professor that feels your mind.</p>
      </header>
      <div className="controls">
        <input
          className="input"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Topic (e.g., Linear Algebra)"
        />
        <input
          className="input"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          placeholder="What do you want right now? (e.g., explain simply)"
        />
        <button className="button" disabled={loading} onClick={fetchLesson}>
          {loading ? 'Adapting…' : 'Teach Me'}
        </button>
      </div>

      <div className="sensors">
        <WebcamEmotionSensor />
        <VoiceSensor />
      </div>

      <div className="panes">
        <LessonPane response={response} />
        {response?.action === 'quiz' && response.quiz && (
          <QuizPane quiz={response.quiz} onAnswer={(correct) => console.log('answer', correct)} />
        )}
      </div>

      <footer className="footer">
        <small>
          Pulse: state={pulse.state} load={(pulse.cognitiveLoad).toFixed(2)} | signals: {Object.entries(pulse.signals)
            .map(([k, v]) => `${k}:${v.toFixed(2)}`)
            .join(' ')}
        </small>
      </footer>

      <div id="dim-overlay" />
      <style jsx global>{`
        body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; background: #0b1020; color: #e8ecff; }
        .container { max-width: 1000px; margin: 0 auto; padding: 24px; }
        .header { margin-bottom: 12px; }
        .controls { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; }
        .input { flex: 1; padding: 10px 12px; border-radius: 10px; border: 1px solid #334; background: #11162a; color: #e8ecff; }
        .button { padding: 10px 16px; background: #4f46e5; color: white; border: 0; border-radius: 10px; cursor: pointer; }
        .button:disabled { opacity: 0.6; cursor: default; }
        .sensors { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0; }
        .panes { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .footer { margin-top: 18px; opacity: 0.7; }
        #dim-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.0); pointer-events: none; transition: background 0.4s ease; }
        .dimmed #dim-overlay { background: rgba(0,0,0,0.2); }
      `}</style>
    </div>
  );
}

export default function Page() {
  return (
    <PulseProvider>
      <Classroom />
    </PulseProvider>
  );
}




