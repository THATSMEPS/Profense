"use client";
import React, { useState } from 'react';

export interface QuizData {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export default function QuizPane({ quiz, onAnswer }: { quiz: QuizData; onAnswer: (correct: boolean) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const correct = selected === quiz.correctIndex;
  return (
    <div className="card">
      <h3>Quick Check</h3>
      <p>{quiz.question}</p>
      <div style={{ display: 'grid', gap: 8 }}>
        {quiz.options.map((opt, i) => {
          const isSel = selected === i;
          const isCorrect = confirmed && i === quiz.correctIndex;
          const isWrong = confirmed && isSel && !isCorrect;
          return (
            <button
              key={i}
              className="button"
              style={{
                textAlign: 'left',
                background: isCorrect ? '#16a34a' : isWrong ? '#dc2626' : 'linear-gradient(135deg, #4f46e5, #22c1c3)'
              }}
              onClick={() => setSelected(i)}
              disabled={confirmed}
            >
              {opt}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          className="button"
          onClick={() => {
            if (selected == null) return;
            setConfirmed(true);
            onAnswer(correct);
          }}
          disabled={confirmed || selected == null}
        >
          Check Answer
        </button>
        {confirmed && (
          <span style={{ alignSelf: 'center' }}>
            {correct ? '✅ Correct!' : '❌ Try again!'}
            {quiz.explanation ? ` — ${quiz.explanation}` : ''}
          </span>
        )}
      </div>
    </div>
  );
}




