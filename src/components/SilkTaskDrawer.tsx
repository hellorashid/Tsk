'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Sheet, useClientMediaQuery, type SheetViewProps } from "@silk-hq/components";
import { TaskModal } from './TaskModal';
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef<boolean>(false);
  const largeViewport = useClientMediaQuery("(min-width: 800px)");
  const contentPlacement = largeViewport ? "center" : "bottom";
  const tracks: SheetViewProps["tracks"] = largeViewport ? ["top", "bottom"] : "bottom";
  
  // Ensure we have a valid task object to work with
  const safeTask = task || {
    id: "placeholder-task",
    name: "Untitled Task",
    description: "",
    completed: false
  };

  // Create a placeholder task for new task mode
  const emptyTask = {
    id: "new-task-placeholder",
    name: "",
    description: "",
    completed: false
  };

  // Debug the task data more extensively
  useEffect(() => {
    if (isOpen) {
      console.log("=== SilkTaskDrawer Debug ===");
      console.log("isOpen:", isOpen);
      console.log("Task in drawer:", task);
      console.log("Task type:", typeof task);
      console.log("Task ID:", task?.id);
      console.log("isNewTaskMode:", isNewTaskMode);
      console.log("safeTask:", safeTask);
    }
  }, [isOpen, task, isNewTaskMode, safeTask]);
  
  // Trigger the sheet to open when isOpen changes
  useEffect(() => {
    // Only trigger open if the state changed from closed to open
    if (isOpen && !wasOpenRef.current && triggerRef.current) {
      triggerRef.current.click();
    }
    
    // Update the ref to track the current state
    wasOpenRef.current = isOpen;
  }, [isOpen]);
  
  // This effect ensures we properly sync the task data
  useEffect(() => {
    if (isOpen && !isNewTaskMode && task) {
      // Force rerender when a task is opened
      console.log("Task loaded into drawer:", task.id);
    }
  }, [isOpen, task, isNewTaskMode]);

  // Handle task creation when in new task mode
  const handleNewTaskUpdate = (id: string, changes: any) => {
    if (id === "new-task-placeholder" && changes.name && changes.name.trim() !== "") {
      if (onAddTask) {
        onAddTask(changes.name);
        setIsOpen(false);
      }
    }
  };

  // Dismiss keyboard when sheet is moved
  const travelHandler = useCallback<Exclude<SheetViewProps["onTravel"], undefined>>(({ progress }) => {
    if (!viewRef.current) return;

    if (progress < 0.999) {
      // Dismiss the on-screen keyboard
      viewRef.current.focus();
    }
    
    // Close the drawer when user swipes it away (less than 30%)
    if (progress < 0.3) {
      setIsOpen(false);
    }
  }, [setIsOpen]);
  
  // Handle sheet close via onChange event
  const handleSheetClose = useCallback(() => {
    console.log("Sheet closed via onChange");
    setIsOpen(false);
  }, [setIsOpen]);

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
          [role="dialog"],
          [role="dialog"] > div,
          [role="dialog"] div:not(.silk-sheet-content) {
            background-color: transparent !important;
          }
        `}
      </style>
      
      <Sheet.Root license="commercial">
        <Sheet.Trigger asChild>
          <button 
            ref={triggerRef} 
            className="hidden" 
            aria-hidden="true"
            data-testid="silk-sheet-trigger"
          >
            Open Sheet
          </button>
        </Sheet.Trigger>
        
        <Sheet.Portal>
          <Sheet.View
            ref={viewRef}
            contentPlacement={contentPlacement}
            tracks={tracks}
            swipeOvershoot={false}
            nativeEdgeSwipePrevention={true}
            onTravel={travelHandler}
            onChange={handleSheetClose}
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
                  {isNewTaskMode ? 'Add New Task' : `Task Details: ${task?.name || 'Task'}`}
                </h2>
                
                <div className="pull-handle" />
                
                {isNewTaskMode ? (
                  <TaskModal
                    task={emptyTask}
                    new={true}
                    updateFunction={handleNewTaskUpdate}
                    inDrawer={true}
                    accentColor={accentColor}
                  />
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