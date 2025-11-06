import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import Checkbox from './Checkbox';
import { useBasic, useQuery } from '@basictech/react';

export interface ScheduleCardData {
  id: string;
  title: string;
  start: {
    dateTime?: string; // ISO 8601 datetime (e.g., "2024-01-15T09:00:00-08:00")
    date?: string; // ISO date for all-day events (e.g., "2024-01-15")
    timeZone?: string; // IANA timezone (e.g., "America/Los_Angeles")
  };
  end: {
    dateTime?: string; // ISO 8601 datetime
    date?: string; // ISO date for all-day events
    timeZone?: string; // IANA timezone
  };
  color: string;
  type?: 'event' | 'task' | 'other';
  description?: string;
  taskId?: string; // If this is a scheduled task, link to task ID (completion status read from task)
}

export interface ScheduleCardProps {
  data: ScheduleCardData;
  // Position in minutes from midnight (for absolute positioning)
  startMinutes: number;
  // Pixel height (calculated from duration)
  height: number;
  // Pixel offset from left (for overlapping events)
  leftOffset?: number;
  // Width percentage or pixels (for overlapping events)
  width?: number | string;
  // Pixel offset from left edge of timeline
  timelineLeftOffset?: number;
  // Callbacks
  onDragStart?: (id: string) => void;
  onDragEnd?: (id: string, newStartMinutes: number) => void;
  onResizeStart?: (id: string, direction: 'top' | 'bottom') => void;
  onResizeEnd?: (id: string, newStartMinutes: number, newDuration: number) => void;
  onClick?: (id: string) => void;
  onDelete?: (id: string) => void;
  onTaskToggle?: (taskId: string, completed: boolean) => void;
  // Feature flags
  draggable?: boolean;
  resizable?: boolean;
  // Snap interval in minutes (e.g., 15 for 15-minute snapping)
  snapInterval?: number;
  // Time constraints
  minTime?: number; // Minutes from midnight
  maxTime?: number; // Minutes from midnight
  minDuration?: number; // Minimum duration in minutes
  maxDuration?: number; // Maximum duration in minutes
  // Styling
  accentColor?: string;
  isDarkMode?: boolean;
}

// Helper functions for working with the new data structure
export const getEventDuration = (event: ScheduleCardData): number => {
  if (!event.start.dateTime || !event.end.dateTime) {
    return 0;
  }
  const startDate = new Date(event.start.dateTime);
  const endDate = new Date(event.end.dateTime);
  return Math.round((endDate.getTime() - startDate.getTime()) / 60000);
};

