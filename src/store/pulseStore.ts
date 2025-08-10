"use client";
import React from 'react';
import { create } from 'zustand';

export type PulseStateName = 'lost' | 'unfocused' | 'confident' | 'frustrated' | 'neutral';

export interface Pulse {
  timestamp: number;
  cognitiveLoad: number; // 0..1
  state: PulseStateName;
  signals: Record<string, number>;
}

interface PulseStore {
  pulse: Pulse;
  updateSignal: (key: string, value: number) => void;
  dimEnvironment: (dim: boolean) => void;
}

const initialPulse: Pulse = {
  timestamp: Date.now(),
  cognitiveLoad: 0.3,
  state: 'neutral',
  signals: {},
};

export const usePulse = create<PulseStore>((set, get) => ({
  pulse: initialPulse,
  updateSignal: (key, value) => {
    const now = Date.now();
    const current = get().pulse;
    const signals = { ...current.signals, [key]: value };
    // Simple heuristic to compute cognitive load
    const stress = signals['voice_rms'] ?? 0;
    const confusion = 1 - (signals['face_happiness'] ?? 0);
    const focusLoss = signals['blink_rate'] ?? 0; // proxy if you add blink detection
    const frustration = signals['face_anger'] ?? 0;
    const load = clamp01(0.25 * stress + 0.35 * confusion + 0.2 * focusLoss + 0.2 * frustration);
    const state = classify(load, { stress, confusion, focusLoss, frustration });
    set({ pulse: { timestamp: now, cognitiveLoad: load, state, signals } });
  },
  dimEnvironment: (dim) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (dim) root.classList.add('dimmed');
    else root.classList.remove('dimmed');
  },
}));

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

function classify(load: number, parts: { stress: number; confusion: number; focusLoss: number; frustration: number }): PulseStateName {
  if (parts.frustration > 0.6 && load > 0.6) return 'frustrated';
  if (parts.confusion > 0.6 && load > 0.6) return 'lost';
  if (parts.focusLoss > 0.6) return 'unfocused';
  if (load < 0.35) return 'confident';
  return 'neutral';
}

export function PulseProvider({ children }: { children: React.ReactNode }) {
  return children as any;
}




