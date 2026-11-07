import React, { useState, useMemo } from 'react';
import { ScheduleCardData } from '../../utils/schedule';
import { Task } from '../../utils/types';
import { getStartOfDay, isToday, formatTime } from '../../utils/dateHelpers';

interface AgendaMonthViewProps {
  events: ScheduleCardData[];
  tasks: Task[];
  onCardClick?: (cardData: ScheduleCardData) => void;
  onTaskClick?: (task: Task) => void;
  isDarkMode: boolean;
  isMobile: boolean;
  onBack: () => void;
}

const AgendaMonthView: React.FC<AgendaMonthViewProps> = ({
  events,
  tasks,
  onCardClick,
  onTaskClick,
  isDarkMode,
  isMobile,
  onBack,
}) => {
  const [selectedDate, setSelectedDate] = useState(() => getStartOfDay(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const { year, month } = useMemo(() => {
    return {
      year: calendarMonth.getFullYear(),
      month: calendarMonth.getMonth(),
    };
  }, [calendarMonth]);

  // Get days in month for mini calendar
  const daysInMonth = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [year, month]);

  // Group upcoming events by day (next 30 days)
  const agendaItems = useMemo(() => {
    const today = getStartOfDay(new Date());
    const upcomingDays: Map<string, { date: Date; items: ScheduleCardData[] }> = new Map();

    // Get events for next 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayKey = date.toISOString();

      const dayEvents = events.filter((event) => {
        if (!event.start.dateTime) return false;
        const eventDate = new Date(event.start.dateTime);
        return (
          eventDate.getFullYear() === date.getFullYear() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getDate() === date.getDate()
        );
      });

      // Sort by time
      dayEvents.sort((a, b) => {
        if (!a.start.dateTime || !b.start.dateTime) return 0;
        return new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime();
      });

      if (dayEvents.length > 0 || i === 0) {
        upcomingDays.set(dayKey, { date, items: dayEvents });
      }
    }

    return Array.from(upcomingDays.values());
  }, [events]);

  // Unscheduled tasks
  const unscheduledTasks = useMemo(() => {
    const scheduledTaskIds = new Set(
      events.filter((e) => e.type === 'task' && e.taskId).map((e) => e.taskId)
    );
    return tasks.filter((t) => !t.completed && !scheduledTaskIds.has(t.id));
  }, [tasks, events]);

  const goToPreviousMonth = () => {
    const newDate = new Date(calendarMonth);
    newDate.setMonth(month - 1);
    setCalendarMonth(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(calendarMonth);
    newDate.setMonth(month + 1);
    setCalendarMonth(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(getStartOfDay(today));
    setCalendarMonth(today);
  };

  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleDayClick = (day: Date) => {
    setSelectedDate(getStartOfDay(day));
  };

  const getDayKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };

  const hasEvents = (day: Date) => {
    return events.some((event) => {
      if (!event.start.dateTime) return false;
      const eventDate = new Date(event.start.dateTime);
      return (
        eventDate.getFullYear() === day.getFullYear() &&
        eventDate.getMonth() === day.getMonth() &&
        eventDate.getDate() === day.getDate()
      );
    });
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
            <h1 className="text-lg font-semibold">Agenda + Month</h1>
          </div>
          <button
            onClick={goToToday}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'
            }`}
          >
            Today
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 overflow-hidden ${isMobile ? 'flex-col' : 'flex'}`}>
        {/* Month Navigator */}
        <div
          className={`${isMobile ? 'border-b' : 'border-r'} ${
            isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'
          } ${isMobile ? 'shrink-0' : 'w-80 shrink-0'}`}
        >
          <div className="p-4">
            {/* Month header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">{monthName}</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={goToPreviousMonth}
                  className={`p-1.5 rounded transition-colors ${
                    isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={goToNextMonth}
                  className={`p-1.5 rounded transition-colors ${
                    isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <div
                  key={idx}
                  className={`text-center text-xs font-medium ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-600'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} />;
                }

                const dayKey = getDayKey(day);
                const selectedKey = getDayKey(selectedDate);
                const isSelected = dayKey === selectedKey;
                const isTodayDay = isToday(day);
                const dayHasEvents = hasEvents(day);

                return (
                  <button
                    key={dayKey}
                    onClick={() => handleDayClick(day)}
                    className={`aspect-square rounded-lg text-xs font-medium transition-colors relative ${
                      isSelected
                        ? isDarkMode
                          ? 'bg-blue-500 text-white'
                          : 'bg-blue-500 text-white'
                        : isTodayDay
                        ? isDarkMode
                          ? 'bg-white/10 text-white'
                          : 'bg-gray-200 text-gray-900'
                        : isDarkMode
                        ? 'hover:bg-white/5 text-gray-300'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {day.getDate()}
                    {dayHasEvents && !isSelected && (
                      <div
                        className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${
                          isTodayDay
                            ? 'bg-blue-500'
                            : isDarkMode
                            ? 'bg-blue-400'
                            : 'bg-blue-500'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Agenda Scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Unscheduled tasks */}
            {unscheduledTasks.length > 0 && (
              <div>
                <h3
                  className={`text-sm font-semibold mb-3 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
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
                </div>
              </div>
            )}

            {/* Upcoming days */}
            {agendaItems.map(({ date, items }) => {
              const isTodayDay = isToday(date);
              const dateStr = date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              });

              return (
                <div key={date.toISOString()}>
                  <h3
                    className={`text-sm font-semibold mb-3 ${
                      isTodayDay ? 'text-blue-500' : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    {isTodayDay ? 'Today — ' : ''}
                    {dateStr}
                  </h3>
                  {items.length === 0 ? (
                    <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Nothing scheduled
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {items.map((event) => (
                        <button
                          key={event.id}
                          onClick={() => onCardClick?.(event)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            isDarkMode
                              ? 'bg-white/5 hover:bg-white/10 border-white/10'
                              : 'bg-white hover:bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {event.start.dateTime && (
                              <div
                                className={`text-xs font-medium mt-0.5 ${
                                  isDarkMode ? 'text-gray-500' : 'text-gray-500'
                                }`}
                              >
                                {formatTime(event.start.dateTime)}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="text-sm font-medium">{event.title}</div>
                              {event.description && (
                                <div
                                  className={`text-xs mt-1 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                  }`}
                                >
                                  {event.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgendaMonthView;
