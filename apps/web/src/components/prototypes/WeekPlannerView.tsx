import React, { useState, useMemo } from 'react';
import { ScheduleCardData } from '../../utils/schedule';
import { Task } from '../../utils/types';
import { getStartOfDay, isToday } from '../../utils/dateHelpers';

interface WeekPlannerViewProps {
  events: ScheduleCardData[];
  tasks: Task[];
  onCardClick?: (cardData: ScheduleCardData) => void;
  onTaskClick?: (task: Task) => void;
  isDarkMode: boolean;
  onBack?: () => void;
}

const WeekPlannerView: React.FC<WeekPlannerViewProps> = ({
  events,
  tasks,
  onCardClick,
  onTaskClick,
  isDarkMode,
  onBack,
}) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day; // Get Monday of current week
    const monday = new Date(today.setDate(diff));
    return getStartOfDay(monday);
  });

  // Calculate week days
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(selectedDate);
      date.setDate(selectedDate.getDate() + i);
      return getStartOfDay(date);
    });
  }, [selectedDate]);

  // Group events by day
  const eventsByDay = useMemo(() => {
    const byDay: Map<string, ScheduleCardData[]> = new Map();
    weekDays.forEach((day) => {
      const dayKey = day.toISOString();
      const dayEvents = events.filter((event) => {
        if (!event.start.dateTime) return false;
        const eventDate = new Date(event.start.dateTime);
        return (
          eventDate.getFullYear() === day.getFullYear() &&
          eventDate.getMonth() === day.getMonth() &&
          eventDate.getDate() === day.getDate()
        );
      });
      // Sort by start time
      dayEvents.sort((a, b) => {
        if (!a.start.dateTime || !b.start.dateTime) return 0;
        return new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime();
      });
      byDay.set(dayKey, dayEvents);
    });
    return byDay;
  }, [events, weekDays]);


  const goToPreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 7);
    setSelectedDate(getStartOfDay(newDate));
  };

  const goToNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 7);
    setSelectedDate(getStartOfDay(newDate));
  };

  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    const monday = new Date(today.setDate(diff));
    setSelectedDate(getStartOfDay(monday));
  };

  const formatTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hour12}:${minutes.toString().padStart(2, '0')}`;
  };

  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const isCurrentWeek = weekDays.some(day => isToday(day));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header - Matches daily calendar style */}
      <div
        className={`px-4 py-3 border-b ${
          isDarkMode ? 'border-white/10' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Left side - Week range */}
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className={`p-2 -ml-2 rounded-xl transition-colors ${
                  isDarkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
                }`}
                aria-label="Back to Labs"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="flex items-center gap-2">
              <h1
                className={`text-4xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {weekStart.toLocaleDateString('en-US', { month: 'short' })} {weekStart.getDate().toString().padStart(2, '0')}
                {' – '}
                {weekEnd.toLocaleDateString('en-US', { month: 'short' })} {weekEnd.getDate().toString().padStart(2, '0')}
              </h1>
              {isCurrentWeek && (
                <span className="w-2 h-2 rounded-full bg-red-500 mt-1" />
              )}
            </div>
          </div>

          {/* Right side - Navigation */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              <button
                onClick={goToPreviousWeek}
                className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}
                aria-label="Previous week"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={goToToday}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}
                aria-label="Go to current week"
              >
                Today
              </button>
              <button
                onClick={goToNextWeek}
                className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}
                aria-label="Next week"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Week Grid - Calendar Style */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* Day Columns */}
          {weekDays.map((day) => {
            const dayKey = day.toISOString();
            const dayEvents = eventsByDay.get(dayKey) || [];
            const isTodayDay = isToday(day);

            return (
              <div
                key={dayKey}
                className={`flex-1 min-w-0 border-r flex flex-col ${
                  isTodayDay
                    ? isDarkMode
                      ? 'bg-blue-500/5 border-blue-500/20'
                      : 'bg-blue-50 border-blue-200'
                    : isDarkMode
                    ? 'border-white/10'
                    : 'border-gray-200'
                }`}
              >
                {/* Day Header */}
                <div
                  className={`px-2 py-2 border-b ${
                    isDarkMode ? 'border-white/10' : 'border-gray-200'
                  }`}
                >
                  <div className={`text-xs text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div
                    className={`text-base font-semibold text-center ${
                      isTodayDay ? 'text-blue-500' : isDarkMode ? 'text-gray-200' : 'text-gray-900'
                    }`}
                  >
                    {day.getDate()}
                  </div>
                </div>

                {/* Items - Compact Calendar Style */}
                <div className="flex-1 overflow-y-auto p-1 space-y-1">
                  {dayEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => event.type === 'task' && event.taskId && onTaskClick ? 
                        onTaskClick(tasks.find(t => t.id === event.taskId)!) : 
                        onCardClick?.(event)
                      }
                      className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                        isDarkMode
                          ? 'bg-white/10 hover:bg-white/15'
                          : 'bg-white hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {event.start.dateTime && (
                        <div className={`font-medium mb-0.5 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                          {formatTime(event.start.dateTime)}
                        </div>
                      )}
                      <div className={`truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        {event.title}
                      </div>
                    </button>
                  ))}
                  {dayEvents.length === 0 && (
                    <p className={`text-xs text-center py-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                      —
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeekPlannerView;
