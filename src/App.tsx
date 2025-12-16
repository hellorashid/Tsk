// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import * as db from "./utils/db";
import "./App.css";

import { TaskModal } from "./components/TaskModal";
import ListItem from "./components/ListItem";
import { Task } from "./utils/types";
import UserAvatarButton from "./components/UserAvatarButton";
import { useBasic, useQuery } from "@basictech/react";
import bgImage from '/bg2.jpg';

import SilkTaskDrawer from "./components/SilkTaskDrawer";
// import Sidebar from "./components/Sidebar"; // Removed - sidebar is empty
import TaskDetailsSidebar from "./components/TaskDetailsSidebar";
import SettingsSidebar from "./components/SettingsSidebar";
import SettingsDrawer from "./components/SettingsDrawer";
import AboutModal from "./components/AboutModal";
import ScheduleSidebar from "./components/ScheduleSidebar";
import { ScheduleCardData } from "./components/ScheduleCard";
import AgendaView from "./components/AgendaView";
import DynamicIsland from "./components/DynamicIsland";
import FocusView from "./components/FocusView";
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import MobileNavBar from "./components/MobileNavBar";
import { fetchWeatherData } from "./utils/weather";
import FoldersBar from "./components/FoldersBar";
import FolderDrawer from "./components/FolderDrawer";
import FolderSettings from "./components/FolderSettings";
import { Folder } from "./utils/types";


