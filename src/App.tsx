// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import * as db from "./utils/db";
import "./App.css";
import { AboutModal } from "./components/AboutModal";
import { TaskModal } from "./components/TaskModal";
import ListItem from "./components/ListItem";
import { Task } from "./utils/types";
import UserAvatarButton from "./components/UserAvatarButton";
import { useBasic, useQuery } from "@basictech/react";
import bgImage from '/bg2.jpg';

import SilkTaskDrawer from "./components/SilkTaskDrawer";
import Sidebar from "./components/Sidebar";
import TaskDetailsSidebar from "./components/TaskDetailsSidebar";
import SettingsSidebar from "./components/SettingsSidebar";
import SettingsDrawer from "./components/SettingsDrawer";


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
            border border-gray-300 dark:border-gray-600
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


function StatusIcon( {status}: {status: string}) {


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

  const tasks = useQuery( () => db.collection("tasks").getAll())
  
  console.log("tasks from DB:", tasks);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newInput, setNewInput] = useState(""); 
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState('cozy');
  const [customFilters, setCustomFilters] = useState([]);
  const [accentColor, setAccentColor] = useState('#1F1B2F');
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isNewTaskMode, setIsNewTaskMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [fontStyle, setFontStyle] = useState<'mono' | 'sans' | 'serif'>('sans');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Apply accent color to CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', accentColor);
  }, [accentColor]);

  // Apply theme to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Apply font style to document
  useEffect(() => {
    document.documentElement.style.setProperty('--font-style', fontStyle);
  }, [fontStyle]);

  const handleThemeChange = (isDark: boolean) => {
    setIsDarkMode(isDark);
  };

  // Define filters
  const filters = [
    { id: 'all', label: 'All Tasks', count: tasks?.length },
    { id: 'active', label: 'Active', count: tasks?.filter(task => !task.completed).length },
    { id: 'completed', label: 'Completed', count: tasks?.filter(task => task.completed).length },
    ...customFilters
  ];

  // Filter tasks based on active filter
  const filteredTasks = tasks?.filter(task => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return !task.completed;
    if (activeFilter === 'completed') return task.completed;
    
    // Handle custom filters
    const customFilter = customFilters.find(f => f.id === activeFilter);
    if (customFilter) {
      // Check if the task has any of the filter's labels
      if (customFilter.labels && customFilter.labels.length > 0) {
        return customFilter.labels.some(label => 
          task.labels && task.labels.includes(label)
        );
      }
      return true;
    }
    
    return true;
  });

  // Keyboard navigation for tasks
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedTask(null);
        setShowSettings(false);
        if (isMobile) {
          setDrawerOpen(false);
        }
        return;
      }
      
      if (!filteredTasks || filteredTasks.length === 0) return;
      
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
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
    
    setSelectedTask({...task}); // Use a copy to ensure reactivity
    setShowSettings(false); // Close settings when selecting a task
    setIsNewTaskMode(false); // Ensure we're in edit mode, not new task mode
    if (isMobile) {
      console.log("Opening drawer for mobile view");
      setDrawerOpen(true);
    }
  };

  const handleCloseTaskDetails = () => {
    setSelectedTask(null);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const handleOpenSettings = () => {
    if (isMobile) {
      setSettingsDrawerOpen(true);
    } else {
      setShowSettings(true);
    }
  };

  const handleCloseSettings = () => {
    if (isMobile) {
      setSettingsDrawerOpen(false);
    } else {
      setShowSettings(false);
    }
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  const handleAccentColorChange = (color) => {
    setAccentColor(color);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newInput.trim() === "") {
      alert('Please fill out this field');
      return;
    }
    
    db.collection("tasks").add({
      name: newInput,
      description: "",
      completed: false
    });

    setNewInput("");
  };

  const updateTask = (taskId: string, changes: any) => {
    console.log(`Updating task ${taskId} with:`, changes);
    db.collection("tasks").update(taskId, changes);
  }

  const deleteTask = (taskId: string) => {
    db.collection("tasks").delete(taskId);
  }

  const handleCreateFilter = (filterName, labels) => {
    const newFilterId = `custom-${Date.now()}`;
    const newFilter = {
      id: newFilterId,
      label: filterName,
      labels: labels,
      count: 0, // This will be updated when tasks are filtered
    };
    
    setCustomFilters([...customFilters, newFilter]);
    setActiveFilter(newFilterId); // Switch to the new filter
  };

  const handleAddTask = (taskName) => {
    db.collection("tasks").add({
      name: taskName,
      description: "",
      completed: false
    });
  };

  // New function to open drawer in "new task" mode
  const openNewTaskDrawer = () => {
    console.log("Opening new task drawer");
    setIsNewTaskMode(true);
    setSelectedTask(null);
    setDrawerOpen(true);
  };

  const handleFontStyleChange = (style: 'mono' | 'sans' | 'serif') => {
    setFontStyle(style);
  };

  return (
    <section className={`flex-1 task-home w-full h-screen max-h-screen relative overflow-hidden ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} ${isMobile && drawerOpen ? 'drawer-open-scale' : ''}`}
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.4)), url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        paddingBottom: 'env(safe-area-inset-bottom, 20px)'
      }}>
      <div className=" h-12 rounded-b-md md:rounded-b-none bg-opacity-95 shadow-md backdrop-blur-sm flex justify-between items-center sticky top-0 z-100"
        style={{ backgroundColor: accentColor }}>
        <div className="">
          <a className="btn btn-ghost normal-case text-md"
            onClick={() => { window.modal_2.showModal(); }}
          ><img className="w-6 h-6 mr-2" src='tsk-logo.png'/>tsk.</a>
          {/* {isNewTaskMode && 'NT'} {drawerOpen && 'DO'} */}
        </div>

        <div className="hidden md:block"> 

          <form
            onSubmit={handleSubmit}
            className="join task-input flex justify-center rounded-sm w-96 h-8"
          >
            <input
              type="text"
              value={newInput}
              onChange={(e) => setNewInput(e.target.value)}
              placeholder="I want to..."
              className="join-item font-serif input w-full max-w-xs focus:outline-none h-8 bg-[white] bg-opacity-5 "
              required
            />
            <button
              className={` px-2 submit font-sm text-slate-300 h-8 overflow-hidden transition-all duration-300 ease-in-out ${
                newInput.trim() !== "" ? "opacity-100 max-w-xs" : "opacity-0 max-w-0 px-0"
              }`}
              type="submit"
              onClick={handleSubmit}
            >Add</button>
          </form>
        </div>

        <div className="flex-none flex items-center pr-2">
          <button 
            onClick={handleOpenSettings}
            className="opacity-60 hover:opacity-100 focus:outline-none mr-2 bg-transparent"
            aria-label="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
          <UserAvatarButton accentColor={accentColor} />
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px)]">
        <div className="hidden md:block pt-6">
          <Sidebar 
            filters={filters}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onCreateFilter={handleCreateFilter}
            accentColor={accentColor}
            isDarkMode={isDarkMode}
          />
        </div>
        
        <div className="flex-1 overflow-y-auto pb-24 md:pb-0 px-1 md:px-4">
          <div className="mt-10 flex justify-center">
            <div className="w-full max-w-4xl">
              {filteredTasks?.length == 0 && <div>
                <p className="text-lg font-bold text-center text-slate-100">No tasks yet.</p>
                <p className="no-task-blurb text-sm font-serif text-center text-slate-100">which is <em>totally</em> fine. its okay to do nothing. you deserve a rest day.</p>
                <p className="no-task-blurb text-sm font-serif text-center text-slate-100">but also, you can add a task above.</p>
              </div>}

              <div className={`flex flex-col ${viewMode === 'compact' ? 'space-y-0' : viewMode === 'cozy' ? 'space-y-1' : 'space-y-2'}`}>
                {filteredTasks?.map((task: Task) => (
                  <div
                    key={task.id}
                    className="w-full "
                    onClick={() => {
                      handleTaskSelect(task);
                    }}
                  >
                    <ListItem 
                      key={task.id}
                      task={task}
                      deleteTask={deleteTask}
                      updateTask={updateTask}
                      isSelected={selectedTask?.id === task.id}
                      viewMode={viewMode}
                      accentColor={accentColor}
                      isDarkMode={isDarkMode}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <dialog id="modal_2" className="modal">
            <AboutModal />
          </dialog>
        </div>

        {/* Desktop task details sidebar - only show on desktop when a task is selected and settings is not open */}
        {!isMobile && selectedTask && !showSettings && (
          <div className="hidden md:block md:pl-4 w-1/3 p-2">

            <TaskDetailsSidebar
              key={selectedTask.id}
              task={selectedTask}
              taskId={selectedTask.id}
              onClose={handleCloseTaskDetails}
              onUpdate={updateTask}
              onDelete={deleteTask}
              accentColor={accentColor}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {/* Settings sidebar - only show on desktop when settings is open */}
        {!isMobile && showSettings && (
          <div className="hidden md:block md:pl-4 w-1/3 p-2">
            <SettingsSidebar 
              onClose={handleCloseSettings} 
              onViewModeChange={handleViewModeChange}
              currentViewMode={viewMode}
              onAccentColorChange={handleAccentColorChange}
              currentAccentColor={accentColor}
              onThemeChange={handleThemeChange}
              isDarkMode={isDarkMode}
              onFontStyleChange={handleFontStyleChange}
              currentFontStyle={fontStyle}
            />
          </div>
        )}
      </div>

      {/* Combined Task Drawer - handles both edit and new task modes */}
      {isMobile && (
        <SilkTaskDrawer
          isOpen={drawerOpen}
          setIsOpen={setDrawerOpen}
          task={selectedTask}
          updateFunction={updateTask}
          deleteTask={deleteTask}
          accentColor={accentColor}
          isNewTaskMode={isNewTaskMode}
          onAddTask={handleAddTask}
        />
      )}

      {/* Settings drawer - only show on mobile when settings is open */}
      {isMobile && (
        <SettingsDrawer
          isOpen={settingsDrawerOpen}
          setIsOpen={setSettingsDrawerOpen}
          onViewModeChange={handleViewModeChange}
          currentViewMode={viewMode}
          onAccentColorChange={handleAccentColorChange}
          currentAccentColor={accentColor}
          onThemeChange={handleThemeChange}
          isDarkMode={isDarkMode}
          onFontStyleChange={handleFontStyleChange}
          currentFontStyle={fontStyle}
        />
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 md:hidden z-10 rounded-t-md">
        <div className="flex justify-between items-center">
          <button
            className="btn btn-circle btn-ghost text-white"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Filters"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-3 3v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          
          {drawerOpen && isNewTaskMode ? (
            <button
              className="btn btn-circle btn-ghost text-white"
              // onClick={() => {
              //   setDrawerOpen(false);
              //   setIsNewTaskMode(false);
              // }}
              aria-label="Cancel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <button
              className="btn btn-circle btn-primary text-white"
              onClick={openNewTaskDrawer}
              aria-label="Add Task"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function App() {
  return (
    <div className="App">
      <Home />
    </div>
  );
}

export default App;
