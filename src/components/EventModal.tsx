import React, { useState, useEffect, useRef } from 'react';
import { ScheduleCardData, getEventDuration, getTimeFromDateTime, minutesToDateTime } from './ScheduleCard';
import Checkbox from './Checkbox';

export const EventModal = ({
  event,
  updateFunction,
  inDrawer = false,
  deleteEvent,
  accentColor = '#1F1B2F',
  isDarkMode = true,
  onDelete
}: {
  event: ScheduleCardData;
  updateFunction: (id: string, changes: Partial<ScheduleCardData>) => void;
  inDrawer?: boolean;
  deleteEvent?: (id: string) => void;
  accentColor?: string;
  isDarkMode?: boolean;
  onDelete?: () => void;
}) => {
  const [eventTitle, setEventTitle] = useState(event?.title || '');
  const [eventDescription, setEventDescription] = useState(event?.description || '');
  const [eventDate, setEventDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const startTimeInputRef = useRef<HTMLInputElement>(null);
  const endTimeInputRef = useRef<HTMLInputElement>(null);
  const [editingSection, setEditingSection] = useState<'date' | 'start' | 'end' | null>(null);

  // Initialize date and time from event
  useEffect(() => {
    if (event?.start.dateTime) {
      const startDate = new Date(event.start.dateTime);
      setEventDate(startDate.toISOString().split('T')[0]);
      setEventStartTime(getTimeFromDateTime(event.start.dateTime));
      if (event.end.dateTime) {
        setEventEndTime(getTimeFromDateTime(event.end.dateTime));
      } else {
        const duration = getEventDuration(event);
        const endDate = new Date(startDate.getTime() + duration * 60000);
        setEventEndTime(getTimeFromDateTime(endDate.toISOString()));
      }
    }
  }, [event]);

  // Update states when event changes
  useEffect(() => {
    setEventTitle(event?.title || '');
    setEventDescription(event?.description || '');
  }, [event]);

  // Trigger native picker when entering edit mode
  useEffect(() => {
    if (editingSection) {
      setTimeout(() => {
        if (editingSection === 'date' && dateInputRef.current) {
          if ('showPicker' in dateInputRef.current && typeof (dateInputRef.current as any).showPicker === 'function') {
            try {
              (dateInputRef.current as any).showPicker();
            } catch (e) {
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
  }, [editingSection]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEventTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    if (event && eventTitle !== event.title && updateFunction) {
      updateFunction(event.id, { title: eventTitle.trim() });
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEventDescription(e.target.value);
  };

  const handleDescriptionBlur = () => {
    if (event && eventDescription !== (event.description || '') && updateFunction) {
      updateFunction(event.id, { description: eventDescription.trim() });
    }
  };

  const handleSectionClick = (section: 'date' | 'start' | 'end', e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSection(section);
  };

  const handleSaveSection = (newDate?: string, newStartTime?: string, newEndTime?: string) => {
    if (!event || !updateFunction) return;

    const dateToUse = newDate !== undefined ? newDate : eventDate;
    const startTimeToUse = newStartTime !== undefined ? newStartTime : eventStartTime;
    const endTimeToUse = newEndTime !== undefined ? newEndTime : eventEndTime;

    if (editingSection === 'date') {
      const [year, month, day] = dateToUse.split('-').map(Number);
      const currentStart = event.start.dateTime ? new Date(event.start.dateTime) : new Date();
      const newStartDate = new Date(year, month - 1, day, currentStart.getHours(), currentStart.getMinutes(), 0, 0);
      const duration = getEventDuration(event);
      const newEndDate = new Date(newStartDate.getTime() + duration * 60000);
      
      updateFunction(event.id, {
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
      const [startHours, startMinutes] = startTimeToUse.split(':').map(Number);
      const currentStart = event.start.dateTime ? new Date(event.start.dateTime) : new Date();
      const newStartDate = new Date(currentStart);
      newStartDate.setHours(startHours, startMinutes, 0, 0);
      const duration = getEventDuration(event);
      const newEndDate = new Date(newStartDate.getTime() + duration * 60000);
      
      updateFunction(event.id, {
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
      const [endHours, endMinutes] = endTimeToUse.split(':').map(Number);
      const currentStart = event.start.dateTime ? new Date(event.start.dateTime) : new Date();
      const newEndDate = new Date(currentStart);
      newEndDate.setHours(endHours, endMinutes, 0, 0);
      
      updateFunction(event.id, {
        end: {
          ...event.end,
          dateTime: newEndDate.toISOString()
        }
      });
      setEventEndTime(endTimeToUse);
    }
    
    setEditingSection(null);
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    // Reset to original values
    if (event?.start.dateTime) {
      const startDate = new Date(event.start.dateTime);
      setEventDate(startDate.toISOString().split('T')[0]);
      setEventStartTime(getTimeFromDateTime(event.start.dateTime));
      if (event.end.dateTime) {
        setEventEndTime(getTimeFromDateTime(event.end.dateTime));
      }
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteEvent && event) {
      deleteEvent(event.id);
      if (onDelete) {
        onDelete();
      }
    }
  };

  const formatDate = (event: ScheduleCardData) => {
    if (!event.start.dateTime) return '';
    const date = new Date(event.start.dateTime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (!event) return null;

  return (
    <>
      <div className="flex flex-col h-full overflow-y-auto pb-20">
        <div className="flex items-start w-full mb-4 gap-3">
          {/* Invisible checkbox to catch auto-focus from Sheet component */}
          <div className="sr-only">
            <Checkbox
              id={`event-${event?.id}`}
              size="md"
              checked={false}
              onChange={() => {}}
            />
          </div>
          
          {/* Title */}
          <textarea
            ref={titleTextareaRef}
            value={eventTitle}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            className={`flex-1 bg-transparent focus:outline-none text-xl font-semibold resize-none overflow-hidden border border-transparent rounded ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
            rows={1}
            style={{ height: 'auto' }}
            placeholder="Event title..."
          />
        </div>

        {/* Date and Time Section */}
        <div className={`flex items-center gap-2 pl-3 pr-2 py-2 rounded-lg h-[36px] mb-4 ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          
          {/* Date Section */}
          {editingSection === 'date' ? (
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
              onClick={(e) => handleSectionClick('date', e)}
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
          {editingSection === 'start' ? (
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
              onClick={(e) => handleSectionClick('start', e)}
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
          {editingSection === 'end' ? (
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
              onClick={(e) => handleSectionClick('end', e)}
              className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'
              }`}
            >
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {event.end.dateTime ? formatTime(event.end.dateTime) : ''}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <textarea
          ref={descTextareaRef}
          value={eventDescription}
          onChange={handleDescriptionChange}
          onBlur={handleDescriptionBlur}
          className={`w-full bg-transparent focus:outline-none resize-none overflow-hidden border border-transparent rounded mb-4 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
          rows={3}
          style={{ height: 'auto' }}
          placeholder="Description..."
        />
      </div>

      {/* Sticky Delete Button */}
      {deleteEvent && (
        <button
          onClick={handleDelete}
          className={`fixed bottom-4 left-4 p-3 rounded-full transition-colors shadow-lg z-50 ${
            isDarkMode 
              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300' 
              : 'bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700'
          }`}
          aria-label="Delete event"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </>
  );
};

