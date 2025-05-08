import React, { useState, useEffect } from 'react';
import { useBasic , useQuery} from "@basictech/react";
import { Task } from '../utils/types';

interface TaskDetailsSidebarProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (id: string, changes: any) => void;
  onDelete: (id: string) => void;
  accentColor?: string;
  isDarkMode?: boolean;
}

const TaskDetailsSidebar: React.FC<TaskDetailsSidebarProps> = ({
  task,
  onClose,
  onUpdate,
  onDelete,
  accentColor = '#1F1B2F',
  isDarkMode = true
}) => {
  const {db } = useBasic()
  const taskDetails = useQuery( () => db.collection('tasks').get(task?.id) )

  
  const [title, setTitle] = useState(task?.name || '');
  const [description, setDescription] = useState(task?.description || '');

  useEffect(() => {
    if (taskDetails?.name) {
      setTitle(taskDetails.name);
    }
  }, [taskDetails]);

  useEffect(() => {
    const titleTextarea = document.querySelector('textarea.text-lg') as HTMLTextAreaElement;
    if (titleTextarea) {
      titleTextarea.style.height = 'auto';
      titleTextarea.style.height = `${titleTextarea.scrollHeight}px`;
    }

    const descTextarea = document.querySelector('textarea.description') as HTMLTextAreaElement;
    if (descTextarea) {
      descTextarea.style.height = 'auto';
      descTextarea.style.height = `${descTextarea.scrollHeight}px`;
    }
  }, [title, description]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTitle(e.target.value);
    // Auto-resize the textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    // Auto-resize the textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleTitleBlur = () => {
    if (title.trim() !== task?.name) {
      onUpdate(task?.id || '', { name: title.trim() });
    }
  };

  const handleDescriptionBlur = () => {
    if (description.trim() !== task?.description) {
      onUpdate(task?.id || '', { description: description.trim() });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, type: 'title' | 'description') => {
    if (e.key === 'Enter' && type === 'title') {
      handleTitleBlur();
      e.preventDefault();
    } else if (e.key === 'Escape') {
      if (type === 'title') {
        setTitle(task?.name || '');
      } else {
        setDescription(task?.description || '');
      }
    }
  };

  const handleCompletedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(task?.id || '', { completed: e.target.checked });
  };

  const handleDelete = () => {
    onDelete(task?.id || '');
    onClose();
  };

  const getBackgroundColor = () => {
    return `${accentColor}90`; // 90% opacity
  };

  if (!task) return null;

  return (
    <div 
      className={`w-full h-full p-6 overflow-y-auto backdrop-blur-sm flex flex-col rounded-md ${
        isDarkMode ? 'text-gray-100' : 'text-gray-900'
      }`}
      style={{ backgroundColor: getBackgroundColor() }}
    >
      <div className="flex items-start mb-2">
        <input
          type="checkbox"
          className="checkbox checkbox-sm mr-1 mt-2"
          checked={taskDetails?.completed}
          onChange={handleCompletedChange}
        />
        <textarea
          value={title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          onKeyDown={(e) => handleKeyDown(e, 'title')}
          className="textarea textarea-sm w-full bg-transparent focus:outline-none text-lg font-medium min-h-[2rem] resize-none overflow-hidden"
          rows={1}
          style={{ height: 'auto' }}
        />
      </div>

      <div className="divider my-2"></div>

      <div className="mt-2">
        <textarea
          value={description}
          onChange={handleDescriptionChange}
          onBlur={handleDescriptionBlur}
          onKeyDown={(e) => handleKeyDown(e, 'description')}
          className="textarea textarea-sm w-full bg-transparent focus:outline-none min-h-[100px] description resize-none"
          placeholder="Add a description..."
          style={{ height: 'auto' }}
        />
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