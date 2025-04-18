'use client';

import React, { useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import { TaskModal } from './TaskModal';

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

export default function TaskDrawer({ 
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
  
  // Debug the task data
  useEffect(() => {
    if (isOpen && task && !isNewTaskMode) {
      console.log("Task in drawer:", task);
    }
  }, [isOpen, task, isNewTaskMode]);
  
  // Calculate background color without opacity
  const getBackgroundColor = () => {
    return accentColor; // No opacity
  };
  
  // Create a placeholder task for new task mode
  const emptyTask = {
    id: "new-task-placeholder",
    name: "",
    description: "",
    completed: false
  };
  
  // Handle task creation when in new task mode
  const handleNewTaskUpdate = (id: string, changes: any) => {
    if (id === "new-task-placeholder" && changes.name && changes.name.trim() !== "") {
      if (onAddTask) {
        onAddTask(changes.name);
        setIsOpen(false);
      }
    }
  };
  
  const handleCloseDrawer = () => {
    setIsOpen(false);
  };
  
  return (
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content 
          className="text-white h-[80vh] max-h-[85vh] fixed bottom-0 left-0 right-0 outline-none rounded-t-xl overflow-auto"
          style={{ backgroundColor: getBackgroundColor() }}
          aria-labelledby={titleId}
        >
          {/* Title for accessibility */}
          <h2 id={titleId} className="sr-only">
            {isNewTaskMode ? 'Add New Task' : `Task Details: ${task?.name || 'Task'}`}
          </h2>
          
          <div className="mx-auto w-12 h-1.5 bg-gray-300 rounded-full my-4" />
          
          {isNewTaskMode ? (
            <TaskModal
              task={emptyTask}
              new={true}
              updateFunction={handleNewTaskUpdate}
              inDrawer={true}
              accentColor={accentColor}
            />
          ) : isOpen && task?.id ? (
            <TaskModal
              key={task.id}
              task={task}
              new={false}
              updateFunction={updateFunction}
              deleteTask={deleteTask}
              inDrawer={true}
              accentColor={accentColor}
            />
          ) : (
            <div className="text-center p-8">Loading task details...</div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
} 