'use client';

import React, { useState } from 'react';
import { Drawer } from 'vaul';
import { Task } from '../utils/types';

interface AddTaskDrawerProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onAddTask: (taskName: string) => void;
  accentColor: string;
}

export default function AddTaskDrawer({ 
  isOpen, 
  setIsOpen, 
  onAddTask,
  accentColor
}: AddTaskDrawerProps) {
  const [taskName, setTaskName] = useState('');
  const titleId = React.useId();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskName.trim() === '') {
      return;
    }
    
    onAddTask(taskName);
    setTaskName('');
    setIsOpen(false);
  };
  
  const handleCancel = () => {
    setTaskName('');
    setIsOpen(false);
  };
  
  return (
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content 
          className="text-white h-[50vh] max-h-[60vh] w-full fixed bottom-0 left-0 right-0 outline-none rounded-t-xl overflow-auto"
          style={{ backgroundColor: accentColor }}
          aria-labelledby={titleId}
        >
          {/* Title for accessibility */}
          <h2 id={titleId} className="sr-only">
            Add New Task
          </h2>
          
          <div className="mx-auto w-12 h-1.5 bg-gray-300 rounded-full my-4" />
          
          <div className="w-full px-4">
            <h3 className="text-xl font-bold mb-4">Add New Task</h3>
            
            <form onSubmit={handleSubmit} className="mb-6">
              <div className="form-control w-full">
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="I want to..."
                  className="input input-bordered w-full bg-white/10 text-white placeholder-gray-400 focus:outline-none"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  type="button"
                  className="btn btn-ghost text-white"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-white"
                  disabled={taskName.trim() === ''}
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
} 