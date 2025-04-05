import React, { useState } from 'react';
import { useBasic } from "@basictech/react";
import { Task } from '../utils/types';

interface TaskDetailsSidebarProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (taskId: string, updates: { title?: string; description?: string; completed?: boolean }) => void;
  onDelete: (taskId: string) => void;
  accentColor?: string;
}

const TaskDetailsSidebar: React.FC<TaskDetailsSidebarProps> = ({
  task,
  onClose,
  onUpdate,
  onDelete,
  accentColor = '#1F1B2F'
}) => {
  const [title, setTitle] = useState(task?.name || '');
  const [description, setDescription] = useState(task?.description || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const { dbStatus } = useBasic();

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title.trim() !== task?.name) {
      onUpdate(task?.id || '', { title: title.trim() });
    }
  };

  const handleDescriptionBlur = () => {
    setIsEditingDescription(false);
    if (description.trim() !== task?.description) {
      onUpdate(task?.id || '', { description: description.trim() });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, type: 'title' | 'description') => {
    if (e.key === 'Enter') {
      if (type === 'title') {
        handleTitleBlur();
      } else {
        handleDescriptionBlur();
      }
    } else if (e.key === 'Escape') {
      if (type === 'title') {
        setTitle(task?.name || '');
        setIsEditingTitle(false);
      } else {
        setDescription(task?.description || '');
        setIsEditingDescription(false);
      }
    }
  };

  const handleCompletedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(task?.id || '', { completed: e.target.checked });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task?.id || '');
      onClose();
    }
  };

  // Calculate background colors based on accent color
  const getBackgroundColor = () => {
    return `${accentColor}80`; // 80% opacity
  };

  if (!task) return null;

  return (
    <div 
      className="w-80 h-full text-white p-6 overflow-y-auto backdrop-blur-sm flex flex-col"
      style={{ backgroundColor: getBackgroundColor() }}
    >
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          className="checkbox checkbox-sm mr-3"
          checked={task.completed}
          onChange={handleCompletedChange}
        />
        {isEditingTitle ? (
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => handleKeyDown(e, 'title')}
            className="input input-sm w-full bg-transparent focus:outline-none text-lg font-medium"
            autoFocus
          />
        ) : (
          <h2 
            className="text-lg font-medium cursor-pointer hover:bg-white/10 px-2 py-1 rounded"
            onClick={() => setIsEditingTitle(true)}
          >
            {task.name}
          </h2>
        )}
      </div>

      <div className="divider my-2"></div>

      <div className="mt-2">
        {isEditingDescription ? (
          <textarea
            value={description}
            onChange={handleDescriptionChange}
            onBlur={handleDescriptionBlur}
            onKeyDown={(e) => handleKeyDown(e, 'description')}
            className="textarea textarea-sm w-full bg-transparent focus:outline-none min-h-[100px]"
            placeholder="Add a description..."
            autoFocus
          />
        ) : (
          <div 
            className="cursor-pointer hover:bg-white/10 px-2 py-1 rounded min-h-[100px]"
            onClick={() => setIsEditingDescription(true)}
          >
            {description || <span className="text-gray-400">Add a description...</span>}
          </div>
        )}
      </div>

      <div className="mt-auto pt-4">
        <button
          onClick={handleDelete}
          className="text-gray-400 hover:text-white focus:outline-none"
          aria-label="Delete task"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TaskDetailsSidebar; 