import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import ScheduleCard, { ScheduleCardData, getEventDuration, getTimeFromDateTime, minutesToDateTime } from './ScheduleCard';
import TimelineView from './TimelineView';
import { getWeatherEmoji } from '../utils/weather';
import { Folder } from '../utils/types';
import { 
  formatDate, 
  isToday, 
  getStartOfDay, 
  getCurrentTimeInMinutes,
  getPreviousDay,
  getNextDay,
  isEventOnDate
} from '../utils/dateHelpers';

interface ScheduleSidebarProps {
  onClose?: () => void;
  onCardClick?: (cardData: ScheduleCardData) => void;
  events?: ScheduleCardData[];
  onUpdateEvent?: (id: string, changes: Partial<ScheduleCardData>) => void;
  onDeleteEvent?: (id: string) => void;
  onTaskToggle?: (taskId: string, completed: boolean) => void;
  onAddEvent?: (eventData: Omit<ScheduleCardData, 'id'>) => Promise<ScheduleCardData>;
  accentColor?: string;
  isDarkMode?: boolean;
  viewMode?: 'timeline' | 'agenda';
  onViewModeChange?: (mode: 'timeline' | 'agenda') => void;
  location?: { latitude: number; longitude: number; name: string };
  onFetchWeather?: (date: Date) => Promise<void>;
  folders?: Folder[];
}

