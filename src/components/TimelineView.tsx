import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ScheduleCardData, getEventDuration } from './ScheduleCard';
import { useBasic, useQuery } from '@basictech/react';
import Checkbox from './Checkbox';

interface TimelineSegment {
  startMinutes: number;
  endMinutes: number;
  color: string;
  colorEnd?: string; // For gradient
  type: 'morning' | 'afternoon' | 'evening' | 'night' | 'day' | 'busy' | 'free';
}

interface TimelineViewProps {
  events: ScheduleCardData[];
  onCardClick?: (cardData: ScheduleCardData) => void;
  onTaskToggle?: (taskId: string, completed: boolean) => void;
  onAddEvent?: (eventData: Omit<ScheduleCardData, 'id'>) => Promise<ScheduleCardData>;
  onUpdateEvent?: (id: string, changes: Partial<ScheduleCardData>) => void;
  weatherData?: ScheduleCardData | null;
  accentColor?: string;
  isDarkMode?: boolean;
  selectedDate: Date;
  folders?: any[];
}

// Zoom levels in pixels per hour
const ZOOM_LEVELS = [60, 90, 120, 180];
const DEFAULT_ZOOM_INDEX = 0; // 60 pixels per hour (2 hour view)

const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  onCardClick,
  onTaskToggle,
  onAddEvent,
  onUpdateEvent,
  weatherData,
  accentColor = '#1F1B2F',
  isDarkMode = true,
  selectedDate,
  folders
}) => {
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartMinutes, setDragStartMinutes] = useState<number | null>(null);
  const [dragEndMinutes, setDragEndMinutes] = useState<number | null>(null);
  const dragStartRef = useRef<number | null>(null);
  const dragEndRef = useRef<number | null>(null);
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null);
  const [draggedEventOffset, setDraggedEventOffset] = useState<number>(0);
  const expectedPositionRef = useRef<{ eventId: string; startMinutes: number } | null>(null);
  const timelineContentRef = useRef<HTMLDivElement>(null);
  const timelineBarRef = useRef<HTMLDivElement>(null);
  const [activityHoverY, setActivityHoverY] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [isTimelineHovered, setIsTimelineHovered] = useState(false);
  
  const pixelsPerHour = ZOOM_LEVELS[zoomIndex];
  const pixelsPerMinute = pixelsPerHour / 60;

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    };
    
    // Update every minute
    const interval = setInterval(updateTime, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Show entire day (24 hours)
  const timeRange = useMemo(() => {
    return {
      startMinutes: 0,        // 12:00 AM
      endMinutes: 24 * 60,    // 11:59 PM (1440 minutes)
    };
  }, []);

  const totalMinutes = timeRange.endMinutes - timeRange.startMinutes;
  const timelineHeight = totalMinutes * pixelsPerMinute;

  // Generate time labels based on zoom level
  const timeLabels = useMemo(() => {
    const labels: { minutes: number; label: string; isMajor: boolean }[] = [];
    
    // Determine interval based on zoom level
    let interval: number;
    if (pixelsPerHour >= 180) {
      interval = 15; // Every 15 minutes
    } else if (pixelsPerHour >= 120) {
      interval = 30; // Every 30 minutes
    } else {
      interval = 60; // Every hour
    }

    for (let minutes = timeRange.startMinutes; minutes <= timeRange.endMinutes; minutes += interval) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const isMajor = mins === 0; // Hour marks are major
      
      // Format time label
      let label: string;
      if (isMajor) {
        const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        label = `${hour12} —`;
      } else {
        const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        label = `${mins}`;
      }
      
      labels.push({ minutes, label, isMajor });
    }

    return labels;
  }, [timeRange, pixelsPerHour]);

  // Generate timeline segments (extend beyond visible range for padding)
  const segments = useMemo((): TimelineSegment[] => {
    const segs: TimelineSegment[] = [];
    
    // Get sunrise/sunset times from weather data if available
    let sunriseMinutes = 6 * 60; // Default 6 AM
    let sunsetMinutes = 18 * 60; // Default 6 PM
    
    if (weatherData && weatherData.metadata?.weather) {
      const sunriseDate = new Date(weatherData.metadata.weather.sunrise);
      const sunsetDate = new Date(weatherData.metadata.weather.sunset);
      sunriseMinutes = sunriseDate.getHours() * 60 + sunriseDate.getMinutes();
      sunsetMinutes = sunsetDate.getHours() * 60 + sunsetDate.getMinutes();
    }
    
    // Three segments with gradients
    const periods = [
      { 
        start: 0, 
        end: sunriseMinutes, 
        type: 'night' as const, 
        color: isDarkMode ? 'rgba(100, 100, 150, 0.3)' : 'rgba(150, 150, 200, 0.2)',
        colorEnd: isDarkMode ? 'rgba(255, 200, 100, 0.2)' : 'rgba(255, 220, 150, 0.3)'
      },
      { 
        start: sunriseMinutes, 
        end: sunsetMinutes, 
        type: 'day' as const, 
        color: isDarkMode ? 'rgba(255, 200, 100, 0.2)' : 'rgba(255, 220, 150, 0.3)',
        colorEnd: isDarkMode ? 'rgba(255, 150, 100, 0.2)' : 'rgba(255, 180, 120, 0.3)'
      },
      { 
        start: sunsetMinutes, 
        end: 24 * 60, 
        type: 'evening' as const, 
        color: isDarkMode ? 'rgba(255, 150, 100, 0.2)' : 'rgba(255, 180, 120, 0.3)',
        colorEnd: isDarkMode ? 'rgba(100, 100, 150, 0.3)' : 'rgba(150, 150, 200, 0.2)'
      },
    ];

    periods.forEach(period => {
      const startMinutes = Math.max(period.start, timeRange.startMinutes);
      const endMinutes = Math.min(period.end, timeRange.endMinutes);
      
      if (startMinutes < endMinutes) {
        segs.push({
          startMinutes,
          endMinutes,
          color: period.color,
          colorEnd: period.colorEnd,
          type: period.type,
        });
      }
    });

    return segs;
  }, [timeRange, isDarkMode, pixelsPerMinute, weatherData]);

  // Zoom controls
  const handleZoomIn = () => {
    if (zoomIndex < ZOOM_LEVELS.length - 1) {
      setZoomIndex(zoomIndex + 1);
    }
  };

  const handleZoomOut = () => {
    if (zoomIndex > 0) {
      setZoomIndex(zoomIndex - 1);
    }
  };

  // Overlap detection and positioning
  const positionedEvents = useMemo(() => {
    if (events.length === 0) return [];

    // Convert events to positioned format with start/end in minutes
    const eventData = events.map(event => {
      const startDate = new Date(event.start.dateTime || '');
      const endDate = new Date(event.end.dateTime || '');
      const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
      const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
      const duration = getEventDuration(event);
      
      return {
        event,
        startMinutes,
        endMinutes,
        duration,
        column: 0,
        totalColumns: 1,
      };
    });

    // Sort by start time, then by duration (longer events first)
    eventData.sort((a, b) => {
      if (a.startMinutes !== b.startMinutes) {
        return a.startMinutes - b.startMinutes;
      }
      return b.duration - a.duration;
    });

    // Detect overlaps and assign columns
    const checkOverlap = (a: typeof eventData[0], b: typeof eventData[0]) => {
      return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
    };

    // Group overlapping events
    type EventItem = typeof eventData[0];
    const groups: EventItem[][] = [];
    eventData.forEach(event => {
      // Find a group this event overlaps with
      let foundGroup = false;
      for (const group of groups) {
        if (group.some(e => checkOverlap(e, event))) {
          group.push(event);
          foundGroup = true;
          break;
        }
      }
      if (!foundGroup) {
        groups.push([event]);
      }
    });

    // Assign columns within each group
    groups.forEach(group => {
      if (group.length === 1) {
        group[0].column = 0;
        group[0].totalColumns = 1;
        return;
      }

      // Sort group by start time
      group.sort((a, b) => a.startMinutes - b.startMinutes);

      // Assign columns using a greedy algorithm
      const columns: EventItem[][] = [[]];
      
      group.forEach(event => {
        // Find the first column where this event doesn't overlap with any existing event
        let placed = false;
        for (let i = 0; i < columns.length; i++) {
          const column = columns[i];
          const hasOverlap = column.some(e => checkOverlap(e, event));
          
          if (!hasOverlap) {
            column.push(event);
            event.column = i;
            placed = true;
            break;
          }
        }
        
        // If no column works, create a new one
        if (!placed) {
          columns.push([event]);
          event.column = columns.length - 1;
        }
      });

      // Set total columns for all events in the group
      const totalColumns = columns.length;
      group.forEach(event => {
        event.totalColumns = totalColumns;
      });
    });

    return eventData;
  }, [events]);

  // Check if viewing today
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  // Clear drag state when the event's position matches the expected position
  useEffect(() => {
    if (draggingEventId && expectedPositionRef.current) {
      const draggedEvent = positionedEvents.find(e => e.event.id === draggingEventId);
      
      if (draggedEvent) {
        const expected = expectedPositionRef.current;
        // Check if the event's position now matches where we dragged it (within 1 minute tolerance)
        if (Math.abs(draggedEvent.startMinutes - expected.startMinutes) <= 1) {
          // Position is updated, clear drag state
          setDraggingEventId(null);
          setDraggedEventOffset(0);
          expectedPositionRef.current = null;
        }
      }
    }
  }, [positionedEvents, draggingEventId]);

  // Handle dragging existing events
  const handleEventMouseDown = (e: React.MouseEvent, event: ScheduleCardData, startMinutes: number, duration: number) => {
    e.stopPropagation();
    
    const timelineContent = timelineContentRef.current;
    if (!timelineContent) return;

    const initialMouseY = e.clientY;
    let hasMoved = false;
    let currentOffset = 0;
    const MOVE_THRESHOLD = 5; // pixels

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dragDistance = Math.abs(moveEvent.clientY - initialMouseY);
      
      if (!hasMoved && dragDistance > MOVE_THRESHOLD) {
        hasMoved = true;
        setDraggingEventId(event.id);
      }

      if (!hasMoved) return;

      const currentY = moveEvent.clientY;
      const deltaY = currentY - initialMouseY;
      const deltaMinutes = deltaY / pixelsPerMinute;
      
      // Snap to 15-minute intervals
      const snappedDelta = Math.round(deltaMinutes / 15) * 15;
      currentOffset = snappedDelta;
      setDraggedEventOffset(snappedDelta);
    };

    const handleMouseUp = async () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      if (hasMoved && currentOffset !== 0 && onUpdateEvent) {
        const newStartMinutes = startMinutes + currentOffset;
        
        // Clamp to valid range
        const clampedStartMinutes = Math.max(
          timeRange.startMinutes,
          Math.min(timeRange.endMinutes - duration, newStartMinutes)
        );

        // Update event times
        const baseDate = new Date(selectedDate);
        baseDate.setHours(0, 0, 0, 0);
        
        const startDate = new Date(baseDate);
        startDate.setMinutes(clampedStartMinutes);
        
        const endDate = new Date(baseDate);
        endDate.setMinutes(clampedStartMinutes + duration);

        // Store expected position for useEffect to clear drag state when data updates
        expectedPositionRef.current = {
          eventId: event.id,
          startMinutes: clampedStartMinutes
        };

        // Update the database
        await onUpdateEvent(event.id, {
          start: {
            ...event.start,
            dateTime: startDate.toISOString()
          },
          end: {
            ...event.end,
            dateTime: endDate.toISOString()
          }
        });
        
        // The useEffect will clear drag state when the event position updates
      } else {
        // No update needed, clear immediately
        setDraggingEventId(null);
        setDraggedEventOffset(0);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle click and drag to create events
  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't start drag if clicking on an existing event card
    if ((e.target as HTMLElement).closest('[data-event-card]')) {
      return;
    }

    const timelineContent = timelineContentRef.current;
    if (!timelineContent) return;

    const rect = timelineContent.getBoundingClientRect();
    const mouseY = e.clientY - rect.top + timelineContent.scrollTop;
    const adjustedY = mouseY - 32; // Subtract py-8 offset

    // Calculate time and snap to 15-minute intervals
    const rawMinutes = (adjustedY / pixelsPerMinute) + timeRange.startMinutes;
    const snappedMinutes = Math.round(rawMinutes / 15) * 15;
    const clampedMinutes = Math.max(timeRange.startMinutes, Math.min(timeRange.endMinutes - 15, snappedMinutes));

    // Track initial mouse position to detect actual drag vs click
    const initialMouseY = e.clientY;
    let hasDragged = false;
    const DRAG_THRESHOLD = 10; // pixels

    setDragStartMinutes(clampedMinutes);
    setDragEndMinutes(clampedMinutes + 30); // Minimum 30 minutes
    dragStartRef.current = clampedMinutes;
    dragEndRef.current = clampedMinutes + 30;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!timelineContent) return;

      // Check if user has dragged beyond threshold
      const dragDistance = Math.abs(moveEvent.clientY - initialMouseY);
      if (!hasDragged && dragDistance > DRAG_THRESHOLD) {
        hasDragged = true;
        setIsDragging(true);
      }

      // Only show preview if actually dragging
      if (!hasDragged) return;

      const rect = timelineContent.getBoundingClientRect();
      const currentY = moveEvent.clientY - rect.top + timelineContent.scrollTop;
      const adjustedCurrentY = currentY - 32;

      const currentRawMinutes = (adjustedCurrentY / pixelsPerMinute) + timeRange.startMinutes;
      const currentSnapped = Math.round(currentRawMinutes / 15) * 15;
      const currentClamped = Math.max(timeRange.startMinutes, Math.min(timeRange.endMinutes, currentSnapped));

      // Update end time based on drag direction
      if (currentClamped > clampedMinutes) {
        const newEndMinutes = Math.max(currentClamped, clampedMinutes + 15);
        setDragEndMinutes(newEndMinutes);
        dragEndRef.current = newEndMinutes;
      }
    };

    const handleMouseUp = async () => {
      // Use ref values which are always current
      const capturedStartMinutes = dragStartRef.current;
      const capturedEndMinutes = dragEndRef.current;
      
      setIsDragging(false);
      setDragStartMinutes(null);
      setDragEndMinutes(null);
      dragStartRef.current = null;
      dragEndRef.current = null;
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Only create event if user actually dragged (not just clicked)
      if (!hasDragged) {
        return;
      }
      
      // Create event after cleanup
      if (capturedStartMinutes !== null && capturedEndMinutes !== null) {
        const duration = capturedEndMinutes - capturedStartMinutes;
        
        // Only create if duration is at least 15 minutes
        if (duration >= 15) {
          const baseDate = new Date(selectedDate);
          baseDate.setHours(0, 0, 0, 0);
          
          const startDate = new Date(baseDate);
          startDate.setMinutes(capturedStartMinutes);
          
          const endDate = new Date(baseDate);
          endDate.setMinutes(capturedEndMinutes);
          
          const eventData: Omit<ScheduleCardData, 'id'> = {
            title: 'New Event',
            start: {
              dateTime: startDate.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
              dateTime: endDate.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            color: 'rgba(148, 163, 184, 0.08)',
            type: 'event',
            description: ''
          };
          
          // If onAddEvent exists, create the event in the database first
          if (onAddEvent) {
            try {
              const createdEvent = await onAddEvent(eventData);
              // Then open the modal with the created event
              if (onCardClick) {
                onCardClick(createdEvent);
              }
            } catch (error) {
              console.error('Failed to create event:', error);
            }
          } else if (onCardClick) {
            // Fallback: just open modal with temp event
            const tempEvent: ScheduleCardData = {
              ...eventData,
              id: `temp-${Date.now()}`
            };
            onCardClick(tempEvent);
          }
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Auto-scroll to current time on mount (if viewing today)
  useEffect(() => {
    if (isToday && timelineContentRef.current) {
      const scrollPosition = (currentTimeMinutes - timeRange.startMinutes) * pixelsPerMinute - 200; // Offset for visibility
      
      timelineContentRef.current.scrollTo({
        top: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    }
  }, [selectedDate, isToday, timeRange.startMinutes, pixelsPerMinute]); // Don't include currentTimeMinutes to avoid scrolling every minute

  return (
    <div className="flex flex-col h-full relative">
      {/* Zoom Controls - bottom right with transparency */}
      <div className={`absolute bottom-4 right-4 z-20 flex items-center gap-1 rounded-lg p-0.5 opacity-30 hover:opacity-100 transition-opacity duration-300 ${
        isDarkMode ? 'bg-white/10' : 'bg-gray-200'
      }`}>
        <button
          onClick={handleZoomOut}
          disabled={zoomIndex === 0}
          className={`p-1.5 rounded-md transition-colors ${
            zoomIndex === 0
              ? 'opacity-30 cursor-not-allowed'
              : isDarkMode
                ? 'hover:bg-white/10 text-gray-300'
                : 'hover:bg-gray-300 text-gray-700'
          }`}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={handleZoomIn}
          disabled={zoomIndex === ZOOM_LEVELS.length - 1}
          className={`p-1.5 rounded-md transition-colors ${
            zoomIndex === ZOOM_LEVELS.length - 1
              ? 'opacity-30 cursor-not-allowed'
              : isDarkMode
                ? 'hover:bg-white/10 text-gray-300'
                : 'hover:bg-gray-300 text-gray-700'
          }`}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Timeline Content */}
      <div 
        ref={timelineContentRef}
        className="flex-1 overflow-y-auto overflow-x-visible"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: isDarkMode ? 'rgba(255,255,255,0.2) transparent' : 'rgba(0,0,0,0.2) transparent',
        }}
      >
        <div 
          className="flex px-4 py-8 min-h-full relative"
          onMouseDown={handleTimelineMouseDown}
        >
          {/* Time Labels Column */}
          <div className="flex-shrink-0 relative" style={{ width: '60px' }}>
            {timeLabels.map(({ minutes, label, isMajor }) => {
              const topPosition = (minutes - timeRange.startMinutes) * pixelsPerMinute;
              return (
                <div
                  key={minutes}
                  className={`absolute right-3 ${
                    isMajor 
                      ? 'text-sm font-medium' 
                      : 'text-xs'
                  } ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  style={{
                    top: `${topPosition}px`,
                    transform: 'translateY(-50%)'
                  }}
                >
                  {label}
                </div>
              );
            })}
          </div>

          {/* Timeline Bar */}
          <div 
            ref={timelineBarRef}
            className="flex-shrink-0 relative" 
            style={{ width: '32px' }}
            onMouseEnter={() => setIsTimelineHovered(true)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const y = e.clientY - rect.top;
              setActivityHoverY(y);
              // Calculate absolute position for portal
              setTooltipPosition({
                x: rect.right + 8, // Position to the right of timeline
                y: e.clientY
              });
            }}
            onMouseLeave={() => {
              setActivityHoverY(null);
              setTooltipPosition(null);
              setIsTimelineHovered(false);
            }}
          >
            <div
              className="absolute left-1/2 transform -translate-x-1/2 rounded overflow-hidden"
              style={{
                width: isTimelineHovered ? '45px' : '32px',
                top: '-16px',
                bottom: '-16px',
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                transition: 'width 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)', // Snappy spring-like easing
              }}
            >
              {/* Colored segments with gradients - extend to fill padding areas */}
              {segments.map((segment, index) => {
                // Calculate base position
                let segmentTop = (segment.startMinutes - timeRange.startMinutes) * pixelsPerMinute;
                let segmentHeight = (segment.endMinutes - segment.startMinutes) * pixelsPerMinute;
                
                // Check if this segment touches the edges and extend into padding
                const isAtTop = segment.startMinutes <= timeRange.startMinutes;
                const isAtBottom = segment.endMinutes >= timeRange.endMinutes;
                
                if (isAtTop) {
                  // Extend into top padding
                  segmentTop = 0;
                  segmentHeight += 16;
                } else {
                  // Normal segments start after top padding
                  segmentTop += 16;
                }
                
                if (isAtBottom) {
                  // Extend into bottom padding
                  segmentHeight += 16;
                }
                
                return (
                  <div
                    key={index}
                    className="absolute left-0 right-0"
                    style={{
                      top: `${segmentTop}px`,
                      height: `${segmentHeight}px`,
                      background: segment.colorEnd 
                        ? `linear-gradient(to bottom, ${segment.color}, ${segment.colorEnd})`
                        : segment.color,
                    }}
                  />
                );
              })}
              
              {/* Activity line - weather */}
              {weatherData && weatherData.metadata?.weather?.hourlyTemperatures && (
                <div
                  className="absolute pointer-events-none rounded-full"
                  style={{
                    left: '4px',
                    top: '16px',
                    bottom: '16px',
                    width: isTimelineHovered ? '8px' : '6px',
                    backgroundColor: isDarkMode ? 'rgba(96, 165, 250, 0.6)' : 'rgba(59, 130, 246, 0.6)',
                    transition: 'width 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)', // Same snappy easing
                  }}
                />
              )}
              
              {/* Activity line - Spotify (prototype) - 4PM to 6PM */}
              <div
                className="absolute pointer-events-none rounded-full"
                style={{
                  left: '14px',
                  top: `${((16 * 60 - timeRange.startMinutes) * pixelsPerMinute) + 16}px`, // 4 PM
                  height: `${(2 * 60) * pixelsPerMinute}px`, // 2 hours
                  width: isTimelineHovered ? '8px' : '6px',
                  backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.6)' : 'rgba(22, 163, 74, 0.6)',
                  transition: 'width 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />
            </div>
            
          </div>

          {/* Render tooltips via portal to escape stacking context */}
          {createPortal(
            <AnimatePresence>
              {tooltipPosition !== null && activityHoverY !== null && (
                <motion.div
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -5 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                  className="fixed pointer-events-none" 
                  style={{ 
                    left: `${tooltipPosition.x}px`, 
                    top: `${tooltipPosition.y}px`,
                    zIndex: 9999 
                  }}
                >
                  <div className="flex flex-col gap-1 items-start transform -translate-y-1/2">
                  {/* Weather tooltip */}
                  {weatherData && weatherData.metadata?.weather?.hourlyTemperatures && (() => {
                    const minutesFromTop = (activityHoverY / pixelsPerMinute) + timeRange.startMinutes;
                    const hourIndex = Math.floor(minutesFromTop / 60);
                    const hourlyData = weatherData.metadata.weather.hourlyTemperatures;
                    const dataPoint = hourlyData[Math.min(hourIndex, hourlyData.length - 1)];
                    
                    if (!dataPoint) return null;
                    
                    return (
                      <motion.div
                        key="weather-tooltip"
                        layout="position"
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="px-2 py-1.5 rounded-md backdrop-blur-xl text-xs font-medium whitespace-nowrap shadow-lg text-white"
                        style={{ 
                          backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.85)' : 'rgba(37, 99, 235, 0.85)',
                          border: `1px solid ${isDarkMode ? 'rgba(147, 197, 253, 0.5)' : 'rgba(96, 165, 250, 0.5)'}`,
                        }}
                      >
                        {dataPoint.temperature}°F {weatherData.metadata.weather.condition}
                      </motion.div>
                    );
                  })()}
                  
                  {/* Spotify tooltip */}
                  {(() => {
                    const minutesFromTop = (activityHoverY / pixelsPerMinute) + timeRange.startMinutes;
                    const isInSpotifyRange = minutesFromTop >= 16 * 60 && minutesFromTop < 18 * 60;
                    
                    if (!isInSpotifyRange) return null;
                    
                    const spotifySongs = [
                      { time: '4:00 PM', song: 'Blinding Lights', artist: 'The Weeknd' },
                      { time: '4:15 PM', song: 'Levitating', artist: 'Dua Lipa' },
                      { time: '4:30 PM', song: 'Save Your Tears', artist: 'The Weeknd' },
                      { time: '4:45 PM', song: 'Good 4 U', artist: 'Olivia Rodrigo' },
                      { time: '5:00 PM', song: 'Peaches', artist: 'Justin Bieber' },
                      { time: '5:15 PM', song: 'drivers license', artist: 'Olivia Rodrigo' },
                      { time: '5:30 PM', song: 'Montero', artist: 'Lil Nas X' },
                      { time: '5:45 PM', song: 'Stay', artist: 'The Kid LAROI' },
                    ];
                    
                    const minutesIntoRange = minutesFromTop - (16 * 60);
                    const songIndex = Math.floor(minutesIntoRange / 15);
                    const song = spotifySongs[Math.min(songIndex, spotifySongs.length - 1)];
                    
                    return (
                      <motion.div
                        key="spotify-tooltip"
                        layout="position"
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="px-2 py-1.5 rounded-md backdrop-blur-xl text-xs font-medium whitespace-nowrap shadow-lg text-white"
                        style={{ 
                          backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.85)' : 'rgba(22, 163, 74, 0.85)',
                          border: `1px solid ${isDarkMode ? 'rgba(134, 239, 172, 0.5)' : 'rgba(34, 197, 94, 0.5)'}`,
                        }}
                      >
                        🎵 {song.song} - {song.artist}
                      </motion.div>
                    );
                  })()}
                </div>
              </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )}

          {/* Current time indicator - positioned absolutely across timeline and cards */}
          {isToday && currentTimeMinutes >= timeRange.startMinutes && currentTimeMinutes <= timeRange.endMinutes && (() => {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
            const ampm = hours < 12 ? 'AM' : 'PM';
            const currentTimeLabel = `${hour12}:${minutes.toString().padStart(2, '0')}`;
            
            return (
              <div
                className="absolute left-0 right-0 z-30 pointer-events-none"
                style={{
                  top: `${(currentTimeMinutes - timeRange.startMinutes) * pixelsPerMinute + 32}px`, // Add py-8 offset (32px = 2rem)
                  height: '2px',
                }}
              >
                {/* Current time label with blurred background */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-1 rounded-md backdrop-blur-md"
                  style={{
                    left: '8px', // Add spacing from the left edge
                    zIndex: 10, // Appear on top of the line
                    color: isDarkMode ? '#fca5a5' : '#991b1b',
                    backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(220, 38, 38, 0.2)',
                    border: `1.5px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.4)' : 'rgba(220, 38, 38, 0.4)'}`,
                    boxShadow: `0 2px 6px ${isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(220, 38, 38, 0.2)'}`,
                  }}
                >
                  {currentTimeLabel}
                  <span className="text-[10px] ml-0.5 opacity-80">{ampm}</span>
                </div>
                
                {/* Subtle line spanning from time label through cards */}
                <div
                  className="absolute"
                  style={{
                    left: '58px', // Start just after time label
                    right: '16px', // Account for px-4 padding on right
                    height: '1.5px',
                    backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.4)' : 'rgba(220, 38, 38, 0.5)',
                    boxShadow: `0 0 4px ${isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 38, 0.3)'}`,
                  }}
                />
              </div>
            );
          })()}

          {/* Event Cards Area */}
          <div className="flex-1 relative ml-6" style={{ minHeight: `${timelineHeight}px` }}>
            {/* Drag preview for creating new event */}
            {isDragging && dragStartMinutes !== null && dragEndMinutes !== null && (
              <div
                className="absolute z-20 rounded-md border-2 border-dashed backdrop-blur-sm pointer-events-none"
                style={{
                  top: `${(dragStartMinutes - timeRange.startMinutes) * pixelsPerMinute}px`,
                  left: '0',
                  right: '0',
                  height: `${(dragEndMinutes - dragStartMinutes) * pixelsPerMinute}px`,
                  backgroundColor: isDarkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.25)',
                  borderColor: isDarkMode ? 'rgba(148, 163, 184, 0.5)' : 'rgba(148, 163, 184, 0.6)',
                  minHeight: '15px',
                }}
              >
                <div className={`p-2 text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  New Event ({Math.round((dragEndMinutes - dragStartMinutes))} min)
                </div>
              </div>
            )}

            {positionedEvents.length === 0 ? (
              <div className={`text-center py-12 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <p className="text-sm">No events scheduled</p>
              </div>
            ) : (
              <div className="relative" data-timeline-content style={{ minHeight: `${timelineHeight}px` }}>
                {positionedEvents.map(({ event, startMinutes, duration, column, totalColumns }) => {
                  return (
                    <TimelineEventCard
                      key={event.id}
                      event={event}
                      startMinutes={startMinutes}
                      duration={duration}
                      column={column}
                      totalColumns={totalColumns}
                      isDraggingThis={draggingEventId === event.id}
                      draggedEventOffset={draggedEventOffset}
                      timeRange={timeRange}
                      pixelsPerMinute={pixelsPerMinute}
                      onCardClick={onCardClick}
                      onEventMouseDown={handleEventMouseDown}
                      onTaskToggle={onTaskToggle}
                      accentColor={accentColor}
                      isDarkMode={isDarkMode}
                      folders={folders}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Separate component for timeline event cards with live query support
interface TimelineEventCardProps {
  event: ScheduleCardData;
  startMinutes: number;
  duration: number;
  column: number;
  totalColumns: number;
  isDraggingThis: boolean;
  draggedEventOffset: number;
  timeRange: { startMinutes: number; endMinutes: number };
  pixelsPerMinute: number;
  onCardClick?: (cardData: ScheduleCardData) => void;
  onEventMouseDown: (e: React.MouseEvent, event: ScheduleCardData, startMinutes: number, duration: number) => void;
  onTaskToggle?: (taskId: string, completed: boolean) => void;
  accentColor?: string;
  isDarkMode: boolean;
  folders?: any[];
}

const TimelineEventCard: React.FC<TimelineEventCardProps> = ({
  event,
  startMinutes,
  duration,
  column,
  totalColumns,
  isDraggingThis,
  draggedEventOffset,
  timeRange,
  pixelsPerMinute,
  onCardClick,
  onEventMouseDown,
  onTaskToggle,
  accentColor = '#1F1B2F',
  isDarkMode,
  folders
}) => {
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

  // Check if this is a completion event
  const isCompletionEvent = event.type === 'task:completed';
  
  // Check if this is a sunrise/sunset event
  const isSunEvent = event.type === 'sunrise' || event.type === 'sunset';

  // Apply drag offset if this event is being dragged
  const effectiveTopPosition = isDraggingThis 
    ? (startMinutes + draggedEventOffset - timeRange.startMinutes) * pixelsPerMinute
    : (startMinutes - timeRange.startMinutes) * pixelsPerMinute;
  
  // Completion and sun event cards have fixed small height, regular cards use calculated height
  const cardHeight = (isCompletionEvent || isSunEvent) ? 28 : duration * pixelsPerMinute;
  
  // Calculate width and left offset for overlapping events
  const cardWidthPercent = totalColumns > 1 ? 100 / totalColumns : 100;
  const leftOffsetPercent = column * cardWidthPercent;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    // Only allow toggling for active tasks (not deleted)
    if (event.taskId && event.taskId !== '' && onTaskToggle) {
      onTaskToggle(event.taskId, e.target.checked);
    }
  };
  
  // Completion and sun events are read-only, shouldn't be dragged
  const isDraggable = !isCompletionEvent && !isSunEvent;

  return (
    <div
      key={event.id}
      onClick={() => !isDraggingThis && !isSunEvent && onCardClick?.(event)}
      onMouseDown={(e) => isDraggable ? onEventMouseDown(e, event, startMinutes, duration) : undefined}
      data-event-card
      className={`absolute rounded-md transition-opacity ${
        isSunEvent
          ? 'cursor-default border-0'
          : (isCompletionEvent
            ? 'cursor-default border' 
            : 'cursor-move border')
      } ${
        isDraggingThis ? 'opacity-70 shadow-lg z-50' : ''
      } ${
        isDarkMode && !isSunEvent
          ? 'bg-opacity-90 border-white/10 hover:border-white/20' 
          : !isDarkMode && !isSunEvent
            ? 'bg-opacity-90 border-gray-300/30 hover:border-gray-400/40'
            : ''
      } ${
        (isCompletionEvent || isSunEvent) ? 'py-1 px-2' : 'p-2'
      }`}
      style={{
        top: `${effectiveTopPosition}px`,
        left: `${leftOffsetPercent}%`,
        width: `calc(${cardWidthPercent}% - ${totalColumns > 1 ? '4px' : '0px'})`,
        height: `${cardHeight}px`,
        background: isSunEvent 
          ? `linear-gradient(to right, transparent, ${event.color} 20%, ${event.color} 80%, transparent)`
          : folderColor && !isSunEvent && !isCompletionEvent
            ? `linear-gradient(to right, ${event.color}, ${event.color}), linear-gradient(to right, ${folderColor}20, ${folderColor}00)`
            : event.color,
        backgroundBlendMode: folderColor && !isSunEvent && !isCompletionEvent ? 'normal, screen' : undefined,
        borderLeft: folderColor && !isSunEvent && !isCompletionEvent ? `3px solid ${folderColor}` : undefined,
        minHeight: (isCompletionEvent || isSunEvent) ? '28px' : '40px',
        transition: isDraggingThis ? 'none' : 'top 0.2s ease-out',
      }}
    >
      <div className="h-full flex items-center overflow-hidden">
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
            <span className={`text-xs font-medium ${
              isDarkMode ? 'text-white/70' : 'text-gray-800'
            }`}>
              {event.type === 'sunrise' ? 'Sunrise' : 'Sunset'}
            </span>
          </div>
        ) : isCompletionEvent ? (
          // Compact completion card layout
          <div className="flex items-center gap-2 w-full">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className={`text-xs font-medium truncate ${
              isDarkMode ? 'text-white/80' : 'text-gray-800'
            }`}>
              {displayTitle} - completed
            </span>
          </div>
        ) : (
          // Regular card layout
          <div className="flex flex-col w-full h-full">
            <div className="flex items-start gap-2">
              {event.type === 'task' && (
                <div onClick={handleCheckboxClick}>
                  <Checkbox
                    id={`timeline-checkbox-${event.id}`}
                    size="sm"
                    checked={isCompleted}
                    onChange={handleCheckboxChange}
                    accentColor={accentColor}
                    disabled={isDeletedTask}
                  />
                </div>
              )}
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div 
                    className={`text-sm font-medium truncate ${
                      isCompleted ? 'line-through opacity-60' : ''
                    } ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    {displayTitle}
                  </div>
                  {duration > 0 && (
                    <span className={`text-xs flex-shrink-0 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      ({Math.round(duration)}m)
                    </span>
                  )}
                </div>
                {event.description && cardHeight > 60 && (
                  <div className={`text-xs line-clamp-2 ${
                    isDarkMode ? 'text-white/70' : 'text-gray-700'
                  }`}>
                    {event.description}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineView;

