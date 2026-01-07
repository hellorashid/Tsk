import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Folder } from '../utils/types';
import { ScheduleCardData, getEventDuration, getTimeFromDateTime, minutesToDateTime } from './ScheduleCard';
import Checkbox from './Checkbox';
import { useBasic, useQuery } from '@basictech/react';
import { useTheme } from '../contexts/ThemeContext';
import SubtasksList from './SubtasksList';
import { useAutoResizeTextarea } from '../hooks/useAutoResizeTextarea';

interface DynamicIslandProps {
  selectedTask: Task | null;
  selectedEvent: ScheduleCardData | null;
  onTaskSelect: (task: Task | null) => void;
  onEventSelect: (event: ScheduleCardData | null) => void;
  onAddTask: (taskName: string) => Promise<string | null>;
  onAddEvent?: (eventData: Omit<ScheduleCardData, 'id'>) => Promise<ScheduleCardData>;
  onUpdateTask: (id: string, changes: any) => void;
  onDeleteTask: (id: string) => void;
  onUpdateEvent?: (id: string, changes: Partial<ScheduleCardData>) => void;
  onDeleteEvent?: (id: string) => void;
  onAddToSchedule?: (task: Task) => void;
  onAddSubtask?: (parentTaskId: string, name: string) => Promise<string | null>;
  onEnterFocus?: (task: Task) => void;
  tasks?: Task[]; // Add tasks list to find newly created task
  folders?: Folder[]; // Add folders list
  activeFolder?: string | null;
  onFolderSelect?: (folderId: string | null) => void;
  onOpenFolderSettings?: () => void;
  showAllFolder?: boolean;
  showOtherFolder?: boolean;
  showTodayFolder?: boolean;
  mode?: 'default' | 'task' | 'event' | 'command';
  onModeChange?: (mode: 'default' | 'task' | 'event' | 'command') => void;
  onOpenSettings?: () => void;
  onToggleView?: () => void;
  currentView?: 'timeline' | 'agenda';
}

