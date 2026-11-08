import React, { useCallback, useState } from 'react';
import type { ScheduleCardData } from '../../utils/schedule';
import EventPopover, { type EventDraft } from './EventPopover';
import type { CalendarViewProps } from './types';

type EditorState =
  | { kind: 'create'; draft: EventDraft; anchorEl: HTMLElement; key: string }
  | { kind: 'edit'; event: ScheduleCardData; anchorEl: HTMLElement; key: string };

type EditorProps = Pick<
  CalendarViewProps,
  'tasks' | 'onTaskClick' | 'onAddEvent' | 'onCreateScheduledTask' | 'onUpdateEvent' | 'onDeleteEvent'
>;

/** Shared create and edit flow for the week and month views. */
export function useCalendarEditor({
  tasks,
  onTaskClick,
  onAddEvent,
  onCreateScheduledTask,
  onUpdateEvent,
  onDeleteEvent,
}: EditorProps) {
  const [state, setState] = useState<EditorState | null>(null);
  const close = useCallback(() => setState(null), []);

  const openCreate = useCallback((draft: EventDraft, anchorEl: HTMLElement) => {
    setState({ kind: 'create', draft, anchorEl, key: `${draft.date.toDateString()}-${draft.startTime}` });
  }, []);

  const openEvent = useCallback(
    (event: ScheduleCardData, anchorEl: HTMLElement) => {
      const task = event.type === 'task' && event.taskId ? tasks.find((item) => item.id === event.taskId) : undefined;
      if (task) {
        setState(null);
        onTaskClick(task);
        return;
      }
      setState({ kind: 'edit', event, anchorEl, key: event.id });
    },
    [onTaskClick, tasks],
  );

  const popover: React.ReactNode = state ? (
    <EventPopover
      key={state.key}
      event={state.kind === 'edit' ? state.event : undefined}
      draft={state.kind === 'create' ? state.draft : undefined}
      anchorEl={state.anchorEl}
      onCreateEvent={onAddEvent}
      onCreateTask={onCreateScheduledTask}
      onUpdate={onUpdateEvent}
      onDelete={onDeleteEvent}
      onClose={close}
    />
  ) : null;

  return { openCreate, openEvent, popover, draft: state?.kind === 'create' ? state.draft : null };
}
