import React from 'react';
import { useTheme, getAppSurface } from '../../contexts/ThemeContext';

export type PrototypeId = 'week-grid' | 'month-board' | 'week-planner' | 'agenda-month';

interface PrototypesLandingProps {
  onSelectPrototype: (prototypeId: PrototypeId) => void;
  onBack: () => void;
}

const prototypes: Array<{ id: PrototypeId; name: string; description: string; emoji: string }> = [
  {
    id: 'week-grid',
    name: 'Week Grid',
    description: 'Time-blocked 7-day calendar with hourly grid',
    emoji: '📅',
  },
  {
    id: 'month-board',
    name: 'Month Board',
    description: 'Full month view with compact task chips per day',
    emoji: '🗓️',
  },
  {
    id: 'week-planner',
    name: 'Week Planner',
    description: 'Task-first columns, one per day (no hourly grid)',
    emoji: '📋',
  },
  {
    id: 'agenda-month',
    name: 'Agenda + Month',
    description: 'Split view: month navigator + scrolling agenda',
    emoji: '📆',
  },
];

const PrototypesLanding: React.FC<PrototypesLandingProps> = ({ onSelectPrototype, onBack }) => {
  const { theme } = useTheme();

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{
        backgroundColor: getAppSurface(theme.accentColor, theme.isDarkMode),
        color: theme.isDarkMode ? '#f3f4f6' : '#111827',
      }}
    >
      <div className="max-w-4xl mx-auto w-full px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className={`mb-4 flex items-center gap-2 text-sm font-medium transition-colors ${
              theme.isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Today
          </button>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Calendar Labs</h1>
          <p className={`text-base ${theme.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Explore experimental calendar and task planning interfaces
          </p>
        </div>

        {/* Prototype Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prototypes.map((prototype) => (
            <button
              key={prototype.id}
              onClick={() => onSelectPrototype(prototype.id)}
              className={`p-6 rounded-2xl border text-left transition-all ${
                theme.isDarkMode
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
                  : 'bg-white/80 hover:bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{prototype.emoji}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-1">{prototype.name}</h3>
                  <p
                    className={`text-sm ${theme.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    {prototype.description}
                  </p>
                </div>
                <svg
                  className={`w-5 h-5 shrink-0 ${theme.isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Info Box */}
        <div
          className={`mt-8 p-4 rounded-xl border ${
            theme.isDarkMode
              ? 'bg-blue-500/10 border-blue-500/20'
              : 'bg-blue-50 border-blue-200'
          }`}
        >
          <p className={`text-sm ${theme.isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
            💡 These are experimental interfaces. Your task data is real and any changes you make will
            be saved. The existing Today view remains unchanged.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrototypesLanding;
