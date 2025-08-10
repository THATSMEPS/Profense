"use client";
import { create } from 'zustand';

export interface ChatTurn { role: 'user' | 'assistant'; content: string }

interface SessionState {
  topic: string;
  history: ChatTurn[];
  modes: string[];
  correctAnswers: number;
  totalQuestions: number;
  setTopic: (t: string) => void;
  addTurn: (turn: ChatTurn) => void;
  addMode: (mode: string) => void;
  recordQuiz: (correct: boolean) => void;
  reset: () => void;
}

export const useSession = create<SessionState>((set) => ({
  topic: '',
  history: [],
  modes: [],
  correctAnswers: 0,
  totalQuestions: 0,
  setTopic: (t) => set({ topic: t }),
  addTurn: (turn) => set((s) => ({ history: [...s.history, turn] })),
  addMode: (mode) => set((s) => ({ modes: [...s.modes, mode] })),
  recordQuiz: (correct) => set((s) => ({
    correctAnswers: s.correctAnswers + (correct ? 1 : 0),
    totalQuestions: s.totalQuestions + 1,
  })),
  reset: () => set({ topic: '', history: [], modes: [], correctAnswers: 0, totalQuestions: 0 }),
}));


