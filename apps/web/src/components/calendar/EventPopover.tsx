import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  addDays,
  formatClockTime,
  getEventRange,
  isAllDayEvent,
  resolveEventTimes,
  toDateInputValue,
  toTimeInputValue,
} from '../../utils/calendar';
import { getStartOfDay } from '../../utils/dateHelpers';
import type { ScheduleCardData, ScheduleCardInput, ScheduleCardUpdate } from '../../utils/schedule';
import CalendarPopover from './CalendarPopover';
import type { ScheduledTaskInput } from './types';

export interface EventDraft {
  date: Date;
  startTime: string;
  endTime: string;
}

interface EventPopoverProps {
  /** Existing event to edit. Omit to create from `draft`. */
  event?: ScheduleCardData;
  draft?: EventDraft;
  anchorEl: HTMLElement | null;
  onCreateEvent: (event: ScheduleCardInput) => Promise<unknown>;
  onCreateTask: (task: ScheduledTaskInput) => Promise<void>;
  onUpdate: (id: string, changes: ScheduleCardUpdate) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  onClose: () => void;
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const getTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

const getInitialFields = (event?: ScheduleCardData, draft?: EventDraft) => {
  const range = event ? getEventRange(event) : null;
  if (range) {
    const dayGap = Math.round(
      (getStartOfDay(range.end).getTime() - getStartOfDay(range.start).getTime()) / MILLISECONDS_PER_DAY,
    );
    return {
      date: toDateInputValue(range.start),
      startTime: toTimeInputValue(range.start),
      endTime: toTimeInputValue(range.end),
      dayGap,
    };
  }
  return {
    date: draft ? toDateInputValue(draft.date) : '',
    startTime: draft?.startTime ?? '09:00',
    endTime: draft?.endTime ?? '10:00',
    dayGap: 0,
  };
};

const EventPopover: React.FC<EventPopoverProps> = ({
  event,
  draft,
  anchorEl,
  onCreateEvent,
  onCreateTask,
  onUpdate,
  onDelete,
  onClose,
}) => {
  const { theme } = useTheme();
  const { isDarkMode } = theme;
  const isCreating = !event;
  const isAllDay = event ? isAllDayEvent(event) : false;
  const [initial] = useState(() => getInitialFields(event, draft));

  const [itemType, setItemType] = useState<'event' | 'task'>('event');
  const [title, setTitle] = useState(event?.title ?? '');
  const [date, setDate] = useState(initial.date);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [endTime, setEndTime] = useState(initial.endTime);
  const [description, setDescription] = useState(event?.description ?? '');
  const [showPickers, setShowPickers] = useState(false);
  const [showNotes, setShowNotes] = useState(Boolean(event?.description));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fail = (message: string) => {
    setError(message);
    setShowPickers(true);
  };

  const saveAllDay = async () => {
    if (!event || !date) {
      fail('Add a date.');
      return;
    }
    const start = new Date(`${date}T00:00`);
    await onUpdate(event.id, {
      title: title.trim() || 'Untitled Event',
      description: description.trim(),
      start: { date },
      end: { date: toDateInputValue(addDays(start, Math.max(1, initial.dayGap))) },
    });
    onClose();
  };

  const saveTimed = async () => {
    const endDayOffset = event ? initial.dayGap : 0;
    const times = resolveEventTimes({ date, startTime, endTime, endDayOffset });
    if ('error' in times) {
      fail(times.error);
      return;
    }

    const timeZone = getTimeZone();
    const start = { dateTime: times.start.toISOString(), timeZone };
    const end = { dateTime: times.end.toISOString(), timeZone };
    const name = title.trim();

    if (event) {
      const fallback = event.type === 'task' ? 'Untitled Task' : 'Untitled Event';
      await onUpdate(event.id, { title: name || fallback, start, end, description: description.trim() });
    } else if (itemType === 'task') {
      await onCreateTask({
        name: name || 'Untitled Task',
        start: times.start,
        durationMinutes: Math.round((times.end.getTime() - times.start.getTime()) / 60_000),
      });
    } else {
      await onCreateEvent({
        title: name || 'Untitled Event',
        start,
        end,
        description: description.trim(),
        color: 'rgba(148, 163, 184, 0.08)',
        type: 'event',
      });
    }
    onClose();
  };

  const handleSubmit = async (submitEvent?: React.FormEvent) => {
    submitEvent?.preventDefault();
    if (isSaving) return;
    setError(null);
    setIsSaving(true);
    try {
      await (isAllDay ? saveAllDay() : saveTimed());
    } catch (saveError) {
      console.error('Failed to save calendar item', saveError);
      setError("Couldn't save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    try {
      await onDelete(event.id);
      onClose();
    } catch (deleteError) {
      console.error('Failed to delete calendar item', deleteError);
      setError("Couldn't delete. Please try again.");
    }
  };

  const dateLabel = date
    ? new Date(`${date}T00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : 'Pick a date';
  const timeLabel = isAllDay ? 'All day' : `${formatClockTime(startTime)} – ${formatClockTime(endTime)}`;

  const fieldClass = `w-full min-w-0 px-2.5 py-1.5 text-sm rounded-lg border outline-none transition-colors ${
    isDarkMode
      ? 'bg-white/5 border-white/10 focus:border-white/40'
      : 'bg-black/[0.03] border-black/10 focus:border-black/40'
  }`;
  const quietText = isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800';
  const itemName = itemType === 'task' ? 'task' : 'event';

  return (
    <CalendarPopover anchorEl={anchorEl} label={isCreating ? `New ${itemName}` : `Edit ${event.title}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-3.5 space-y-3">
        <div className="flex items-start gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={itemType === 'task' ? 'Task name' : 'Event title'}
            aria-label="Title"
            autoFocus={isCreating}
            className={`flex-1 min-w-0 bg-transparent text-base font-semibold outline-none placeholder:font-normal ${
              isDarkMode ? 'placeholder-gray-500' : 'placeholder-gray-400'
            }`}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`shrink-0 p-1 -m-0.5 rounded-md transition-colors ${
              isDarkMode ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-black/5 hover:text-gray-900'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowPickers((open) => !open)}
          aria-expanded={showPickers}
          className={`block text-left text-sm transition-colors ${quietText}`}
        >
          {dateLabel} · {timeLabel}
        </button>

        {showPickers && (
          <div className="space-y-2">
            <input
              type="date"
              aria-label="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={fieldClass}
            />
            {!isAllDay && (
              <div className="flex items-center gap-1.5">
                <input
                  type="time"
                  aria-label="Start time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={fieldClass}
                />
                <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} aria-hidden>–</span>
                <input
                  type="time"
                  aria-label="End time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={fieldClass}
                />
              </div>
            )}
          </div>
        )}

        {showNotes ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void handleSubmit();
            }}
            placeholder="Add notes…"
            aria-label="Notes"
            rows={3}
            autoFocus={!event?.description}
            className={`${fieldClass} resize-none`}
          />
        ) : (
          <button type="button" onClick={() => setShowNotes(true)} className={`block text-sm transition-colors ${quietText}`}>
            Add notes
          </button>
        )}

        {error && (
          <p role="alert" className={`text-xs ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>
            {error}
          </p>
        )}

        <div className="flex items-center gap-2">
          {isCreating ? (
            <div
              role="group"
              aria-label="Item type"
              className={`flex p-0.5 rounded-lg ${isDarkMode ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`}
            >
              {(['event', 'task'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setItemType(type)}
                  aria-pressed={itemType === type}
                  className={`px-2.5 py-1 text-xs font-medium capitalize rounded-md transition-colors ${
                    itemType === type
                      ? isDarkMode ? 'bg-white/15 text-white' : 'bg-white text-gray-900 shadow-sm'
                      : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleDelete}
              className={`px-2 py-1.5 -ml-2 text-sm rounded-lg transition-colors ${
                isDarkMode ? 'text-red-300 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
              }`}
            >
              Delete
            </button>
          )}
          <div className="flex-1" />
          <button
            type="submit"
            disabled={isSaving}
            className={`pressable px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-60 ${
              isDarkMode ? 'bg-white text-gray-900 hover:bg-white/90' : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {isCreating ? 'Create' : 'Save'}
          </button>
        </div>
      </form>
    </CalendarPopover>
  );
};

export default EventPopover;
