import React, { useMemo, useState } from 'react';
import { ScheduleCardData, getEventDuration, getTimeFromDateTime } from './ScheduleCard';
import Checkbox from './Checkbox';
import { useBasic, useQuery } from '@basictech/react';

// Format date
const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
};

// Check if date is today
const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

// Get date at start of day (midnight)
const getStartOfDay = (date: Date): Date => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

// Format time for display (12-hour format)
const formatTime = (dateTime: string): string => {
  const date = new Date(dateTime);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const ampm = hours < 12 ? 'AM' : 'PM';
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

// Format duration
const formatDuration = (durationMinutes: number): string => {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
};

// Event Item Component - defined outside AgendaView to prevent recreation on parent re-renders
interface EventItemProps {
  event: ScheduleCardData;
  onCardClick?: (cardData: ScheduleCardData) => void;
  onTaskToggle?: (taskId: string, completed: boolean) => void;
  accentColor: string;
  isDarkMode: boolean;
}

const AgendaEventItem: React.FC<EventItemProps> = ({ event, onCardClick, onTaskToggle, accentColor, isDarkMode }) => {
  const { db } = useBasic();
  
  // Fetch linked task if this is a task event
  const linkedTask = useQuery(
    () => event.taskId ? db.collection('tasks').get(event.taskId) : null,
    [event.taskId]
  );
  
  const isCompleted = event.type === 'task' && linkedTask?.completed || false;
  const displayTitle = event.type === 'task' && linkedTask ? linkedTask.name : event.title;
  
  const startTime = event.start.dateTime ? formatTime(event.start.dateTime) : '';
  const endTime = event.end.dateTime ? formatTime(event.end.dateTime) : '';
  const duration = getEventDuration(event);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (event.taskId && onTaskToggle) {
      onTaskToggle(event.taskId, e.target.checked);
    }
  };

  // Calculate dynamic height based on duration
  // Base height: 60px, add 0.6px per minute, min 60px, max 180px
  const calculateHeight = (durationMinutes: number): number => {
    const baseHeight = 60;
    const heightPerMinute = 0.6;
    const calculatedHeight = baseHeight + (durationMinutes * heightPerMinute);
    return Math.min(Math.max(calculatedHeight, 60), 180); // min 60px, max 180px
  };

  const cardHeight = calculateHeight(duration);

  // Calculate progress for current/past events
  const calculateProgress = (): number => {
    if (!event.start.dateTime || !event.end.dateTime) return 0;
    
    const now = new Date();
    const startTime = new Date(event.start.dateTime);
    const endTime = new Date(event.end.dateTime);
    
    // Future event - no progress
    if (now < startTime) return 0;
    
    // Past event - fully complete
    if (now >= endTime) return 100;
    
    // Current event - calculate percentage
    const totalDuration = endTime.getTime() - startTime.getTime();
    const elapsed = now.getTime() - startTime.getTime();
    return (elapsed / totalDuration) * 100;
  };

  const progressPercentage = calculateProgress();

  return (
    <div
      onClick={() => onCardClick?.(event)}
      className={`group p-3 rounded-lg border cursor-pointer transition-all flex flex-col ${
        isDarkMode 
          ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20' 
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
      }`}
      style={{ height: `${cardHeight}px` }}
    >
      <div className="flex items-stretch gap-3 flex-1">
        {/* Time column - stacked start, duration, and end times */}
        <div className={`flex-shrink-0 text-xs text-right ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`} style={{ width: '60px' }}>
          <div className="font-mono">{startTime}</div>
          <div className="flex items-center justify-end gap-1.5 my-0.5">
            <div className="w-px h-3 bg-current opacity-40"></div>
            <span className="text-[10px]">{formatDuration(duration)}</span>
          </div>
          <div className="font-mono opacity-70">{endTime}</div>
        </div>

        {/* Color indicator with progress */}
        <div 
          className="flex-shrink-0 w-1 rounded-full self-stretch relative overflow-hidden"
          style={{ backgroundColor: event.color }}
        >
          {/* Progress overlay - fills from top to bottom */}
          {progressPercentage > 0 && (
            <div 
              className="absolute top-0 left-0 right-0 rounded-full transition-all duration-1000"
              style={{ 
                height: `${progressPercentage}%`,
                backgroundColor: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.3)' 
                  : 'rgba(0, 0, 0, 0.2)'
              }}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title row with optional checkbox */}
          <div className="flex items-start gap-2 mb-1">
            {/* Checkbox inline to the left for tasks */}
            {event.type === 'task' && (
              <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0 pt-0.5">
                <Checkbox
                  id={`agenda-checkbox-${event.id}`}
                  size="sm"
                  checked={isCompleted}
                  onChange={handleCheckboxChange}
                  accentColor={accentColor}
                />
              </div>
            )}
            
            <div className={`flex-1 font-medium ${
              isCompleted && event.type === 'task' ? 'line-through opacity-60' : ''
            } ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {displayTitle}
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className={`text-sm mt-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {event.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface AgendaViewProps {
  onCardClick?: (cardData: ScheduleCardData) => void;
  events?: ScheduleCardData[];
  onTaskToggle?: (taskId: string, completed: boolean) => void;
  accentColor?: string;
  isDarkMode?: boolean;
  viewMode?: 'timeline' | 'agenda';
  onViewModeChange?: (mode: 'timeline' | 'agenda') => void;
}

const AgendaView: React.FC<AgendaViewProps> = ({
  onCardClick,
  events: externalEvents,
  onTaskToggle,
  accentColor = '#1F1B2F',
  isDarkMode = true,
  viewMode = 'agenda',
  onViewModeChange
}) => {
  const { db } = useBasic();
  
  // Track selected date (defaults to today)
  const [selectedDate, setSelectedDate] = useState<Date>(getStartOfDay(new Date()));

  // Filter events to only show those on the selected date
  const events = useMemo(() => {
    if (!externalEvents || externalEvents.length === 0) return [];
    
    const isEventOnDate = (event: ScheduleCardData, targetDate: Date): boolean => {
      if (!event.start.dateTime) return false;
      
      const eventDate = new Date(event.start.dateTime);
      
      const eventYear = eventDate.getFullYear();
      const eventMonth = eventDate.getMonth();
      const eventDay = eventDate.getDate();
      
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth();
      const targetDay = targetDate.getDate();
      
      return eventYear === targetYear && eventMonth === targetMonth && eventDay === targetDay;
    };
    
    return externalEvents.filter(event => isEventOnDate(event, selectedDate));
  }, [externalEvents, selectedDate]);

  // Sort events by start time
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      if (!a.start.dateTime || !b.start.dateTime) return 0;
      return new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime();
    });
  }, [events]);

  // Group events by time blocks (morning, afternoon, evening)
  const groupedEvents = useMemo(() => {
    const groups = {
      morning: [] as ScheduleCardData[], // 6 AM - 12 PM
      afternoon: [] as ScheduleCardData[], // 12 PM - 6 PM
      evening: [] as ScheduleCardData[], // 6 PM - 12 AM
      night: [] as ScheduleCardData[], // 12 AM - 6 AM
    };

    sortedEvents.forEach(event => {
      if (!event.start.dateTime) return;
      
      const startTime = new Date(event.start.dateTime);
      const hour = startTime.getHours();
      
      if (hour >= 6 && hour < 12) {
        groups.morning.push(event);
      } else if (hour >= 12 && hour < 18) {
        groups.afternoon.push(event);
      } else if (hour >= 18 && hour < 24) {
        groups.evening.push(event);
      } else {
        groups.night.push(event);
      }
    });

    return groups;
  }, [sortedEvents]);

  // Date navigation functions
  const goToToday = () => {
    setSelectedDate(getStartOfDay(new Date()));
  };

  const goToPreviousDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(getStartOfDay(prevDay));
  };

  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(getStartOfDay(nextDay));
  };

  const getBackgroundColor = () => {
    return `${accentColor}E6`; // 90% opacity
  };

  const displayDate = formatDate(selectedDate);
  const isSelectedDateToday = isToday(selectedDate);

  return (
    <div
      className={`w-full h-full px-6 pb-6 overflow-y-auto backdrop-blur-3xl flex flex-col rounded-md ${
        isDarkMode ? 'text-gray-100' : 'text-gray-900'
      }`}
      style={{ 
        backgroundColor: getBackgroundColor(),
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE/Edge
      }}
    >
      {/* Sticky header with date navigation */}
      <div 
        className="sticky top-0 z-50 py-4 mb-4 border-b backdrop-blur-md -mx-6 px-6"
        style={{ 
          backgroundColor: getBackgroundColor(),
          borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(209, 213, 219, 0.5)'
        }}
      >
        <div className="relative flex items-center justify-between mb-3">
          <h3 className={`text-lg font-semibold ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>
            {isSelectedDateToday ? 'Today' : displayDate.split(',')[0]}
          </h3>
          
          {/* Center: Date navigation buttons */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
            <button
              onClick={goToPreviousDay}
              className={`p-1.5 rounded-md transition-colors ${
                isDarkMode 
                  ? 'hover:bg-white/10 text-gray-300' 
                  : 'hover:bg-gray-200 text-gray-700'
              }`}
              aria-label="Previous day"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className={`p-1.5 rounded-md transition-colors ${
                isDarkMode 
                  ? 'hover:bg-white/10 text-gray-300' 
                  : 'hover:bg-gray-200 text-gray-700'
              }`}
              aria-label="Go to today"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={goToNextDay}
              className={`p-1.5 rounded-md transition-colors ${
                isDarkMode 
                  ? 'hover:bg-white/10 text-gray-300' 
                  : 'hover:bg-gray-200 text-gray-700'
              }`}
              aria-label="Next day"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Right: View mode toggle switch with icons */}
          {onViewModeChange && (
            <div className={`flex items-center rounded-lg p-0.5 ${
              isDarkMode ? 'bg-white/10' : 'bg-gray-200'
            }`}>
              <button
                onClick={() => onViewModeChange('timeline')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'timeline'
                    ? isDarkMode
                      ? 'bg-white/20 text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-gray-200'
                      : 'text-gray-500 hover:text-gray-800'
                }`}
                aria-label="Timeline view"
                title="Timeline view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => onViewModeChange('agenda')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'agenda'
                    ? isDarkMode
                      ? 'bg-white/20 text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-gray-200'
                      : 'text-gray-500 hover:text-gray-800'
                }`}
                aria-label="Agenda view"
                title="Agenda view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
        <p className={`text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {displayDate}
        </p>
      </div>

      {/* Events list */}
      <div className="flex-1 pb-[200px] md:pb-0">
        {sortedEvents.length === 0 ? (
          <div className={`text-center py-12 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-medium">No events scheduled</p>
            <p className="text-sm mt-1">Your day is free!</p>
          </div>
        ) : (
          <>
            {groupedEvents.morning.length > 0 && (
              <div className="mb-6">
                <h4 className={`text-sm font-semibold mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Morning
                </h4>
                <div className="space-y-2">
                  {groupedEvents.morning.map(event => (
                    <AgendaEventItem 
                      key={event.id} 
                      event={event}
                      onCardClick={onCardClick}
                      onTaskToggle={onTaskToggle}
                      accentColor={accentColor}
                      isDarkMode={isDarkMode}
                    />
                  ))}
                </div>
              </div>
            )}
            {groupedEvents.afternoon.length > 0 && (
              <div className="mb-6">
                <h4 className={`text-sm font-semibold mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Afternoon
                </h4>
                <div className="space-y-2">
                  {groupedEvents.afternoon.map(event => (
                    <AgendaEventItem 
                      key={event.id} 
                      event={event}
                      onCardClick={onCardClick}
                      onTaskToggle={onTaskToggle}
                      accentColor={accentColor}
                      isDarkMode={isDarkMode}
                    />
                  ))}
                </div>
              </div>
            )}
            {groupedEvents.evening.length > 0 && (
              <div className="mb-6">
                <h4 className={`text-sm font-semibold mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Evening
                </h4>
                <div className="space-y-2">
                  {groupedEvents.evening.map(event => (
                    <AgendaEventItem 
                      key={event.id} 
                      event={event}
                      onCardClick={onCardClick}
                      onTaskToggle={onTaskToggle}
                      accentColor={accentColor}
                      isDarkMode={isDarkMode}
                    />
                  ))}
                </div>
              </div>
            )}
            {groupedEvents.night.length > 0 && (
              <div className="mb-6">
                <h4 className={`text-sm font-semibold mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Night
                </h4>
                <div className="space-y-2">
                  {groupedEvents.night.map(event => (
                    <AgendaEventItem 
                      key={event.id} 
                      event={event}
                      onCardClick={onCardClick}
                      onTaskToggle={onTaskToggle}
                      accentColor={accentColor}
                      isDarkMode={isDarkMode}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AgendaView;

