'use client';

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { Sheet, useClientMediaQuery, type SheetViewProps } from "@silk-hq/components";
import { motion } from 'framer-motion';
import { TaskModal } from './TaskModal';
import { EventModal } from './EventModal';
import ListItem from './ListItem';
import Checkbox from './Checkbox';
import { ScheduleCardData } from './ScheduleCard';
import { useBasic, useQuery } from '@basictech/react';
import { useModalHistory } from '../hooks/useModalHistory';
import './SilkTaskDrawer.css';
import './SheetWithKeyboard.css';

// Simple VisuallyHidden component for accessibility
const VisuallyHidden = ({ children }: { children: React.ReactNode }) => {
  return (
    <span
      style={{
        border: 0,
        clip: 'rect(0 0 0 0)',
        height: '1px',
        margin: '-1px',
        overflow: 'hidden',
        padding: 0,
        position: 'absolute',
        width: '1px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
};

interface TaskDrawerProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  task: any;
  event?: ScheduleCardData | null;
  updateFunction: (id: string, changes: any) => void;
  deleteTask?: (id: string) => void;
  accentColor?: string;
  isNewTaskMode?: boolean;
  currentView?: 'tasks' | 'calendar';
  onAddTask?: (taskName: string) => Promise<string | null>;
  onAddToSchedule?: (task: any) => void;
  isDarkMode?: boolean;
  onUpdateEvent?: (id: string, changes: Partial<ScheduleCardData>) => void;
  onDeleteEvent?: (id: string) => void;
  onAddEvent?: (eventData: Omit<ScheduleCardData, 'id'>) => Promise<ScheduleCardData>;
  onAddSubtask?: (parentTaskId: string, name: string) => void;
  onUpdateSubtask?: (id: string, changes: any) => void;
  onDeleteSubtask?: (id: string) => void;
  onTaskSelect?: (task: any) => void;
  onEnterFocus?: (task: any) => void;
  folders?: any[];
}

export default function SilkTaskDrawer({ 
  isOpen,
  setIsOpen,
  task, 
  event,
  updateFunction, 
  deleteTask,
  accentColor = '#1F1B2F',
  isNewTaskMode = false,
  currentView = 'tasks',
  onAddTask,
  onAddToSchedule,
  isDarkMode = true,
  onUpdateEvent,
  onDeleteEvent,
  onAddEvent,
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onTaskSelect,
  onEnterFocus,
  folders
}: TaskDrawerProps) {
  const titleId = React.useId();
  const viewRef = useRef<HTMLDivElement>(null);
  const largeViewport = useClientMediaQuery("(min-width: 800px)");
  const contentPlacement = largeViewport ? "center" : "bottom";
  const tracks: SheetViewProps["tracks"] = largeViewport ? ["top", "bottom"] : "bottom";
  
  // Handle browser back button for closing drawer
  useModalHistory(isOpen, () => setIsOpen(false), 'task-drawer');
  
  const [newTaskName, setNewTaskName] = useState('');
  const [createdTasks, setCreatedTasks] = useState<{ id: string; name: string; completed: boolean; description: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [creationMode, setCreationMode] = useState<'task' | 'event'>('task');
  
  // Query all tasks to find created tasks by ID
  const { db } = useBasic();
  const allTasks = useQuery(() => db.collection("tasks").getAll()) || [];
  
  // Event creation state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const eventTitleRef = useRef<HTMLInputElement>(null);
  
  // Fetch scheduled events for the selected task
  const allScheduleEvents = useQuery(() => db.collection('schedule').getAll());
  const scheduledEvents = useMemo(() => {
    if (!task?.id || !allScheduleEvents) return [];
    return allScheduleEvents.filter((event: ScheduleCardData) => event.taskId === task.id);
  }, [task?.id, allScheduleEvents]);

  // Query subtasks for deleted task (if viewing a deleted task schedule item)
  const deletedTaskSubtasks = useQuery(
    () => event?.type === 'task' && 
          (!event?.taskId || event?.taskId === '') && 
          event?.metadata?.taskSnapshot?.id 
      ? db.collection('tasks')
          .filter((task: any) => task.parentTaskId === event.metadata?.taskSnapshot?.id)
      : null,
    [event?.metadata?.taskSnapshot?.id]
  );

  // Memoize the placeholder task to ensure stable reference
  const placeholderTask = useMemo(() => ({
    id: "placeholder-task",
    name: "Untitled Task",
    description: "",
    completed: false
  }), []);

  // Ensure we have a valid task object to work with
  const safeTask = task || placeholderTask;

  // Create a placeholder task for new task mode
  const emptyTask = {
    id: "new-task-placeholder",
    name: "",
    description: "",
    completed: false
  };

  // useEffect for resetting input state and focusing when drawer opens in new task mode
  useEffect(() => {
    if (isOpen && isNewTaskMode) {
      setNewTaskName('');
      setEventTitle('');
      setEventDescription('');
      setEventDate('');
      setEventStartTime('');
      setEventEndTime('');
      // Default to event mode if calendar view is active, otherwise task mode
      setCreationMode(currentView === 'calendar' ? 'event' : 'task');
      // Set default date to today
      const today = new Date();
      setEventDate(today.toISOString().split('T')[0]);
      // Set default time to now and 1 hour later
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      setEventStartTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
      setEventEndTime(`${oneHourLater.getHours().toString().padStart(2, '0')}:${oneHourLater.getMinutes().toString().padStart(2, '0')}`);
    }
  }, [isOpen, isNewTaskMode, currentView]);

  // useEffect for resetting all local new task state when drawer is closed or opened anew
  useEffect(() => {
    if (!isOpen) {
      setNewTaskName('');
      setCreatedTasks([]);
      setEventTitle('');
      setEventDescription('');
      setEventDate('');
      setEventStartTime('');
      setEventEndTime('');
      setCreationMode('task');
    } else if (isNewTaskMode) {
      // If opening in new task mode, ensure createdTasks is clear for the new session.
      setCreatedTasks([]); 
    }
  }, [isOpen, isNewTaskMode]);

  // Dismiss keyboard when sheet is moved
  const travelHandler = useCallback<Exclude<SheetViewProps["onTravel"], undefined>>(({ progress }) => {
    if (!viewRef.current) return;

    if (progress < 0.999) {
      // Dismiss the on-screen keyboard
      viewRef.current.focus();
    }
    
    // Close the drawer when user swipes it away - now handled by onPresentedChange
    // if (progress < 0.3) {
    //   setIsOpen(false); 
    // }
  }, []); // Removed setIsOpen from dependencies as it's no longer called here

  // Handle task creation when in new task mode
  const handleNewTaskInternal = async () => {
    if (newTaskName.trim() !== "" && onAddTask) {
      const taskId = await onAddTask(newTaskName.trim());
      if (taskId) {
        // Store the real task ID from the database
        setCreatedTasks(prev => [...prev, { id: taskId, name: newTaskName.trim(), completed: false, description: '' }]);
      }
      setNewTaskName(''); // Clear input for next task
      setTimeout(() => inputRef.current?.focus(), 0); // Re-focus after state update
    }
  };

  // Handle event creation
  const handleNewEventInternal = async (closeAfterCreate: boolean = false) => {
    if (!eventTitle.trim() || !onAddEvent || !eventDate || !eventStartTime || !eventEndTime) return;
    
    // Parse date and times
    const [year, month, day] = eventDate.split('-').map(Number);
    const [startHours, startMinutes] = eventStartTime.split(':').map(Number);
    const [endHours, endMinutes] = eventEndTime.split(':').map(Number);
    
    const startDate = new Date(year, month - 1, day, startHours, startMinutes, 0, 0);
    const endDate = new Date(year, month - 1, day, endHours, endMinutes, 0, 0);
    
    const eventData: Omit<ScheduleCardData, 'id'> = {
      title: eventTitle.trim(),
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
      description: eventDescription.trim()
    };
    
    try {
      await onAddEvent(eventData);
      
      if (closeAfterCreate) {
        // Close the drawer
        setIsOpen(false);
      } else {
        // Reset form for next event
        setEventTitle('');
        setEventDescription('');
        const today = new Date();
        setEventDate(today.toISOString().split('T')[0]);
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
        setEventStartTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
        setEventEndTime(`${oneHourLater.getHours().toString().padStart(2, '0')}:${oneHourLater.getMinutes().toString().padStart(2, '0')}`);
        setTimeout(() => eventTitleRef.current?.focus(), 0);
      }
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  // Function to toggle the completed state of a temporarily created task
  const handleToggleTempTask = (tempId: string) => {
    setCreatedTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === tempId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // Handle clicking on a newly created task to open it in edit mode
  const handleCreatedTaskClick = (createdTask: { id: string; name: string; completed: boolean; description: string }) => {
    // Find the actual task from the database
    const actualTask = allTasks.find((t: any) => t.id === createdTask.id);
    if (actualTask && onTaskSelect) {
      onTaskSelect(actualTask);
    }
  };

  // Use inline styles to ensure the sheet is tall enough
  // Modern browsers: use dvh (dynamic viewport height) which tracks visible viewport
  // Fallback: JavaScript sets --vh for older browsers
  const supportsDvh = typeof CSS !== 'undefined' && CSS.supports('height', '100dvh');
  const heightValue = supportsDvh ? '90dvh' : 'calc(var(--vh, 1vh) * 90)';
  
  const sheetStyles = {
    height: heightValue,
    maxHeight: heightValue,
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: 'transparent'
  };
  
  const contentStyles = {
    backgroundColor: accentColor,
    minHeight: heightValue,
    height: heightValue,
    maxHeight: heightValue,
    display: 'flex',
    flexDirection: 'column' as const,
    borderTopLeftRadius: '1rem',
    borderTopRightRadius: '1rem',
    padding: '1rem'
  };

  const sheetContentStyles = {
    height: heightValue,
    maxHeight: heightValue,
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: 'transparent'
  };

  // Determine if we should show the content based on having a valid task or event
  const hasValidTask = isNewTaskMode || (task && task.id);
  const hasValidEvent = event && event.id;
  const isLoadingTask = isOpen && !isNewTaskMode && !task && !event;

  // Ensures proper rendering when component mounts
  useEffect(() => {
    // Add a class to make all parent containers transparent
    const dialog = document.querySelector('[role="dialog"]');
    if (dialog) {
      dialog.setAttribute('style', 'background-color: transparent !important;');
      
      // Find all parent elements of our content and make them transparent
      const parents = dialog.querySelectorAll('div');
      parents.forEach(parent => {
        if (!parent.classList.contains('silk-sheet-content')) {
          parent.setAttribute('style', 'background-color: transparent !important;');
        }
      });
    }
  }, [isOpen]);

  return (
    <div className="silk-task-drawer">
      {/* Add a style tag for direct overrides */}
      <style>
        {`
          .SheetWithKeyboard-view[role="dialog"],
          .SheetWithKeyboard-view[role="dialog"] > div,
          .SheetWithKeyboard-view[role="dialog"] div:not(.silk-sheet-content) {
            background-color: transparent !important;
          }
        `}
      </style>
      
      <Sheet.Root 
        license="non-commercial"
        presented={isOpen}
        onPresentedChange={setIsOpen}
      >
        <Sheet.Portal>
          <Sheet.View
            ref={viewRef}
            contentPlacement={contentPlacement}
            tracks={tracks}
            swipeOvershoot={false}
            nativeEdgeSwipePrevention={true}
            onTravel={travelHandler}
            className="SheetWithKeyboard-view"
            style={sheetStyles}
          >
            <Sheet.Backdrop 
              className="sheet-backdrop" 
              themeColorDimming="auto" 
            />
            
            <Sheet.Content 
              className="SheetWithKeyboard-content"
              style={sheetContentStyles}
            >
              <div 
                style={contentStyles}
                className="text-white silk-sheet-content"
              >
                {/* Title for accessibility */}
                <h2 id={titleId} className="sr-only">
                  {isNewTaskMode 
                    ? (creationMode === 'task' ? 'Add New Task' : 'Add New Event') 
                    : event 
                      ? `Event Details: ${event?.title || 'Event'}` 
                      : `Task Details: ${task?.name || 'Task'}`}
                </h2>
                
                <div className="pull-handle" />
                
                {/* Mode Toggle - only show in new task mode */}
                {isNewTaskMode && (
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setCreationMode('task')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        creationMode === 'task'
                          ? isDarkMode
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-800 text-white'
                          : isDarkMode
                            ? 'bg-white/5 text-gray-300 hover:bg-white/10'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Task
                    </button>
                    <button
                      onClick={() => setCreationMode('event')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        creationMode === 'event'
                          ? isDarkMode
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-800 text-white'
                          : isDarkMode
                            ? 'bg-white/5 text-gray-300 hover:bg-white/10'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Event
                    </button>
                  </div>
                )}
                
                {isNewTaskMode ? (
                  creationMode === 'task' ? (
                  <div className="flex flex-col h-full">
                    {/* List of created tasks */}
                    {createdTasks.length > 0 && (
                      <div className="mb-4 p-1 bg-white/5 rounded-md overflow-y-auto max-h-60 styled-scrollbar">
                        {/* <h3 className="text-sm font-semibold mb-1 text-gray-300 px-2 pt-1">Added:</h3> */}
                        <div className="space-y-1 py-1">
                          {createdTasks.map((task, index) => (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20, duration: 0.15, delay: index * 0.03 }}
                            >
                              <ListItem
                                key={task.id}
                                task={task}
                                handleTaskSelect={() => handleCreatedTaskClick(task)}
                                // For temporary items, updateTask and deleteTask are no-ops or disabled
                                // Pass a function to handle local toggle for the checkbox
                                updateTask={(id, changes) => {
                                  if (changes.hasOwnProperty('completed') && id === task.id) {
                                    handleToggleTempTask(task.id);
                                    // Also update the actual task in the database
                                    const actualTask = allTasks.find((t: any) => t.id === task.id);
                                    if (actualTask) {
                                      updateFunction(task.id, changes);
                                    }
                                  }
                                  // Other updates are not supported for temp items
                                }}
                                deleteTask={() => { /* Optionally allow removal from this list */ }}
                                isSelected={false} // Temporary items are not "selected" in the main app sense
                                viewMode={"cozy"} // Or a viewMode prop from parent if available
                                accentColor={accentColor}
                                isDarkMode={isDarkMode}
                                // Pass any other necessary props that ListItem expects
                                // Ensure ListItem can handle a task object that might not have all DB fields
                              />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Input Card */}
                    <div className="p-3 bg-white/10 rounded-lg shadow-md mb-auto">
                      <input
                        ref={inputRef}
                        type="text"
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                        placeholder="Enter task name..."
                        autoFocus={true}
                        className="w-full p-2 rounded-md bg-transparent text-white placeholder-gray-300 focus:outline-none"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleNewTaskInternal();
                          }
                        }}
                        autoComplete="off"
                        inputMode="text"
                      />
                    </div>

                  </div>
                  ) : (
                    /* Event Creation Form */
                    <div className="flex flex-col h-full gap-4">
                      {/* Title Input */}
                      <div className="p-3 bg-white/10 rounded-lg shadow-md">
                        <input
                          ref={eventTitleRef}
                          type="text"
                          value={eventTitle}
                          onChange={(e) => setEventTitle(e.target.value)}
                          placeholder="Event title..."
                          autoFocus={true}
                          className="w-full p-2 rounded-md bg-transparent text-white placeholder-gray-300 focus:outline-none"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleNewEventInternal();
                            }
                          }}
                        />
                      </div>

                      {/* Date and Time Inputs */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 bg-white/10 rounded-lg shadow-md">
                          <label className="text-xs text-gray-300 mb-1 block">Date</label>
                          <input
                            type="date"
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)}
                            className="w-full p-1 rounded-md bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="p-2 bg-white/10 rounded-lg shadow-md">
                          <label className="text-xs text-gray-300 mb-1 block">Start</label>
                          <input
                            type="time"
                            value={eventStartTime}
                            onChange={(e) => setEventStartTime(e.target.value)}
                            className="w-full p-1 rounded-md bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="p-2 bg-white/10 rounded-lg shadow-md">
                          <label className="text-xs text-gray-300 mb-1 block">End</label>
                          <input
                            type="time"
                            value={eventEndTime}
                            onChange={(e) => setEventEndTime(e.target.value)}
                            className="w-full p-1 rounded-md bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Description Input */}
                      <div className="p-2 bg-white/10 rounded-lg shadow-md mb-auto">
                        <textarea
                          value={eventDescription}
                          onChange={(e) => setEventDescription(e.target.value)}
                          placeholder="Description (optional)..."
                          rows={3}
                          className="w-full p-1 rounded-md bg-transparent text-white placeholder-gray-300 focus:outline-none resize-none"
                        />
                      </div>

                      {/* Create Button - Sticky at bottom to float above keyboard */}
                      <div 
                        className="sticky bottom-0 mt-4 pt-4 border-t border-white/10 pb-safe -mx-4 px-4 -mb-4 pb-4"
                        style={{ 
                          paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 1rem)`,
                          backgroundColor: accentColor
                        }}
                      >
                        <button
                          onClick={() => handleNewEventInternal(true)}
                          disabled={!eventTitle.trim() || !eventDate || !eventStartTime || !eventEndTime}
                          className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                            eventTitle.trim() && eventDate && eventStartTime && eventEndTime
                              ? isDarkMode
                                ? 'bg-white/20 hover:bg-white/30 text-white'
                                : 'bg-gray-800 hover:bg-gray-700 text-white'
                              : 'bg-gray-400/50 cursor-not-allowed text-gray-500'
                          }`}
                        >
                          Create Event
                      </button>
                    </div>
                  </div>
                  )
                ) : isLoadingTask ? (
                  <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Loading details...</p>
                  </div>
                ) : event ? (
                  // Check if this is a deleted task schedule item
                  event.type === 'task' && (!event.taskId || event.taskId === '') && event.metadata?.taskSnapshot ? (
                    // Read-only view for deleted task - matching TaskModal layout
                    <div className="flex flex-col h-full">
                          <div className="flex-1 overflow-y-auto styled-scrollbar">
                            {/* Header with checkbox and title - matching TaskModal layout */}
                            <div className="flex items-start w-full mb-4 gap-3">
                              <div className="mt-2">
                                <Checkbox
                                  id={`deleted-task-${event.id}`}
                                  size="md"
                                  checked={event.metadata.taskSnapshot.completed}
                                  onChange={() => {}} // No-op for deleted tasks
                                  disabled={true}
                                  accentColor={accentColor}
                                />
                              </div>

                              <div className="flex-1 text-start text-xl text-bold py-1 px-2 text-white">
                                {event.metadata.taskSnapshot.name}
                              </div>
                            </div>

                            {/* Schedule info */}
                            <div className="flex items-center gap-2 pl-3 pr-2 py-2 mb-4 rounded-lg bg-white/5">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                              <div className="flex-1 text-sm text-gray-300">
                                {event.start.dateTime && new Date(event.start.dateTime).toLocaleString()}
                              </div>
                            </div>

                            {/* Subtasks Section - read-only */}
                            {deletedTaskSubtasks && deletedTaskSubtasks.length > 0 && (
                              <div className="mb-4">
                                <div className="text-xs font-medium text-gray-400 mb-2">
                                  Subtasks ({deletedTaskSubtasks.length})
                                </div>
                                <div className="space-y-1">
                                  {deletedTaskSubtasks.map((subtask: any) => (
                                    <div 
                                      key={subtask.id} 
                                      className="flex items-center gap-2 p-2 rounded bg-white/5"
                                    >
                                      <Checkbox
                                        id={`deleted-subtask-${subtask.id}`}
                                        size="sm"
                                        checked={subtask.completed}
                                        onChange={() => {}} // No-op
                                        accentColor={accentColor}
                                        disabled={true}
                                      />
                                      <span className={`text-sm ${
                                        subtask.completed ? 'line-through opacity-60' : ''
                                      } text-gray-300`}>
                                        {subtask.name}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Description Section - matching TaskModal layout */}
                        <div className="opacity-70 text-left py-1 px-2 text-white resize-none min-h-[100px] mt-6 mb-4 whitespace-pre-wrap">
                          {event.metadata.taskSnapshot.description || 'No description'}
                        </div>

                        {/* Warning banner */}
                        <div className="p-3 bg-yellow-500/15 border border-yellow-500/25 rounded-lg mb-4">
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
                                This task was deleted on {new Date(event.metadata.taskSnapshot.deletedAt).toLocaleDateString()}. This is read only.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Delete button - sticky at bottom */}
                      <button
                        onClick={() => {
                          if (onDeleteEvent && event.id) {
                            onDeleteEvent(event.id);
                            setIsOpen(false);
                          }
                        }}
                        className={`flex items-center justify-center gap-2 w-full p-3 border-t transition-colors ${
                          isDarkMode
                            ? 'bg-white/5 hover:bg-red-500/10 text-red-400 border-white/10'
                            : 'bg-gray-50 hover:bg-red-50 text-red-600 border-gray-200'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>Remove from Schedule</span>
                      </button>
                    </div>
                  ) : (
                    <EventModal
                      key={event.id}
                      event={event}
                      updateFunction={onUpdateEvent || (() => {})}
                      deleteEvent={onDeleteEvent}
                      inDrawer={true}
                      accentColor={accentColor}
                      isDarkMode={isDarkMode}
                      onDelete={() => setIsOpen(false)}
                    />
                  )
                ) : (
                  <TaskModal
                    key={safeTask.id}
                    task={safeTask}
                    new={false}
                    updateFunction={updateFunction}
                    deleteTask={deleteTask}
                    inDrawer={true}
                    accentColor={accentColor}
                    onDelete={() => setIsOpen(false)}
                    onAddToSchedule={onAddToSchedule}
                    scheduledEvents={scheduledEvents}
                    isDarkMode={isDarkMode}
                    onUpdateEvent={onUpdateEvent}
                    onDeleteEvent={onDeleteEvent}
                    onAddSubtask={onAddSubtask}
                    onUpdateSubtask={onUpdateSubtask}
                    onDeleteSubtask={onDeleteSubtask}
                    onEnterFocus={onEnterFocus}
                    folders={folders}
                  />
                )}
              </div>
            </Sheet.Content>
          </Sheet.View>
        </Sheet.Portal>
      </Sheet.Root>
    </div>
  );
} 