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

  // Filter unscheduled tasks
  const unscheduledTasks = useMemo(() => {
    const scheduledTaskIds = new Set(
      events.filter((e) => e.type === 'task' && e.taskId).map((e) => e.taskId)
    );
    return tasks.filter((t) => !t.completed && !scheduledTaskIds.has(t.id));
  }, [tasks, events]);

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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className={`px-4 py-3 border-b ${
          isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Labs
              </button>
            )}
            <h1 className="text-lg font-semibold">Week Planner</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousWeek}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'
              }`}
            >
              Today
            </button>
            <button
              onClick={goToNextWeek}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Columns Container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full min-w-max">
          {/* Inbox Column */}
          <div
            className={`w-64 shrink-0 border-r flex flex-col ${
              isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div
              className={`px-4 py-3 border-b ${
                isDarkMode ? 'border-white/10' : 'border-gray-200'
              }`}
            >
              <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Inbox
              </h3>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {unscheduledTasks.length} undated
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {unscheduledTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onTaskClick?.(task)}
                  className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${
                    isDarkMode
                      ? 'bg-white/5 hover:bg-white/10 border-white/10'
                      : 'bg-white hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  {task.name}
                </button>
              ))}
              {unscheduledTasks.length === 0 && (
                <p className={`text-sm text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  All tasks scheduled
                </p>
              )}
            </div>
          </div>

          {/* Day Columns */}
          {weekDays.map((day) => {
            const dayKey = day.toISOString();
            const dayEvents = eventsByDay.get(dayKey) || [];
            const isTodayDay = isToday(day);

            return (
              <div
                key={dayKey}
                className={`w-64 shrink-0 border-r flex flex-col ${
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
                  className={`px-4 py-3 border-b ${
                    isDarkMode ? 'border-white/10' : 'border-gray-200'
                  }`}
                >
                  <div className={`text-xs mb-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <h3
                    className={`text-lg font-semibold ${
                      isTodayDay ? 'text-blue-500' : isDarkMode ? 'text-gray-200' : 'text-gray-900'
                    }`}
                  >
                    {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </h3>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {dayEvents.length} {dayEvents.length === 1 ? 'item' : 'items'}
                  </p>
                </div>

                {/* Task List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {dayEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => onCardClick?.(event)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        isDarkMode
                          ? 'bg-white/5 hover:bg-white/10 border-white/10'
                          : 'bg-white hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      {event.start.dateTime && (
                        <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {formatTime(event.start.dateTime)}
                        </div>
                      )}
                      <div className="text-sm font-medium">{event.title}</div>
                    </button>
                  ))}
                  {dayEvents.length === 0 && (
                    <p className={`text-sm text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Nothing planned
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