const DynamicIsland: React.FC<DynamicIslandProps> = ({
  selectedTask,
  selectedEvent,
  onTaskSelect,
  onEventSelect,
  onAddTask,
  onAddEvent,
  onUpdateTask,
  onDeleteTask,
  onUpdateEvent,
  onDeleteEvent,
  onAddToSchedule,
  onAddSubtask,
  onEnterFocus,
  tasks,
  folders,
  activeFolder,
  onFolderSelect,
  onOpenFolderSettings,
  showAllFolder = true,
  showOtherFolder = false,
  showTodayFolder = true,
  mode = 'default',
  onModeChange,
  onOpenSettings,
  onToggleView,
  currentView
}) => {
  const { theme } = useTheme();
  const { accentColor, isDarkMode } = theme;
  
  const [inputValue, setInputValue] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [isActivityExpanded, setIsActivityExpanded] = useState(false);
  
  // Activity editing state
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editActivityDate, setEditActivityDate] = useState('');
  const [editActivityStartTime, setEditActivityStartTime] = useState('');
  const [editActivityEndTime, setEditActivityEndTime] = useState('');
  // Internal creationMode is replaced by the controlled 'mode' prop
  // const [creationMode, setCreationMode] = useState<'task' | 'event'>('task');
  
  // Derive effective creation mode for UI rendering logic
  // If mode is 'command', we don't use this derived value directly for rendering the input form
  const creationMode = mode === 'event' ? 'event' : 'task';

  const [isInputFocused, setIsInputFocused] = useState(false);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);
  const eventTitleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const eventDescTextareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if ANY mode is active (task, event, command) to determine if island is expanded
  // Previously it only checked for selectedTask/selectedEvent, but now we have 'command' mode
  const isExpanded = selectedTask !== null || selectedEvent !== null || mode === 'command';
  const isEventView = selectedEvent !== null;
  
  // Fetch scheduled events for the selected task
  const { db } = useBasic();
  
  // Fetch live task data from database (like ScheduleCard does)
  const liveTask = useQuery(
    () => selectedTask?.id 
      ? db.collection('tasks').get(selectedTask.id)
      : null,
    [selectedTask?.id]
  );
  
  // Fetch live event data from database (same pattern as tasks)
  const liveEvent = useQuery(
    () => selectedEvent?.id 
      ? db.collection('schedule').get(selectedEvent.id)
      : null,
    [selectedEvent?.id]
  );
  
  // Use live data if available, otherwise fall back to props
  const currentTask = liveTask || selectedTask;
  const currentEvent = liveEvent || selectedEvent;
  
  const scheduledEvents = useQuery(
    () => selectedTask?.id 
      ? db.collection('schedule')
          .filter((event) => (event as ScheduleCardData).taskId === selectedTask.id)
       
      : null,
    [selectedTask?.id]
  ) as ScheduleCardData[] | null;
  console.log("scheduledEvents:", scheduledEvents);

  // Check if task has any scheduled events for today
  const hasScheduledEventToday = (() => {
    if (!scheduledEvents || scheduledEvents.length === 0) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return scheduledEvents.some((event) => {
      let eventDate: Date | null = null;
      
      if (event.start?.dateTime) {
        eventDate = new Date(event.start.dateTime);
        eventDate.setHours(0, 0, 0, 0);
      } else if (event.start?.date) {
        eventDate = new Date(event.start.date);
        eventDate.setHours(0, 0, 0, 0);
      }
      
      if (!eventDate) return false;
      
      return eventDate.getTime() >= today.getTime() && eventDate.getTime() < tomorrow.getTime();
    });
  })();

  // Query subtasks for deleted task (if viewing a deleted task schedule item)
  const deletedTaskSubtasks = useQuery(
    () => selectedEvent?.type === 'task' && 
          (!selectedEvent?.taskId || selectedEvent?.taskId === '') && 
          selectedEvent?.metadata?.taskSnapshot?.id 
      ? db.collection('tasks')
          .filter((task: any) => task.parentTaskId === selectedEvent.metadata?.taskSnapshot?.id)
      : null,
    [selectedEvent?.metadata?.taskSnapshot?.id]
  );

  // Query subtasks for the selected task
  const subtasks = (useQuery(
    () => selectedTask?.id && !selectedTask?.parentTaskId
      ? db.collection('tasks').filter((t) => (t as Task).parentTaskId === selectedTask.id)
      : null,
    [selectedTask?.id, selectedTask?.parentTaskId]
  ) || []) as Task[];

  // Watch for newly created task to appear in tasks list
  useEffect(() => {
    if (pendingTaskId && tasks) {
      const foundTask = tasks.find(t => t.id === pendingTaskId);
      if (foundTask) {
        onTaskSelect(foundTask);
        setPendingTaskId(null);
      }
    }
  }, [tasks, pendingTaskId, onTaskSelect]);

  // Update title and description when task changes
  useEffect(() => {
    if (currentTask) {
      setTitle(currentTask.name || '');
      setDescription(currentTask.description || '');
    } else {
      setTitle('');
      setDescription('');
      setInputValue('');
    }
  }, [currentTask]);

  // Calculate end time from start time and duration
  const calculateEndTime = (startTime: string, duration: number): string => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMins = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  // Calculate duration from start and end time
  const calculateDuration = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 60;
    const [startHours, startMins] = startTime.split(':').map(Number);
    const [endHours, endMins] = endTime.split(':').map(Number);
    const startTotal = startHours * 60 + startMins;
    const endTotal = endHours * 60 + endMins;
    let duration = endTotal - startTotal;
    if (duration < 0) duration += 24 * 60; // Handle midnight crossover
    return duration;
  };
  
  // Format date/time for display
  const formatScheduledTime = (event: ScheduleCardData): string => {
    if (!event.start.dateTime) return '';
    
    const startDate = new Date(event.start.dateTime);
    const endDate = event.end.dateTime ? new Date(event.end.dateTime) : null;
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format date
    let dateStr = '';
    if (startDate.toDateString() === today.toDateString()) {
      dateStr = 'Today';
    } else if (startDate.toDateString() === tomorrow.toDateString()) {
      dateStr = 'Tomorrow';
    } else {
      dateStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    // Format time
    const startTimeStr = startDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    const endTimeStr = endDate ? endDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }) : '';
    
    return endTimeStr ? `${dateStr} at ${startTimeStr} - ${endTimeStr}` : `${dateStr} at ${startTimeStr}`;
  };

  // Update event fields when event changes
  useEffect(() => {
    if (currentEvent) {
      setEventTitle(currentEvent.title || '');
      setEventDescription(currentEvent.description || '');
      const startTime = currentEvent.start.dateTime ? getTimeFromDateTime(currentEvent.start.dateTime) : '';
      const endTime = currentEvent.end.dateTime ? getTimeFromDateTime(currentEvent.end.dateTime) : '';
      setEventStartTime(startTime);
      setEventEndTime(endTime);
    } else {
      setEventTitle('');
      setEventDescription('');
      setEventStartTime('');
      setEventEndTime('');
    }
  }, [currentEvent]);

  // Auto-resize textareas using custom hook
  useAutoResizeTextarea(titleTextareaRef, title);
  useAutoResizeTextarea(descTextareaRef, description);
  useAutoResizeTextarea(eventTitleTextareaRef, eventTitle);
  useAutoResizeTextarea(eventDescTextareaRef, eventDescription);

  // Focus input when collapsed or when mode changes to task/event/command
  useEffect(() => {
    if (!isExpanded && inputRef.current) {
      // In default mode (collapsed), focus the input
      inputRef.current.focus();
    } else if ((mode === 'task' || mode === 'event') && !selectedTask && !selectedEvent) {
      // When switching to task/event creation mode (and NOT viewing an existing one), focus input
      inputRef.current?.focus();
    }
  }, [isExpanded, mode, selectedTask, selectedEvent]);

  // Command Palette State
  const [commandSearch, setCommandSearch] = useState('');
  const [selectedActionIndex, setSelectedActionIndex] = useState(0);
  const commandInputRef = useRef<HTMLInputElement>(null);

  // Reset command search when entering command mode
  useEffect(() => {
    if (mode === 'command') {
      setCommandSearch('');
      setSelectedActionIndex(0);
    }
  }, [mode]);

  // Define available commands
  const folderCommands = folders?.map(folder => ({
    id: `folder-${folder.id}`,
    label: `Switch to ${folder.name.charAt(0).toUpperCase() + folder.name.slice(1).toLowerCase()}`,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
    action: () => {
      onFolderSelect?.(folder.id);
      onModeChange?.('default');
    },
    disabled: false
  })) || [];

  const allFolderCommand = showAllFolder ? [{
    id: 'folder-all',
    label: 'Switch to All Tasks',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
    action: () => {
      onFolderSelect?.('all');
      onModeChange?.('default');
    },
    disabled: false
  }] : [];

  const otherFolderCommands = [
    ...(showOtherFolder ? [{
      id: 'folder-other',
      label: 'Switch to Other',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      action: () => {
        onFolderSelect?.('other');
        onModeChange?.('default');
      },
      disabled: false
    }] : []),
    ...(showTodayFolder ? [{
      id: 'folder-today',
      label: 'Switch to Today',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      action: () => {
        onFolderSelect?.('today');
        onModeChange?.('default');
      },
      disabled: false
    }] : [])
  ];

  const commands = [
    ...allFolderCommand,
    ...folderCommands,
    ...otherFolderCommands,
    {
      id: 'new-task',
      label: 'Create New Task',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
        </svg>
      ),
      action: () => onModeChange?.('task'),
      disabled: false
    },
    {
      id: 'new-event',
      label: 'Create New Event',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      ),
      action: () => onModeChange?.('event'),
      disabled: false
    },
    {
      id: 'focus-mode',
      label: 'Start Focus Mode',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
        </svg>
      ),
      action: () => {
        if (selectedTask && onEnterFocus) {
          onEnterFocus(selectedTask);
          onModeChange?.('default');
        }
      },
      disabled: !selectedTask
    },
    {
      id: 'toggle-view',
      label: `Switch to ${currentView === 'agenda' ? 'Timeline' : 'Agenda'} View`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      ),
      action: () => {
        onToggleView?.();
        onModeChange?.('default');
      },
      disabled: !onToggleView || false
    },
    {
      id: 'folder-settings',
      label: 'Folder Settings',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      action: () => {
        onOpenFolderSettings?.();
        onModeChange?.('default');
      },
      disabled: !onOpenFolderSettings || false
    },
    {
      id: 'settings',
      label: 'Open Settings',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      ),
      action: () => {
        onOpenSettings?.();
        onModeChange?.('default');
      },
      disabled: !onOpenSettings || false
    }
  ];

  // Filter commands based on search
  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(commandSearch.toLowerCase()) &&
    !cmd.disabled
  );

  const handleCommandKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedActionIndex(prev => 
        prev < filteredCommands.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedActionIndex(prev => 
        prev > 0 ? prev - 1 : filteredCommands.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedActionIndex]) {
        filteredCommands[selectedActionIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onModeChange?.('default');
    }
  };

  // Handle Esc key to close dialog
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        // Always close when expanded on Esc, regardless of focus
        // This overrides the previous check that prevented closing when textarea was focused
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        onModeChange?.('default');
      }
    };

    // Use capturing phase to intercept before other handlers if needed, 
    // though bubbling (default) is usually fine if we stop propagation.
    // We'll stick to standard bubbling but ensure we catch it.
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isExpanded, onModeChange]);

  // Textarea specific key handlers (Enter for submit/newline, but NOT Esc since that's handled globally now)
  const handleTextareaKeyDown = (e: React.KeyboardEvent, type: 'title' | 'description') => {
    if (e.key === 'Enter' && !e.shiftKey && type === 'title') {
      e.preventDefault();
      descTextareaRef.current?.focus();
    } 
    // Esc handling removed from here as the global handler above covers it
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const title = inputValue.trim();
      const titleValue = title;
      setInputValue('');
      
      if (creationMode === 'task') {
        await onAddTask(titleValue);
      } else if (creationMode === 'event' && onAddEvent) {
        const now = new Date();
        const startDateTime = now.toISOString();
        const endDateTime = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
        const newEvent = await onAddEvent({
          title: titleValue,
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
        });
        // If event was returned, select it to open in island
        if (newEvent) {
          onEventSelect(newEvent);
        }
      }
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleClose();
      onModeChange?.('default');
      return;
    }

    if (e.key === 'Tab') {
      // Tab: cycle between task and event modes
      e.preventDefault();
      e.stopPropagation();
      // Toggle mode via prop
      if (mode === 'task') {
        onModeChange?.('event');
      } else if (mode === 'event') {
        onModeChange?.('task');
      } else {
         // Default behavior if in some other mode (e.g. default -> task)
         onModeChange?.('task');
      }
      return;
    }

    if (e.key === '/') {
       // Slash command to open command palette
       e.preventDefault();
       onModeChange?.('command');
       return;
    }

    if (e.key === 'Enter' && e.shiftKey) {
      // Shift+Enter: create task/event and open it
      e.preventDefault();
      e.stopPropagation();

      if (inputValue.trim()) {
        const title = inputValue.trim();
        setInputValue('');
        
        if (creationMode === 'task') {
          try {
            const newTaskId = await onAddTask(title);
            console.log("newTaskId:", newTaskId);
            
            if (newTaskId) {
              // Try to find the task in the current tasks list
              const foundTask = tasks?.find(t => t.id === newTaskId);
              
              if (foundTask) {
                // Task is already in the list, select it immediately
                onTaskSelect(foundTask);
              } else {
                // Task not in list yet, set pending ID and useEffect will handle it
                setPendingTaskId(newTaskId);
                // Fallback: wait a bit longer and check again
                setTimeout(() => {
                  const taskFromList = tasks?.find(t => t.id === newTaskId);
                  if (taskFromList) {
                    onTaskSelect(taskFromList);
                    setPendingTaskId(null);
                  } else {
                    // If still not found, keep pending ID and let useEffect handle it
                    console.log('Task not found yet, waiting for query update...');
                  }
                }, 300);
              }
            }
          } catch (error) {
            console.error('Error creating task:', error);
            setPendingTaskId(null);
          }
        } else if (creationMode === 'event' && onAddEvent) {
          // Create event and open it
          const now = new Date();
          const startDateTime = now.toISOString();
          const endDateTime = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
          const newEvent = await onAddEvent({
            title: title,
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
          });
          // If event was returned, select it to open in island
          if (newEvent) {
            onEventSelect(newEvent);
          }
        }
      }
      return;
    }
    // Regular Enter will submit the form normally (creates task or event based on mode, opens event automatically)
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    if (selectedTask && title.trim() !== selectedTask.name) {
      onUpdateTask(selectedTask.id, { name: title.trim() });
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleDescriptionBlur = () => {
    if (selectedTask && description !== selectedTask.description) {
      onUpdateTask(selectedTask.id, { description });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedTask) {
      onUpdateTask(selectedTask.id, { completed: e.target.checked });
    }
  };

  const handleDelete = () => {
    if (selectedTask) {
      onDeleteTask(selectedTask.id);
      onTaskSelect(null);
    }
  };

  const handleClose = () => {
    // Save pending task changes before closing
    if (selectedTask) {
      if (title.trim() !== selectedTask.name) {
        onUpdateTask(selectedTask.id, { name: title.trim() });
      }
      if (description !== selectedTask.description) {
        onUpdateTask(selectedTask.id, { description });
      }
    }
    // Save pending event changes before closing
    if (currentEvent && onUpdateEvent) {
      if (eventTitle.trim() !== currentEvent.title) {
        onUpdateEvent(currentEvent.id, { title: eventTitle.trim() });
      }
      if (eventDescription !== currentEvent.description) {
        onUpdateEvent(currentEvent.id, { description: eventDescription });
      }
    }
    
    onTaskSelect(null);
    onEventSelect(null);
    setInputValue('');
    setEventTitle('');
    setEventDescription('');
    setEventStartTime('');
    setEventEndTime('');
  };

  // Get current time in HH:MM format
  const getCurrentTime = (): string => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Handle switching to event mode
  const handleSwitchToEvent = () => {
    onModeChange?.('event');
  };

  // Handle switching to task mode
  const handleSwitchToTask = () => {
    onModeChange?.('task');
  };


  // Event handlers
  const handleEventTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEventTitle(e.target.value);
  };

  const handleEventTitleBlur = () => {
    if (currentEvent && eventTitle.trim() !== currentEvent.title && onUpdateEvent) {
      onUpdateEvent(currentEvent.id, { title: eventTitle.trim() });
    }
  };

  const handleEventTitleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEventTitleBlur();
      eventTitleTextareaRef.current?.blur();
    }
  };

  const handleEventDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEventDescription(e.target.value);
  };

  const handleEventDescriptionBlur = () => {
    if (currentEvent && eventDescription !== currentEvent.description && onUpdateEvent) {
      onUpdateEvent(currentEvent.id, { description: eventDescription });
    }
  };

  const handleEventDescriptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Esc handling is now global, but we can keep this if we want to explicitly blur first?
    // Actually, the global handler calls handleClose which resets everything, so this is redundant/conflicting.
    // Removing the stopPropagation here so the global handler catches it.
    if (e.key === 'Escape') {
       // Let global handler take over
       return; 
    }
  };

  const handleEventStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEventStartTime(e.target.value);
  };

  const handleEventStartTimeBlur = () => {
    const currentStartTime = currentEvent?.start.dateTime ? getTimeFromDateTime(currentEvent.start.dateTime) : '';
    if (currentEvent && eventStartTime !== currentStartTime && onUpdateEvent) {
      // Parse the time and update the event
      const baseDate = currentEvent.start.dateTime ? new Date(currentEvent.start.dateTime) : new Date();
      const [hours, minutes] = eventStartTime.split(':').map(Number);
      baseDate.setHours(hours, minutes, 0, 0);
      
      // If end time is set, update both start and end
      if (eventEndTime) {
        const [endHours, endMinutes] = eventEndTime.split(':').map(Number);
        const endDate = new Date(baseDate);
        endDate.setHours(endHours, endMinutes, 0, 0);
        
        onUpdateEvent(currentEvent.id, {
          start: {
            ...currentEvent.start,
            dateTime: baseDate.toISOString()
          },
          end: {
            ...currentEvent.end,
            dateTime: endDate.toISOString()
          }
        });
      } else {
        // Just update start time, keep duration the same
        const currentDuration = getEventDuration(currentEvent as ScheduleCardData);
        const endDate = new Date(baseDate.getTime() + currentDuration * 60000);
        
        onUpdateEvent(currentEvent.id, {
          start: {
            ...currentEvent.start,
            dateTime: baseDate.toISOString()
          },
          end: {
            ...currentEvent.end,
            dateTime: endDate.toISOString()
          }
        });
        setEventEndTime(getTimeFromDateTime(endDate.toISOString()));
      }
    }
  };

  const handleEventEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEventEndTime(e.target.value);
  };

  const handleEventEndTimeBlur = () => {
    const currentEndTime = currentEvent?.end.dateTime ? getTimeFromDateTime(currentEvent.end.dateTime) : '';
    if (currentEvent && eventEndTime !== currentEndTime && onUpdateEvent) {
      // Parse the end time and update the event
      const baseDate = currentEvent.start.dateTime ? new Date(currentEvent.start.dateTime) : new Date();
      const [endHours, endMinutes] = eventEndTime.split(':').map(Number);
      const endDate = new Date(baseDate);
      endDate.setHours(endHours, endMinutes, 0, 0);
      
      onUpdateEvent(currentEvent.id, {
        end: {
          ...currentEvent.end,
          dateTime: endDate.toISOString()
        }
      });
    }
  };

  const handleEventDelete = () => {
    if (currentEvent && onDeleteEvent) {
      onDeleteEvent(currentEvent.id);
      onEventSelect(null);
    }
  };

  // Activity editing handlers
  const handleOpenActivityEdit = (event: ScheduleCardData) => {
    const startDate = event.start.dateTime ? new Date(event.start.dateTime) : new Date();
    const endDate = event.end.dateTime ? new Date(event.end.dateTime) : startDate;
    
    // Format date as YYYY-MM-DD
    const dateStr = startDate.toISOString().split('T')[0];
    
    // Format times as HH:MM
    const startTimeStr = startDate.toTimeString().slice(0, 5);
    const endTimeStr = endDate.toTimeString().slice(0, 5);
    
    setEditingActivityId(event.id);
    setEditActivityDate(dateStr);
    setEditActivityStartTime(startTimeStr);
    setEditActivityEndTime(endTimeStr);
  };

  // Error state for activity editing validation
  const [activityEditError, setActivityEditError] = useState<string | null>(null);

  const handleSaveActivityEdit = (eventId: string) => {
    if (!onUpdateEvent || !editActivityDate || !editActivityStartTime || !editActivityEndTime) return;
    
    // Clear any previous error
    setActivityEditError(null);
    
    // Parse date and times
    const [year, month, day] = editActivityDate.split('-').map(Number);
    const [startHours, startMinutes] = editActivityStartTime.split(':').map(Number);
    const [endHours, endMinutes] = editActivityEndTime.split(':').map(Number);
    
    const startDate = new Date(year, month - 1, day, startHours, startMinutes, 0, 0);
    const endDate = new Date(year, month - 1, day, endHours, endMinutes, 0, 0);
    
    // Validate: end time must be after start time
    if (endDate <= startDate) {
      setActivityEditError('End time must be after start time');
      return;
    }
    
    onUpdateEvent(eventId, {
      start: {
        dateTime: startDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    });
    
    setEditingActivityId(null);
  };

  const handleCancelActivityEdit = () => {
    setEditingActivityId(null);
    setEditActivityDate('');
    setEditActivityStartTime('');
    setEditActivityEndTime('');
    setActivityEditError(null);
  };

  const getBackgroundColor = () => {
    return `${accentColor}E6`; // 90% opacity
  };

  return (
    <div 
      className="fixed bottom-4 z-50 max-w-4xl px-4"
      style={{
        left: '50%',
        transform: 'translateX(calc(-50% - 240px))', // Center in left column (schedule is ~480px, so shift left by half)
        width: 'calc(50% - 240px - 2rem)', // Constrain to tasks column width
        minWidth: '500px', // Ensure minimum width
      }}
    >
      <motion.div
        initial={false}
        animate={{
          borderRadius: isExpanded ? '1rem' : '2rem',
          height: isExpanded ? 'auto' : '3.5rem',
        }}
        transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
        className={`overflow-hidden backdrop-blur-3xl ${
          isDarkMode ? 'text-gray-100' : 'text-gray-900'
        }`}
        style={{
          backgroundColor: getBackgroundColor(),
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <AnimatePresence mode="wait">
          {mode === 'command' ? (
             <motion.div
              key="command-palette"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.1 }}
              className="flex flex-col-reverse max-h-[300px]"
            >
              <div className="flex items-center h-14 px-4 gap-3 border-t border-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                <input
                  ref={commandInputRef}
                  type="text"
                  value={commandSearch}
                  onChange={(e) => {
                    setCommandSearch(e.target.value);
                    setSelectedActionIndex(0);
                  }}
                  onKeyDown={handleCommandKeyDown}
                  placeholder="Type a command..."
                  autoFocus
                  className={`flex-1 bg-transparent border-none outline-none ${
                    isDarkMode ? 'text-gray-100 placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                  } text-sm`}
                  autoComplete="off"
                />
                <div className={`text-xs px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
                  ESC
                </div>
              </div>
              
              <div className="overflow-y-auto py-2">
                {filteredCommands.length > 0 ? (
                  filteredCommands.map((cmd, index) => (
                    <button
                      key={cmd.id}
                      onClick={() => cmd.action()}
                      className={`w-full px-4 py-2 flex items-center gap-3 text-left transition-colors ${
                        index === selectedActionIndex
                          ? isDarkMode ? 'bg-white/10' : 'bg-gray-100'
                          : 'hover:bg-white/5'
                      } ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
                    >
                      <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {cmd.icon}
                      </div>
                      <span className="flex-1">{cmd.label}</span>
                      {index === selectedActionIndex && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))
                ) : (
                  <div className={`px-4 py-3 text-center text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    No commands found
                  </div>
                )}
              </div>
            </motion.div>
          ) : !isExpanded ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="flex items-center h-14 px-4 gap-3"
            >
              <form 
                onSubmit={handleSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.shiftKey) {
                    e.preventDefault();
                  }
                }}
                className="flex-1 flex items-center gap-3"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  placeholder={creationMode === 'task' ? 'I want to...' : 'Event title...'}
                  className={`flex-1 bg-transparent border-none outline-none ${
                    isDarkMode ? 'text-gray-100 placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                  } text-sm`}
                  autoComplete="off"
                  inputMode="text"
                />
              </form>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSwitchToTask}
                  className={`p-2 rounded-lg transition-all ${
                    isInputFocused || inputValue.trim()
                      ? creationMode === 'task'
                        ? isDarkMode 
                          ? 'bg-white/20 text-white' 
                          : 'bg-gray-800 text-white'
                        : isDarkMode
                          ? 'bg-transparent text-gray-400 hover:text-gray-100 hover:bg-white/10'
                          : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      : isDarkMode
                        ? 'bg-transparent text-gray-400/40 hover:text-gray-400/60'
                        : 'bg-transparent text-gray-600/40 hover:text-gray-600/60'
                  }`}
                  aria-label="Create task"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={handleSwitchToEvent}
                  className={`p-2 rounded-lg transition-all ${
                    isInputFocused || inputValue.trim()
                      ? creationMode === 'event'
                        ? isDarkMode 
                          ? 'bg-white/20 text-white' 
                          : 'bg-gray-800 text-white'
                        : isDarkMode
                          ? 'bg-transparent text-gray-400 hover:text-gray-100 hover:bg-white/10'
                          : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      : isDarkMode
                        ? 'bg-transparent text-gray-400/40 hover:text-gray-400/60'
                        : 'bg-transparent text-gray-600/40 hover:text-gray-600/60'
                  }`}
                  aria-label="Create event"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </motion.div>
          ) : isEventView ? (
            // Check if this is a completion event
            currentEvent?.type === 'task:completed' ? (
              // Simple read-only view for task completion
              <motion.div
                key="expanded-completion"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
                className="p-4 space-y-4"
              >
                {/* Header with checkmark and close button */}
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      {currentEvent.title}
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className={`p-1.5 rounded-full bg-transparent hover:bg-white/10 transition-colors ${
                      isDarkMode ? 'text-gray-400 hover:text-gray-100' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    aria-label="Close"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {/* Completion info */}
                <div className={`space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">
                      Completed: {currentEvent.start.dateTime && new Date(currentEvent.start.dateTime).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Info banner */}
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg 
                      className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" 
                      fill="none" 
                      strokeWidth="2" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-green-300">Task Completed</p>
                      <p className="text-xs text-green-200/80 mt-0.5">
                        This is a completion activity record.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex justify-start gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={handleEventDelete}
                    className={`p-2 rounded-lg bg-transparent transition-colors ${
                      isDarkMode 
                        ? 'text-red-400 hover:bg-red-400/10' 
                        : 'text-red-600 hover:bg-red-100'
                    }`}
                    aria-label="Delete activity record"
                    title="Delete this activity record"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            ) : currentEvent?.type === 'task' && (!currentEvent?.taskId || currentEvent?.taskId === '') && currentEvent?.metadata?.taskSnapshot ? (
              // Read-only view for deleted task
              <motion.div
                    key="expanded-deleted-task"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
                    className="p-4 space-y-4"
                  >
                    {/* Header with checkbox and close button - matching regular task layout */}
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`dynamic-island-deleted-${currentEvent.id}`}
                        size="sm"
                        checked={currentEvent.metadata.taskSnapshot.completed}
                        onChange={() => {}} // No-op for deleted tasks
                        disabled={true}
                      />
                      <div className="flex-1">
                        <div className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                          {currentEvent.metadata.taskSnapshot.name}
                        </div>
                      </div>
                      <button
                        onClick={handleClose}
                        className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${
                          isDarkMode ? 'text-gray-400 hover:text-gray-100' : 'text-gray-600 hover:text-gray-900'
                        }`}
                        aria-label="Close"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>

                    {/* Subtasks Section - read-only */}
                    {deletedTaskSubtasks && deletedTaskSubtasks.length > 0 && (
                      <div className="space-y-2">
                        <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Subtasks ({deletedTaskSubtasks.length})
                        </div>
                        <div className="space-y-1">
                          {deletedTaskSubtasks.map((subtask: any) => (
                            <div 
                              key={subtask.id} 
                              className={`flex items-center gap-2 p-2 rounded ${
                                isDarkMode ? 'bg-white/5' : 'bg-gray-100'
                              }`}
                            >
                              <Checkbox
                                id={`deleted-subtask-${subtask.id}`}
                                size="sm"
                                checked={subtask.completed}
                                onChange={() => {}} // No-op
                                disabled={true}
                              />
                              <span className={`text-sm ${
                                subtask.completed ? 'line-through opacity-60' : ''
                              } ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {subtask.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description Section - matching regular task layout */}
                <div className={`w-full min-h-[100px] whitespace-pre-wrap ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {currentEvent.metadata.taskSnapshot.description || 'No description'}
                </div>

                {/* Schedule info */}
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Scheduled: {currentEvent.start.dateTime && new Date(currentEvent.start.dateTime).toLocaleString()}
                </div>

                {/* Warning banner */}
                <div className="p-3 bg-yellow-500/15 border border-yellow-500/25 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg 
                      className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" 
                      fill="none" 
                      strokeWidth="2" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-yellow-300">Task Deleted</p>
                      <p className="text-xs text-yellow-200/80 mt-0.5">
                        This task was deleted on {currentEvent?.metadata?.taskSnapshot?.deletedAt ? new Date(currentEvent.metadata.taskSnapshot.deletedAt).toLocaleDateString() : 'unknown date'}. This is read only.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions Footer - matching regular task layout */}
                <div className="flex justify-start gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={handleEventDelete}
                    className={`p-2 rounded-lg bg-transparent transition-colors ${
                      isDarkMode 
                        ? 'text-red-400 hover:bg-red-400/10' 
                        : 'text-red-600 hover:bg-red-100'
                    }`}
                    aria-label="Remove from schedule"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            ) : (
              // Regular event view
              <motion.div
                key="expanded-event"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
                className="p-4 space-y-4"
              >
                {/* Header with close button */}
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <textarea
                      ref={eventTitleTextareaRef}
                      value={eventTitle}
                      onChange={handleEventTitleChange}
                      onBlur={handleEventTitleBlur}
                      onKeyDown={handleEventTitleKeyDown}
                      className={`w-full bg-transparent focus:outline-none text-lg font-medium min-h-[2rem] resize-none overflow-hidden border border-transparent rounded ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-900'
                      }`}
                      rows={1}
                      style={{ height: 'auto' }}
                      placeholder="Event title..."
                    />
                  </div>
                  <button
                    onClick={handleClose}
                    className={`p-1.5 rounded-full bg-transparent hover:bg-white/10 transition-colors ${
                      isDarkMode ? 'text-gray-400 hover:text-gray-100' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    aria-label="Close"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {/* Time */}
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={eventStartTime}
                    onChange={handleEventStartTimeChange}
                    onBlur={handleEventStartTimeBlur}
                    className={`flex-1 bg-transparent border border-white/10 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 ${
                      isDarkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}
                  />
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>–</span>
                  <input
                    type="time"
                    value={eventEndTime}
                    onChange={handleEventEndTimeChange}
                    onBlur={handleEventEndTimeBlur}
                    className={`flex-1 bg-transparent border border-white/10 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 ${
                      isDarkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}
                  />
                </div>

                {/* Description */}
                <textarea
                  ref={eventDescTextareaRef}
                  value={eventDescription}
                  onChange={handleEventDescriptionChange}
                  onBlur={handleEventDescriptionBlur}
                  onKeyDown={handleEventDescriptionKeyDown}
                  className={`w-full bg-transparent focus:outline-none min-h-[100px] resize-none border border-transparent rounded ${
                    isDarkMode ? 'text-gray-300 placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'
                  }`}
                  placeholder="Add a description..."
                  style={{ height: 'auto' }}
                />

                {/* Actions */}
                <div className="flex justify-start gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={handleEventDelete}
                    className={`p-2 rounded-lg bg-transparent transition-colors ${
                      isDarkMode 
                        ? 'text-red-400 hover:bg-red-400/10' 
                        : 'text-red-600 hover:bg-red-100'
                    }`}
                    aria-label="Delete event"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )
          ) : (
            <motion.div
              key="expanded-task"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
              className="p-4 flex flex-col max-h-[70vh]"
            >
              {/* Header with checkbox and close button - sticky */}
              <div className="flex items-center gap-3 pb-4 flex-shrink-0">
                <Checkbox
                  id={`dynamic-island-${currentTask?.id}`}
                  size="sm"
                  checked={currentTask?.completed || false}
                  onChange={handleCheckboxChange}
                />
                <div className="flex-1 flex items-center">
                  <textarea
                    ref={titleTextareaRef}
                    value={title}
                    onChange={handleTitleChange}
                    onBlur={handleTitleBlur}
                    onKeyDown={(e) => handleTextareaKeyDown(e, 'title')}
                    className={`w-full bg-transparent focus:outline-none text-lg font-medium min-h-[2rem] resize-none overflow-hidden border border-transparent rounded ${
                      isDarkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}
                    rows={1}
                    style={{ height: 'auto' }}
                    placeholder="Task title..."
                    autoComplete="off"
                    inputMode="text"
                  />
                </div>
                <button
                  onClick={handleClose}
                  className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${
                    isDarkMode ? 'text-gray-400 hover:text-gray-100' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Scrollable content area - subtasks, description, and activity */}
              <div 
                className="flex-1 overflow-y-auto min-h-0 space-y-4 -mr-4 pr-4"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: isDarkMode ? 'rgba(255,255,255,0.2) transparent' : 'rgba(0,0,0,0.2) transparent',
                }}
              >
                {/* Subtasks Section - Only show if task is not a subtask itself */}
                {selectedTask && !selectedTask.parentTaskId && onAddSubtask && (
                  <SubtasksList
                    key={selectedTask.id}
                    parentTaskId={selectedTask.id}
                    subtasks={subtasks}
                    onAddSubtask={onAddSubtask}
                    onUpdateSubtask={onUpdateTask}
                    onDeleteSubtask={onDeleteTask}
                    showHeader={true}
                  />
                )}

                {/* Description Section */}
                <textarea
                  ref={descTextareaRef}
                  value={description}
                  onChange={handleDescriptionChange}
                  onBlur={handleDescriptionBlur}
                  onKeyDown={(e) => handleTextareaKeyDown(e, 'description')}
                  className={`w-full bg-transparent focus:outline-none min-h-[100px] resize-none overflow-hidden border border-transparent rounded ${
                    isDarkMode ? 'text-gray-300 placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'
                  }`}
                  placeholder="Add a description..."
                  style={{ height: 'auto' }}
                />

              {/* Activity Section - show scheduled events if any exist */}
              {scheduledEvents && scheduledEvents.length > 0 && (() => {
                // Calculate total duration across all activities
                const totalDurationMinutes = scheduledEvents.reduce((total, event) => {
                  if (!event.start.dateTime || !event.end.dateTime) return total;
                  const start = new Date(event.start.dateTime);
                  const end = new Date(event.end.dateTime);
                  const durationMs = end.getTime() - start.getTime();
                  return total + Math.max(0, durationMs / (1000 * 60));
                }, 0);
                
                // Format total duration
                const formatDuration = (minutes: number): string => {
                  if (minutes < 60) return `${Math.round(minutes)}m`;
                  const hours = Math.floor(minutes / 60);
                  const mins = Math.round(minutes % 60);
                  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
                };

                // Sort events chronologically (oldest to newest, top to bottom)
                const sortedEvents = [...scheduledEvents].sort((a, b) => {
                  const dateA = a.start.dateTime ? new Date(a.start.dateTime).getTime() : 0;
                  const dateB = b.start.dateTime ? new Date(b.start.dateTime).getTime() : 0;
                  return dateA - dateB; // Oldest first (chronological)
                });
                // When collapsed, show only the latest (last) activity
                const displayedEvents = isActivityExpanded ? sortedEvents : sortedEvents.slice(-1);
                const hiddenCount = scheduledEvents.length - 1;
                
                return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-semibold uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      Activity
                    </h4>
                    {totalDurationMinutes > 0 && (
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Total: {formatDuration(totalDurationMinutes)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {/* Show "Show more" button above when collapsed */}
                    {!isActivityExpanded && hiddenCount > 0 && (
                      <button
                        onClick={() => setIsActivityExpanded(true)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                          isDarkMode 
                            ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Show {hiddenCount} earlier {hiddenCount === 1 ? 'activity' : 'activities'}...
                      </button>
                    )}
                    
                    {displayedEvents.map((event) => {
                      const isCompletion = event.type === 'task:completed';
                      const isTask = event.type === 'task';
                      const isEditing = editingActivityId === event.id;
                      
                      // Calculate duration for this event
                      let eventDurationMinutes = 0;
                      if (event.start.dateTime && event.end.dateTime) {
                        const start = new Date(event.start.dateTime);
                        const end = new Date(event.end.dateTime);
                        eventDurationMinutes = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60));
                      }
                      
                      // Format text for completion events
                      let displayText = '';
                      if (isCompletion) {
                        const completedDate = event.start.dateTime ? new Date(event.start.dateTime) : new Date();
                        const today = new Date();
                        const dateStr = completedDate.toDateString() === today.toDateString() 
                          ? 'Today' 
                          : completedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        const timeStr = completedDate.toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        });
                        displayText = `completed ${dateStr} at ${timeStr}`;
                      } else {
                        displayText = formatScheduledTime(event);
                      }
                      
                      return (
                        <div
                          key={event.id}
                          className={`relative rounded-lg ${
                            isDarkMode ? 'bg-white/5' : 'bg-gray-100'
                          }`}
                        >
                          {/* Main activity row */}
                          <div className="flex items-center justify-between gap-2 px-3 py-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {isCompletion ? (
                                <svg className={`h-4 w-4 flex-shrink-0 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              ) : isTask ? (
                                <svg className={`h-4 w-4 flex-shrink-0 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                              )}
                              <span className={`text-sm truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {displayText}
                              </span>
                              {eventDurationMinutes > 0 && (
                                <span className={`text-xs flex-shrink-0 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                  ({formatDuration(eventDurationMinutes)})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {/* Edit button - only show for non-completion events */}
                              {!isCompletion && (
                                <button
                                  onClick={() => handleOpenActivityEdit(event)}
                                  className={`p-1 rounded bg-transparent transition-colors ${
                                    isDarkMode 
                                      ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-400/10' 
                                      : 'text-gray-500 hover:text-blue-600 hover:bg-blue-100'
                                  }`}
                                  aria-label="Edit schedule"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                </button>
                              )}
                              {/* Delete button */}
                              <button
                                onClick={() => {
                                  if (onDeleteEvent) {
                                    onDeleteEvent(event.id);
                                  }
                                }}
                                className={`p-1 rounded bg-transparent transition-colors ${
                                  isDarkMode 
                                    ? 'text-gray-400 hover:text-red-400 hover:bg-red-400/10' 
                                    : 'text-gray-500 hover:text-red-600 hover:bg-red-100'
                                }`}
                                aria-label="Remove from schedule"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          
                          {/* Edit popover - inline expansion */}
                          <AnimatePresence>
                            {isEditing && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="overflow-hidden"
                              >
                                <div className={`px-3 pb-3 pt-1 border-t ${
                                  isDarkMode ? 'border-white/10' : 'border-gray-200'
                                }`}>
                                  <div className="space-y-2">
                                    {/* Date input */}
                                    <div>
                                      <label className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date</label>
                                      <input
                                        type="date"
                                        value={editActivityDate}
                                        onChange={(e) => setEditActivityDate(e.target.value)}
                                        className={`w-full mt-1 px-2 py-1.5 text-sm rounded border focus:outline-none focus:ring-2 ${
                                          isDarkMode 
                                            ? 'bg-white/5 border-white/10 text-gray-100 focus:ring-white/30' 
                                            : 'bg-white border-gray-200 text-gray-900 focus:ring-gray-300'
                                        }`}
                                      />
                                    </div>
                                    
                                    {/* Time inputs */}
                                    <div className="flex gap-2">
                                      <div className="flex-1">
                                        <label className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Start</label>
                                        <input
                                          type="time"
                                          value={editActivityStartTime}
                                          onChange={(e) => { setEditActivityStartTime(e.target.value); setActivityEditError(null); }}
                                          className={`w-full mt-1 px-2 py-1.5 text-sm rounded border focus:outline-none focus:ring-2 ${
                                            isDarkMode 
                                              ? 'bg-white/5 border-white/10 text-gray-100 focus:ring-white/30' 
                                              : 'bg-white border-gray-200 text-gray-900 focus:ring-gray-300'
                                          }`}
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <label className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>End</label>
                                        <input
                                          type="time"
                                          value={editActivityEndTime}
                                          onChange={(e) => { setEditActivityEndTime(e.target.value); setActivityEditError(null); }}
                                          className={`w-full mt-1 px-2 py-1.5 text-sm rounded border focus:outline-none focus:ring-2 ${
                                            isDarkMode 
                                              ? 'bg-white/5 border-white/10 text-gray-100 focus:ring-white/30' 
                                              : 'bg-white border-gray-200 text-gray-900 focus:ring-gray-300'
                                          }`}
                                        />
                                      </div>
                                    </div>
                                    
                                    {/* Validation error message */}
                                    {activityEditError && (
                                      <div className={`text-xs px-2 py-1.5 rounded ${
                                        isDarkMode 
                                          ? 'bg-red-500/20 text-red-300' 
                                          : 'bg-red-100 text-red-600'
                                      }`}>
                                        {activityEditError}
                                      </div>
                                    )}
                                    
                                    {/* Action buttons */}
                                    <div className="flex justify-end gap-2 pt-1">
                                      <button
                                        onClick={handleCancelActivityEdit}
                                        className={`px-3 py-1 text-xs rounded transition-colors ${
                                          isDarkMode 
                                            ? 'text-gray-400 hover:bg-white/10' 
                                            : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleSaveActivityEdit(event.id)}
                                        className={`px-3 py-1 text-xs rounded transition-colors ${
                                          isDarkMode 
                                            ? 'bg-white/20 text-white hover:bg-white/30' 
                                            : 'bg-gray-800 text-white hover:bg-gray-700'
                                        }`}
                                      >
                                        Save
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                    
                    {/* Show "Show less" button at bottom when expanded */}
                    {isActivityExpanded && hiddenCount > 0 && (
                      <button
                        onClick={() => setIsActivityExpanded(false)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                          isDarkMode 
                            ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Show less
                      </button>
                    )}
                  </div>
                </div>
                );
              })()}
              </div>

              {/* Actions Footer - sticky */}
              <div className="flex justify-between items-center gap-2 pt-4 border-t border-white/10 flex-shrink-0 mt-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDelete}
                    className={`p-2 rounded-lg bg-transparent transition-colors ${
                      isDarkMode 
                        ? 'text-red-400 hover:bg-red-400/10' 
                        : 'text-red-600 hover:bg-red-100'
                    }`}
                    aria-label="Delete task"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Folder Dropdown */}
                  {folders && folders.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setShowFolderDropdown(!showFolderDropdown)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-colors h-[36px] ${
                          isDarkMode 
                            ? 'text-gray-300 hover:bg-white/10 bg-white/5' 
                            : 'text-gray-600 hover:bg-gray-100 bg-gray-50'
                        }`}
                        aria-label="Select folder"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        {(() => {
                          const taskLabels = currentTask?.labels?.split(',').map((l: string) => l.trim()) || [];
                          const folderLabel = taskLabels.find((l: string) => l.startsWith('folder:'));
                          if (folderLabel) {
                            const folderName = folderLabel.replace('folder:', '');
                            return <span className="capitalize">{folderName}</span>;
                          }
                          return <span>Folder</span>;
                        })()}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {showFolderDropdown && (
                        <>
                          {/* Backdrop to close dropdown */}
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setShowFolderDropdown(false)}
                          />
                          
                          {/* Dropdown menu */}
                          <div 
                            className={`absolute bottom-full left-0 mb-1 min-w-[140px] rounded-lg shadow-lg border z-50 ${
                              isDarkMode 
                                ? 'bg-gray-800 border-white/10' 
                                : 'bg-white border-gray-200'
                            }`}
                            style={{
                              backdropFilter: 'blur(12px)',
                            }}
                          >
                            {/* None option */}
                            <button
                              onClick={() => {
                                if (currentTask) {
                                  const taskLabels = currentTask.labels?.split(',').map((l: string) => l.trim()) || [];
                                  const newLabels = taskLabels.filter((l: string) => !l.startsWith('folder:')).join(',');
                                  onUpdateTask(currentTask.id, { labels: newLabels });
                                }
                                setShowFolderDropdown(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                isDarkMode 
                                  ? 'hover:bg-white/10 text-gray-300' 
                                  : 'hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              None
                            </button>

                            {/* Folder options */}
                            {folders.map((folder) => (
                              <button
                                key={folder.id}
                                onClick={() => {
                                  if (currentTask) {
                                    const taskLabels = currentTask.labels?.split(',').map((l: string) => l.trim()) || [];
                                    const labelsWithoutFolder = taskLabels.filter((l: string) => !l.startsWith('folder:'));
                                    const newLabels = [...labelsWithoutFolder, `folder:${folder.name.toLowerCase()}`].join(',');
                                    onUpdateTask(currentTask.id, { labels: newLabels });
                                  }
                                  setShowFolderDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm transition-colors capitalize ${
                                  isDarkMode 
                                    ? 'hover:bg-white/10 text-gray-300' 
                                    : 'hover:bg-gray-100 text-gray-700'
                                }`}
                              >
                                {folder.name.charAt(0).toUpperCase() + folder.name.slice(1).toLowerCase()}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Add to Today button or Focus button */}
                <div className="flex items-center gap-2">
                  {!currentTask?.completed && !hasScheduledEventToday && (
                    <button
                      onClick={() => {
                        if (selectedTask && onAddToSchedule) {
                          onAddToSchedule(selectedTask);
                        }
                      }}
                      disabled={!selectedTask || !onAddToSchedule}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors h-[36px] ${
                        selectedTask && onAddToSchedule
                          ? isDarkMode 
                            ? 'bg-white/10 hover:bg-white/20 text-white' 
                            : 'bg-gray-800 hover:bg-gray-700 text-white'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      Add to Today
                    </button>
                  )}
                  
                  {/* Focus button - positioned on the right */}
                  {onEnterFocus && currentTask && (
                    <button
                      onClick={() => onEnterFocus(currentTask as Task)}
                      className={`p-2 rounded-lg bg-transparent transition-colors ${
                        isDarkMode 
                          ? 'text-purple-400 hover:bg-purple-400/10' 
                          : 'text-purple-600 hover:bg-purple-100'
                      }`}
                      aria-label="Enter focus mode"
                      title="Focus mode"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default DynamicIsland;
