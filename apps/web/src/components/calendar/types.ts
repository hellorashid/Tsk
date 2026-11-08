import type { ScheduleCardData, ScheduleCardInput, ScheduleCardUpdate } from '../../utils/schedule';
import type { EventKind } from '../../utils/calendar';
import type { Task } from '../../utils/types';

export interface ScheduledTaskInput {
  name: string;
  start: Date;
  durationMinutes: number;
}

export interface CalendarViewProps {
  events: ScheduleCardData[];
  tasks: Task[];
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
  onTaskClick: (task: Task) => void;
  onAddEvent: (eventData: ScheduleCardInput) => Promise<ScheduleCardData>;
  onCreateScheduledTask: (task: ScheduledTaskInput) => Promise<void>;
  onUpdateEvent: (id: string, changes: ScheduleCardUpdate) => Promise<void> | void;
  onDeleteEvent: (id: string) => Promise<void> | void;
  isMobile: boolean;
  tasksCollapsed?: boolean;
  /** Desktop only: hides or shows the tasks column beside the calendar. */
  onToggleTasks?: () => void;
}

export const eventToneClass = (kind: EventKind, isDarkMode: boolean): string => {
  if (isDarkMode) {
    if (kind === 'event') return 'bg-white/[0.18] hover:bg-white/[0.26] text-white';
    if (kind === 'task') return 'bg-white/[0.08] hover:bg-white/[0.15] ring-1 ring-inset ring-white/20 text-gray-100';
    return 'bg-white/[0.04] hover:bg-white/[0.09] text-gray-400';
  }
  if (kind === 'event') return 'bg-white/90 hover:bg-white shadow-sm text-gray-900';
  if (kind === 'task') return 'bg-white/40 hover:bg-white/65 ring-1 ring-inset ring-black/15 text-gray-900';
  return 'bg-white/25 hover:bg-white/45 text-gray-500';
};
