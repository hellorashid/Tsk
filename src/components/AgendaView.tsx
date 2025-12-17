import React, { useMemo, useState, useEffect } from 'react';
import { ScheduleCardData, getEventDuration, getTimeFromDateTime } from './ScheduleCard';
import Checkbox from './Checkbox';
import { useBasic, useQuery } from '@basictech/react';
import TimelineView from './TimelineView';
import { getWeatherEmoji } from '../utils/weather';

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
  folders?: any[];
}

const AgendaEventItem: React.FC<EventItemProps> = ({ event, onCardClick, onTaskToggle, accentColor, isDarkMode, folders }) => {
  const { db } = useBasic();
  
  // Fetch linked task if this is a task event (only if taskId is not empty)
  const linkedTask = useQuery(
    () => event.taskId && event.taskId !== '' ? db.collection('tasks').get(event.taskId) : null,
    [event.taskId]
  );
  
  // Check if this is a deleted task (has snapshot in metadata, taskId is empty string)
  const taskSnapshot = event.metadata?.taskSnapshot;
  const isDeletedTask = event.type === 'task' && (!event.taskId || event.taskId === '') && !!taskSnapshot;
  
  const isCompleted = event.type === 'task' && (linkedTask?.completed || taskSnapshot?.completed || false);
  const displayTitle = event.type === 'task' && linkedTask 
    ? linkedTask.name 
    : isDeletedTask && taskSnapshot
    ? taskSnapshot.name
    : event.title;
  
  // Get folder color from task labels
  const getFolderColor = () => {
    if (event.type !== 'task' || !linkedTask?.labels || !folders) return null;
    
    const taskLabels = linkedTask.labels.split(',').map((l: string) => l.trim());
    const folderLabel = taskLabels.find((l: string) => l.startsWith('folder:'));
    
    if (!folderLabel) return null;
    
    const folderName = folderLabel.replace('folder:', '').toLowerCase();
    const folder = folders.find((f: any) => f.name === folderName);
    
    return folder?.color || null;
  };
  
  const folderColor = getFolderColor();
  
  const startTime = event.start.dateTime ? formatTime(event.start.dateTime) : '';
  const endTime = event.end.dateTime ? formatTime(event.end.dateTime) : '';
  const duration = getEventDuration(event);

  // Check if this is a completion event
  const isCompletionEvent = event.type === 'task:completed';
  
  // Check if this is a sunrise/sunset event
  const isSunEvent = event.type === 'sunrise' || event.type === 'sunset';

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    // Only allow toggling for active tasks (not deleted)
    if (event.taskId && event.taskId !== '' && onTaskToggle) {
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

  // Completion and sun event cards are compact (just one line), regular cards use calculated height
  const cardHeight = (isCompletionEvent || isSunEvent) ? 40 : calculateHeight(duration);

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
      onClick={() => !isSunEvent && onCardClick?.(event)}
      className={`group rounded-lg transition-all flex flex-col ${
        isSunEvent
          ? 'p-2 cursor-default border-0'
          : (isCompletionEvent
            ? 'p-2 cursor-default border' 
            : 'p-3 cursor-pointer border')
      } ${
        isDarkMode && !isSunEvent
          ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20' 
          : !isDarkMode && !isSunEvent
            ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
            : ''
      }`}
      style={{ 
        height: `${cardHeight}px`,
        background: isSunEvent 
          ? `linear-gradient(to right, transparent, ${event.color} 20%, ${event.color} 80%, transparent)`
          : undefined
      }}
    >
      {isSunEvent ? (
        // Minimal sunrise/sunset card - center aligned
        <div className="flex items-center justify-center gap-2 w-full">
          {event.type === 'sunrise' ? (
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M7.646 1.146a.5.5 0 0 1 .708 0l1.5 1.5a.5.5 0 0 1-.708.708L8.5 2.707V4.5a.5.5 0 0 1-1 0V2.707l-.646.647a.5.5 0 1 1-.708-.708zM2.343 4.343a.5.5 0 0 1 .707 0l1.414 1.414a.5.5 0 0 1-.707.707L2.343 5.05a.5.5 0 0 1 0-.707m11.314 0a.5.5 0 0 1 0 .707l-1.414 1.414a.5.5 0 1 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0M8 7a3 3 0 0 1 2.599 4.5H5.4A3 3 0 0 1 8 7m3.71 4.5a4 4 0 1 0-7.418 0H.499a.5.5 0 0 0 0 1h15a.5.5 0 0 0 0-1h-3.79zM0 10a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2A.5.5 0 0 1 0 10m13 0a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5"/>
            </svg>
          ) : (
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.792-.001 1.533-.16a.79.79 0 0 1 .81.316.73.73 0 0 1-.031.893A8.35 8.35 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.75.75 0 0 1 6 .278M4.858 1.311A7.27 7.27 0 0 0 1.025 7.71c0 4.02 3.279 7.276 7.319 7.276a7.32 7.32 0 0 0 5.205-2.162q-.506.063-1.029.063c-4.61 0-8.343-3.714-8.343-8.29 0-1.167.242-2.278.681-3.286"/>
              <path d="M10.794 3.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387a1.73 1.73 0 0 0-1.097 1.097l-.387 1.162a.217.217 0 0 1-.412 0l-.387-1.162A1.73 1.73 0 0 0 9.31 6.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387a1.73 1.73 0 0 0 1.097-1.097zM13.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.16 1.16 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.16 1.16 0 0 0-.732-.732l-.774-.258a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732z"/>
            </svg>
          )}
          <span className={`text-sm font-medium ${
            isDarkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>
            {event.type === 'sunrise' ? 'Sunrise' : 'Sunset'}
          </span>
        </div>
      ) : isCompletionEvent ? (
        // Compact completion card layout
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className={`text-sm font-medium truncate ${
            isDarkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>
            {displayTitle} - completed
          </span>
          <span className={`text-xs ml-auto flex-shrink-0 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-600'
          }`}>
            {startTime}
          </span>
        </div>
      ) : (
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
          style={{ 
            backgroundColor: event.color
          }}
        >
          {/* Folder color overlay with gradient */}
          {folderColor && (
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: `linear-gradient(to bottom, ${folderColor}60, ${folderColor}20)`
              }}
            />
          )}
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
            {/* Checkbox inline to the left for tasks (disabled for deleted tasks) */}
            {event.type === 'task' && (
              <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0 pt-0.5">
                <Checkbox
                  id={`agenda-checkbox-${event.id}`}
                  size="sm"
                  checked={isCompleted}
                  onChange={handleCheckboxChange}
                  accentColor={accentColor}
                  disabled={isDeletedTask}
                />
              </div>
            )}
            
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`font-medium truncate ${
              isCompleted && event.type === 'task' ? 'line-through opacity-60' : ''
            } ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {displayTitle}
                </div>
                {event.type === 'task' && duration > 0 && (
                  <span className={`text-xs flex-shrink-0 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    ({Math.round(duration)}m)
                  </span>
                )}
            </div>
          </div>

          {/* Description */}
          {event.type !== 'task' && event.description && (
            <div className={`text-sm mt-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {event.description}
            </div>
          )}
        </div>
      </div>
      )}
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
  location?: { latitude: number; longitude: number; name: string };
  onFetchWeather?: (date: Date) => Promise<void>;
  folders?: any[];
}

const AgendaView: React.FC<AgendaViewProps> = ({
  onCardClick,
  events: externalEvents,
  onTaskToggle,
  accentColor = '#1F1B2F',
  isDarkMode = true,
  viewMode = 'agenda',
  onViewModeChange,
  location,
  onFetchWeather,
  folders
}) => {
  const { db } = useBasic();
  
  // Track selected date (defaults to today)
  const [selectedDate, setSelectedDate] = useState<Date>(getStartOfDay(new Date()));

  // Filter events to only show those on the selected date (exclude weather type)
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
    
    return externalEvents.filter(event => 
      event.type !== 'weather' && isEventOnDate(event, selectedDate)
    );
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

  // Find weather event for the selected date
  const weatherEvent = useMemo(() => {
    return externalEvents?.find(event => {
      if (event.type !== 'weather' || !event.start.dateTime) return false;
      const eventDate = new Date(event.start.dateTime);
      return eventDate.toDateString() === selectedDate.toDateString();
    });
  }, [externalEvents, selectedDate]);

  // Render header component (shared between timeline and agenda views)
  const renderHeader = (isTimelineView: boolean) => (
    <div
      className={`${isTimelineView ? 'flex-shrink-0' : 'sticky top-0 z-50 -mx-6 px-6 mb-4'} py-4 ${isTimelineView ? 'px-6' : ''} border-b backdrop-blur-md`}
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
              className={`p-1.5 rounded-md bg-transparent transition-colors ${
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
              className={`p-1.5 rounded-md bg-transparent transition-colors ${
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
              className={`p-1.5 rounded-md bg-transparent transition-colors ${
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
                isTimelineView
                    ? isDarkMode
                      ? 'bg-white/20 text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                    : isDarkMode
                      ? 'bg-transparent text-gray-400 hover:text-gray-200'
                      : 'bg-transparent text-gray-500 hover:text-gray-800'
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
                !isTimelineView
                    ? isDarkMode
                      ? 'bg-white/20 text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                    : isDarkMode
                      ? 'bg-transparent text-gray-400 hover:text-gray-200'
                      : 'bg-transparent text-gray-500 hover:text-gray-800'
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
        <div className="flex items-center justify-between">
        <p className={`text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {displayDate}
        </p>
          {weatherEvent && weatherEvent.metadata?.weather && (
            <div className={`flex items-center gap-1.5 text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <span>{getWeatherEmoji(weatherEvent.metadata.weather.condition)}</span>
              <span>{weatherEvent.metadata.weather.temperature}°F</span>
            </div>
          )}
        </div>
      </div>
  );

  // If timeline mode, render TimelineView instead
  if (viewMode === 'timeline') {
    return (
      <div
        className={`w-full h-full backdrop-blur-3xl flex flex-col rounded-md ${
          isDarkMode ? 'text-gray-100' : 'text-gray-900'
        }`}
        style={{ 
          backgroundColor: getBackgroundColor(),
        }}
      >
        {renderHeader(true)}

        {/* Timeline View */}
        <div className="flex-1 overflow-hidden">
          <TimelineView
            events={sortedEvents}
            onCardClick={onCardClick}
            onTaskToggle={onTaskToggle}
            weatherData={weatherEvent}
            accentColor={accentColor}
            isDarkMode={isDarkMode}
            selectedDate={selectedDate}
          />
        </div>
      </div>
    );
  }

  // Otherwise render agenda list view
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
      {renderHeader(false)}

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
                      folders={folders}
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
                      folders={folders}
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
                      folders={folders}
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
                      folders={folders}
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

