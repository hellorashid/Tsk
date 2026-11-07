import React, { useState, useMemo } from 'react';
import { ScheduleCardData, getEventDuration } from '../../utils/schedule';
import { Task } from '../../utils/types';
import { getStartOfDay, isToday } from '../../utils/dateHelpers';

interface WeekGridViewProps {
  events: ScheduleCardData[];
  tasks: Task[];
  onCardClick?: (cardData: ScheduleCardData) => void;
  onTaskClick?: (task: Task) => void;
  isDarkMode: boolean;
  onBack: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // pixels

const WeekGridView: React.FC<WeekGridViewProps> = ({
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

  // Filter tasks that have no schedule (for inbox)
  const unscheduledTasks = useMemo(() => {
    const scheduledTaskIds = new Set(
      events.filter((e) => e.type === 'task' && e.taskId).map((e) => e.taskId)
    );
    return tasks.filter((t) => !t.completed && !scheduledTaskIds.has(t.id));
  }, [tasks, events]);

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

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
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
            <h1 className="text-lg font-semibold">Week Grid</h1>
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

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Week Grid */}
        <div className="flex-1 overflow-auto">
          <div className="flex min-w-max">
            {/* Time column */}
            <div className="w-16 shrink-0 border-r" style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
              <div className="h-12 border-b" style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="relative text-xs text-right pr-2 py-1"
                  style={{ height: HOUR_HEIGHT, color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day) => {
              const dayKey = day.toISOString();
              const dayEvents = eventsByDay.get(dayKey) || [];
              const isTodayDay = isToday(day);

              return (
                <div
                  key={dayKey}
                  className="flex-1 border-r min-w-[120px]"
                  style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                >
                  {/* Day header */}
                  <div
                    className={`h-12 border-b flex flex-col items-center justify-center ${
                      isTodayDay
                        ? isDarkMode
                          ? 'bg-blue-500/20'
                          : 'bg-blue-50'
                        : ''
                    }`}
                    style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                  >
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div
                      className={`text-lg font-semibold ${
                        isTodayDay
                          ? 'text-blue-500'
                          : isDarkMode
                          ? 'text-gray-200'
                          : 'text-gray-900'
                      }`}
                    >
                      {day.getDate()}
                    </div>
                  </div>

                  {/* Hour grid */}
                  <div className="relative">
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="border-b"
                        style={{
                          height: HOUR_HEIGHT,
                          borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        }}
                      />
                    ))}

                    {/* Events overlay */}
                    {dayEvents.map((event) => {
                      if (!event.start.dateTime || !event.end.dateTime) return null;
                      const startDate = new Date(event.start.dateTime);
                      const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
                      const duration = getEventDuration(event);
                      const top = (startMinutes / 60) * HOUR_HEIGHT;
                      const height = (duration / 60) * HOUR_HEIGHT;

                      return (
                        <button
                          key={event.id}
                          onClick={() => onCardClick?.(event)}
                          className={`absolute left-1 right-1 rounded-md p-2 text-left text-xs font-medium border transition-colors ${
                            isDarkMode
                              ? 'bg-white/10 hover:bg-white/20 border-white/20'
                              : 'bg-blue-50 hover:bg-blue-100 border-blue-200'
                          }`}
                          style={{
                            top: `${top}px`,
                            height: `${Math.max(height, 30)}px`,
                            minHeight: '30px',
                          }}
                        >
                          <div className="truncate">{event.title}</div>
                          {duration > 30 && (
                            <div className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {Math.round(duration)}m
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inbox Sidebar */}
        <div
          className={`w-64 shrink-0 border-l overflow-y-auto ${
            isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="p-4">
            <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Unscheduled ({unscheduledTasks.length})
            </h3>
            <div className="space-y-2">
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
                <p className={`text-sm text-center py-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  All tasks scheduled
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekGridView;
