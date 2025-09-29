'use client';

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { Sheet, useClientMediaQuery, type SheetViewProps } from "@silk-hq/components";
import { motion } from 'framer-motion';
import { TaskModal } from './TaskModal';
import ListItem from './ListItem';
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
  updateFunction: (id: string, changes: any) => void;
  deleteTask?: (id: string) => void;
  accentColor?: string;
  isNewTaskMode?: boolean;
  onAddTask?: (taskName: string) => void;
}

export default function SilkTaskDrawer({ 
  isOpen,
  setIsOpen,
  task, 
  updateFunction, 
  deleteTask,
  accentColor = '#1F1B2F',
  isNewTaskMode = false,
  onAddTask
}: TaskDrawerProps) {
  const titleId = React.useId();
  const viewRef = useRef<HTMLDivElement>(null);
  // Safari-compatible media query check with fallback
  const [largeViewport, setLargeViewport] = React.useState(false);
  const [mediaQuerySupported, setMediaQuerySupported] = React.useState(true);
  
  React.useEffect(() => {
    try {
      const checkViewport = () => {
        try {
          return window.innerWidth >= 800;
        } catch (e) {
          return false;
        }
      };
      
      setLargeViewport(checkViewport());
      
      const handleResize = () => {
        setLargeViewport(checkViewport());
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    } catch (error) {
      console.warn('Media query not supported, falling back to mobile view:', error);
      setMediaQuerySupported(false);
      setLargeViewport(false);
    }
  }, []);
  
  // Use Silk's useClientMediaQuery only if supported, otherwise use our fallback
  let silkLargeViewport = false;
  try {
    silkLargeViewport = useClientMediaQuery("(min-width: 800px)");
  } catch (error) {
    console.warn('Silk useClientMediaQuery failed, using fallback:', error);
  }
  
  const effectiveLargeViewport = mediaQuerySupported ? (silkLargeViewport || largeViewport) : largeViewport;
  const contentPlacement = effectiveLargeViewport ? "center" : "bottom";
  const tracks: SheetViewProps["tracks"] = effectiveLargeViewport ? ["top", "bottom"] : "bottom";
  
  const [newTaskName, setNewTaskName] = useState('');
  const [createdTasks, setCreatedTasks] = useState<{ id: string; name: string; completed: boolean; description: string }[]>([]);
  const [isStable, setIsStable] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      // createdTasks will be reset by the effect below when isOpen becomes true from a false state,
      // or handled on initial load if isNewTaskMode is true from the start.
      // setTimeout(() => {
      //   inputRef.current?.focus();
      // }, 0);
    }
  }, [isOpen, isNewTaskMode]);

  // useEffect for resetting all local new task state when drawer is closed or opened anew
  useEffect(() => {
    if (!isOpen) {
      setNewTaskName('');
      setCreatedTasks([]);
      // console.log("SilkTaskDrawer: Drawer closed (isOpen is false), cleared newTaskName and createdTasks.");
    } else if (isNewTaskMode) {
      // If opening in new task mode, ensure createdTasks is clear for the new session.
      // This covers initial open and reopening in new task mode.
      setCreatedTasks([]); 
      // console.log("SilkTaskDrawer: Drawer opened in new task mode, ensured createdTasks is empty.");
    }
  }, [isOpen, isNewTaskMode]);

  // Track when drawer is stable to prevent premature closing
  useEffect(() => {
    if (isOpen) {
      // Mark as stable after a short delay when opened
      const timer = setTimeout(() => {
        setIsStable(true);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setIsStable(false);
    }
  }, [isOpen]);

  // Enhanced presented change handler to prevent flickering
  const handlePresentedChange = useCallback((presented: boolean) => {
    if (!presented) {
      // Only allow closing if the drawer was stable (open for at least 200ms)
      if (isStable) {
        setTimeout(() => {
          setIsOpen(presented);
        }, 50);
      }
    } else {
      setIsOpen(presented);
    }
  }, [setIsOpen, isStable]);

  // Dismiss keyboard when sheet is moved
  const travelHandler = useCallback<Exclude<SheetViewProps["onTravel"], undefined>>(({ progress }) => {
    if (!viewRef.current) return;

    // Only dismiss keyboard when sheet is being moved significantly
    if (progress < 0.95) {
      try {
        // Dismiss the on-screen keyboard safely
        viewRef.current.focus();
      } catch (error) {
        console.warn('Failed to focus viewRef:', error);
      }
    }
    
    // Prevent accidental closing - handled by onPresentedChange with better logic
  }, []);

  // Handle task creation when in new task mode
  const handleNewTaskInternal = () => {
    if (newTaskName.trim() !== "" && onAddTask) {
      onAddTask(newTaskName.trim());
      // Add as an object to createdTasks, including an empty description
      const newId = `temp-${Date.now()}`;
      setCreatedTasks(prev => [...prev, { id: newId, name: newTaskName.trim(), completed: false, description: '' }]);
      setNewTaskName(''); // Clear input for next task
      setTimeout(() => inputRef.current?.focus(), 0); // Re-focus after state update
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

  // Use inline styles to ensure the sheet is tall enough
  const sheetStyles = {
    height: '90vh',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: 'transparent'
  };
  
  const contentStyles = {
    backgroundColor: accentColor,
    minHeight: '90vh',
    height: '90vh',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column' as const,
    borderTopLeftRadius: '1rem',
    borderTopRightRadius: '1rem',
    padding: '1rem'
  };

  const sheetContentStyles = {
    height: '90vh',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: 'transparent'
  };

  // Determine if we should show the content based on having a valid task
  const hasValidTask = isNewTaskMode || (task && task.id);
  const isLoadingTask = isOpen && !isNewTaskMode && !task;

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
        onPresentedChange={handlePresentedChange}
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
            {/* <Sheet.Backdrop 
              className="sheet-backdrop" 
              themeColorDimming="auto" 
            /> */}
            
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
                  {isNewTaskMode ? 'Add New Task' : `Task Details: ${task?.name || 'Task'}`}
                </h2>
                
                <div className="pull-handle" />
                
                {isNewTaskMode ? (
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
                                handleTaskSelect={() => {}}
                                // For temporary items, updateTask and deleteTask are no-ops or disabled
                                // Pass a function to handle local toggle for the checkbox
                                updateTask={(id, changes) => {
                                  if (changes.hasOwnProperty('completed') && id === task.id) {
                                    handleToggleTempTask(task.id);
                                  }
                                  // Other updates are not supported for temp items
                                }}
                                deleteTask={() => { /* Optionally allow removal from this list */ }}
                                isSelected={false} // Temporary items are not "selected" in the main app sense
                                viewMode={"cozy"} // Or a viewMode prop from parent if available
                                accentColor={accentColor}
                                isDarkMode={true} // Assuming drawer is always dark, or pass isDarkMode prop
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
                      />
                    </div>

                    {/* Plus Button */}
                    <div className="mt-4 flex justify-center sticky bottom-4">
                      <button
                        onClick={handleNewTaskInternal}
                        className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center text-white shadow-lg transition-colors duration-200"
                        aria-label="Add Task"
                        disabled={!newTaskName.trim()}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : isLoadingTask ? (
                  <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Loading task details...</p>
                  </div>
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