const ScheduleSidebar: React.FC<ScheduleSidebarProps> = ({
  onCardClick,
  events: externalEvents,
  onUpdateEvent,
  onDeleteEvent,
  onTaskToggle,
  onAddEvent,
  accentColor = '#1F1B2F',
  isDarkMode = true,
  viewMode = 'timeline',
  onViewModeChange,
  location,
  onFetchWeather,
  folders
}) => {
  // Track selected date (defaults to today)
  const [selectedDate, setSelectedDate] = useState<Date>(getStartOfDay(new Date()));
  
  // Track current time for the indicator line
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(getCurrentTimeInMinutes());
  
  // Track creating new event by dragging
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [newEventStartMinutes, setNewEventStartMinutes] = useState(0);
  const [newEventDuration, setNewEventDuration] = useState(30);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const scrollableContainerRef = useRef<HTMLDivElement>(null);
  const outerScrollableRef = useRef<HTMLDivElement>(null);
  const newEventDurationRef = useRef(30);
  const dragStartYRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const hasScrolledToCurrentTimeRef = useRef(false);

  // Reset scroll flag when date changes
  useEffect(() => {
    hasScrolledToCurrentTimeRef.current = false;
  }, [selectedDate]);

  // Scroll to current time on initial load (only when viewing today)
  useEffect(() => {
    // Only scroll to current time if viewing today
    if (!isToday(selectedDate)) {
      return;
    }

    // Use a timeout to ensure DOM is fully rendered and has dimensions
    const scrollToCurrentTime = () => {
      // Use the outer scrollable container (the one that actually scrolls)
      const scrollableElement = outerScrollableRef.current;
      
      if (!scrollableElement || hasScrolledToCurrentTimeRef.current) {
        return;
      }
      
      // Check if element has dimensions
      if (scrollableElement.clientHeight === 0) {
        // If not ready, try again after a short delay
        setTimeout(scrollToCurrentTime, 50);
        return;
      }
      
      // Get the header height to account for sticky header
      const headerElement = scrollableElement.querySelector('[class*="sticky"]') as HTMLElement;
      const headerHeight = headerElement ? headerElement.offsetHeight : 0;
      
      const currentTimePos = currentTimeMinutes; // Position in pixels (1px = 1 minute)
      
      // Calculate scroll position so current time is at least 1/3 from the top of viewport
      // Account for header height: scrollTop + headerHeight + (1/3 * visibleTimelineHeight) = currentTimePos
      // Visible timeline height = viewportHeight - headerHeight
      const viewportHeight = scrollableElement.clientHeight;
      const visibleTimelineHeight = viewportHeight - headerHeight;
      const targetScrollTop = currentTimePos - headerHeight - (visibleTimelineHeight / 3);
      
      // Ensure we don't scroll to negative values
      scrollableElement.scrollTop = Math.max(0, targetScrollTop);
      hasScrolledToCurrentTimeRef.current = true;
    };
    
    // Try immediately, then with delays to ensure DOM is ready
    requestAnimationFrame(() => {
      scrollToCurrentTime();
      // Multiple fallbacks to ensure it works
      setTimeout(scrollToCurrentTime, 100);
      setTimeout(scrollToCurrentTime, 300);
    });
  }, [selectedDate]); // Only re-run when date changes, not when current time updates

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => {
      setCurrentTimeMinutes(getCurrentTimeInMinutes());
    };
    
    // Update immediately
    updateTime();
    
    // Update every minute
    const interval = setInterval(updateTime, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Filter events to only show those on the selected date (exclude weather type)
  const events = useMemo(() => {
    if (!externalEvents || externalEvents.length === 0) return [];
    
    return externalEvents.filter(event => 
      event.type !== 'weather' && isEventOnDate(event.start.dateTime, selectedDate)
    );
  }, [externalEvents, selectedDate]);

  // Generate hour slots (12 AM to 11 PM)
  const hours = useMemo(() => {
    const hourSlots = [];
    for (let i = 0; i < 24; i++) {
      const hour12 = i === 0 ? 12 : i > 12 ? i - 12 : i;
      const ampm = i < 12 ? 'AM' : 'PM';
      hourSlots.push({
        hour24: i,
        hour12,
        ampm,
        display: `${hour12}:00 ${ampm}`
      });
    }
    return hourSlots;
  }, []);

  // Convert time string to minutes from midnight
  const timeToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Convert minutes to time string
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Handle drag end
  const handleDragEnd = (id: string, newStartMinutes: number) => {
    const event = events.find(e => e.id === id);
    if (!event || !onUpdateEvent) return;
    
    const duration = getEventDuration(event);
    const baseDate = event.start.dateTime ? new Date(event.start.dateTime) : new Date();
    
    onUpdateEvent(id, {
      start: {
        ...event.start,
        dateTime: minutesToDateTime(newStartMinutes, baseDate)
      },
      end: {
        ...event.end,
        dateTime: minutesToDateTime(newStartMinutes + duration, baseDate)
      }
    });
  };

  // Handle resize end
  const handleResizeEnd = (id: string, newStartMinutes: number, newDuration: number) => {
    const event = events.find(e => e.id === id);
    if (!event || !onUpdateEvent) return;
    
    const baseDate = event.start.dateTime ? new Date(event.start.dateTime) : new Date();
    
    onUpdateEvent(id, {
      start: {
        ...event.start,
        dateTime: minutesToDateTime(newStartMinutes, baseDate)
      },
      end: {
        ...event.end,
        dateTime: minutesToDateTime(newStartMinutes + newDuration, baseDate)
      }
    });
  };

  // Handle click
  const handleCardClick = (id: string) => {
    const cardData = events.find(event => event.id === id);
    if (cardData && onCardClick) {
      onCardClick(cardData);
    }
  };

  // Handle delete
  const handleCardDelete = (id: string) => {
    if (onDeleteEvent) {
      onDeleteEvent(id);
    }
  };

  // Handle task checkbox toggle - this is now handled in ScheduleCard directly
  const handleTaskToggle = (taskId: string, completed: boolean) => {
    if (onTaskToggle) {
      onTaskToggle(taskId, completed);
    }
  };

  // Snap time to nearest interval
  const snapToInterval = (minutes: number, interval: number = 15): number => {
    return Math.round(minutes / interval) * interval;
  };

  // Handle creating new event by clicking and dragging on timeline
  const handleTimelineMouseDown = (e: React.MouseEvent) => {
    // Don't start creating if clicking on an event card
    const target = e.target as HTMLElement;
    if (target.closest('[data-schedule-card]')) {
      return;
    }
    
    if (!timelineContainerRef.current || !outerScrollableRef.current) return;

    const timelineRect = timelineContainerRef.current.getBoundingClientRect();
    
    // Don't start if clicking on hour labels (left 64px area)
    const relativeX = e.clientX - timelineRect.left;
    if (relativeX < 64) {
      return; // Clicked in hour label area
    }

    e.preventDefault();
    e.stopPropagation();

    // Calculate mouse position relative to the timeline content
    // Match ScheduleCard's exact approach: mouseY = clientY - timelineRect.top + scrollTop
    // ScheduleCard uses timelineRef.current.scrollTop where timelineRef is [data-timeline-content]
    // That element doesn't scroll, so scrollTop is 0, giving: mouseY = clientY - timelineRect.top
    // This works because the timeline container is positioned relative, and events are positioned
    // absolutely within it, so we just need the viewport-relative offset
    const mouseY = e.clientY - timelineRect.top;
    
    // Snap to 15-minute intervals
    const startMinutes = snapToInterval(Math.max(0, Math.min(1439, mouseY)));
    
    // Track initial click position (store in timeline-relative coordinates)
    dragStartYRef.current = mouseY;
    hasDraggedRef.current = false;
    
    setIsCreatingEvent(true);
    setNewEventStartMinutes(startMinutes);
    setNewEventDuration(30); // Start with default duration
    newEventDurationRef.current = 30;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!timelineContainerRef.current || !outerScrollableRef.current) return;
      
      const timelineRect = timelineContainerRef.current.getBoundingClientRect();
      // Same calculation as ScheduleCard - just use viewport-relative positions
      const currentMouseY = moveEvent.clientY - timelineRect.top;
      
      // Check if user has actually dragged (moved at least a few pixels)
      const dragDistance = Math.abs(currentMouseY - dragStartYRef.current);
      if (dragDistance > 3) {
        hasDraggedRef.current = true;
      }
      
      // Calculate duration based on drag distance (in pixels/minutes)
      // currentMouseY and startMinutes are both in minutes (1px = 1 minute)
      const duration = Math.max(15, snapToInterval(Math.max(0, currentMouseY - startMinutes)));
      const maxDuration = 1440 - startMinutes; // Don't exceed end of day
      const finalDuration = Math.min(duration, maxDuration);
      setNewEventDuration(finalDuration);
      newEventDurationRef.current = finalDuration;
    };

    const handleMouseUp = async (upEvent: MouseEvent) => {
      if (!timelineContainerRef.current) return;
      
      setIsCreatingEvent(false);
      
      // Only create event if:
      // 1. User actually dragged (not just clicked)
      // 2. Duration is at least 15 minutes
      const finalDuration = newEventDurationRef.current;
      const finalStartMinutes = startMinutes; // Use the captured startMinutes from closure
      const shouldCreate = hasDraggedRef.current && finalDuration >= 15;
      
      if (shouldCreate) {
        // Create the event with the new data structure
        const baseDate = getStartOfDay(selectedDate);
        const startDateTime = minutesToDateTime(finalStartMinutes, baseDate);
        const endDateTime = minutesToDateTime(finalStartMinutes + finalDuration, baseDate);
        
        const eventData: Omit<ScheduleCardData, 'id'> = {
          title: 'New Event',
          start: {
            dateTime: startDateTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: endDateTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          color: 'rgba(148, 163, 184, 0.08)',
          type: 'event',
          description: ''
        };
        
        // Save the event to the database and then open it in DynamicIsland
        if (onAddEvent) {
          try {
            const createdEvent = await onAddEvent(eventData);
            if (onCardClick) {
              onCardClick(createdEvent);
            }
          } catch (error) {
            console.error('Failed to create event:', error);
          }
        } else if (onCardClick) {
          // Fallback: if onAddEvent is not provided, still open the event (for backwards compatibility)
          const tempEvent: ScheduleCardData = {
            ...eventData,
            id: `temp-${Date.now()}`
          };
          onCardClick(tempEvent);
        }
      }
      
      // Reset state
      setNewEventStartMinutes(0);
      setNewEventDuration(30);
      newEventDurationRef.current = 30;
      hasDraggedRef.current = false;
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Date navigation functions
  const goToToday = () => setSelectedDate(getStartOfDay(new Date()));
  const goToPreviousDay = () => setSelectedDate(getPreviousDay(selectedDate));
  const goToNextDay = () => setSelectedDate(getNextDay(selectedDate));

  const getBackgroundColor = () => {
    return `${accentColor}E6`; // 90% opacity (E6 hex = 230/255 ≈ 90%)
  };

  const displayDate = formatDate(selectedDate);
  const isSelectedDateToday = isToday(selectedDate);

  // Find weather event for the selected date
  const weatherEvent = useMemo(() => {
    return externalEvents?.find(event => 
      event.type === 'weather' && isEventOnDate(event.start.dateTime, selectedDate)
    );
  }, [externalEvents, selectedDate]);

  // Render header component (shared between timeline and old schedule views)
  const renderHeader = (isTimeline: boolean = false) => (
    <div
      className={`${isTimeline ? 'px-5 pt-5 pb-4' : 'sticky top-0 z-50 -mx-6 px-6 py-4 mb-4 border-b backdrop-blur-md'}`}
      style={!isTimeline ? { 
        backgroundColor: getBackgroundColor(),
        borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(209, 213, 219, 0.5)'
      } : undefined}
    >
      <div className="flex items-start justify-between">
        {/* Left side - Date */}
        <div>
          <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
          </p>
          <div className="flex items-center gap-3">
            <h1 
              className={`text-4xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              {selectedDate.toLocaleDateString('en-US', { month: 'short' })} {selectedDate.getDate().toString().padStart(2, '0')}
            </h1>
            {isSelectedDateToday && (
              <span className="w-2 h-2 rounded-full bg-red-500 mt-1" />
            )}
          </div>
        </div>
        
        {/* Right side - Navigation & Toggle */}
        <div className="flex items-center gap-2">
          {/* Date navigation */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={goToPreviousDay}
              className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}
              aria-label="Previous day"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}
              aria-label="Go to today"
            >
              Today
            </button>
            <button
              onClick={goToNextDay}
              className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}
              aria-label="Next day"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* View mode toggle */}
          {onViewModeChange && (
            <div className={`flex items-center rounded-xl p-0.5 ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`}>
              <button
                onClick={() => onViewModeChange('timeline')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'timeline'
                    ? isDarkMode ? 'bg-white/20 text-white' : 'bg-white text-gray-900 shadow-sm'
                    : isDarkMode ? 'bg-transparent text-gray-400 hover:text-gray-200' : 'bg-transparent text-gray-500 hover:text-gray-800'
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
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'agenda'
                    ? isDarkMode ? 'bg-white/20 text-white' : 'bg-white text-gray-900 shadow-sm'
                    : isDarkMode ? 'bg-transparent text-gray-400 hover:text-gray-200' : 'bg-transparent text-gray-500 hover:text-gray-800'
                }`}
                aria-label="Widget view"
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
    </div>
  );

  // If timeline mode, render the new TimelineView
  if (viewMode === 'timeline') {
    return (
      <div
        className={`w-full h-full backdrop-blur-3xl flex flex-col rounded-2xl overflow-hidden ${
          isDarkMode ? 'text-gray-100' : 'text-gray-900'
        }`}
        style={{ 
          backgroundColor: getBackgroundColor(),
        }}
      >
        {renderHeader(true)}

        {/* New Timeline View */}
        <div className="flex-1 overflow-hidden">
          <TimelineView
            events={events}
            onCardClick={onCardClick}
            onTaskToggle={handleTaskToggle}
            onAddEvent={onAddEvent}
            onUpdateEvent={onUpdateEvent}
            weatherData={weatherEvent}
            accentColor={accentColor}
            isDarkMode={isDarkMode}
            selectedDate={selectedDate}
            folders={folders}
          />
        </div>
      </div>
    );
  }

  // Otherwise, render the old schedule grid view (with draggable cards)
  return (
    <div
      ref={outerScrollableRef}
      className={`w-full h-full px-6 pb-6 overflow-y-auto backdrop-blur-3xl flex flex-col rounded-2xl ${
        isDarkMode ? 'text-gray-100' : 'text-gray-900'
      }`}
      style={{ 
        backgroundColor: getBackgroundColor(),
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE/Edge
      }}
      data-timeline-container
    >
      {/* Sticky header with date navigation */}
      {renderHeader()}

      <div 
        ref={scrollableContainerRef}
        className="flex-1 relative pb-[200px] md:pb-0" 
        style={{ minHeight: '1440px' }} 
      > {/* 24 hours * 60px, 200px padding for mobile navbar */}
        {/* Timeline container */}
        <div 
          ref={timelineContainerRef}
          className="relative h-full" 
          style={{ minHeight: '1440px' }}
          onMouseDown={handleTimelineMouseDown}
          data-timeline-content
        >
          {/* Hour slots */}
          {hours.map((hourSlot, index) => (
            <div
              key={hourSlot.hour24}
              className={`relative border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-300'
              }`}
              style={{ height: '60px' }}
            >
              <div className="absolute left-0 top-0 h-full flex items-start pt-1">
                <span className={`text-xs font-medium font-mono ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`} style={{ width: '64px' }}>
                  {hourSlot.display}
                </span>
              </div>
            </div>
          ))}

          {/* Current time indicator line - only show when viewing today */}
          {isSelectedDateToday && currentTimeMinutes >= 0 && currentTimeMinutes < 1440 && (
            <div
              className="absolute left-0 right-0 z-20 pointer-events-none"
              style={{
                top: `${currentTimeMinutes}px`,
                height: '2px',
              }}
            >
              <div
                className="w-full h-full"
                style={{
                  backgroundColor: isDarkMode ? '#ef4444' : '#dc2626', // Red color for visibility
                  boxShadow: `0 0 4px ${isDarkMode ? 'rgba(239, 68, 68, 0.5)' : 'rgba(220, 38, 38, 0.5)'}`,
                }}
              />
              {/* Circle indicator on the left */}
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: isDarkMode ? '#ef4444' : '#dc2626',
                  left: '64px', // Align with timeline content
                  marginLeft: '-4px', // Center the circle on the line
                }}
              />
            </div>
          )}

          {/* Events overlay */}
          <div className="absolute inset-0 z-0">
            {events.map((event) => {
              // Extract start time and duration from the new data structure
              const startTime = event.start.dateTime ? getTimeFromDateTime(event.start.dateTime) : '00:00';
              const startMinutes = timeToMinutes(startTime);
              const height = getEventDuration(event); // Duration in minutes
              
              return (
                <div key={event.id} data-schedule-card>
                  <ScheduleCard
                    data={event}
                    startMinutes={startMinutes}
                    height={height}
                    timelineLeftOffset={64}
                    onDragEnd={handleDragEnd}
                    onResizeEnd={handleResizeEnd}
                    onClick={handleCardClick}
                    onDelete={handleCardDelete}
                    onTaskToggle={handleTaskToggle}
                    draggable={true}
                    resizable={true}
                    snapInterval={15}
                    minTime={0}
                    maxTime={1440}
                    minDuration={15}
                    maxDuration={1440}
                    accentColor={accentColor}
                    isDarkMode={isDarkMode}
                  />
                </div>
              );
            })}
            
            {/* Preview of new event being created */}
            {isCreatingEvent && (
              <div
                className="absolute rounded-md p-2 backdrop-blur-md border border-dashed opacity-60 z-50 pointer-events-none"
                style={{
                  top: `${newEventStartMinutes}px`,
                  left: '64px',
                  right: '12px',
                  height: `${newEventDuration}px`,
                  backgroundColor: 'rgba(148, 163, 184, 0.08)',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                  minHeight: '15px'
                }}
              >
                <div className={`text-sm font-medium truncate ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  New Event
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSidebar;

