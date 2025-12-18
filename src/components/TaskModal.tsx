// @ts-nocheck

import { Task, Folder } from "../utils/types";
import { useState, useEffect, useRef } from 'react';
import Checkbox from './Checkbox';
import { ScheduleCardData, getTimeFromDateTime, getEventDuration } from './ScheduleCard';
import { useBasic, useQuery } from '@basictech/react';
import SubtasksList from './SubtasksList';

export const TaskModal = ({
  task, updateFunction, inDrawer = false, deleteTask, new: isNew = false, accentColor = '#1F1B2F', onDelete, onAddToSchedule, scheduledEvents, isDarkMode = true, onUpdateEvent, onDeleteEvent, onAddSubtask, onUpdateSubtask, onDeleteSubtask, onEnterFocus, folders, onFolderSelect
}: {
  task: Task;
  updateFunction: any;
  inDrawer?: boolean;
  deleteTask?: any;
  new?: boolean;
  accentColor?: string;
  onDelete?: () => void;
  onAddToSchedule?: (task: Task) => void;
  scheduledEvents?: ScheduleCardData[];
  isDarkMode?: boolean;
  onUpdateEvent?: (id: string, changes: Partial<ScheduleCardData>) => void;
  onDeleteEvent?: (id: string) => void;
  onAddSubtask?: (parentTaskId: string, name: string) => void;
  onUpdateSubtask?: (id: string, changes: Partial<Task>) => void;
  onDeleteSubtask?: (id: string) => void;
  onEnterFocus?: (task: Task) => void;
  folders?: Folder[];
  onFolderSelect?: (folderId: string | null) => void;
}) => {
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  
  // Log task for debugging
  useEffect(() => {
    console.log("TaskModal received task:", task);
  }, [task]);

  const [taskCompleted, setTaskCompleted] = useState(task?.completed || false);
  const [taskName, setTaskName] = useState(task?.name || '');
  const [taskDescription, setTaskDescription] = useState(task?.description || '');
  const nameInputRef = useRef(null);
  
  // Query subtasks for this task
  const { db } = useBasic();
  const subtasks = useQuery(
    () => task?.id && !task?.parentTaskId 
      ? db.collection('tasks').filter((t: Task) => t.parentTaskId === task.id)
      : null,
    [task?.id, task?.parentTaskId]
  ) || [];

  // Check if task has any scheduled events for today
  const hasScheduledEventToday = (() => {
    if (!scheduledEvents || scheduledEvents.length === 0) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return scheduledEvents.some((event: ScheduleCardData) => {
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

  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<'date' | 'start' | 'end' | null>(null);
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventDate, setEventDate] = useState('');
  const dateInputRef = useRef<HTMLInputElement>(null);
  const startTimeInputRef = useRef<HTMLInputElement>(null);
  const endTimeInputRef = useRef<HTMLInputElement>(null);

  // Focus the name input when creating a new task
  useEffect(() => {
    if (isNew && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isNew]);

  // Trigger native picker when entering edit mode
  useEffect(() => {
    if (editingEventId && editingSection) {
      setTimeout(() => {
        if (editingSection === 'date' && dateInputRef.current) {
          if ('showPicker' in dateInputRef.current && typeof (dateInputRef.current as any).showPicker === 'function') {
            try {
              (dateInputRef.current as any).showPicker();
            } catch (e) {
              // Fallback to click if showPicker fails
              dateInputRef.current.click();
            }
          } else {
            dateInputRef.current.click();
          }
        } else if (editingSection === 'start' && startTimeInputRef.current) {
          if ('showPicker' in startTimeInputRef.current && typeof (startTimeInputRef.current as any).showPicker === 'function') {
            try {
              (startTimeInputRef.current as any).showPicker();
            } catch (e) {
              startTimeInputRef.current.click();
            }
          } else {
            startTimeInputRef.current.click();
          }
        } else if (editingSection === 'end' && endTimeInputRef.current) {
          if ('showPicker' in endTimeInputRef.current && typeof (endTimeInputRef.current as any).showPicker === 'function') {
            try {
              (endTimeInputRef.current as any).showPicker();
            } catch (e) {
              endTimeInputRef.current.click();
            }
          } else {
            endTimeInputRef.current.click();
          }
        }
      }, 10);
    }
  }, [editingEventId, editingSection]);

  useEffect(() => {
    // Update states whenever task changes
    setTaskCompleted(task?.completed || false);
    setTaskName(task?.name || '');
    setTaskDescription(task?.description || '');
  }, [task]);

  // Auto-resize textareas on initial render and when content changes
  useEffect(() => {
    const titleTextarea = document.querySelector('textarea.task-title') as HTMLTextAreaElement;
    if (titleTextarea) {
      titleTextarea.style.height = 'auto';
      titleTextarea.style.height = `${titleTextarea.scrollHeight}px`;
    }

    const descTextarea = document.querySelector('textarea.task-description') as HTMLTextAreaElement;
    if (descTextarea) {
      descTextarea.style.height = 'auto';
      descTextarea.style.height = `${descTextarea.scrollHeight}px`;
    }
  }, [taskName, taskDescription]);

  const handleDelete = (e) => {
    e.stopPropagation();
    console.log("delete button clicked");
    if (task?.id && deleteTask) {
      deleteTask(task.id);
      if (onDelete) {
        onDelete();
      }
    }
  };

  const handleTitleChange = (e) => {
    setTaskName(e.target.value);
    // Auto-resize the textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleDescriptionChange = (e) => {
    setTaskDescription(e.target.value);
    // Auto-resize the textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleTitleBlur = () => {
    if (taskName.trim() !== task?.name && task?.id) {
      updateFunction(task.id, { name: taskName.trim() });
    }
  };

  const handleDescriptionBlur = () => {
    if ((taskDescription.trim() !== task?.description) && task?.id) {
      updateFunction(task.id, { description: taskDescription.trim() || '' });
    }
  };

  const handleKeyDown = (e, type) => {
    if (e.key === 'Enter' && type === 'title') {
      handleTitleBlur();
      e.preventDefault();
    }
  };

  // Calculate background color without opacity
  const getBackgroundColor = () => {
    return accentColor; // No opacity
  };

  // Format scheduled time like DynamicIsland
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

  // Handle clicking on a section to edit
  const handleSectionClick = (event: ScheduleCardData, section: 'date' | 'start' | 'end', e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEventId(event.id);
    setEditingSection(section);
    
    if (event.start.dateTime) {
      const startDate = new Date(event.start.dateTime);
      setEventStartTime(getTimeFromDateTime(event.start.dateTime));
      setEventDate(startDate.toISOString().split('T')[0]);
      if (event.end.dateTime) {
        setEventEndTime(getTimeFromDateTime(event.end.dateTime));
      } else {
        const duration = getEventDuration(event);
        const endDate = new Date(startDate.getTime() + duration * 60000);
        setEventEndTime(getTimeFromDateTime(endDate.toISOString()));
      }
    }
    
  };

  // Handle saving edited section
  const handleSaveSection = (newDate?: string, newStartTime?: string, newEndTime?: string) => {
    if (!editingEventId || !editingSection || !onUpdateEvent) return;
    
    const event = scheduledEvents?.find(e => e.id === editingEventId);
    if (!event) return;

    // Use provided values or fall back to state
    const dateToUse = newDate !== undefined ? newDate : eventDate;
    const startTimeToUse = newStartTime !== undefined ? newStartTime : eventStartTime;
    const endTimeToUse = newEndTime !== undefined ? newEndTime : eventEndTime;

    if (editingSection === 'date') {
      // Update date, keep times the same
      const currentStart = event.start.dateTime ? new Date(event.start.dateTime) : new Date();
      
      // Parse date string in local timezone to avoid timezone shift issues
      const [year, month, day] = dateToUse.split('-').map(Number);
      const newStartDate = new Date(year, month - 1, day, currentStart.getHours(), currentStart.getMinutes(), 0, 0);
      
      const duration = getEventDuration(event);
      const newEndDate = new Date(newStartDate.getTime() + duration * 60000);
      
      onUpdateEvent(editingEventId, {
        start: {
          ...event.start,
          dateTime: newStartDate.toISOString()
        },
        end: {
          ...event.end,
          dateTime: newEndDate.toISOString()
        }
      });
      setEventDate(dateToUse);
    } else if (editingSection === 'start') {
      // Update start time
      const [startHours, startMinutes] = startTimeToUse.split(':').map(Number);
      const currentStart = event.start.dateTime ? new Date(event.start.dateTime) : new Date();
      const newStartDate = new Date(currentStart);
      newStartDate.setHours(startHours, startMinutes, 0, 0);
      
      // Keep duration the same, update end time
      const duration = getEventDuration(event);
      const newEndDate = new Date(newStartDate.getTime() + duration * 60000);
      
      onUpdateEvent(editingEventId, {
        start: {
          ...event.start,
          dateTime: newStartDate.toISOString()
        },
        end: {
          ...event.end,
          dateTime: newEndDate.toISOString()
        }
      });
      setEventStartTime(startTimeToUse);
      setEventEndTime(getTimeFromDateTime(newEndDate.toISOString()));
    } else if (editingSection === 'end') {
      // Update end time
      const [endHours, endMinutes] = endTimeToUse.split(':').map(Number);
      const currentStart = event.start.dateTime ? new Date(event.start.dateTime) : new Date();
      const newEndDate = new Date(currentStart);
      newEndDate.setHours(endHours, endMinutes, 0, 0);
      
      onUpdateEvent(editingEventId, {
        end: {
          ...event.end,
          dateTime: newEndDate.toISOString()
        }
      });
      setEventEndTime(endTimeToUse);
    }
    
    setEditingEventId(null);
    setEditingSection(null);
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingEventId(null);
    setEditingSection(null);
  };

  // Format date for display
  const formatDate = (event: ScheduleCardData): string => {
    if (!event.start.dateTime) return '';
    const startDate = new Date(event.start.dateTime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (startDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (startDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Format time for display
  const formatTime = (dateTime: string | undefined): string => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Handle deleting event
  const handleDeleteEvent = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteEvent) {
      onDeleteEvent(eventId);
    }
  };

  if (!task?.id) {
    return <div className="p-4 text-center">No task selected or task data is incomplete.</div>;
  }

  return (
    <>
      <div
        className={`${inDrawer ? "flex flex-col h-full overflow-y-auto pb-20" : "bg-black rounded-lg shadow-xl max-w-2xl w-full mx-4 p-4"}`}
        style={inDrawer ? { backgroundColor: getBackgroundColor() } : {}}
      >
        <div className={`flex items-start w-full ${inDrawer ? 'mb-4' : 'my-4'} gap-3`}>
          <div className="mt-2">
            <Checkbox
              id={task?.id}
              size="md"
              checked={taskCompleted}
              onChange={() => {
                const newState = !taskCompleted;
                setTaskCompleted(newState);
                if (task?.id) {
                  updateFunction(task.id, {
                    completed: newState
                  });
                }
              }}
            />
          </div>

          <textarea
            ref={nameInputRef}
            value={taskName}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => handleKeyDown(e, 'title')}
            className="task-title flex-1 text-start text-xl text-bold py-1 px-2 text-white bg-transparent resize-none overflow-hidden min-h-[2rem] focus:outline-none"
            placeholder={isNew ? "Enter task name..." : ""}
            rows={1}
            style={{ height: 'auto' }}
            autoComplete="off"
            inputMode="text"
          />

          {isNew && (
            <div className="text-sm opacity-70">New Task</div>
          )}
        </div>

        {/* Schedule Section - moved below title */}
        {!isNew && scheduledEvents && scheduledEvents.length > 0 && (() => {
          // Calculate total duration across all activities
          const totalDurationMinutes = scheduledEvents.reduce((total: number, event: ScheduleCardData) => {
            if (!event.start.dateTime || !event.end.dateTime) return total;
            const start = new Date(event.start.dateTime);
            const end = new Date(event.end.dateTime);
            const durationMs = end.getTime() - start.getTime();
            return total + Math.max(0, durationMs / (1000 * 60));
          }, 0);
          
          // Format duration helper
          const formatDuration = (minutes: number): string => {
            if (minutes < 60) return `${Math.round(minutes)}m`;
            const hours = Math.floor(minutes / 60);
            const mins = Math.round(minutes % 60);
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
          };
          
          return (
          <div className={`flex flex-col gap-2 ${inDrawer ? 'mb-4' : 'mt-4'}`}>
            {/* Activity header with total duration */}
            <div className="flex items-center justify-between px-1">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Activity
              </span>
              {totalDurationMinutes > 0 && (
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Total: {formatDuration(totalDurationMinutes)}
                </span>
              )}
            </div>
            {scheduledEvents.map((event) => {
              // Calculate duration for this event
              let eventDurationMinutes = 0;
              if (event.start.dateTime && event.end.dateTime) {
                const start = new Date(event.start.dateTime);
                const end = new Date(event.end.dateTime);
                eventDurationMinutes = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60));
              }
              
              return (
                <div 
                  key={event.id} 
                  onClick={(e) => e.stopPropagation()}
                  className={`flex items-center gap-2 pl-3 pr-2 py-2 rounded-lg h-[36px] ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    
                    {/* Date Section */}
                    {editingEventId === event.id && editingSection === 'date' ? (
                      <input
                        ref={dateInputRef}
                        type="date"
                        value={eventDate}
                        onChange={(e) => {
                          const newDate = e.target.value;
                          setEventDate(newDate);
                          handleSaveSection(newDate);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={() => {
                          // Only cancel if no value was selected
                          if (!eventDate) {
                            handleCancelEdit();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                        className={`flex-1 px-2 py-1 rounded text-sm ${
                          isDarkMode 
                            ? 'bg-white/10 text-white border border-white/20' 
                            : 'bg-white text-gray-900 border border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    ) : (
                      <div
                        onClick={(e) => handleSectionClick(event, 'date', e)}
                        className={`flex-1 px-2 py-1 rounded cursor-pointer transition-colors ${
                          isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                        }`}
                      >
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {formatDate(event)}
                        </span>
                      </div>
                    )}
                    
                    {/* Start Time Section */}
                    {editingEventId === event.id && editingSection === 'start' ? (
                      <input
                        ref={startTimeInputRef}
                        type="time"
                        value={eventStartTime}
                        onChange={(e) => {
                          const newStartTime = e.target.value;
                          setEventStartTime(newStartTime);
                          handleSaveSection(undefined, newStartTime);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={() => {
                          // Only cancel if no value was selected
                          if (!eventStartTime) {
                            handleCancelEdit();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                        className={`px-2 py-1 rounded text-sm ${
                          isDarkMode 
                            ? 'bg-white/10 text-white border border-white/20' 
                            : 'bg-white text-gray-900 border border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    ) : (
                      <div
                        onClick={(e) => handleSectionClick(event, 'start', e)}
                        className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                          isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                        }`}
                      >
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {event.start.dateTime ? formatTime(event.start.dateTime) : ''}
                        </span>
                      </div>
                    )}
                    
                    {/* Separator */}
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>-</span>
                    
                    {/* End Time Section */}
                    {editingEventId === event.id && editingSection === 'end' ? (
                      <input
                        ref={endTimeInputRef}
                        type="time"
                        value={eventEndTime}
                        onChange={(e) => {
                          const newEndTime = e.target.value;
                          setEventEndTime(newEndTime);
                          handleSaveSection(undefined, undefined, newEndTime);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={() => {
                          // Only cancel if no value was selected
                          if (!eventEndTime) {
                            handleCancelEdit();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                        className={`px-2 py-1 rounded text-sm ${
                          isDarkMode 
                            ? 'bg-white/10 text-white border border-white/20' 
                            : 'bg-white text-gray-900 border border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    ) : (
                      <div
                        onClick={(e) => handleSectionClick(event, 'end', e)}
                        className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                          isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                        }`}
                      >
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {event.end.dateTime ? formatTime(event.end.dateTime) : ''}
                        </span>
                      </div>
                    )}
                    
                    {/* Duration */}
                    {eventDurationMinutes > 0 && (
                      <span className={`text-xs flex-shrink-0 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        ({formatDuration(eventDurationMinutes)})
                      </span>
                    )}
                    
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(event.id, e);
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
              );
            })}
          </div>
          );
        })()}

        {/* Add to Today button - full width, same height as schedule cards */}
        {!isNew && !task?.completed && !hasScheduledEventToday && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (task && onAddToSchedule) {
                onAddToSchedule(task);
              }
            }}
            disabled={!task || !onAddToSchedule}
            className={`flex items-center gap-3 pl-4 pr-3 py-3 rounded-lg ${inDrawer ? 'h-[44px] mb-4' : 'h-[36px] mt-4'} transition-colors ${
                task && onAddToSchedule
                  ? isDarkMode 
                    ? 'bg-white/5 hover:bg-white/10 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`${inDrawer ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span className={inDrawer ? 'text-base' : 'text-sm'}>Add to Today</span>
            </button>
        )}

        {/* Subtasks Section - below schedule */}
        {!isNew && !task?.parentTaskId && onAddSubtask && onUpdateSubtask && onDeleteSubtask && (
          <SubtasksList
            parentTaskId={task.id}
            subtasks={subtasks}
            onAddSubtask={onAddSubtask}
            onUpdateSubtask={onUpdateSubtask}
            onDeleteSubtask={onDeleteSubtask}
            accentColor={accentColor}
            isDarkMode={isDarkMode}
          />
        )}

        {/* Description Section - at bottom */}
        <textarea
          value={taskDescription || ""}
          onChange={handleDescriptionChange}
          onBlur={handleDescriptionBlur}
          onKeyDown={(e) => handleKeyDown(e, 'description')}
          className={`task-description opacity-70 text-left py-1 px-2 text-white bg-transparent resize-none min-h-[100px] focus:outline-none ${inDrawer ? 'mt-6 mb-4' : 'mt-4'}`}
          placeholder="Some description..."
          style={{ height: 'auto' }}
        />

      </div>
      
      {/* Sticky Delete Button - bottom left */}
      {!isNew && deleteTask && inDrawer && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(e);
          }}
          className={`fixed bottom-4 left-4 p-4 rounded-full transition-colors shadow-lg z-50 ${
            isDarkMode 
              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300' 
              : 'bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700'
          }`}
          aria-label="Delete task"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      )}
      
      {/* Folder Selector - bottom center */}
      {!isNew && inDrawer && folders && folders.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowFolderDropdown(!showFolderDropdown);
            }}
            className={`flex items-center gap-2 px-4 py-4 rounded-full transition-colors shadow-lg ${
              isDarkMode 
                ? 'bg-white/10 hover:bg-white/20 text-gray-100 backdrop-blur-xl' 
                : 'bg-gray-800 hover:bg-gray-900 text-white'
            }`}
            aria-label="Select folder"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="text-sm font-medium">
              {(() => {
                const taskLabels = task?.labels?.split(',').map(l => l.trim()) || [];
                const folderLabel = taskLabels.find(l => l.startsWith('folder:'));
                if (folderLabel) {
                  const folderName = folderLabel.replace('folder:', '');
                  return folderName.charAt(0).toUpperCase() + folderName.slice(1).toLowerCase();
                }
                return 'Folder';
              })()}
            </span>
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
                className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 min-w-[180px] rounded-lg shadow-lg border z-50 max-h-[300px] overflow-y-auto ${
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
                  onClick={(e) => {
                    e.stopPropagation();
                    const taskLabels = task.labels?.split(',').map(l => l.trim()) || [];
                    const newLabels = taskLabels.filter(l => !l.startsWith('folder:')).join(',');
                    updateFunction(task.id, { labels: newLabels });
                    setShowFolderDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${
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
                    onClick={(e) => {
                      e.stopPropagation();
                      const taskLabels = task.labels?.split(',').map(l => l.trim()) || [];
                      const labelsWithoutFolder = taskLabels.filter(l => !l.startsWith('folder:'));
                      const newLabels = [...labelsWithoutFolder, `folder:${folder.name.toLowerCase()}`].join(',');
                      updateFunction(task.id, { labels: newLabels });
                      setShowFolderDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors capitalize ${
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

      {/* Sticky Focus Button - bottom right */}
      {!isNew && onEnterFocus && inDrawer && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEnterFocus(task);
          }}
          className={`fixed bottom-4 right-4 p-4 rounded-full transition-colors shadow-lg z-50 ${
            isDarkMode 
              ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300' 
              : 'bg-green-100 hover:bg-green-200 text-green-600 hover:text-green-700'
          }`}
          aria-label="Enter focus mode"
          title="Focus mode"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
        </button>
      )}
      
      {/* Delete Button for non-drawer mode */}
      {!isNew && deleteTask && !inDrawer && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(e);
          }}
          className={`mt-auto self-start w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isDarkMode 
              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300' 
              : 'bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700'
          }`}
          aria-label="Delete task"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      )}
      {!inDrawer && (
        <form method="dialog" className="absolute inset-0 -z-10 bg-black/50">
          <button>close</button>
        </form>
      )}
    </>
  );
};
