"use client";
import React from 'react';

export default function PulseGauge({ load, state }: { load: number; state: string }) {
  const pct = Math.round(load * 100);
  const color = pct <= 40 ? '#16a34a' : pct <= 70 ? '#eab308' : '#dc2626';
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h3>Learning Pulse</h3>
      <div style={{ height: 16, background: '#1b2146', borderRadius: 999, border: '1px solid #2a2f66', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <small>Load: {pct}%</small>
        <small>State: {state}</small>
      </div>
    </div>
  );
}


