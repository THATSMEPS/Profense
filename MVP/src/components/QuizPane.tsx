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
      <div>
        {quiz.options.map((opt, i) => (
          <label key={i} style={{ display: 'block', marginBottom: 6 }}>
            <input
              type="radio"
              name="quiz"
              checked={selected === i}
              onChange={() => setSelected(i)}
              disabled={confirmed}
            />{' '}
            {opt}
          </label>
        ))}
      </div>
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
        <p style={{ marginTop: 8 }}>
          {correct ? 'Correct! 🎉' : 'Not quite.'}
          {quiz.explanation ? ` ${quiz.explanation}` : ''}
        </p>
      )}
    </div>
  );
}




