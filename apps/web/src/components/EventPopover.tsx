import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ScheduleCardData, ScheduleCardInput } from '../utils/schedule';

interface EventPopoverProps {
  event?: ScheduleCardData | null;
  isCreating?: boolean;
  anchorEl?: HTMLElement | null;
  position?: { x: number; y: number };
  onSave?: (eventData: ScheduleCardInput | Partial<ScheduleCardData>) => void | Promise<void>;
  onSaveTask?: (taskData: { name: string; startTime: Date; duration: number }) => void | Promise<void>;
  onDelete?: (eventId: string) => void;
  onClose: () => void;
  isDarkMode: boolean;
  defaultDate?: Date;
  defaultStartTime?: string;
  defaultEndTime?: string;
}

type ItemType = 'event' | 'task';

const EventPopover: React.FC<EventPopoverProps> = ({
  event,
  isCreating = false,
  anchorEl,
  position,
  onSave,
  onSaveTask,
  onDelete,
  onClose,
  isDarkMode,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(event?.title || '');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState(event?.description || '');
  const [itemType, setItemType] = useState<ItemType>('event');
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  // Check if this is a system event (weather, sun) that shouldn't be edited
  const isSystemEvent = event?.type === 'other' || event?.metadata?.weather !== undefined;
  const isTaskEvent = event?.type === 'task';

  useEffect(() => {
    // Initialize form fields
    if (event?.start.dateTime) {
      const startDate = new Date(event.start.dateTime);
      setDate(startDate.toISOString().split('T')[0]);
      setStartTime(startDate.toTimeString().slice(0, 5));
      
      if (event.end.dateTime) {
        const endDate = new Date(event.end.dateTime);
        setEndTime(endDate.toTimeString().slice(0, 5));
      }
    } else if (defaultDate) {
      setDate(defaultDate.toISOString().split('T')[0]);
      setStartTime(defaultStartTime || '09:00');
      setEndTime(defaultEndTime || '10:00');
    }

    // Set initial type based on event
    if (isTaskEvent) {
      setItemType('task');
    }
  }, [event, defaultDate, defaultStartTime, defaultEndTime, isTaskEvent]);

  useEffect(() => {
    // Calculate popover position with improved collision detection
    if (!popoverRef.current) return;

    const popover = popoverRef.current;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popoverRect = popover.getBoundingClientRect();
    const popoverWidth = popoverRect.width || 340; // fallback width
    const popoverHeight = popoverRect.height || 400; // fallback height

    let x = position?.x || 0;
    let y = position?.y || 0;

    // If anchor element is provided, position relative to it
    if (anchorEl) {
      const anchorRect = anchorEl.getBoundingClientRect();
      x = anchorRect.left;
      y = anchorRect.bottom + 8; // 8px gap below anchor
    }

    // Horizontal collision detection with generous margins
    const rightOverflow = (x + popoverWidth) - (viewportWidth - 16);
    if (rightOverflow > 0) {
      x = x - rightOverflow - 8; // shift left with extra margin
    }

    // Keep left margin
    if (x < 16) {
      x = 16;
    }

    // Vertical collision detection
    const bottomOverflow = (y + popoverHeight) - (viewportHeight - 16);
    if (bottomOverflow > 0) {
      // Try to flip above anchor
      const flippedY = (anchorEl?.getBoundingClientRect().top || position?.y || 0) - popoverHeight - 8;
      if (flippedY >= 16) {
        y = flippedY;
      } else {
        // If can't flip, just shift up within viewport
        y = viewportHeight - popoverHeight - 16;
      }
    }

    // Keep top margin
    if (y < 16) {
      y = 16;
    }

    setPopoverStyle({
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      zIndex: 9999, // Very high z-index to ensure it's above everything
    });
  }, [anchorEl, position]);

  useEffect(() => {
    // Handle click outside to close
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Small delay to prevent immediate close from the click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleSave = async () => {
    if (isSystemEvent) {
      onClose();
      return;
    }

    const startDateTime = new Date(`${date}T${startTime}`).toISOString();
    const endDateTime = new Date(`${date}T${endTime}`).toISOString();

    if (isCreating) {
      if (itemType === 'task' && onSaveTask) {
        // Create task with auto-scheduling
        const startDate = new Date(`${date}T${startTime}`);
        const endDate = new Date(`${date}T${endTime}`);
        const durationMinutes = Math.max(15, (endDate.getTime() - startDate.getTime()) / (1000 * 60));
        
        await onSaveTask({
          name: title.trim() || 'Untitled Task',
          startTime: startDate,
          duration: durationMinutes,
        });
      } else if (onSave) {
        // Create event
        await onSave({
          title: title.trim() || 'Untitled Event',
          start: { dateTime: startDateTime },
          end: { dateTime: endDateTime },
          description: description.trim(),
          color: '#1F1B2F',
        });
      }
    } else if (event && onSave) {
      // Update existing event/task
      await onSave({
        id: event.id,
        title: title.trim() || (isTaskEvent ? 'Untitled Task' : 'Untitled Event'),
        start: { dateTime: startDateTime },
        end: { dateTime: endDateTime },
        description: description.trim(),
      });
    }

    onClose();
  };

  const handleDelete = () => {
    if (event && onDelete && !isSystemEvent) {
      onDelete(event.id);
      onClose();
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTimeDisplay = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const popoverContent = (
    <div
      ref={popoverRef}
      style={popoverStyle}
      className={`rounded-xl shadow-2xl border backdrop-blur-xl w-[340px] ${
        isDarkMode
          ? 'bg-gray-900/95 border-white/10'
          : 'bg-white/95 border-gray-200'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${
        isDarkMode ? 'border-white/10' : 'border-gray-200'
      }`}>
        <div className={`text-xs font-medium uppercase tracking-wider ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {isSystemEvent ? 'Details' : isCreating ? 'New' : 'Edit'}
        </div>
        <button
          onClick={onClose}
          className={`p-1 rounded hover:bg-black/10 transition-colors ${
            isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
          }`}
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Type Selector (only for creation) */}
        {isCreating && !isSystemEvent && (
          <div className="flex gap-2">
            <button
              onClick={() => setItemType('event')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                itemType === 'event'
                  ? isDarkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : isDarkMode
                  ? 'bg-white/5 text-gray-400 hover:bg-white/10'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Event
            </button>
            <button
              onClick={() => setItemType('task')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                itemType === 'task'
                  ? isDarkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : isDarkMode
                  ? 'bg-white/5 text-gray-400 hover:bg-white/10'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Task
            </button>
          </div>
        )}

        {/* Title */}
        {isSystemEvent ? (
          <div>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {event?.title}
            </h3>
          </div>
        ) : (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={itemType === 'task' ? 'Task name' : 'Event title'}
            className={`w-full text-base font-semibold bg-transparent border-none outline-none placeholder:font-normal ${
              isDarkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
            }`}
            autoFocus={isCreating}
          />
        )}

        {/* Date and Time */}
        <div className="space-y-2">
          {isSystemEvent ? (
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {event?.start.dateTime && (
                <>
                  {formatDateDisplay(new Date(event.start.dateTime).toISOString().split('T')[0])}
                  {' · '}
                  {formatTimeDisplay(new Date(event.start.dateTime).toTimeString().slice(0, 5))}
                </>
              )}
            </div>
          ) : (
            <>
              <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Date
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10 text-white hover:bg-white/10 focus:bg-white/10 focus:border-blue-500'
                    : 'bg-gray-50 border-gray-300 text-gray-900 hover:bg-gray-100 focus:bg-white focus:border-blue-500'
                } outline-none`}
              />
              
              <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Time
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    isDarkMode
                      ? 'bg-white/5 border-white/10 text-white hover:bg-white/10 focus:bg-white/10 focus:border-blue-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 hover:bg-gray-100 focus:bg-white focus:border-blue-500'
                  } outline-none`}
                />
                <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>→</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    isDarkMode
                      ? 'bg-white/5 border-white/10 text-white hover:bg-white/10 focus:bg-white/10 focus:border-blue-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 hover:bg-gray-100 focus:bg-white focus:border-blue-500'
                  } outline-none`}
                />
              </div>
            </>
          )}
        </div>

        {/* Description */}
        {!isSystemEvent && (
          <div>
            <div className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Description (optional)
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
              className={`w-full px-3 py-2 text-sm rounded-lg border resize-none transition-colors ${
                isDarkMode
                  ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 hover:bg-white/10 focus:bg-white/10 focus:border-blue-500'
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 hover:bg-gray-100 focus:bg-white focus:border-blue-500'
              } outline-none`}
            />
          </div>
        )}

        {isSystemEvent && event?.description && (
          <div>
            <div className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Details
            </div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {event.description}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className={`flex items-center gap-2 pt-2 border-t ${
          isDarkMode ? 'border-white/10' : 'border-gray-200'
        }`}>
          {!isSystemEvent && !isCreating && (
            <button
              onClick={handleDelete}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isDarkMode
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              Delete
            </button>
          )}
          <div className="flex-1" />
          {!isSystemEvent && (
            <button
              onClick={handleSave}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                isDarkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                  : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
              }`}
            >
              {isCreating ? 'Create' : 'Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Render popover in a portal at document root to escape overflow constraints
  return typeof document !== 'undefined' 
    ? createPortal(popoverContent, document.body)
    : null;
};

export default EventPopover;
