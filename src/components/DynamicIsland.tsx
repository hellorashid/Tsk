import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '../utils/types';
import { ScheduleCardData, getEventDuration, getTimeFromDateTime, minutesToDateTime } from './ScheduleCard';
import Checkbox from './Checkbox';
import { useBasic, useQuery } from '@basictech/react';
import SubtasksList from './SubtasksList';

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
  tasks?: Task[]; // Add tasks list to find newly created task
  accentColor?: string;
  isDarkMode?: boolean;
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
  tasks,
  accentColor = '#1F1B2F',
  isDarkMode = true
}) => {
  const [inputValue, setInputValue] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [creationMode, setCreationMode] = useState<'task' | 'event'>('task');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);
  const eventTitleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const eventDescTextareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isExpanded = selectedTask !== null || selectedEvent !== null;
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
  
  // Use live task data if available, otherwise fall back to prop
  const currentTask = liveTask || selectedTask;
  
  const scheduledEvents = useQuery(
    () => selectedTask?.id 
      ? db.collection('schedule')
          .filter((event: ScheduleCardData) => event.taskId === selectedTask.id)
       
      : null,
    [selectedTask?.id]
  );
  console.log("scheduledEvents:", scheduledEvents);

  // Query subtasks for the selected task
  const subtasks = useQuery(
    () => selectedTask?.id && !selectedTask?.parentTaskId
      ? db.collection('tasks').filter((t: Task) => t.parentTaskId === selectedTask.id)
      : null,
    [selectedTask?.id, selectedTask?.parentTaskId]
  ) || [];

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
    if (selectedEvent) {
      setEventTitle(selectedEvent.title || '');
      setEventDescription(selectedEvent.description || '');
      const startTime = selectedEvent.start.dateTime ? getTimeFromDateTime(selectedEvent.start.dateTime) : '';
      const endTime = selectedEvent.end.dateTime ? getTimeFromDateTime(selectedEvent.end.dateTime) : '';
      setEventStartTime(startTime);
      setEventEndTime(endTime);
    } else {
      setEventTitle('');
      setEventDescription('');
      setEventStartTime('');
      setEventEndTime('');
    }
  }, [selectedEvent]);

  // Auto-resize textareas
  useEffect(() => {
    if (titleTextareaRef.current) {
      titleTextareaRef.current.style.height = 'auto';
      titleTextareaRef.current.style.height = `${titleTextareaRef.current.scrollHeight}px`;
    }
  }, [title]);

  useEffect(() => {
    if (descTextareaRef.current) {
      descTextareaRef.current.style.height = 'auto';
      descTextareaRef.current.style.height = `${descTextareaRef.current.scrollHeight}px`;
    }
  }, [description]);

  useEffect(() => {
    if (eventTitleTextareaRef.current) {
      eventTitleTextareaRef.current.style.height = 'auto';
      eventTitleTextareaRef.current.style.height = `${eventTitleTextareaRef.current.scrollHeight}px`;
    }
  }, [eventTitle]);

  useEffect(() => {
    if (eventDescTextareaRef.current) {
      eventDescTextareaRef.current.style.height = 'auto';
      eventDescTextareaRef.current.style.height = `${eventDescTextareaRef.current.scrollHeight}px`;
    }
  }, [eventDescription]);

  // Focus input when collapsed
  useEffect(() => {
    if (!isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Handle Esc key to close dialog when not focused on description
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        // Check if the active element is a description textarea
        const activeElement = document.activeElement;
        const isDescriptionFocused = 
          activeElement === descTextareaRef.current ||
          activeElement === eventDescTextareaRef.current;
        
        // Only close if description is not focused
        if (!isDescriptionFocused) {
          handleClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isExpanded]);

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
    if (e.key === 'Tab') {
      // Tab: cycle between task and event modes
      e.preventDefault();
      e.stopPropagation();
      setCreationMode(prev => prev === 'task' ? 'event' : 'task');
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
    setCreationMode('event');
  };

  // Handle switching to task mode
  const handleSwitchToTask = () => {
    setCreationMode('task');
  };


  // Event handlers
  const handleEventTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEventTitle(e.target.value);
  };

  const handleEventTitleBlur = () => {
    if (selectedEvent && eventTitle.trim() !== selectedEvent.title && onUpdateEvent) {
      onUpdateEvent(selectedEvent.id, { title: eventTitle.trim() });
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
    if (selectedEvent && eventDescription !== selectedEvent.description && onUpdateEvent) {
      onUpdateEvent(selectedEvent.id, { description: eventDescription });
    }
  };

  const handleEventDescriptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleEventDescriptionBlur();
      eventDescTextareaRef.current?.blur();
    }
  };

  const handleEventStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEventStartTime(e.target.value);
  };

  const handleEventStartTimeBlur = () => {
    const currentStartTime = selectedEvent?.start.dateTime ? getTimeFromDateTime(selectedEvent.start.dateTime) : '';
    if (selectedEvent && eventStartTime !== currentStartTime && onUpdateEvent) {
      // Parse the time and update the event
      const baseDate = selectedEvent.start.dateTime ? new Date(selectedEvent.start.dateTime) : new Date();
      const [hours, minutes] = eventStartTime.split(':').map(Number);
      baseDate.setHours(hours, minutes, 0, 0);
      
      // If end time is set, update both start and end
      if (eventEndTime) {
        const [endHours, endMinutes] = eventEndTime.split(':').map(Number);
        const endDate = new Date(baseDate);
        endDate.setHours(endHours, endMinutes, 0, 0);
        
        onUpdateEvent(selectedEvent.id, {
          start: {
            ...selectedEvent.start,
            dateTime: baseDate.toISOString()
          },
          end: {
            ...selectedEvent.end,
            dateTime: endDate.toISOString()
          }
        });
      } else {
        // Just update start time, keep duration the same
        const currentDuration = getEventDuration(selectedEvent);
        const endDate = new Date(baseDate.getTime() + currentDuration * 60000);
        
        onUpdateEvent(selectedEvent.id, {
          start: {
            ...selectedEvent.start,
            dateTime: baseDate.toISOString()
          },
          end: {
            ...selectedEvent.end,
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
    const currentEndTime = selectedEvent?.end.dateTime ? getTimeFromDateTime(selectedEvent.end.dateTime) : '';
    if (selectedEvent && eventEndTime !== currentEndTime && onUpdateEvent) {
      // Parse the end time and update the event
      const baseDate = selectedEvent.start.dateTime ? new Date(selectedEvent.start.dateTime) : new Date();
      const [endHours, endMinutes] = eventEndTime.split(':').map(Number);
      const endDate = new Date(baseDate);
      endDate.setHours(endHours, endMinutes, 0, 0);
      
      onUpdateEvent(selectedEvent.id, {
        end: {
          ...selectedEvent.end,
          dateTime: endDate.toISOString()
        }
      });
    }
  };

  const handleEventDelete = () => {
    if (selectedEvent && onDeleteEvent) {
      onDeleteEvent(selectedEvent.id);
      onEventSelect(null);
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent, type: 'title' | 'description') => {
    if (e.key === 'Enter' && !e.shiftKey && type === 'title') {
      e.preventDefault();
      descTextareaRef.current?.focus();
    } else if (e.key === 'Escape' && type === 'description') {
      e.preventDefault();
      e.stopPropagation();
      handleDescriptionBlur();
      descTextareaRef.current?.blur();
    }
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
          {!isExpanded ? (
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
                          ? 'text-gray-400 hover:text-gray-100 hover:bg-white/10'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      : isDarkMode
                        ? 'text-gray-400/40 hover:text-gray-400/60'
                        : 'text-gray-600/40 hover:text-gray-600/60'
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
                          ? 'text-gray-400 hover:text-gray-100 hover:bg-white/10'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      : isDarkMode
                        ? 'text-gray-400/40 hover:text-gray-400/60'
                        : 'text-gray-600/40 hover:text-gray-600/60'
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
                  className={`p-2 rounded-lg transition-colors ${
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
          ) : (
            <motion.div
              key="expanded-task"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
              className="p-4 space-y-4"
            >
              {/* Header with checkbox and close button */}
              <div className="flex items-center gap-3">
                <Checkbox
                  id={`dynamic-island-${currentTask?.id}`}
                  size="sm"
                  checked={currentTask?.completed || false}
                  onChange={handleCheckboxChange}
                  accentColor={accentColor}
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

              {/* Subtasks Section - Only show if task is not a subtask itself */}
              {selectedTask && !selectedTask.parentTaskId && onAddSubtask && (
                <SubtasksList
                  parentTaskId={selectedTask.id}
                  subtasks={subtasks}
                  onAddSubtask={onAddSubtask}
                  onUpdateSubtask={onUpdateTask}
                  onDeleteSubtask={onDeleteTask}
                  accentColor={accentColor}
                  isDarkMode={isDarkMode}
                />
              )}

              {/* Description Section - in the middle */}
              <textarea
                ref={descTextareaRef}
                value={description}
                onChange={handleDescriptionChange}
                onBlur={handleDescriptionBlur}
                onKeyDown={(e) => handleTextareaKeyDown(e, 'description')}
                className={`w-full bg-transparent focus:outline-none min-h-[100px] resize-none border border-transparent rounded ${
                  isDarkMode ? 'text-gray-300 placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'
                }`}
                placeholder="Add a description..."
                style={{ height: 'auto' }}
              />

              {/* Actions Footer */}
              <div className="flex justify-between items-center gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={handleDelete}
                  className={`p-2 rounded-lg transition-colors ${
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
                
                {/* Show scheduled times or Add to Schedule button */}
                {scheduledEvents && scheduledEvents.length > 0 ? (
                  <div className="flex flex-col gap-1 items-end">
                    {scheduledEvents.map((event: ScheduleCardData) => (
                      <div
                        key={event.id}
                        className={`flex items-center gap-2 pl-3 pr-2 py-2 rounded-lg h-[36px] ${
                          isDarkMode ? 'bg-white/5' : 'bg-gray-100'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span className={`text-sm whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {formatScheduledTime(event)}
                        </span>
                        <button
                          onClick={() => {
                            if (onDeleteEvent) {
                              onDeleteEvent(event.id);
                            }
                          }}
                          className={`p-1 rounded transition-colors flex-shrink-0 ${
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
                    ))}
                  </div>
                ) : (
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
                    Add to Schedule
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default DynamicIsland;

