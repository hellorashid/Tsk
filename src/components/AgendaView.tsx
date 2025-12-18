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

// Format time compact (12-hour, no AM/PM)
const formatTimeCompact = (dateTime: string): string => {
  const date = new Date(dateTime);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hour12}:${minutes.toString().padStart(2, '0')}`;
};

// Get greeting based on time of day
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
};

// Get weather icon based on condition
const getWeatherIcon = (condition: string): React.ReactNode => {
  const iconClass = "w-8 h-8";
  switch (condition?.toLowerCase()) {
    case 'clear':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      );
    case 'partly cloudy':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2v1M12 21v1M4.22 4.22l.71.71M18.36 18.36l.71.71M2 12h1M21 12h1M4.22 19.78l.71-.71M18.36 5.64l.71-.71" 
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
          <circle cx="10" cy="8" r="3" opacity="0.7" />
          <path d="M18 15h.5a3.5 3.5 0 000-7h-.02a5.5 5.5 0 00-10.78 1.38A3 3 0 008 15h10z" />
        </svg>
      );
    case 'cloudy':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 15h.5a3.5 3.5 0 000-7h-.02a5.5 5.5 0 00-10.78 1.38A3 3 0 008 15h10z" />
        </svg>
      );
    case 'rainy':
    case 'showers':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 12h.5a3.5 3.5 0 000-7h-.02a5.5 5.5 0 00-10.78 1.38A3 3 0 008 12h10z" />
          <path d="M8 15l-1 3M12 15l-1 3M16 15l-1 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      );
    case 'snowy':
    case 'snow showers':
  return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 10h.5a3.5 3.5 0 000-7h-.02a5.5 5.5 0 00-10.78 1.38A3 3 0 008 10h10z" />
          <circle cx="8" cy="15" r="1" /><circle cx="12" cy="14" r="1" /><circle cx="16" cy="15" r="1" />
          <circle cx="10" cy="18" r="1" /><circle cx="14" cy="18" r="1" />
            </svg>
      );
    case 'thunderstorm':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 10h.5a3.5 3.5 0 000-7h-.02a5.5 5.5 0 00-10.78 1.38A3 3 0 008 10h10z" />
          <path d="M13 12l-2 4h3l-2 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
      );
    default:
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 15h.5a3.5 3.5 0 000-7h-.02a5.5 5.5 0 00-10.78 1.38A3 3 0 008 15h10z" />
          </svg>
      );
  }
};

// Schedule Item Row Component - fetches linked task for completion status
interface ScheduleItemRowProps {
  event: ScheduleCardData;
  index: number;
  totalItems: number;
  isCurrentEvent: boolean;
  isDarkMode: boolean;
  onCardClick?: (cardData: ScheduleCardData) => void;
  getEventDotColor: (event: ScheduleCardData) => string;
}

const ScheduleItemRow: React.FC<ScheduleItemRowProps> = ({
  event,
  index,
  totalItems,
  isCurrentEvent,
  isDarkMode,
  onCardClick,
  getEventDotColor
}) => {
  const { db } = useBasic();
  
  // Fetch linked task if this is a task event
  const linkedTask = useQuery(
    () => event.taskId && event.taskId !== '' ? db.collection('tasks').get(event.taskId) : null,
    [event.taskId]
  );
  
  const isTask = event.type === 'task';
  const isCompleted = isTask && linkedTask?.completed;
  const displayTitle = isTask && linkedTask ? linkedTask.name : event.title;
  const isFirst = index === 0;
  const isLast = index === totalItems - 1;

  return (
    <div
      className={`flex items-stretch gap-3 py-0 px-2 -mx-2 rounded-lg cursor-pointer transition-colors ${
        isCurrentEvent 
          ? isDarkMode ? 'bg-white/10' : 'bg-gray-100'
          : isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'
      }`}
      onClick={() => onCardClick?.(event)}
    >
      {/* Time */}
      <span className={`text-xs font-mono w-10 flex-shrink-0 py-2 ${
        isCompleted ? 'opacity-50' : ''
      } ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        {event.start.dateTime ? formatTimeCompact(event.start.dateTime) : '--:--'}
      </span>
      
      {/* Timeline indicator - continuous line */}
      <div className="flex flex-col items-center w-5 flex-shrink-0">
        {/* Top line segment */}
        <div 
          className={`w-0.5 flex-1 ${isFirst ? 'bg-transparent' : (isDarkMode ? 'bg-white/20' : 'bg-gray-300')}`}
        />
        
        {/* Icon */}
        <div className="flex-shrink-0 my-0.5">
          {isTask ? (
            isCompleted ? (
              <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
              </div>
            ) : (
              <div className={`w-4 h-4 rounded-full border-2 ${
                isDarkMode ? 'border-emerald-500 bg-[#1a1625]' : 'border-emerald-500 bg-white'
              }`} />
            )
          ) : (
            <div className="w-4 h-4 rounded bg-amber-500/30 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            </div>
          )}
        </div>

        {/* Bottom line segment */}
        <div 
          className={`w-0.5 flex-1 ${isLast ? 'bg-transparent' : (isDarkMode ? 'bg-white/20' : 'bg-gray-300')}`}
        />
        </div>

        {/* Content */}
      <div className="flex-1 min-w-0 flex items-center py-2">
        <p className={`text-sm font-medium truncate ${
          isCompleted 
            ? 'line-through opacity-50' 
            : ''
        } ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {displayTitle}
        </p>
      </div>
                </div>
  );
};

// Task Progress Component - fetches all scheduled tasks to compute completion stats
interface TaskProgressProps {
  taskIds: string[];
  isDarkMode: boolean;
}

// Radial Progress Circle Component
const RadialProgress: React.FC<{ 
  progress: number; 
  size?: number; 
  strokeWidth?: number;
  isComplete?: boolean;
  isDarkMode: boolean;
}> = ({ progress, size = 56, strokeWidth = 4, isComplete = false, isDarkMode }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isComplete ? '#22c55e' : '#3b82f6'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isComplete ? (
          <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </div>
  );
};

const TaskProgress: React.FC<TaskProgressProps> = ({ taskIds, isDarkMode }) => {
  const { db } = useBasic();
  
  // Fetch all tasks
  const allTasks = useQuery(() => db.collection('tasks').getAll(), []);
  
  // Compute stats
  const stats = useMemo(() => {
    if (!allTasks || taskIds.length === 0) {
      return { total: 0, completed: 0 };
    }
    
    const scheduledTasks = allTasks.filter((t: any) => taskIds.includes(t.id));
    const completedCount = scheduledTasks.filter((t: any) => t.completed).length;
    
    return {
      total: scheduledTasks.length,
      completed: completedCount
    };
  }, [allTasks, taskIds]);

  if (stats.total === 0) return null;

  const isAllComplete = stats.completed === stats.total;
  const progressPercent = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <div className={`rounded-2xl p-4 border transition-colors ${
      isDarkMode 
        ? 'bg-white/5 hover:bg-white/8 border-white/10' 
        : 'bg-white/80 hover:bg-white/90 border-gray-200'
    }`}>
      <div className="flex items-center gap-4">
        <RadialProgress 
          progress={progressPercent} 
          isComplete={isAllComplete}
          isDarkMode={isDarkMode}
        />
        <div className="flex-1">
          <p className={`text-xs uppercase tracking-wider mb-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {isAllComplete ? 'All Done!' : 'Tasks Today'}
          </p>
          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {stats.completed}<span className={`text-base font-normal ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>/{stats.total}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

// Helper to get task count summary for welcome message
interface TaskCountSummaryProps {
  taskIds: string[];
  eventCount: number;
  isDarkMode: boolean;
}

const TaskCountSummary: React.FC<TaskCountSummaryProps> = ({ taskIds, eventCount, isDarkMode }) => {
  const { db } = useBasic();
  const allTasks = useQuery(() => db.collection('tasks').getAll(), []);
  
  const stats = useMemo(() => {
    if (!allTasks || taskIds.length === 0) {
      return { total: 0, completed: 0, pending: 0 };
    }
    
    const scheduledTasks = allTasks.filter((t: any) => taskIds.includes(t.id));
    const completedCount = scheduledTasks.filter((t: any) => t.completed).length;
    
    return {
      total: scheduledTasks.length,
      completed: completedCount,
      pending: scheduledTasks.length - completedCount
    };
  }, [allTasks, taskIds]);

  if (stats.total === 0 && eventCount === 0) {
    return <span>Your day is clear — enjoy the peace! ✨</span>;
  }

  return (
    <>
      You have{' '}
      {stats.pending > 0 && (
        <>
          <span className="font-semibold text-emerald-400">
            {stats.pending} task{stats.pending !== 1 ? 's' : ''}
          </span>
          {eventCount > 0 && ' and '}
        </>
      )}
      {eventCount > 0 && (
        <span className="font-semibold text-blue-400">
          {eventCount} event{eventCount !== 1 ? 's' : ''}
        </span>
      )}
      {stats.pending === 0 && eventCount === 0 && stats.completed > 0 && (
        <span className="font-semibold text-emerald-400">completed all {stats.completed} tasks</span>
      )}
      {' '}today. Have a lovely day 💫
    </>
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

  const isSelectedDateToday = isToday(selectedDate);

  // Find weather event for the selected date
  const weatherEvent = useMemo(() => {
    return externalEvents?.find(event => {
      if (event.type !== 'weather' || !event.start.dateTime) return false;
      const eventDate = new Date(event.start.dateTime);
      return eventDate.toDateString() === selectedDate.toDateString();
    });
  }, [externalEvents, selectedDate]);

  // Count events (tasks counted separately with completion status)
  const eventCount = useMemo(() => {
    return sortedEvents.filter(e => e.type === 'event' || e.type === 'other').length;
  }, [sortedEvents]);

  // Get task IDs scheduled for this day
  const scheduledTaskIds = useMemo(() => {
    return sortedEvents
      .filter(e => e.type === 'task' && e.taskId)
      .map(e => e.taskId as string);
  }, [sortedEvents]);

  // Get next upcoming event (that hasn't started yet)
  const upNextEvent = useMemo(() => {
    const now = new Date();
    return sortedEvents.find(event => {
      if (!event.start.dateTime) return false;
      // Exclude sunrise/sunset and weather events
      if (event.type === 'sunrise' || event.type === 'sunset' || event.type === 'weather') return false;
      const eventStart = new Date(event.start.dateTime);
      return eventStart > now;
    });
  }, [sortedEvents]);

  // Get currently happening event
  const currentEvent = useMemo(() => {
    const now = new Date();
    return sortedEvents.find(event => {
      if (!event.start.dateTime || !event.end.dateTime) return false;
      if (event.type === 'sunrise' || event.type === 'sunset' || event.type === 'weather') return false;
      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);
      return now >= eventStart && now <= eventEnd;
    });
  }, [sortedEvents]);

  // Filter schedule events (exclude sunrise/sunset for the schedule list)
  const scheduleItems = useMemo(() => {
    return sortedEvents.filter(event => 
      event.type !== 'sunrise' && 
      event.type !== 'sunset' && 
      event.type !== 'weather' &&
      event.type !== 'task:completed'
    );
  }, [sortedEvents]);

  // Get color dot for event
  const getEventDotColor = (event: ScheduleCardData): string => {
    if (event.type === 'task') return '#22c55e'; // green for tasks
    if (event.color) return event.color;
    return '#f59e0b'; // amber for events
  };

  const cardBg = isDarkMode 
    ? 'bg-white/5 hover:bg-white/8' 
    : 'bg-white/80 hover:bg-white/90';
  
  const cardBorder = isDarkMode 
    ? 'border-white/10' 
    : 'border-gray-200';

  // If timeline mode, render TimelineView instead
  if (viewMode === 'timeline') {
    return (
      <div
        className={`w-full h-full backdrop-blur-3xl flex flex-col rounded-2xl ${
          isDarkMode ? 'text-gray-100' : 'text-gray-900'
        }`}
        style={{ 
          backgroundColor: `${accentColor}E6`,
        }}
      >
        {/* Compact Header for Timeline */}
        <div className="flex-shrink-0 px-5 py-4 border-b backdrop-blur-md"
          style={{ 
            borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
              </p>
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </h2>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Date navigation */}
              <div className="flex items-center gap-1">
            <button
              onClick={goToPreviousDay}
                  className={`p-1.5 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-white/10 text-gray-300' 
                  : 'hover:bg-gray-200 text-gray-700'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={goToToday}
                  className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-white/10 text-gray-300' 
                  : 'hover:bg-gray-200 text-gray-700'
              }`}
            >
                  Today
            </button>
            <button
              onClick={goToNextDay}
                  className={`p-1.5 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-white/10 text-gray-300' 
                  : 'hover:bg-gray-200 text-gray-700'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

              {/* View mode toggle */}
          {onViewModeChange && (
            <div className={`flex items-center rounded-lg p-0.5 ${
              isDarkMode ? 'bg-white/10' : 'bg-gray-200'
            }`}>
              <button
                onClick={() => onViewModeChange('timeline')}
                className={`p-1.5 rounded-md transition-all ${
                      isDarkMode
                      ? 'bg-white/20 text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => onViewModeChange('agenda')}
                className={`p-1.5 rounded-md transition-all ${
                      isDarkMode
                      ? 'bg-transparent text-gray-400 hover:text-gray-200'
                      : 'bg-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          )}
        </div>
            </div>
        </div>

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

  // Widget-based Agenda View
  return (
    <div
      className={`w-full h-full overflow-y-auto backdrop-blur-3xl flex flex-col rounded-2xl ${
        isDarkMode ? 'text-gray-100' : 'text-gray-900'
      }`}
      style={{ 
        backgroundColor: `${accentColor}E6`,
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <div className="p-5 pb-32 md:pb-8 space-y-4">
        {/* Header Row - Date & Navigation */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
            </p>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                {selectedDate.toLocaleDateString('en-US', { month: 'short' })} {selectedDate.getDate().toString().padStart(2, '0')}
              </h1>
              {isSelectedDateToday && (
                <span className="w-2 h-2 rounded-full bg-red-500 mt-1"></span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Date navigation */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={goToPreviousDay}
                className={`p-2 rounded-xl transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-white/10 text-gray-300' 
                    : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={goToToday}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-white/10 text-gray-300' 
                    : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                Today
              </button>
              <button
                onClick={goToNextDay}
                className={`p-2 rounded-xl transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-white/10 text-gray-300' 
                    : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {/* View mode toggle */}
            {onViewModeChange && (
              <div className={`flex items-center rounded-xl p-0.5 ${
                isDarkMode ? 'bg-white/10' : 'bg-gray-200'
              }`}>
                <button
                  onClick={() => onViewModeChange('timeline')}
                  className={`p-2 rounded-lg transition-all ${
                    isDarkMode
                      ? 'bg-transparent text-gray-400 hover:text-gray-200'
                      : 'bg-transparent text-gray-500 hover:text-gray-800'
                  }`}
                  title="Timeline view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => onViewModeChange('agenda')}
                  className={`p-2 rounded-lg transition-all ${
                    isDarkMode
                      ? 'bg-white/20 text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                  }`}
                  title="Widget view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>
            )}
                </div>
              </div>

        {/* Welcome Widget */}
        <div className={`rounded-2xl p-5 border transition-colors ${cardBg} ${cardBorder}`}>
          <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{getGreeting()}.</span>
            {' '}
            <TaskCountSummary taskIds={scheduledTaskIds} eventCount={eventCount} isDarkMode={isDarkMode} />
          </p>
        </div>

        {/* Widget Grid - Weather & Up Next */}
        <div className="grid grid-cols-2 gap-3">
          {/* Weather Widget */}
          <div className={`rounded-2xl p-4 border transition-colors ${cardBg} ${cardBorder}`}>
            <div className="flex items-start justify-between mb-2">
              <div className={`${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}>
                {weatherEvent?.metadata?.weather ? (
                  getWeatherIcon(weatherEvent.metadata.weather.condition)
                ) : (
                  <svg className="w-8 h-8 opacity-50" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 15h.5a3.5 3.5 0 000-7h-.02a5.5 5.5 0 00-10.78 1.38A3 3 0 008 15h10z" />
                  </svg>
                )}
              </div>
              {weatherEvent?.metadata?.weather && (
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isDarkMode ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-600'
                }`}>
                  Now
                </span>
              )}
            </div>
            
            {weatherEvent?.metadata?.weather ? (
              <>
                <div className="flex items-baseline gap-2 mb-1">
                  <p className="text-3xl font-bold">
                    {weatherEvent.metadata.weather.temperature}°
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {weatherEvent.metadata.weather.condition}
                  </p>
                </div>
                
                {/* Sunrise/Sunset */}
                {(weatherEvent.metadata.weather.sunrise || weatherEvent.metadata.weather.sunset) && (
                  <div className={`flex items-center gap-3 mt-2 pt-2 border-t ${
                    isDarkMode ? 'border-white/10' : 'border-gray-200'
                  }`}>
                    {weatherEvent.metadata.weather.sunrise && (
                      <div className="flex items-center gap-1">
                        <svg className={`w-3.5 h-3.5 ${isDarkMode ? 'text-orange-400' : 'text-orange-500'}`} viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2v3M4.22 10.22l2.12 2.12M1 18h4M19 18h4M19.78 10.22l-2.12 2.12M12 7a5 5 0 015 5v1H7v-1a5 5 0 015-5z"/>
                          <path d="M3 21h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatTimeCompact(weatherEvent.metadata.weather.sunrise)}
                        </span>
                      </div>
                    )}
                    {weatherEvent.metadata.weather.sunset && (
                      <div className="flex items-center gap-1">
                        <svg className={`w-3.5 h-3.5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`} viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 10v3M4.22 10.22l2.12 2.12M1 18h4M19 18h4M19.78 10.22l-2.12 2.12M12 7a5 5 0 015 5v1H7v-1a5 5 0 015-5z"/>
                          <path d="M12 2l2 3h-4l2-3z"/>
                          <path d="M3 21h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatTimeCompact(weatherEvent.metadata.weather.sunset)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-3xl font-bold mb-0.5 opacity-50">--°</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  No weather data
                </p>
              </>
            )}
          </div>

          {/* Up Next Widget */}
          <div 
            className={`rounded-2xl p-4 border transition-colors cursor-pointer ${cardBg} ${cardBorder}`}
            onClick={() => (currentEvent || upNextEvent) && onCardClick?.(currentEvent || upNextEvent!)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`${isDarkMode ? 'text-orange-400' : 'text-orange-500'}`}>
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              {currentEvent ? (
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                  Now
                </span>
              ) : upNextEvent && (
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isDarkMode ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-600'
                }`}>
                  Next
                </span>
              )}
            </div>
            
            {currentEvent ? (
              <>
                <p className={`text-sm font-semibold truncate mb-0.5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {currentEvent.title}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Until {currentEvent.end.dateTime ? formatTime(currentEvent.end.dateTime) : '--'}
                </p>
              </>
            ) : upNextEvent ? (
              <>
                <p className={`text-sm font-semibold truncate mb-0.5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {upNextEvent.title}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {upNextEvent.start.dateTime ? formatTime(upNextEvent.start.dateTime) : '--'}
                </p>
              </>
            ) : (
              <>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  All clear!
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Nothing scheduled
                </p>
              </>
            )}
          </div>
        </div>

        {/* Today's Schedule Widget */}
        <div className={`rounded-2xl p-5 border transition-colors ${cardBg} ${cardBorder}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Today's Plan
            </h3>
            <span className={`text-xs px-2 py-1 rounded-full ${
              isDarkMode ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-600'
            }`}>
              {scheduleItems.length} item{scheduleItems.length !== 1 ? 's' : ''}
            </span>
          </div>

          {scheduleItems.length === 0 ? (
            <div className={`text-center py-6 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Nothing scheduled</p>
            </div>
          ) : (
            <div>
              {scheduleItems.map((event, index) => (
                <ScheduleItemRow 
                      key={event.id} 
                      event={event}
                  index={index}
                  totalItems={scheduleItems.length}
                  isCurrentEvent={currentEvent?.id === event.id}
                  isDarkMode={isDarkMode}
                      onCardClick={onCardClick}
                  getEventDotColor={getEventDotColor}
                    />
                  ))}
                </div>
          )}
              </div>

        {/* Task Progress Widget */}
        <TaskProgress taskIds={scheduledTaskIds} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

export default AgendaView;
