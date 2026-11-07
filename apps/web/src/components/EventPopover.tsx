import React, { useEffect, useRef, useState } from 'react';
import { ScheduleCardData, ScheduleCardInput } from '../utils/schedule';

interface EventPopoverProps {
  event?: ScheduleCardData | null;
  isCreating?: boolean;
  anchorEl?: HTMLElement | null;
  position?: { x: number; y: number };
  onSave?: (eventData: ScheduleCardInput | Partial<ScheduleCardData>) => void | Promise<void>;
  onDelete?: (eventId: string) => void;
  onClose: () => void;
  isDarkMode: boolean;
  defaultDate?: Date;
  defaultStartTime?: string;
  defaultEndTime?: string;
}

const EventPopover: React.FC<EventPopoverProps> = ({
  event,
  isCreating = false,
  anchorEl,
  position,
  onSave,
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
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  // Check if this is a system event (weather, sun) that shouldn't be edited
  const isSystemEvent = event?.type === 'other' || event?.metadata?.weather !== undefined;

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
  }, [event, defaultDate, defaultStartTime, defaultEndTime]);

  useEffect(() => {
    // Calculate popover position to avoid viewport edges
    if (!popoverRef.current) return;

    const popover = popoverRef.current;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popoverRect = popover.getBoundingClientRect();

    let x = position?.x || 0;
    let y = position?.y || 0;

    // If anchor element is provided, position relative to it
    if (anchorEl) {
      const anchorRect = anchorEl.getBoundingClientRect();
      x = anchorRect.left;
      y = anchorRect.bottom + 4; // 4px gap below anchor
    }

    // Adjust for right edge collision
    if (x + popoverRect.width > viewportWidth - 16) {
      x = viewportWidth - popoverRect.width - 16;
    }

    // Adjust for left edge collision
    if (x < 16) {
      x = 16;
    }

    // Adjust for bottom edge collision
    if (y + popoverRect.height > viewportHeight - 16) {
      y = (anchorEl?.getBoundingClientRect().top || position?.y || 0) - popoverRect.height - 4;
    }

    // Adjust for top edge collision
    if (y < 16) {
      y = 16;
    }

    setPopoverStyle({
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      zIndex: 50,
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

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleSave = async () => {
    if (isSystemEvent) {
      onClose();
      return;
    }

    if (!onSave) return;

    const startDateTime = new Date(`${date}T${startTime}`).toISOString();
    const endDateTime = new Date(`${date}T${endTime}`).toISOString();

    if (isCreating) {
      await onSave({
        title: title.trim() || 'Untitled',
        start: { dateTime: startDateTime },
        end: { dateTime: endDateTime },
        description: description.trim(),
        color: '#1F1B2F',
      });
    } else if (event) {
      await onSave({
        id: event.id,
        title: title.trim() || 'Untitled',
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

  return (
    <div
      ref={popoverRef}
      style={popoverStyle}
      className={`rounded-lg shadow-2xl border min-w-[320px] max-w-[400px] ${
        isDarkMode
          ? 'bg-gray-800 border-white/10'
          : 'bg-white border-gray-200'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4 space-y-3">
        {/* Title */}
        {isSystemEvent ? (
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {event?.title}
          </h3>
        ) : (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            className={`w-full text-lg font-semibold bg-transparent border-none outline-none ${
              isDarkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
            }`}
            autoFocus={isCreating}
          />
        )}

        {/* Date and Time */}
        {isSystemEvent ? (
          <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {event?.start.dateTime && new Date(event.start.dateTime).toLocaleString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </div>
        ) : (
          <>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full px-2 py-1 text-sm rounded border ${
                isDarkMode
                  ? 'bg-gray-700 border-white/10 text-white'
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
            />
            <div className="flex gap-2">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={`flex-1 px-2 py-1 text-sm rounded border ${
                  isDarkMode
                    ? 'bg-gray-700 border-white/10 text-white'
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
              />
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>–</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`flex-1 px-2 py-1 text-sm rounded border ${
                  isDarkMode
                    ? 'bg-gray-700 border-white/10 text-white'
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </>
        )}

        {/* Description */}
        {isSystemEvent ? (
          event?.description && (
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {event.description}
            </p>
          )
        ) : (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add description..."
            rows={3}
            className={`w-full px-2 py-1 text-sm rounded border resize-none ${
              isDarkMode
                ? 'bg-gray-700 border-white/10 text-white placeholder-gray-500'
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          {!isSystemEvent && !isCreating && (
            <button
              onClick={handleDelete}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                isDarkMode
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              Delete
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              isDarkMode
                ? 'text-gray-300 hover:bg-white/10'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {isSystemEvent ? 'Close' : 'Cancel'}
          </button>
          {!isSystemEvent && (
            <button
              onClick={handleSave}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                isDarkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isCreating ? 'Create' : 'Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventPopover;