function ExpandableInput() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submitted:', inputValue)
    setInputValue('')
    setIsExpanded(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsExpanded(false)
    }
  }

  const handleBlur = (e: React.FocusEvent) => {
    if (formRef.current && !formRef.current.contains(e.relatedTarget as Node)) {
      setIsExpanded(false)
    }
  }

  return (
    <div className="relative">
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="relative"
      >
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="I want to..."
          className={`
            w-full p-3 rounded-lg
            bg-white dark:bg-gray-800
            
            focus:outline-none focus:ring-2 focus:ring-blue-500
            transition-all duration-300 ease-in-out
            ${isExpanded ? 'h-32' : 'h-12'}
          `}
          onClick={() => setIsExpanded(true)}
        />

        <div
          className={`
            absolute bottom-0 left-0 right-0
            bg-white dark:bg-gray-800 border-t
            transition-opacity duration-300 ease-in-out
            ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
        >
          <div className="flex justify-between items-center p-2">
            <div className="flex space-x-2">
              <button variant="ghost" size="icon" type="button">
                {/* <Bold className="h-4 w-4" /> */}
                <span className="sr-only">Bold</span>
              </button>
              <button variant="ghost" size="icon" type="button">
                {/* <Italic className="h-4 w-4" /> */}
                <span className="sr-only">Italic</span>
              </button>
              <button variant="ghost" size="icon" type="button">
                {/* <Link className="h-4 w-4" /> */}
                <span className="sr-only">Link</span>
              </button>
            </div>
            <button type="submit" size="sm">
              {/* <Send className="h-4 w-4 mr-2" /> */}
              Submit
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}


function StatusIcon({ status }: { status: string }) {


  return (
    <div className="px-2 opacity-80">
      {status === "OFFLINE" && (
        <div className="text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">

            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
          </svg>
        </div>
      )}
      {status === "ONLINE" && (
        <div className="text-green-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">

            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        </div>
      )}
      {status !== "OFFLINE" && status !== "ONLINE" && (
        <div className="text-gray-500 animate-spin">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      )}
    </div>
  )
}





function Home() {
  const { db, dbStatus } = useBasic();
  const { theme, setAccentColor, setIsDarkMode, setFontStyle } = useTheme();

  const tasks = useQuery(() => db.collection("tasks").getAll())
  const scheduleEventsData = useQuery(() => db.collection("schedule").getAll())
  const folders = useQuery(() => db.collection("filters").getAll())

  console.log("tasks from DB:", tasks);
  console.log("schedule from DB:", scheduleEventsData);
  console.log("folders from DB:", folders);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleCardData | null>(null);
  const [focusedTask, setFocusedTask] = useState<Task | null>(null);
  const [focusSessionEventId, setFocusSessionEventId] = useState<string | null>(null);
  const fetchingWeatherDatesRef = useRef<Set<string>>(new Set());

  // Use schedule events from database, fallback to empty array
  const scheduleEvents = scheduleEventsData || [];
  
  // Update a schedule event in the database
  const updateScheduleEvent = async (id: string, changes: Partial<ScheduleCardData>) => {
    await db.collection("schedule").update(id, changes);
  };
  
  // Delete a schedule event from the database
  const deleteScheduleEvent = async (id: string) => {
    await db.collection("schedule").delete(id);
  };
  const [newInput, setNewInput] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Filter-related state - commented out for now
  // const [activeFilter, setActiveFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSchedule, setShowSchedule] = useState(true);
  const [viewMode, setViewMode] = useState('cozy');
  // const [customFilters, setCustomFilters] = useState([]);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  // const [showFilters, setShowFilters] = useState(false);
  const [isNewTaskMode, setIsNewTaskMode] = useState(false);
  const [mobileView, setMobileView] = useState<'tasks' | 'calendar'>('tasks');
  
  // Initialize from localStorage
  const [scheduleViewMode, setScheduleViewMode] = useState<'timeline' | 'agenda'>(() => {
    const saved = localStorage.getItem('tsk-schedule-view-mode');
    return (saved === 'timeline' || saved === 'agenda') ? saved : 'agenda';
  });
  
  // Dynamic Island mode state (Lifted State)
  const [islandMode, setIslandMode] = useState<'default' | 'task' | 'event' | 'command'>('default');

  // Folder state - initialize from localStorage
  const [activeFolder, setActiveFolder] = useState<string | null>(() => {
    const saved = localStorage.getItem('tsk-active-folder');
    return saved === 'null' ? null : saved;
  });
  const [folderDrawerOpen, setFolderDrawerOpen] = useState(false);
  const [folderSettingsOpen, setFolderSettingsOpen] = useState(false);
  
  // Default folders toggle state
  const [showAllFolder, setShowAllFolder] = useState<boolean>(() => {
    const saved = localStorage.getItem('tsk-show-all-folder');
    return saved !== 'false'; // Default to true
  });
  const [showOtherFolder, setShowOtherFolder] = useState<boolean>(() => {
    const saved = localStorage.getItem('tsk-show-other-folder');
    return saved === 'true'; // Default to false
  });
  const [showTodayFolder, setShowTodayFolder] = useState<boolean>(() => {
    const saved = localStorage.getItem('tsk-show-today-folder');
    return saved !== 'false'; // Default to true
  });
  const [suggestedTasksExpanded, setSuggestedTasksExpanded] = useState<boolean>(true);

  useEffect(() => {
    localStorage.setItem('tsk-show-today-folder', showTodayFolder.toString());
  }, [showTodayFolder]);

  // Auto-fetch weather for today on initial load (with delay to ensure app is fully initialized)
  useEffect(() => {
    if (scheduleEvents) {
      const timer = setTimeout(() => {
        handleFetchWeather(new Date());
      }, 3000); // Wait 3 seconds after schedule loads
      
      return () => clearTimeout(timer);
    }
  }, [scheduleEvents]);

  // Handle mobile view change - close drawer when switching views
  const handleMobileViewChange = (view: 'tasks' | 'calendar') => {
    setMobileView(view);
    if (drawerOpen) {
      setDrawerOpen(false);
      setIsNewTaskMode(false);
      setSelectedTask(null);
      setSelectedEvent(null);
    }
  };

  // Focus mode handlers
  const handleEnterFocus = async (task: Task) => {
    setFocusedTask(task);
    // Close any open modals/drawers
    setSelectedTask(null);
    setSelectedEvent(null);
    setDrawerOpen(false);
    
    // Create a focus session event
    const now = new Date();
    const sessionEvent = {
      title: `${task.name} (focus session)`,
      start: {
        dateTime: now.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: now.toISOString(), // Will be updated when session ends
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      color: 'rgba(148, 163, 184, 0.08)',
      type: 'task' as const,
      taskId: task.id,
      description: 'Focus session'
    };
    
    const eventId = await db.collection("schedule").add(sessionEvent);
    setFocusSessionEventId(eventId);
  };

  const handleExitFocus = async () => {
    // Update the focus session event's end time
    if (focusSessionEventId) {
      const now = new Date();
      await db.collection("schedule").update(focusSessionEventId, {
        end: {
          dateTime: now.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      });
      setFocusSessionEventId(null);
    }
    
    setFocusedTask(null);
  };

  // Fetch weather and create weather events
  const handleFetchWeather = async (date: Date) => {
    const dateStr = date.toDateString();
    
    // Check if already fetching for this date (race condition prevention)
    if (fetchingWeatherDatesRef.current.has(dateStr)) {
      return;
    }
    
    // Wait for scheduleEvents to be loaded (not undefined)
    if (!scheduleEvents) {
      return;
    }
    
    // Check if weather already exists for this date to prevent duplicates
    const existingWeather = scheduleEvents.find(event => {
      if (event.type !== 'weather' || !event.start.dateTime) return false;
      const eventDate = new Date(event.start.dateTime);
      return eventDate.toDateString() === dateStr;
    });
    
    if (existingWeather) {
      // Weather already exists, don't fetch again
      return;
    }

    // Mark this date as being fetched
    fetchingWeatherDatesRef.current.add(dateStr);

    try {
      const weatherData = await fetchWeatherData(
        theme.location.latitude,
        theme.location.longitude,
        date
      );

      // Create weather event (for header display)
      const weatherEvent = {
        title: 'Weather',
        start: {
          dateTime: new Date(date.setHours(12, 0, 0, 0)).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: new Date(date.setHours(12, 0, 0, 0)).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        color: 'rgba(148, 163, 184, 0.05)',
        type: 'weather' as const,
        description: `${weatherData.condition}`,
        metadata: {
          weather: {
            temperature: weatherData.temperature,
            condition: weatherData.condition,
            sunrise: weatherData.sunrise,
            sunset: weatherData.sunset,
            fetchedAt: new Date().toISOString(),
            hourlyTemperatures: weatherData.hourlyTemperatures
          }
        }
      };

      // Create sunrise event
      const sunriseDate = new Date(weatherData.sunrise);
      const sunriseEvent = {
        title: 'Sunrise',
        start: {
          dateTime: sunriseDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: sunriseDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        color: 'rgba(251, 146, 60, 0.15)',
        type: 'sunrise' as const,
        description: 'Sunrise'
      };

      // Create sunset event
      const sunsetDate = new Date(weatherData.sunset);
      const sunsetEvent = {
        title: 'Sunset',
        start: {
          dateTime: sunsetDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: sunsetDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        color: 'rgba(249, 115, 22, 0.15)',
        type: 'sunset' as const,
        description: 'Sunset'
      };

      // Add all three events to database
      await Promise.all([
        db.collection("schedule").add(weatherEvent),
        db.collection("schedule").add(sunriseEvent),
        db.collection("schedule").add(sunsetEvent)
      ]);
      
      // Remove from fetching set after successful creation
      fetchingWeatherDatesRef.current.delete(dateStr);
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      // Remove from fetching set on error too
      fetchingWeatherDatesRef.current.delete(dateStr);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleThemeChange = (isDark: boolean) => {
    setIsDarkMode(isDark);
  };

  // Filter-related code - commented out for now
  // Define filters
  // const filters = [
  //   { id: 'all', label: 'All Tasks', count: tasks?.length },
  //   { id: 'active', label: 'Active', count: tasks?.filter(task => !task.completed).length },
  //   { id: 'completed', label: 'Completed', count: tasks?.filter(task => task.completed).length },
  //   ...customFilters
  // ];

  // Filter tasks based on active filter - commented out, showing all tasks instead
  // const filteredTasks = tasks?.filter(task => {
  //   if (activeFilter === 'all') return true;
  //   if (activeFilter === 'active') return !task.completed;
  //   if (activeFilter === 'completed') return task.completed;
  //   
  //   // Handle custom filters
  //   const customFilter = customFilters.find(f => f.id === activeFilter);
  //   if (customFilter) {
  //     // Check if the task has any of the filter's labels
  //     if (customFilter.labels && customFilter.labels.length > 0) {
  //       return customFilter.labels.some(label => 
  //         task.labels && task.labels.includes(label)
  //       );
  //     }
  //     return true;
  //   }
  //   
  //   return true;
  // });

  const filteredTasks = (() => {
    const topLevelTasks = tasks?.filter((task: Task) => !task.parentTaskId) || [];
    
    if (activeFolder === null || activeFolder === 'all') {
      return topLevelTasks;
    }
    
    if (activeFolder === 'other') {
      return topLevelTasks.filter((task: Task) => {
        if (!task.labels) return true;
        
        const taskLabels = task.labels.split(',').map(l => l.trim());
        const hasFolder = taskLabels.some(label => label.startsWith('folder:'));
        return !hasFolder;
      });
    }
    
    if (activeFolder === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      return topLevelTasks.filter((task: Task) => {
        // Filter out completed tasks
        if (task.completed) {
          return false;
        }
        
        return scheduleEvents.some((event: ScheduleCardData) => {
          if (event.type !== 'task' || event.taskId !== task.id) {
            return false;
          }
          
          let eventDate: Date | null = null;
          
          if (event.start?.dateTime) {
            eventDate = new Date(event.start.dateTime);
            eventDate.setHours(0, 0, 0, 0);
          } else if (event.start?.date) {
            eventDate = new Date(event.start.date);
            eventDate.setHours(0, 0, 0, 0);
          }
          
          if (!eventDate) {
            return false;
          }
          
          return eventDate.getTime() >= today.getTime() && eventDate.getTime() < tomorrow.getTime();
        });
      });
    }
    
    const selectedFolder = folders?.find((f: Folder) => f.id === activeFolder);
    if (!selectedFolder) {
      return topLevelTasks;
    }
    
    const folderLabels = selectedFolder.labels
      ? selectedFolder.labels.split(',').map(l => l.trim()).filter(l => l)
      : [];
    
    if (folderLabels.length === 0) {
      return topLevelTasks;
    }
    
    return topLevelTasks.filter((task: Task) => {
      if (!task.labels) return false;
      
      const taskLabels = task.labels.split(',').map(l => l.trim());
      return folderLabels.some(folderLabel => 
        taskLabels.some(taskLabel => taskLabel === folderLabel)
      );
    });
  })();

  // Get suggested tasks (uncompleted tasks from past week + unscheduled tasks) for Today folder empty state
  const suggestedTasks = (() => {
    if (activeFolder !== 'today') {
      return [];
    }
    
    const topLevelTasks = tasks?.filter((task: Task) => !task.parentTaskId && !task.completed) || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Get tasks scheduled in the past week (but not today)
    const pastWeekScheduledTasks = topLevelTasks.filter((task: Task) => {
      return scheduleEvents.some((event: ScheduleCardData) => {
        if (event.type !== 'task' || event.taskId !== task.id) {
          return false;
        }
        
        let eventDate: Date | null = null;
        
        if (event.start?.dateTime) {
          eventDate = new Date(event.start.dateTime);
          eventDate.setHours(0, 0, 0, 0);
        } else if (event.start?.date) {
          eventDate = new Date(event.start.date);
          eventDate.setHours(0, 0, 0, 0);
        }
        
        if (!eventDate) {
          return false;
        }
        
        return eventDate.getTime() >= oneWeekAgo.getTime() && eventDate.getTime() < today.getTime();
      });
    });
    
    // Get unscheduled tasks (tasks with no schedule events)
    const unscheduledTasks = topLevelTasks.filter((task: Task) => {
      return !scheduleEvents.some((event: ScheduleCardData) => 
        event.type === 'task' && event.taskId === task.id
      );
    });
    
    // Combine both lists, prioritizing past week scheduled tasks, then unscheduled tasks
    // Remove duplicates and limit to 5
    const allSuggested = [...pastWeekScheduledTasks];
    unscheduledTasks.forEach(task => {
      if (!allSuggested.find(t => t.id === task.id)) {
        allSuggested.push(task);
      }
    });
    
    return allSuggested.slice(0, 5);
  })();

    // Keyboard navigation for tasks and global shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Global shortcuts - only when no input is focused
      const activeElement = document.activeElement;
      const isInputFocused = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;

      if (!isInputFocused) {
        if (e.key === 't') {
          e.preventDefault();
          setIslandMode('task');
          return;
        }
        
        if (e.key === 'e') {
          e.preventDefault();
          setIslandMode('event');
          return;
        }
        
        if (e.key === '/') {
          e.preventDefault();
          setIslandMode(prev => prev === 'command' ? 'default' : 'command');
          return;
        }

        if (e.key === ' ') {
          // Space to focus task
          if (selectedTask) {
             e.preventDefault();
             handleEnterFocus(selectedTask);
             return;
          }
        }
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedTask(null);
        setSelectedEvent(null);
        setSettingsDrawerOpen(false);
        setAboutModalOpen(false);
        setShowSchedule(false);
        setIslandMode('default');
        if (isMobile) {
          setDrawerOpen(false);
        }
        return;
      }

      // Tab to cycle through folders (only when Dynamic Island is not open/focused)
      if (e.key === 'Tab' && !isInputFocused && islandMode === 'default' && !selectedTask && !selectedEvent) {
        e.preventDefault();
        
        const folderIds = [
          ...(showAllFolder ? ['all'] : []),
          ...(folders?.map(f => f.id) || []),
          ...(showOtherFolder ? ['other'] : []),
          ...(showTodayFolder ? ['today'] : [])
        ];
        
        if (folderIds.length === 0) {
          return;
        }
        
        const currentFolder = activeFolder || (showAllFolder ? 'all' : folderIds[0]);
        const currentIndex = folderIds.indexOf(currentFolder);
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % folderIds.length : 0;
        
        setActiveFolder(folderIds[nextIndex]);
        return;
      }

      // Schedule Navigation (ArrowUp / ArrowDown)
      if (scheduleEvents && scheduleEvents.length > 0 && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
         // Only if no task is selected (or maybe allow switching context?)
         // For now let's prioritize schedule navigation if we are not in input
         if (!isInputFocused) {
            e.preventDefault();
            
            // Sort events by time
            const sortedEvents = [...scheduleEvents].sort((a, b) => {
               const startA = a.start?.dateTime ? new Date(a.start.dateTime).getTime() : 0;
               const startB = b.start?.dateTime ? new Date(b.start.dateTime).getTime() : 0;
               return startA - startB;
            });

            // Filter for Today
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

            const todaysEvents = sortedEvents.filter(ev => {
              if (!ev.start?.dateTime) return false;
              const eventDate = new Date(ev.start.dateTime);
              return eventDate >= startOfDay && eventDate <= endOfDay;
            });
            
            if (todaysEvents.length === 0) return;

            const currentIndex = selectedEvent 
               ? todaysEvents.findIndex(ev => ev.id === selectedEvent.id)
               : -1;
            
            let newIndex;
            if (e.key === 'ArrowDown') {
               // If nothing selected, start at 0. If at end, cycle to 0.
               newIndex = currentIndex < todaysEvents.length - 1 ? currentIndex + 1 : 0;
            } else {
               // If nothing selected (currentIndex -1), wrapping implies going to last? 
               // Actually currentIndex > 0 check handles -1 because -1 > 0 is false, so it goes to else -> last item.
               // That feels natural for "Up" (start from bottom).
               newIndex = currentIndex > 0 ? currentIndex - 1 : todaysEvents.length - 1;
            }
            
            const nextEvent = todaysEvents[newIndex];
            // Use the wrapper logic to select event and clear task
            handleEventSelectWrapper(nextEvent);
            return; 
         }
      }

      // Task List Navigation
      if (filteredTasks && filteredTasks.length > 0 && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        e.preventDefault();

        const currentIndex = selectedTask
          ? filteredTasks.findIndex(task => task.id === selectedTask.id)
          : -1;

        let newIndex;

        if (e.key === 'ArrowRight') {
          // Move to next task or first task if at the end
          newIndex = currentIndex < filteredTasks.length - 1 ? currentIndex + 1 : 0;
        } else {
          // Move to previous task or last task if at the beginning
          newIndex = currentIndex > 0 ? currentIndex - 1 : filteredTasks.length - 1;
        }

        setSelectedTask(filteredTasks[newIndex]);
        setSelectedEvent(null); // Clear event when navigating tasks
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredTasks, selectedTask, isMobile]);

  // When opening a task in the drawer
  const handleTaskSelect = (task) => {
    console.log("Selected task:", task);
    console.log("isMobile state:", isMobile);

    // Validate the task
    if (!task) {
      console.error("Cannot select null task");
      return;
    }

    if (!task.id) {
      console.error("Task is missing ID:", task);
      return;
    }

    setSelectedTask({ ...task }); // Use a copy to ensure reactivity
    setSelectedEvent(null); // Clear event selection when selecting a task
    setSettingsDrawerOpen(false); // Close settings when selecting a task
    setIsNewTaskMode(false); // Ensure we're in edit mode, not new task mode
    if (isMobile) {
      console.log("Opening drawer for mobile view");
      setDrawerOpen(true);
    }
  };

  // Wrapper to ensure mutual exclusivity when selecting tasks
  const handleTaskSelectWrapper = (task: Task | null) => {
    setSelectedTask(task);
    setSelectedEvent(null); // Clear event when selecting task
  };

  // Wrapper to ensure mutual exclusivity when selecting events
  const handleEventSelectWrapper = (event: ScheduleCardData | null) => {
    setSelectedEvent(event);
    setSelectedTask(null); // Clear task when selecting event
  };

  const handleCloseTaskDetails = () => {
    setSelectedTask(null);
    setSelectedEvent(null);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  // Handle schedule card clicks
  const handleScheduleCardClick = (cardData: ScheduleCardData) => {
    // Check if this is a deleted task (empty taskId but has snapshot)
    const isDeletedTask = cardData.type === 'task' && (!cardData.taskId || cardData.taskId === '') && cardData.metadata?.taskSnapshot;
    
    if (isDeletedTask) {
      // Deleted task - open as event to show read-only view
      setSelectedEvent(cardData);
      setSelectedTask(null);
      setIsNewTaskMode(false);
      if (isMobile) {
        setDrawerOpen(true);
      }
    } else if (cardData.type === 'task:completed') {
      // Completion event - open as event to show completion view
      setSelectedEvent(cardData);
      setSelectedTask(null);
      setIsNewTaskMode(false);
      if (isMobile) {
        setDrawerOpen(true);
      }
    } else if (cardData.type === 'task' && cardData.taskId && cardData.taskId !== '') {
      // Active task - find and select the task
      const task = tasks.find(t => t.id === cardData.taskId);
      if (task) {
        setSelectedTask(task);
        setSelectedEvent(null); // Clear event selection
        setIsNewTaskMode(false);
        if (isMobile) {
          setDrawerOpen(true);
        }
      }
    } else if (cardData.type === 'event' || cardData.type === 'other') {
      // Regular event
      setSelectedEvent(cardData);
      setSelectedTask(null); // Clear task selection
      setIsNewTaskMode(false);
      if (isMobile) {
        setDrawerOpen(true);
      }
    }
  };

  // Convert minutes from midnight to HH:MM format
  const minutesToTimeString = (minutes: number): string => {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Get current time in minutes from midnight
  const getCurrentTimeInMinutes = (): number => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };

  // Find next available time slot (30 min duration)
  const findNextAvailableSlot = (durationMinutes: number = 30): { start: Date; end: Date } => {
    const now = new Date();
    
    // Round up to next 15-minute interval
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    now.setMinutes(roundedMinutes, 0, 0);
    
    let candidateStart = new Date(now);
    let candidateEnd = new Date(candidateStart.getTime() + durationMinutes * 60 * 1000);
    
    // Keep trying until we find a free slot (max 50 attempts to avoid infinite loop)
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      // Check if this slot conflicts with any existing event
      const hasConflict = scheduleEvents.some(event => {
        if (!event.start.dateTime || !event.end.dateTime) return false;
        
        const eventStart = new Date(event.start.dateTime);
        const eventEnd = new Date(event.end.dateTime);
        
        // Check for overlap: candidate starts before event ends AND candidate ends after event starts
        return candidateStart < eventEnd && candidateEnd > eventStart;
      });
      
      if (!hasConflict) {
        // Found a free slot!
        return { start: candidateStart, end: candidateEnd };
      }
      
      // Move to next 15-minute slot
      candidateStart = new Date(candidateStart.getTime() + 15 * 60 * 1000);
      candidateEnd = new Date(candidateStart.getTime() + durationMinutes * 60 * 1000);
      attempts++;
    }
    
    // Fallback: if no slot found, just use current time
    return { start: now, end: new Date(now.getTime() + durationMinutes * 60 * 1000) };
  };

  // Handle adding task to schedule
  const handleAddToSchedule = async (task: Task) => {
    const { start, end } = findNextAvailableSlot(30); // 30 minute duration

    const newScheduleItem = {
      title: task.name || 'Untitled Task', // Stored for reference, but display uses task.name from taskId
      start: {
        dateTime: start.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      color: 'rgba(148, 163, 184, 0.08)',
      type: 'task',
      taskId: task.id,
      description: task.description
    };

    // Add to database (DB will auto-generate ID)
    await db.collection("schedule").add(newScheduleItem);
  };

  // Handle adding new event
  const handleAddEvent = async (eventData: Omit<ScheduleCardData, 'id'>): Promise<ScheduleCardData> => {
    const eventId = await db.collection("schedule").add(eventData);
    return { ...eventData, id: eventId }; // Return with DB-assigned ID
  };

  const handleOpenSettings = () => {
    setSettingsDrawerOpen(true);
  };

  const handleCloseSettings = () => {
    setSettingsDrawerOpen(false);
  };

  const handleOpenAbout = () => {
    setAboutModalOpen(true);
  };

  const handleCloseAbout = () => {
    setAboutModalOpen(false);
  };


  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  const handleAccentColorChange = (color) => {
    setAccentColor(color);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newInput.trim() === "") {
      alert('Please fill out this field');
      return;
    }

    const newTask = await db.collection("tasks").add({
      name: newInput,
      description: "",
      completed: false
    });
    console.log("newTask:", newTask);



    setNewInput("");
  };

  const updateTask = async (taskId: string, changes: any) => {
    console.log(`Updating task ${taskId} with:`, changes);
    
    // Check if task is being marked as complete
    if (changes.completed === true) {
      const task = await db.collection("tasks").get(taskId);
      
      // Only create completion event if task wasn't already completed
      if (task && !task.completed) {
        await createTaskCompletionEvent(task);
      }
    }
    
    await db.collection("tasks").update(taskId, changes);
  }
  
  // Create or update a completion activity event
  const createTaskCompletionEvent = async (task: Task) => {
    const now = new Date();
    
    // Check if a completion event already exists for this task today
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    
    const existingCompletionEvents = await db.collection("schedule")
      .filter((event: ScheduleCardData) => 
        event.type === 'task:completed' && 
        event.taskId === task.id &&
        event.start.dateTime &&
        new Date(event.start.dateTime) >= todayStart &&
        new Date(event.start.dateTime) <= todayEnd
      );
    
    const completionEventData = {
      title: task.name || 'Untitled Task',
      start: {
        dateTime: now.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: now.toISOString(), // Same as start - no duration
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      color: 'rgba(148, 163, 184, 0.08)',
      type: 'task:completed' as const,
      taskId: task.id,
      description: `Completed: ${task.name}`
    };
    
    if (existingCompletionEvents && existingCompletionEvents.length > 0) {
      // Update existing completion event with new time
      await db.collection("schedule").update(existingCompletionEvents[0].id, completionEventData);
    } else {
      // Create new completion event
      await db.collection("schedule").add(completionEventData);
    }
  };
  
  // Handle task toggle from schedule - wrapper for updateTask
  const handleTaskToggle = (taskId: string, completed: boolean) => {
    updateTask(taskId, { completed });
  };

  const deleteTask = async (taskId: string) => {
    // First, check if this task has any schedule items
    const scheduleItems = await db.collection("schedule")
      .filter((item: any) => item.taskId === taskId)
    
    // If there are schedule items, we need to snapshot the task data
    if (scheduleItems && scheduleItems.length > 0) {
      // Get the task data before deleting
      const task = await db.collection("tasks").get(taskId);
      
      if (task) {
        // Create snapshot with task data
        const taskSnapshot = {
          id: taskId,
          name: task.name,
          description: task.description,
          completed: task.completed,
          deletedAt: Date.now()
        };
        
        // Update each schedule item to set taskId to empty string and add snapshot
        for (const item of scheduleItems) {
          await db.collection("schedule").update(item.id, {
            taskId: '',
            metadata: {
              taskSnapshot
            }
          });
        }
      }
    }
    
    // Now delete the task
    await db.collection("tasks").delete(taskId);
    
    // Clear selections if the deleted task was selected
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
  }

  // Filter creation handler - commented out for now
  // const handleCreateFilter = (filterName, labels) => {
  //   const newFilterId = `custom-${Date.now()}`;
  //   const newFilter = {
  //     id: newFilterId,
  //     label: filterName,
  //     labels: labels,
  //     count: 0, // This will be updated when tasks are filtered
  //   };
  //   
  //   setCustomFilters([...customFilters, newFilter]);
  //   setActiveFilter(newFilterId); // Switch to the new filter
  // };

  const handleAddTask = async (taskName): Promise<string | null> => {
    // Auto-add current folder label if a folder is selected
    let labels = '';
    if (activeFolder) {
      const selectedFolder = folders?.find((f: Folder) => f.id === activeFolder);
      if (selectedFolder) {
        labels = `folder:${selectedFolder.name.toLowerCase()}`;
      }
    }
    
    const taskId = await db.collection("tasks").add({
      name: taskName,
      description: "",
      completed: false,
      labels: labels
    });
    console.log("newTask ID:", taskId);
    
    // If Today folder is active, automatically add task to today's schedule
    if (activeFolder === 'today' && taskId) {
      const task: Task = {
        id: taskId,
        name: taskName,
        description: "",
        completed: false,
        labels: labels
      };
      await handleAddToSchedule(task);
    }
    
    return taskId || null;
  };

  // Add subtask to a parent task
  const handleAddSubtask = async (parentTaskId: string, subtaskName: string): Promise<string | null> => {
    const subtaskId = await db.collection("tasks").add({
      name: subtaskName,
      description: "",
      completed: false,
      parentTaskId: parentTaskId
    });
    console.log("newSubtask ID:", subtaskId);
    return subtaskId || null;
  };

  // New function to open drawer in "new task" mode
  const openNewTaskDrawer = () => {
    console.log("Opening new task drawer");
    setIsNewTaskMode(true);
    setSelectedTask(null);
    setSelectedEvent(null);
    setDrawerOpen(true);
  };

  const handleFontStyleChange = (style: 'mono' | 'sans' | 'serif') => {
    setFontStyle(style);
  };

  useEffect(() => {
    localStorage.setItem('tsk-active-folder', activeFolder === null ? 'null' : activeFolder);
  }, [activeFolder]);

  useEffect(() => {
    localStorage.setItem('tsk-schedule-view-mode', scheduleViewMode);
  }, [scheduleViewMode]);

  useEffect(() => {
    localStorage.setItem('tsk-show-all-folder', showAllFolder.toString());
  }, [showAllFolder]);

  useEffect(() => {
    localStorage.setItem('tsk-show-other-folder', showOtherFolder.toString());
  }, [showOtherFolder]);

  // Folder handlers
  const handleFolderSelect = (folderId: string | null) => {
    setActiveFolder(folderId);
  };

  const handleCreateFolder = async (name: string, labels?: string, color?: string) => {
    // Auto-generate folder label if not provided
    const folderLabel = `folder:${name.toLowerCase()}`;
    const allLabels = labels ? `${folderLabel},${labels}` : folderLabel;
    
    await db.collection("filters").add({
      name: name.toLowerCase(), // Store lowercase
      labels: allLabels,
      color: color || ''
    });
  };

  const handleUpdateFolder = async (folderId: string, name: string, labels: string, color?: string) => {
    await db.collection("filters").update(folderId, {
      name: name.toLowerCase(), // Store lowercase
      labels: labels,
      color: color || ''
    });
  };

  const handleDeleteFolder = async (folderId: string) => {
    await db.collection("filters").delete(folderId);
    // If deleted folder was active, switch to "All"
    if (activeFolder === folderId) {
      setActiveFolder(null);
    }
  };

  const handleOpenFolderSettings = () => {
    setFolderSettingsOpen(true);
  };

  // Update viewport height on resize for mobile Chrome fix (fallback for older browsers)
  // Modern browsers use dvh (dynamic viewport height) natively, so this is only needed for legacy support
  useEffect(() => {
    // Skip if browser supports dvh natively
    if (typeof CSS !== 'undefined' && CSS.supports('height', '100dvh')) {
      return;
    }

    const updateViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  return (
    <>
      {/* Focus Mode - renders on top of everything */}
      {focusedTask && (
        <FocusView
          task={focusedTask}
          onExit={handleExitFocus}
          onUpdateTask={updateTask}
          onTaskToggle={handleTaskToggle}
          onAddSubtask={handleAddSubtask}
          accentColor={theme.accentColor}
          isDarkMode={theme.isDarkMode}
        />
      )}

    <section className={`flex-1 task-home w-full relative overflow-hidden ${theme.isDarkMode ? 'text-gray-100' : 'text-gray-900'} ${isMobile && drawerOpen ? 'drawer-open-scale' : ''}`}
      style={{
        backgroundColor: theme.accentColor,
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.4)), url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        // Use dvh (dynamic viewport height) with fallback
        // Modern browsers: dvh tracks visible viewport and adjusts as address bar shows/hides
        // Fallback: JavaScript sets --vh for older browsers
        height: typeof CSS !== 'undefined' && CSS.supports('height', '100dvh') 
          ? '100dvh' 
          : 'calc(var(--vh, 1vh) * 100)',
        maxHeight: typeof CSS !== 'undefined' && CSS.supports('height', '100dvh') 
          ? '100dvh' 
          : 'calc(var(--vh, 1vh) * 100)',
        paddingBottom: 'env(safe-area-inset-bottom, 20px)'
      }}>
      <div className=" h-12 rounded-b-md md:rounded-b-none flex justify-between items-center sticky top-0 z-100"
        style={{ backgroundColor: 'transparent' }}>
        <div className="">
          <button 
            onClick={handleOpenAbout}
            className="group ml-1 px-2 py-2 rounded-lg bg-transparent hover:bg-white/10 transition-colors duration-200 text-md flex items-center cursor-pointer"
          >
            <img className="w-6 h-6 mr-2" src='tsk-logo.png' />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">tsk.</span>
          </button>
          {/* {isNewTaskMode && 'NT'} {drawerOpen && 'DO'} */}
        </div>

        <div className="flex-none flex items-center pr-2 gap-2">
          <button
            onClick={handleOpenSettings}
            className="opacity-60 hover:opacity-100 focus:outline-none bg-transparent"
            aria-label="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
          <UserAvatarButton accentColor={theme.accentColor} />
        </div>
      </div>

      <div className="flex" style={{ 
        height: typeof CSS !== 'undefined' && CSS.supports('height', '100dvh') 
          ? 'calc(100dvh - 64px)' 
          : 'calc(var(--vh, 1vh) * 100 - 64px)'
      }}>
        {/* Sidebar removed - was empty after filters were commented out */}

        {/* Tasks View - shown on desktop or mobile when tasks tab is selected */}
        {(!isMobile || mobileView === 'tasks') && (
          <div className="flex-1 flex flex-col relative">
            {/* Folders Bar - outside scroll container */}
            <FoldersBar
              folders={folders || []}
              activeFolder={activeFolder}
              onFolderSelect={handleFolderSelect}
              showAllFolder={showAllFolder}
              showOtherFolder={showOtherFolder}
              showTodayFolder={showTodayFolder}
              accentColor={theme.accentColor}
              isDarkMode={theme.isDarkMode}
              onOpenSettings={handleOpenFolderSettings}
            />
            
            {/* Tasks scroll container */}
            <div className="flex-1 overflow-y-auto px-1 md:px-4 relative tasks-scroll-container" style={{ 
              paddingBottom: isMobile 
                ? '8rem' 
                : (typeof CSS !== 'undefined' && CSS.supports('height', '100dvh') ? '50dvh' : 'calc(var(--vh, 1vh) * 50)')
            }}>
              <div className="mt-10 flex justify-center">
              <div className="w-full max-w-2xl relative">
                {filteredTasks?.length == 0 && (
                  <div>
                    {activeFolder === 'today' ? (
                      <>
                        <p className={`text-lg font-bold text-center ${theme.isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                          No Tasks scheduled for Today
                        </p>
                        <p className={`no-task-blurb text-sm font-serif text-center mt-2 ${theme.isDarkMode ? 'text-slate-100' : 'text-gray-700'}`}>
                          which is <em>totally</em> fine. its okay to do nothing. you deserve a rest day.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className={`text-lg font-bold text-center ${theme.isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                          No tasks yet.
                        </p>
                        <p className={`no-task-blurb text-sm font-serif text-center ${theme.isDarkMode ? 'text-slate-100' : 'text-gray-700'}`}>
                          which is <em>totally</em> fine. its okay to do nothing. you deserve a rest day.
                        </p>
                        <p className={`no-task-blurb text-sm font-serif text-center ${theme.isDarkMode ? 'text-slate-100' : 'text-gray-700'}`}>
                          but also, you can add a task below.
                        </p>
                      </>
                    )}
                  </div>
                )}

                <div className={`flex flex-col ${viewMode === 'compact' ? 'space-y-0' : viewMode === 'cozy' ? 'space-y-1' : 'space-y-2'}`}>
                  {filteredTasks?.map((task: Task) => (
                    <div
                      key={task.id}
                      className="w-full "
                      onClick={() => {
                        // handleTaskSelect(task);
                      }}
                    >
                      <ListItem
                        key={task.id}
                        task={task}
                        deleteTask={deleteTask}
                        updateTask={updateTask}
                        isSelected={selectedTask?.id === task.id}
                        viewMode={viewMode}
                        accentColor={theme.accentColor}
                        isDarkMode={theme.isDarkMode}
                        handleTaskSelect={handleTaskSelect}
                        onEnterFocus={handleEnterFocus}
                        onAddToSchedule={handleAddToSchedule}
                      />
                    </div>
                  ))}
                </div>

                {/* Suggested tasks section - shown when Today folder is active */}
                {activeFolder === 'today' && suggestedTasks.length > 0 && (
                  <div className={`mt-8 ${filteredTasks.length > 0 ? 'pt-8' : ''}`}>
                    <button
                      onClick={() => setSuggestedTasksExpanded(!suggestedTasksExpanded)}
                      className={`flex items-center gap-2 mb-4 w-full text-left ${theme.isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900'} transition-colors`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 transition-transform ${suggestedTasksExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-sm font-medium">Suggested</span>
                      <span className={`text-xs ${theme.isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        ({suggestedTasks.length})
                      </span>
                    </button>
                    {suggestedTasksExpanded && (
                      <div className={`flex flex-col ${viewMode === 'compact' ? 'space-y-0' : viewMode === 'cozy' ? 'space-y-1' : 'space-y-2'}`}>
                        {suggestedTasks.map((task: Task) => (
                          <div
                            key={task.id}
                            className="w-full"
                            onClick={() => {
                              handleTaskSelect(task);
                            }}
                          >
                            <ListItem
                              task={task}
                              deleteTask={deleteTask}
                              updateTask={updateTask}
                              isSelected={selectedTask?.id === task.id}
                              viewMode={viewMode}
                              accentColor={theme.accentColor}
                              isDarkMode={theme.isDarkMode}
                              handleTaskSelect={handleTaskSelect}
                              onEnterFocus={handleEnterFocus}
                              onAddToSchedule={handleAddToSchedule}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>
        )}

        {/* Calendar View - shown on mobile when calendar tab is selected */}
        {isMobile && mobileView === 'calendar' && (
          <div className="flex-1 h-full overflow-hidden px-1 relative">
            {scheduleViewMode === 'timeline' ? (
              <ScheduleSidebar
                onCardClick={handleScheduleCardClick}
                events={scheduleEvents}
                onUpdateEvent={updateScheduleEvent}
                onDeleteEvent={deleteScheduleEvent}
                onTaskToggle={handleTaskToggle}
                onAddEvent={handleAddEvent}
                accentColor={theme.accentColor}
                isDarkMode={theme.isDarkMode}
                viewMode={scheduleViewMode}
                onViewModeChange={setScheduleViewMode}
                location={theme.location}
                onFetchWeather={handleFetchWeather}
                folders={folders}
              />
            ) : (
              <AgendaView
                onCardClick={handleScheduleCardClick}
                events={scheduleEvents}
                onTaskToggle={handleTaskToggle}
                accentColor={theme.accentColor}
                isDarkMode={theme.isDarkMode}
                viewMode={scheduleViewMode}
                onViewModeChange={setScheduleViewMode}
                location={theme.location}
                onFetchWeather={handleFetchWeather}
                folders={folders}
              />
            )}
          </div>
        )}

        {/* Desktop task details sidebar - disabled in favor of dynamic island */}
        {false && !isMobile && selectedTask && !settingsDrawerOpen && (
          <div className="hidden md:block md:pl-4 w-1/3 p-2">

            <TaskDetailsSidebar
              key={selectedTask.id}
              task={selectedTask}
              taskId={selectedTask.id}
              onClose={handleCloseTaskDetails}
              onUpdate={updateTask}
              onDelete={deleteTask}
              accentColor={theme.accentColor}
              isDarkMode={theme.isDarkMode}
            />
          </div>
        )}

        {/* Schedule sidebar - always show on desktop */}
        {!isMobile && (
          <div className="hidden md:block md:pl-4 w-[480px] p-2">
            {scheduleViewMode === 'timeline' ? (
              <ScheduleSidebar
                onCardClick={handleScheduleCardClick}
                events={scheduleEvents}
                onUpdateEvent={updateScheduleEvent}
                onDeleteEvent={deleteScheduleEvent}
                onTaskToggle={handleTaskToggle}
                onAddEvent={handleAddEvent}
                accentColor={theme.accentColor}
                isDarkMode={theme.isDarkMode}
                viewMode={scheduleViewMode}
                onViewModeChange={setScheduleViewMode}
                location={theme.location}
                onFetchWeather={handleFetchWeather}
                folders={folders}
              />
            ) : (
              <AgendaView
                onCardClick={handleScheduleCardClick}
                events={scheduleEvents}
                onTaskToggle={handleTaskToggle}
                accentColor={theme.accentColor}
                isDarkMode={theme.isDarkMode}
                viewMode={scheduleViewMode}
                onViewModeChange={setScheduleViewMode}
                location={theme.location}
                onFetchWeather={handleFetchWeather}
                folders={folders}
              />
            )}
          </div>
        )}
      </div>

      {/* Dynamic Island - Desktop - sticky at bottom of tasks column */}
      {!isMobile && (
        <DynamicIsland
          selectedTask={selectedTask}
          selectedEvent={selectedEvent}
          onTaskSelect={handleTaskSelectWrapper}
          onEventSelect={handleEventSelectWrapper}
          onAddTask={handleAddTask}
          onAddEvent={handleAddEvent}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
          onUpdateEvent={updateScheduleEvent}
          onDeleteEvent={deleteScheduleEvent}
          onAddToSchedule={handleAddToSchedule}
          onAddSubtask={handleAddSubtask}
          onEnterFocus={handleEnterFocus}
          tasks={tasks}
          folders={folders}
          activeFolder={activeFolder}
          onFolderSelect={handleFolderSelect}
          onOpenFolderSettings={handleOpenFolderSettings}
          showAllFolder={showAllFolder}
          showOtherFolder={showOtherFolder}
          showTodayFolder={showTodayFolder}
          accentColor={theme.accentColor}
          isDarkMode={theme.isDarkMode}
          mode={islandMode}
          onModeChange={setIslandMode}
          onOpenSettings={handleOpenSettings}
          onToggleView={() => setScheduleViewMode(prev => prev === 'agenda' ? 'timeline' : 'agenda')}
          currentView={scheduleViewMode}
        />
      )}

      {/* Combined Task Drawer - handles both edit and new task modes */}
      {isMobile && (
        <SilkTaskDrawer
          isOpen={drawerOpen}
          setIsOpen={setDrawerOpen}
          task={selectedTask}
          event={selectedEvent}
          updateFunction={updateTask}
          deleteTask={deleteTask}
          accentColor={theme.accentColor}
          isNewTaskMode={isNewTaskMode}
          currentView={mobileView}
          onAddTask={handleAddTask}
          onAddToSchedule={handleAddToSchedule}
          isDarkMode={theme.isDarkMode}
          onUpdateEvent={updateScheduleEvent}
          onDeleteEvent={deleteScheduleEvent}
          onAddEvent={handleAddEvent}
          onAddSubtask={handleAddSubtask}
          onUpdateSubtask={updateTask}
          onDeleteSubtask={deleteTask}
          onTaskSelect={handleTaskSelect}
          onEnterFocus={handleEnterFocus}
          folders={folders}
        />
      )}

      {/* Settings drawer - shown on both mobile and desktop */}
      <SettingsDrawer
        isOpen={settingsDrawerOpen}
        setIsOpen={setSettingsDrawerOpen}
        onViewModeChange={handleViewModeChange}
        currentViewMode={viewMode}
        onAccentColorChange={handleAccentColorChange}
        currentAccentColor={theme.accentColor}
        onThemeChange={handleThemeChange}
        isDarkMode={theme.isDarkMode}
        onFontStyleChange={handleFontStyleChange}
        currentFontStyle={theme.fontStyle}
      />

      {/* About modal - shown on both mobile and desktop */}
      <AboutModal
        isOpen={aboutModalOpen}
        setIsOpen={setAboutModalOpen}
        isDarkMode={theme.isDarkMode}
        currentAccentColor={theme.accentColor}
      />

      {/* Mobile Navigation Bar */}
      {isMobile && (
        <>
          <MobileNavBar
            currentView={mobileView}
            onViewChange={handleMobileViewChange}
            onCreateNew={openNewTaskDrawer}
            accentColor={theme.accentColor}
            isDarkMode={theme.isDarkMode}
          />
          
          {/* Mobile Folder Button - Bottom Left - Only show on tasks view */}
          {mobileView === 'tasks' && (
            <div
              className="fixed bottom-0 left-0 z-50 md:hidden"
              style={{
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
              }}
            >
              <div className="flex px-6 mb-2">
                <div
                  className="flex items-center justify-center px-2 py-2 rounded-full backdrop-blur-3xl shadow-lg border"
                  style={{
                    backgroundColor: `${theme.accentColor}E6`,
                    borderColor: theme.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <button
                    onClick={() => setFolderDrawerOpen(true)}
                    className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-200 ${
                      theme.isDarkMode
                        ? 'text-gray-300 hover:bg-white/10'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    aria-label="Folders"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-6 w-6" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" 
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Folder Drawer - Mobile only */}
      {isMobile && (
        <FolderDrawer
          isOpen={folderDrawerOpen}
          setIsOpen={setFolderDrawerOpen}
          folders={folders || []}
          activeFolder={activeFolder}
          onFolderSelect={handleFolderSelect}
          onOpenSettings={handleOpenFolderSettings}
          showAllFolder={showAllFolder}
          showOtherFolder={showOtherFolder}
          showTodayFolder={showTodayFolder}
          isDarkMode={theme.isDarkMode}
          accentColor={theme.accentColor}
        />
      )}

      {/* Folder Settings */}
      <FolderSettings
        isOpen={folderSettingsOpen}
        setIsOpen={setFolderSettingsOpen}
        folders={folders || []}
        onCreateFolder={handleCreateFolder}
        onUpdateFolder={handleUpdateFolder}
        onDeleteFolder={handleDeleteFolder}
        showAllFolder={showAllFolder}
        showOtherFolder={showOtherFolder}
        showTodayFolder={showTodayFolder}
        onToggleAllFolder={setShowAllFolder}
        onToggleOtherFolder={setShowOtherFolder}
        onToggleTodayFolder={setShowTodayFolder}
        isDarkMode={theme.isDarkMode}
        accentColor={theme.accentColor}
      />
    </section>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <Home />
      </div>
    </ThemeProvider>
  );
}

export default App;
