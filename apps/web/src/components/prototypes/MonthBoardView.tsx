import React, { useState, useMemo } from 'react';
import { ScheduleCardData } from '../../utils/schedule';
import { Task } from '../../utils/types';
import { getStartOfDay, isToday } from '../../utils/dateHelpers';

interface MonthBoardViewProps {
  events: ScheduleCardData[];
  tasks: Task[];
  onCardClick?: (cardData: ScheduleCardData) => void;
  onTaskClick?: (task: Task) => void;
  onDayClick?: (date: Date) => void;
  isDarkMode: boolean;
  onBack?: () => void;
}

const MonthBoardView: React.FC<MonthBoardViewProps> = ({
  events,
  tasks,
  onCardClick,
  onTaskClick,
  onDayClick,
  isDarkMode,
  onBack,
}) => {
  const [selectedDate, setSelectedDate] = useState(() => getStartOfDay(new Date()));
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const { year, month } = useMemo(() => {
    return {
      year: selectedDate.getFullYear(),
      month: selectedDate.getMonth(),
    };
  }, [selectedDate]);

  // Get days in month
  const daysInMonth = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Create array of days, padded with nulls for alignment
    const days: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [year, month]);

  // Group events and tasks by day
  const itemsByDay = useMemo(() => {
    const byDay: Map<string, { events: ScheduleCardData[]; tasks: Task[] }> = new Map();

    events.forEach((event) => {
      if (!event.start.dateTime && !event.start.date) return;
      const eventDate = event.start.dateTime
        ? new Date(event.start.dateTime)
        : new Date(event.start.date!);
      const dayKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;

      if (!byDay.has(dayKey)) {
        byDay.set(dayKey, { events: [], tasks: [] });
      }
      byDay.get(dayKey)!.events.push(event);
    });

    // Add unscheduled tasks to today
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const scheduledTaskIds = new Set(
      events.filter((e) => e.type === 'task' && e.taskId).map((e) => e.taskId)
    );
    const unscheduledTasks = tasks.filter((t) => !t.completed && !scheduledTaskIds.has(t.id));

    if (!byDay.has(todayKey)) {
      byDay.set(todayKey, { events: [], tasks: [] });
    }
    byDay.get(todayKey)!.tasks = unscheduledTasks;

    return byDay;
  }, [events, tasks]);

  const goToPreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(month - 1);
    setSelectedDate(getStartOfDay(newDate));
    setExpandedDay(null);
  };

  const goToNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(month + 1);
    setSelectedDate(getStartOfDay(newDate));
    setExpandedDay(null);
  };

  const goToToday = () => {
    setSelectedDate(getStartOfDay(new Date()));
    setExpandedDay(null);
  };

  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getDayKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };

  const handleDayClick = (day: Date) => {
    const dayKey = getDayKey(day);
    setExpandedDay(expandedDay === dayKey ? null : dayKey);
    onDayClick?.(day);
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
            <h1 className="text-lg font-semibold">{monthName}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
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
              onClick={goToNextMonth}
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

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-6xl mx-auto">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className={`text-center text-xs font-semibold py-2 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-2">
            {daysInMonth.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} />;
              }

              const dayKey = getDayKey(day);
              const dayItems = itemsByDay.get(dayKey) || { events: [], tasks: [] };
              const totalCount = dayItems.events.length + dayItems.tasks.length;
              const isTodayDay = isToday(day);
              const isExpanded = expandedDay === dayKey;

              return (
                <button
                  key={dayKey}
                  onClick={() => handleDayClick(day)}
                  className={`relative rounded-lg border p-2 text-left transition-all min-h-[100px] ${
                    isTodayDay
                      ? isDarkMode
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-blue-500 bg-blue-50'
                      : isDarkMode
                      ? 'border-white/10 bg-white/5 hover:bg-white/10'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  } ${isExpanded ? 'ring-2 ring-blue-500' : ''}`}
                >
                  {/* Date */}
                  <div className={`text-sm font-semibold mb-2 ${isTodayDay ? 'text-blue-500' : ''}`}>
                    {day.getDate()}
                  </div>

                  {/* Items */}
                  {!isExpanded && totalCount > 0 && (
                    <div className="space-y-1">
                      {dayItems.events.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={`text-[10px] px-2 py-1 rounded truncate ${
                            isDarkMode ? 'bg-white/10' : 'bg-blue-100'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onCardClick?.(event);
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {totalCount > 3 && (
                        <div
                          className={`text-[10px] px-2 py-1 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          +{totalCount - 3} more
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expanded view */}
                  {isExpanded && (
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                      {dayItems.events.map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs px-2 py-1.5 rounded truncate cursor-pointer ${
                            isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-blue-100 hover:bg-blue-200'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onCardClick?.(event);
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayItems.tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`text-xs px-2 py-1.5 rounded truncate cursor-pointer ${
                            isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskClick?.(task);
                          }}
                        >
                          {task.name}
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthBoardView;
