import React, { useState, useMemo } from 'react';
import { ScheduleCardData, ScheduleCardInput } from '../../utils/schedule';
import { Task } from '../../utils/types';
import { getStartOfDay, isToday } from '../../utils/dateHelpers';
import EventPopover from '../EventPopover';

interface MonthBoardViewProps {
  events: ScheduleCardData[];
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onDayClick?: (date: Date) => void;
  onAddEvent?: (eventData: ScheduleCardInput) => Promise<ScheduleCardData>;
  onAddTask?: (taskName: string) => Promise<string | null>;
  onAddTaskToSchedule?: (taskId: string, startTime: Date, duration: number) => Promise<void>;
  onUpdateEvent?: (id: string, changes: Partial<ScheduleCardData>) => void;
  onDeleteEvent?: (id: string) => void;
  selectedDate?: Date;
  isDarkMode: boolean;
  onBack?: () => void;
}

const MonthBoardView: React.FC<MonthBoardViewProps> = ({
  events,
  tasks,
  onTaskClick,
  onDayClick,
  onAddEvent,
  onAddTask,
  onAddTaskToSchedule,
  onUpdateEvent,
  onDeleteEvent,
  selectedDate: externalSelectedDate,
  isDarkMode,
  onBack,
}) => {
  const [internalSelectedDate, setInternalSelectedDate] = useState(() => getStartOfDay(new Date()));
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Popover state
  const [popoverEvent, setPopoverEvent] = useState<ScheduleCardData | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | undefined>();
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [creationDate, setCreationDate] = useState<Date | undefined>();

  // Use external selectedDate if provided, otherwise use internal
  const selectedDate = externalSelectedDate || internalSelectedDate;
  const setSelectedDate = externalSelectedDate ? () => {} : setInternalSelectedDate;

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
  const isCurrentMonth = new Date().getMonth() === month && new Date().getFullYear() === year;

  const getDayKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };

  const handleDayClick = (day: Date, hasItems: boolean, clickEvent?: React.MouseEvent<HTMLElement>) => {
    // Always notify parent about day selection
    onDayClick?.(day);
    
    // If day has no items, show creation popover
    if (!hasItems && onAddEvent && clickEvent) {
      clickEvent.stopPropagation();
      setCreationDate(day);
      setIsCreatingEvent(true);
      setPopoverEvent(null);
      setPopoverAnchor(clickEvent.currentTarget);
      setPopoverPosition({ x: clickEvent.clientX, y: clickEvent.clientY });
      return;
    }
    
    // If day has items, toggle expansion
    if (hasItems) {
      const dayKey = getDayKey(day);
      setExpandedDay(expandedDay === dayKey ? null : dayKey);
    }
  };

  const handleEventClick = (event: ScheduleCardData, clickEvent: React.MouseEvent<HTMLElement>) => {
    clickEvent.stopPropagation();
    
    // For task events, use existing task click handler
    if (event.type === 'task' && event.taskId && onTaskClick) {
      const task = tasks.find(t => t.id === event.taskId);
      if (task) {
        onTaskClick(task);
        return;
      }
    }

    // Show popover for regular events
    setPopoverEvent(event);
    setIsCreatingEvent(false);
    setPopoverAnchor(clickEvent.currentTarget);
    setPopoverPosition({ x: clickEvent.clientX, y: clickEvent.clientY });
  };

  const handlePopoverSave = async (eventData: ScheduleCardInput | Partial<ScheduleCardData>) => {
    if (isCreatingEvent && onAddEvent) {
      await onAddEvent(eventData as ScheduleCardInput);
    } else if (popoverEvent && onUpdateEvent) {
      onUpdateEvent(popoverEvent.id, eventData as Partial<ScheduleCardData>);
    }
    handlePopoverClose();
  };

  const handlePopoverSaveTask = async (taskData: { name: string; startTime: Date; duration: number }) => {
    if (onAddTask && onAddTaskToSchedule) {
      const taskId = await onAddTask(taskData.name);
      if (taskId) {
        await onAddTaskToSchedule(taskId, taskData.startTime, taskData.duration);
      }
    }
    handlePopoverClose();
  };

  const handlePopoverDelete = (eventId: string) => {
    if (onDeleteEvent) {
      onDeleteEvent(eventId);
    }
    handlePopoverClose();
  };

  const handlePopoverClose = () => {
    setPopoverEvent(null);
    setPopoverAnchor(null);
    setPopoverPosition(undefined);
    setIsCreatingEvent(false);
    setCreationDate(undefined);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header - Matches daily calendar style */}
      <div
        className={`px-4 py-3 border-b ${
          isDarkMode ? 'border-white/10' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Left side - Month and year */}
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
                {monthName}
              </h1>
              {isCurrentMonth && (
                <span className="w-2 h-2 rounded-full bg-red-500 mt-1" />
              )}
            </div>
          </div>

          {/* Right side - Navigation */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              <button
                onClick={goToPreviousMonth}
                className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}
                aria-label="Previous month"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={goToToday}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}
                aria-label="Go to current month"
              >
                Today
              </button>
              <button
                onClick={goToNextMonth}
                className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}
                aria-label="Next month"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
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
              const isSelectedDay = externalSelectedDate && 
                day.getFullYear() === externalSelectedDate.getFullYear() &&
                day.getMonth() === externalSelectedDate.getMonth() &&
                day.getDate() === externalSelectedDate.getDate();

              return (
                <button
                  key={dayKey}
                  onClick={(e) => handleDayClick(day, totalCount > 0, e)}
                  className={`relative rounded-lg border p-2 text-left transition-all min-h-[100px] ${
                    isSelectedDay
                      ? isDarkMode
                        ? 'border-blue-500 bg-blue-500/15 ring-2 ring-blue-500/50'
                        : 'border-blue-500 bg-blue-200 ring-2 ring-blue-400'
                    : isTodayDay
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
                          className={`text-[10px] px-2 py-1 rounded truncate cursor-pointer ${
                            isDarkMode ? 'bg-white/10' : 'bg-blue-100'
                          }`}
                          onClick={(e) => handleEventClick(event, e)}
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
                          onClick={(e) => handleEventClick(event, e)}
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

      {/* Event Popover */}
      {(popoverEvent || isCreatingEvent) && (
        <EventPopover
          event={popoverEvent}
          isCreating={isCreatingEvent}
          anchorEl={popoverAnchor}
          position={popoverPosition}
          onSave={handlePopoverSave}
          onSaveTask={handlePopoverSaveTask}
          onDelete={handlePopoverDelete}
          onClose={handlePopoverClose}
          isDarkMode={isDarkMode}
          defaultDate={creationDate}
          defaultStartTime="09:00"
          defaultEndTime="10:00"
        />
      )}
    </div>
  );
};

export default MonthBoardView;
