import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { ScheduleViewMode } from '../../hooks/useHomeUiState';

const OPTIONS: { value: ScheduleViewMode; label: string }[] = [
  { value: 'timeline', label: 'Day' },
  { value: 'week-planner', label: 'Week' },
  { value: 'month-board', label: 'Month' },
];

interface CalendarViewSwitcherProps {
  value: ScheduleViewMode;
  onChange: (value: ScheduleViewMode) => void;
}

/** Day, week and month picker for phones, where the nav bar has one Calendar tab. */
const CalendarViewSwitcher: React.FC<CalendarViewSwitcherProps> = ({ value, onChange }) => {
  const { theme } = useTheme();
  const { isDarkMode } = theme;

  return (
    <div
      role="group"
      aria-label="Calendar range"
      className={`flex shrink-0 mb-2 p-0.5 rounded-xl backdrop-blur-3xl ${isDarkMode ? 'bg-black/30' : 'bg-white/60'}`}
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`flex-1 py-2 text-sm font-medium rounded-[10px] transition-colors ${
            value === option.value
              ? isDarkMode ? 'bg-white/15 text-white' : 'bg-white text-gray-900 shadow-sm'
              : isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default CalendarViewSwitcher;
