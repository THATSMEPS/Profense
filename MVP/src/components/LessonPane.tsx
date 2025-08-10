"use client";
import React from 'react';
import { AdaptiveResponse } from '@/lib/openai';

export default function LessonPane({ response }: { response: AdaptiveResponse | null }) {
  return (
    <div className="card">
      <h3>Lesson</h3>
      {response ? (
        <>
          <p style={{ whiteSpace: 'pre-wrap' }}>{response.message}</p>
          <p><small>Action: {response.action}</small></p>
        </>
      ) : (
        <p>Press "Teach Me" to begin. The lesson will adapt to your Learning Pulse in real time.</p>
      )}
    </div>
  );
}




