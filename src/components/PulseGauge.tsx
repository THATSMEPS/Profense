"use client";
import React from 'react';

export default function PulseGauge({ load, state }: { load: number; state: string }) {
  const pct = Math.round(load * 100);
  const getColor = () => {
    if (pct <= 40) return 'from-green-400 to-green-600';
    if (pct <= 70) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };
  
  const getStateColor = () => {
    switch (state) {
      case 'frustrated': return 'text-red-500';
      case 'unfocused': return 'text-yellow-500';
      case 'confident': return 'text-green-500';
      case 'lost': return 'text-purple-500';
      default: return 'text-blue-500';
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center space-x-2 mb-3">
        <span className="text-lg">🧠</span>
        <span className="text-gray-700 font-medium">Learning Pulse</span>
      </div>
      
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Cognitive Load:</span>
            <span className="text-gray-700 font-medium">{pct}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${getColor()} transition-all duration-500 ease-out`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">State:</span>
          <span className={`font-medium capitalize ${getStateColor()}`}>
            {state}
          </span>
        </div>
        
        {/* Load Level Indicator */}
        <div className="flex justify-between text-xs text-gray-500">
          <span className={pct <= 40 ? 'font-bold text-green-500' : ''}>Low</span>
          <span className={pct > 40 && pct <= 70 ? 'font-bold text-yellow-500' : ''}>Medium</span>
          <span className={pct > 70 ? 'font-bold text-red-500' : ''}>High</span>
        </div>
      </div>
      
      <p className="text-gray-500 text-xs mt-3">
        Real-time cognitive load monitoring
      </p>
    </div>
  );
}


