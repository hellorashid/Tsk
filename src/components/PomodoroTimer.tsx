import React, { useState, useEffect, useRef } from 'react';

interface PomodoroTimerProps {
  accentColor?: string;
  isDarkMode?: boolean;
  onMarkDone?: () => void;
}

type TimerState = 'idle' | 'running' | 'paused';

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  accentColor = '#1F1B2F',
  isDarkMode = true,
  onMarkDone
}) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerState, setTimerState] = useState<TimerState>('running'); // Start automatically
  const intervalRef = useRef<number | null>(null);

  // Format seconds to HH:MM:SS or MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Stopwatch logic
  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = window.setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState]);

  const handleStart = () => {
    if (timerState === 'paused') {
      setTimerState('running');
    } else if (timerState === 'idle') {
      setTimerState('running');
    } else {
      setTimerState('paused');
    }
  };

  const handleReset = () => {
    setTimerState('idle');
    setTimeElapsed(0);
  };

  const handleMarkDone = () => {
    if (onMarkDone) {
      onMarkDone();
    }
  };

  return (
    <div className={`text-center p-6 rounded-xl opacity-50 hover:opacity-100 transition-all duration-300 ${
      isDarkMode ? 'bg-white/3 hover:bg-white/5' : 'bg-white shadow-lg hover:shadow-xl'
    }`}>
      {/* Time display */}
      <div className="mb-4">
        <div className={`text-3xl font-medium tabular-nums ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {formatTime(timeElapsed)}
        </div>
        <div className={`text-xs mt-1 ${
          isDarkMode ? 'text-gray-600' : 'text-gray-500'
        }`}>
          {timerState === 'running' ? 'focusing' : 
           timerState === 'paused' ? 'paused' :
           'ready'}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={handleStart}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            timerState === 'running'
              ? isDarkMode
                ? 'bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-400'
                : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
              : isDarkMode
                ? 'bg-white/8 hover:bg-white/12 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          {timerState === 'running' ? 'Pause' : 
           timerState === 'paused' ? 'Resume' :
           'Start'}
        </button>
        
        {onMarkDone && (
          <button
            onClick={handleMarkDone}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDarkMode
                ? 'bg-green-500/15 hover:bg-green-500/25 text-green-400'
                : 'bg-green-100 hover:bg-green-200 text-green-700'
            }`}
          >
            Mark as Done
          </button>
        )}
      </div>
    </div>
  );
};

export default PomodoroTimer;

