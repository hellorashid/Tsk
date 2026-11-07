import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ScheduleCardData, ScheduleCardInput } from '../../utils/schedule';
import { Task } from '../../utils/types';
import { getStartOfDay, isToday } from '../../utils/dateHelpers';
import EventPopover from '../EventPopover';

interface WeekPlannerViewProps {
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

const WeekPlannerView: React.FC<WeekPlannerViewProps> = ({
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
  const [internalSelectedDate, setInternalSelectedDate] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day; // Get Monday of current week
    const monday = new Date(today.setDate(diff));
    return getStartOfDay(monday);
  });

  // Popover state
  const [popoverEvent, setPopoverEvent] = useState<ScheduleCardData | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | undefined>();
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [creationDate, setCreationDate] = useState<Date | undefined>();
  const [creationStartTime, setCreationStartTime] = useState<string | undefined>();
  const [creationEndTime, setCreationEndTime] = useState<string | undefined>();

  // Use external selectedDate if provided, otherwise use internal
  const selectedDate = externalSelectedDate || internalSelectedDate;
  const setSelectedDate = externalSelectedDate ? () => {} : setInternalSelectedDate;

  // Scroll container ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialize scroll position to show current hour or 6 AM
  useEffect(() => {
    if (scrollContainerRef.current) {
      const currentHour = new Date().getHours();
      // Scroll to current hour - 2 (to show some context above)
      // But ensure we don't go negative and that midnight is still accessible
      const targetHour = Math.max(0, currentHour - 2);
      const scrollTop = targetHour * 60; // 60px per hour
      scrollContainerRef.current.scrollTop = scrollTop;
    }
  }, []); // Only run once on mount

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

  const getHourFromDateTime = (dateTime: string): number => {
    return new Date(dateTime).getHours() + new Date(dateTime).getMinutes() / 60;
  };

  const handleDayClick = (day: Date) => {
    onDayClick?.(day);
  };

  const handleTimeSlotClick = (day: Date, hour: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    
    const startDate = new Date(day);
    startDate.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 1);

    const startTimeStr = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
    const endTimeStr = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

    setCreationDate(startDate);
    setCreationStartTime(startTimeStr);
    setCreationEndTime(endTimeStr);
    setIsCreatingEvent(true);
    setPopoverEvent(null);
    setPopoverAnchor(event.currentTarget);
    setPopoverPosition({ x: event.clientX, y: event.clientY });
  };

  const handleEventClick = (event: ScheduleCardData, clickEvent: React.MouseEvent<HTMLButtonElement>) => {
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
    setCreationStartTime(undefined);
    setCreationEndTime(undefined);
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

      {/* Week Grid - Unified Scrolling (Cron/Notion-inspired) */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative overscroll-none"
      >
        {/* Sticky Day Headers */}
        <div 
          className={`sticky top-0 z-10 flex ${
            isDarkMode ? 'bg-gray-900/95 backdrop-blur-sm' : 'bg-white/95 backdrop-blur-sm'
          }`}
          style={{ marginLeft: '48px' }}
        >
          {weekDays.map((day) => {
            const dayKey = day.toISOString();
            const isTodayDay = isToday(day);
            const isSelectedDay = externalSelectedDate && 
              day.getFullYear() === externalSelectedDate.getFullYear() &&
              day.getMonth() === externalSelectedDate.getMonth() &&
              day.getDate() === externalSelectedDate.getDate();

            return (
              <button
                key={`header-${dayKey}`}
                onClick={() => handleDayClick(day)}
                className={`flex-1 px-2 py-2 border-b border-r transition-colors text-center ${
                  isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'
                } ${
                  isSelectedDay
                    ? isDarkMode
                      ? 'bg-blue-500/15'
                      : 'bg-blue-100'
                    : isTodayDay
                    ? isDarkMode
                      ? 'bg-blue-500/5'
                      : 'bg-blue-50'
                    : ''
                }`}
              >
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div
                  className={`text-base font-semibold ${
                    isTodayDay ? 'text-blue-500' : isDarkMode ? 'text-gray-200' : 'text-gray-900'
                  }`}
                >
                  {day.getDate()}
                </div>
              </button>
            );
          })}
        </div>

        {/* Time Grid with Hour Gutter - All Days Share Vertical Scroll */}
        <div className="flex relative">
          {/* Fixed Hour Gutter - All 24 Hours */}
          <div className="w-12 shrink-0">
            {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
              <div
                key={`gutter-${hour}`}
                className={`h-[60px] pr-2 pt-0.5 text-right text-[10px] ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </div>
            ))}
          </div>

          {/* Day Columns Grid */}
          <div className="flex-1 flex">
            {weekDays.map((day) => {
              const dayKey = day.toISOString();
              const dayEvents = eventsByDay.get(dayKey) || [];
              const isTodayDay = isToday(day);
              const isSelectedDay = externalSelectedDate && 
                day.getFullYear() === externalSelectedDate.getFullYear() &&
                day.getMonth() === externalSelectedDate.getMonth() &&
                day.getDate() === externalSelectedDate.getDate();

              return (
                <div
                  key={dayKey}
                  className={`flex-1 relative border-r ${
                    isSelectedDay
                      ? isDarkMode
                        ? 'bg-blue-500/5 border-blue-500/20'
                        : 'bg-blue-50/50 border-blue-300'
                      : isTodayDay
                      ? isDarkMode
                        ? 'bg-blue-500/[0.02] border-blue-500/10'
                        : 'bg-blue-50/30 border-blue-200'
                      : isDarkMode
                      ? 'border-white/10'
                      : 'border-gray-200'
                  }`}
                >
                  {/* Hour Row Dividers - All 24 Hours */}
                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                    <button
                      key={`slot-${hour}`}
                      type="button"
                      className={`w-full h-[60px] border-t transition-colors ${
                        isDarkMode 
                          ? 'border-white/[0.03] hover:bg-white/[0.02] cursor-pointer' 
                          : 'border-gray-200/50 hover:bg-blue-50/50 cursor-pointer'
                      }`}
                      onClick={(e) => handleTimeSlotClick(day, hour, e)}
                      aria-label={`Create event at ${hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`} on ${day.toLocaleDateString()}`}
                    />
                  ))}

                  {/* Events - Absolutely Positioned by Time */}
                  {dayEvents.map((event) => {
                    const hour = event.start.dateTime ? getHourFromDateTime(event.start.dateTime) : 12;
                    const topPosition = hour * 60; // Position from midnight (0) onwards

                    return (
                      <button
                        key={event.id}
                        onClick={(e) => handleEventClick(event, e)}
                        className={`absolute left-1 right-1 px-2 py-1 rounded text-[10px] transition-colors ${
                          isDarkMode
                            ? 'bg-white/10 hover:bg-white/20'
                            : 'bg-blue-100 hover:bg-blue-200'
                        }`}
                        style={{ 
                          top: `${topPosition}px`,
                          minHeight: '24px',
                          maxHeight: '56px'
                        }}
                      >
                        <div className={`truncate font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                          {event.title}
                        </div>
                      </button>
                    );
                  })}
                </div>
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
          defaultStartTime={creationStartTime}
          defaultEndTime={creationEndTime}
        />
      )}
    </div>
  );
};

export default WeekPlannerView;
