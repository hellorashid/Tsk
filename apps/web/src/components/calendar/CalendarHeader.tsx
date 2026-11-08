import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface CalendarHeaderProps {
  title: string;
  isCurrentPeriod: boolean;
  periodName: string;
  onPrevious: () => void;
  onToday: () => void;
  onNext: () => void;
  onCreate: (anchorEl: HTMLElement) => void;
  tasksCollapsed?: boolean;
  onToggleTasks?: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  title,
  isCurrentPeriod,
  periodName,
  onPrevious,
  onToday,
  onNext,
  onCreate,
  tasksCollapsed = false,
  onToggleTasks,
}) => {
  const { theme } = useTheme();
  const { isDarkMode } = theme;
  const control = `rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-black/5 text-gray-700'}`;

  return (
    <div className={`flex items-center justify-between gap-2 px-4 py-3 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
      <div className="flex items-center gap-2 min-w-0">
        <h1
          className={`text-2xl md:text-4xl font-bold tracking-tight truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {title}
        </h1>
        {isCurrentPeriod && <span className="w-2 h-2 shrink-0 rounded-full bg-red-500 mt-1" />}
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <button type="button" onClick={onPrevious} className={`p-2 ${control}`} aria-label={`Previous ${periodName}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <button type="button" onClick={onToday} className={`px-3 py-1.5 text-xs font-medium ${control}`} aria-label={`Go to current ${periodName}`}>
          Today
        </button>
        <button type="button" onClick={onNext} className={`p-2 ${control}`} aria-label={`Next ${periodName}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(event) => onCreate(event.currentTarget)}
          className={`p-2 ${control}`}
          aria-label="New event"
          title="New event"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M10 4a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V5a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
        {onToggleTasks && (
          <button
            type="button"
            onClick={onToggleTasks}
            className={`p-2 ${control}`}
            aria-label={tasksCollapsed ? 'Show tasks' : 'Hide tasks'}
            aria-pressed={!tasksCollapsed}
            title={tasksCollapsed ? 'Show tasks' : 'Hide tasks'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
              <rect x="2.75" y="3.75" width="14.5" height="12.5" rx="2.25" />
              <path d="M12.5 4v12" />
              {!tasksCollapsed && <path d="M12.5 4h2.5a2 2 0 012 2v8a2 2 0 01-2 2h-2.5V4z" fill="currentColor" stroke="none" />}
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default CalendarHeader;
