"use client";
import React, { useEffect, useRef, useState } from 'react';
import { AdaptiveResponse } from '@/lib/openai';

export default function LessonPane({ response }: { response: AdaptiveResponse | null }) {
  const prevAction = useRef<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!response) return;
    if (prevAction.current && response.action !== prevAction.current) {
      const label = actionLabel(response.action);
      setBanner(`Adapted lesson style: ${label}`);
      setTimeout(() => setBanner(null), 2200);
    }
    prevAction.current = response.action;
  }, [response]);

  return (
    <div className="card">
      <h3>Lesson</h3>
      {banner && (
        <div style={{ padding: '8px 10px', background: '#151b4e', border: '1px solid #2a2f77', borderRadius: 10, marginBottom: 8 }}>
          <span style={{ marginRight: 6 }}>🔄</span>
          <b>{banner}</b>
        </div>
      )}
      {response ? (
        <>
          {response.action === 'analogy' && <p><b>Switching to Narrative Analogy Mode…</b></p>}
          {response.action === 'breakdown' && <p><b>Step-by-step Breakdown Mode…</b></p>}
          {response.action === 'advanced' && <p><b>Advanced Problem-Solving Mode…</b></p>}
          {response.action === 'gamified' && <p><b>Flash Challenge Mode…</b></p>}
          <div style={{ fontSize: 18, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{response.message}</div>
        </>
      ) : (
        <p>Press "Send" to begin. I’ll adapt to your Learning Pulse in real time.</p>
      )}
    </div>
  );
}

function actionLabel(a: string) {
  switch (a) {
    case 'analogy': return 'Narrative Analogy';
    case 'breakdown': return 'Step-by-step Breakdown';
    case 'advanced': return 'Advanced Problem-Solving';
    case 'gamified': return 'Gamified Flash Challenge';
    case 'humor': return 'Humorous Reframe';
    case 'quiz': return 'Quick Quiz';
    default: return 'Standard Teaching';
  }
}