export const getTimeFromDateTime = (dateTime: string): string => {
  const date = new Date(dateTime);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const minutesToDateTime = (minutes: number, baseDate?: Date): string => {
  const date = baseDate || new Date();
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  date.setHours(hours, mins, 0, 0);
  return date.toISOString();
};

const ScheduleCard: React.FC<ScheduleCardProps> = ({
  data,
  startMinutes,
  height,
  leftOffset = 0,
  width = 'auto',
  timelineLeftOffset = 60,
  onDragStart,
  onDragEnd,
  onResizeStart,
  onResizeEnd,
  onClick,
  onDelete,
  onTaskToggle,
  draggable = true,
  resizable = true,
  snapInterval = 15,
  minTime = 0,
  maxTime = 1440, // 24 hours in minutes
  minDuration = 15,
  maxDuration = 1440,
  accentColor = '#1F1B2F',
  isDarkMode = true
}) => {
  // Calculate duration from start/end times
  const duration = getEventDuration(data);
  
  // Fetch linked task if this is a task event
  const { db } = useBasic();
  const linkedTask = useQuery(
    () => data.taskId ? db.collection('tasks').get(data.taskId) : null,
    [data.taskId]
  );
  
  // Get completion status from linked task
  const isCompleted = data.type === 'task' && linkedTask?.completed || false;
  
  // For scheduled tasks, use task name; otherwise use event title
  const displayTitle = data.type === 'task' && linkedTask 
    ? linkedTask.name 
    : data.title;
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [resizeStartOffset, setResizeStartOffset] = useState(0);
  const [resizeHeightOffset, setResizeHeightOffset] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLElement | null>(null);
  const dragStartY = useRef(0);
  const dragStartMinutes = useRef(0);
  const clickOffsetY = useRef(0);
  const hasMoved = useRef(false);

  // Find timeline container - use the inner timeline content container, not the outer scrollable one
  useEffect(() => {
    // First try to find the inner timeline content container
    timelineRef.current = cardRef.current?.closest('[data-timeline-content]') as HTMLElement;
    // Fallback to outer container if inner not found (for backwards compatibility)
    if (!timelineRef.current) {
      timelineRef.current = cardRef.current?.closest('[data-timeline-container]') as HTMLElement;
    }
  }, []);

  // Smooth snap time to nearest interval with magnetic effect
  const smoothSnapToInterval = (minutes: number, threshold: number = snapInterval * 0.4): number => {
    const snapped = Math.round(minutes / snapInterval) * snapInterval;
    const distance = Math.abs(minutes - snapped);
    
    // If close to snap point, use smooth interpolation
    if (distance < threshold) {
      // Use easing function for smooth transition
      const easeFactor = 1 - (distance / threshold);
      const easedFactor = easeFactor * easeFactor; // Ease out curve
      return minutes + (snapped - minutes) * easedFactor;
    }
    
    return minutes;
  };

  // Hard snap for final values (used on mouse up)
  const snapToInterval = (minutes: number): number => {
    return Math.round(minutes / snapInterval) * snapInterval;
  };

  // Convert minutes to pixels
  const minutesToPixels = (minutes: number): number => {
    return minutes; // 1 minute = 1px
  };

  // Calculate end time from start time and duration
  const calculateEndTime = (start: string, duration: number): string => {
    const [hours, minutes] = start.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  // Format time for display
  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const ampm = hours < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggable || isResizing) return;
    if ((e.target as HTMLElement).closest('[data-resize-handle]')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (!timelineRef.current || !cardRef.current) return;
    
    setIsDragging(true);
    hasMoved.current = false;
    
    // Calculate the offset from where user clicked within the card
    const cardRect = cardRef.current.getBoundingClientRect();
    clickOffsetY.current = e.clientY - cardRect.top; // Offset from top of card
    
    dragStartY.current = e.clientY;
    dragStartMinutes.current = startMinutes;
    
    onDragStart?.(data.id);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!timelineRef.current) return;
      
      // Track if mouse has actually moved (to prevent jump on click)
      const moveDistance = Math.abs(moveEvent.clientY - dragStartY.current);
      if (moveDistance < 2) return; // Ignore tiny movements (< 2px)
      hasMoved.current = true;
      
      const timelineRect = timelineRef.current.getBoundingClientRect();
      const scrollTop = timelineRef.current.scrollTop;
      
      // Calculate position based on mouse Y, accounting for where user clicked in the card
      // This keeps the card's position relative to the mouse cursor consistent
      const mouseY = moveEvent.clientY - timelineRect.top + scrollTop;
      const relativeY = mouseY - clickOffsetY.current; // Adjust for click offset
      
      // Use smooth snap for live preview
      let newMinutes = smoothSnapToInterval(relativeY);
      newMinutes = Math.max(minTime, Math.min(maxTime - duration, newMinutes));
      
      setDragOffset(newMinutes - startMinutes);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      if (!timelineRef.current) return;
      
      setIsDragging(false);
      
      // Only update position if mouse actually moved
      if (hasMoved.current) {
        const timelineRect = timelineRef.current.getBoundingClientRect();
        const scrollTop = timelineRef.current.scrollTop;
        
        // Use same offset calculation as mouse move
        const mouseY = upEvent.clientY - timelineRect.top + scrollTop;
        const relativeY = mouseY - clickOffsetY.current; // Adjust for click offset
        
        let finalMinutes = snapToInterval(relativeY);
        finalMinutes = Math.max(minTime, Math.min(maxTime - duration, finalMinutes));
        
        if (finalMinutes !== startMinutes) {
          onDragEnd?.(data.id, finalMinutes);
        }
      }
      
      setDragOffset(0);
      hasMoved.current = false;
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Resize handlers
  const handleResizeMouseDown = (e: React.MouseEvent, direction: 'top' | 'bottom') => {
    if (!resizable) return;
    
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(direction);
    
    const startY = e.clientY;
    const startMins = startMinutes;
    const startDur = duration;
    
    onResizeStart?.(data.id, direction);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const deltaMinutes = deltaY; // 1px = 1 minute
      
      let newStartMinutes = startMins;
      let newDuration = startDur;

      if (direction === 'top') {
        // Use smooth snap for live preview
        const rawStart = startMins + deltaMinutes;
        newStartMinutes = smoothSnapToInterval(rawStart);
        newDuration = startDur - deltaMinutes;
        newStartMinutes = Math.max(minTime, newStartMinutes);
        newDuration = Math.max(minDuration, Math.min(maxDuration, newDuration));
        if (newDuration === minDuration) {
          newStartMinutes = startMins + startDur - minDuration;
        }
        newStartMinutes = Math.max(minTime, newStartMinutes);
      } else {
        // Use smooth snap for live preview
        const rawDuration = startDur + deltaMinutes;
        newDuration = smoothSnapToInterval(rawDuration);
        newDuration = Math.max(minDuration, Math.min(maxDuration, newDuration));
      }

      const endMinutes = newStartMinutes + newDuration;
      if (endMinutes > maxTime) {
        if (direction === 'top') {
          newStartMinutes = Math.max(minTime, maxTime - newDuration);
        } else {
          newDuration = maxTime - newStartMinutes;
        }
      }

      // Update preview state for live feedback
      setResizeStartOffset(newStartMinutes - startMins);
      setResizeHeightOffset(newDuration - startDur);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      setIsResizing(null);
      setResizeStartOffset(0);
      setResizeHeightOffset(0);
      
      const deltaY = upEvent.clientY - startY;
      const deltaMinutes = deltaY;
      
      let finalStartMinutes = startMins;
      let finalDuration = startDur;

      if (direction === 'top') {
        // Use hard snap for final value
        finalStartMinutes = snapToInterval(startMins + deltaMinutes);
        finalDuration = startDur - deltaMinutes;
        finalStartMinutes = Math.max(minTime, finalStartMinutes);
        finalDuration = Math.max(minDuration, Math.min(maxDuration, finalDuration));
        if (finalDuration === minDuration) {
          finalStartMinutes = startMins + startDur - minDuration;
        }
        finalStartMinutes = Math.max(minTime, finalStartMinutes);
      } else {
        // Use hard snap for final value
        finalDuration = snapToInterval(startDur + deltaMinutes);
        finalDuration = Math.max(minDuration, Math.min(maxDuration, finalDuration));
      }

      const endMinutes = finalStartMinutes + finalDuration;
      if (endMinutes > maxTime) {
        if (direction === 'top') {
          finalStartMinutes = Math.max(minTime, maxTime - finalDuration);
        } else {
          finalDuration = maxTime - finalStartMinutes;
        }
      }

      if (finalStartMinutes !== startMins || finalDuration !== startDur) {
        onResizeEnd?.(data.id, finalStartMinutes, finalDuration);
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isResizing || isDragging) return;
    onClick?.(data.id);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (data.taskId && onTaskToggle) {
      onTaskToggle(data.taskId, e.target.checked);
    }
  };

  // Calculate width consistently - if 'auto', use left/right instead
  const widthStyle = typeof width === 'number' ? `${width}px` : (width === 'auto' ? 'auto' : width);
  const leftStyle = `${timelineLeftOffset + leftOffset}px`;
  
  // When width is auto, use right property for stable sizing
  const useRightProperty = widthStyle === 'auto';
  const rightStyle = useRightProperty ? '12px' : undefined;
  const finalWidth = useRightProperty ? undefined : widthStyle;
  
  // Calculate current position and size with live preview
  const currentTop = startMinutes + dragOffset + resizeStartOffset;
  const currentHeight = height + resizeHeightOffset;
  const currentDuration = duration + resizeHeightOffset;
  
  // Determine padding based on card height (smaller cards get less padding)
  const isSmallCard = currentHeight <= 45; // 45px or less (about 45 minutes)
  const cardPadding = isSmallCard ? 'p-1' : 'p-2';
  const contentPadding = isSmallCard ? 'pt-0' : 'pt-1';
  
  // Calculate start time for display (accounting for drag and resize offsets)
  const startTime = data.start.dateTime ? getTimeFromDateTime(data.start.dateTime) : '00:00';
  const [startHours, startMins] = startTime.split(':').map(Number);
  const displayStartMinutes = startHours * 60 + startMins + dragOffset + resizeStartOffset;
  const displayStartHours = Math.floor(displayStartMinutes / 60) % 24;
  const displayStartMins = displayStartMinutes % 60;
  const displayStartTime = `${displayStartHours.toString().padStart(2, '0')}:${displayStartMins.toString().padStart(2, '0')}`;
  
  const endTime = data.end.dateTime ? getTimeFromDateTime(data.end.dateTime) : calculateEndTime(displayStartTime, currentDuration);

  // Subtle text color that matches the UI theme
  const textColor = isDarkMode 
    ? 'rgba(255, 255, 255, 0.85)' 
    : 'rgba(0, 0, 0, 0.75)';

  return (
    <motion.div
      ref={cardRef}
      className={`rounded-md ${cardPadding} select-none backdrop-blur-md border ${
        isDragging || isResizing ? 'opacity-90 z-50' : 'z-10'
      } ${isHovered ? 'shadow-md' : 'shadow-sm'} ${
        draggable && !isResizing ? 'cursor-move' : ''
      } ${
        isDarkMode 
          ? 'border-white/10 hover:border-white/20' 
          : 'border-gray-300/30 hover:border-gray-400/40'
      }`}
      style={{
        position: 'absolute',
        top: `${minutesToPixels(currentTop)}px`,
        left: leftStyle,
        ...(rightStyle && { right: rightStyle }), // Only set right if using auto width
        ...(finalWidth && { width: finalWidth }), // Only set width if explicitly provided
        height: `${currentHeight}px`,
        backgroundColor: data.color,
        color: textColor,
        minHeight: `${minutesToPixels(minDuration)}px`,
        transformOrigin: 'center center', // Ensure scale doesn't affect width calculation
        willChange: isDragging || isResizing ? 'top, height' : 'auto', // Optimize for drag/resize
        filter: isHovered && !isDragging && !isResizing ? 'brightness(1.15)' : 'none',
        transition: 'filter 0.2s ease',
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{
        zIndex: isDragging || isResizing ? 50 : 10
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.5
      }}
    >
      {/* Top resize handle */}
      {resizable && (
        <div
          data-resize-handle
          className="absolute top-0 left-0 right-0 h-3 cursor-ns-resize rounded-t-md z-10"
          onMouseDown={(e) => handleResizeMouseDown(e, 'top')}
        />
      )}

      {/* Content */}
      <div className="h-full flex flex-col relative z-0">
        <div className={`${contentPadding} flex items-center gap-2`}>
          {data.type === 'task' && (
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                id={`schedule-checkbox-${data.id}`}
                size="sm"
                checked={isCompleted}
                onChange={handleCheckboxChange}
                accentColor={accentColor}
              />
            </div>
          )}
          <div className={`text-sm font-medium flex-1 truncate ${isCompleted && data.type === 'task' ? 'line-through opacity-60' : ''}`} style={{ color: textColor }}>
            {displayTitle}
          </div>
        </div>
      </div>

      {/* Bottom resize handle */}
      {resizable && (
        <div
          data-resize-handle
          className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize rounded-b-md z-10"
          onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')}
        />
      )}
    </motion.div>
  );
};

export default ScheduleCard;
