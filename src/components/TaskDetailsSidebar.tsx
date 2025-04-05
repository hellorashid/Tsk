import React, { useState } from 'react';
import { useBasic } from "@basictech/react";
import { Task } from '../utils/types';

interface TaskDetailsSidebarProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (taskId: string, updates: { title?: string; description?: string; completed?: boolean }) => void;
  onDelete: (taskId: string) => void;
}

const TaskDetailsSidebar: React.FC<TaskDetailsSidebarProps> = ({
  task,
  onClose,
  onUpdate,
  onDelete,
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

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleTitleBlur();
    }
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleDescriptionBlur();
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

  if (!task) return null;

  return (
    <div className="w-80 h-full text-white p-6 overflow-y-auto bg-[#1F1B2F]/80 backdrop-blur-sm flex flex-col">
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
            onKeyDown={handleTitleKeyDown}
            className="input input-sm w-full bg-transparent border-none focus:outline-none text-white text-lg font-medium"
            autoFocus
          />
        ) : (
          <h3
            className="text-lg font-medium text-white cursor-pointer hover:bg-[#2A2535]/50 px-2 py-1 rounded"
            onClick={() => setIsEditingTitle(true)}
          >
            {task.name}
          </h3>
        )}
      </div>

      <div className="divider my-2"></div>

      <div className="flex-1 overflow-y-auto">
        {isEditingDescription ? (
          <textarea
            value={description}
            onChange={handleDescriptionChange}
            onBlur={handleDescriptionBlur}
            onKeyDown={handleDescriptionKeyDown}
            className="textarea textarea-sm w-full bg-transparent border-none focus:outline-none text-white min-h-[200px] resize-none"
            placeholder="Add a description..."
            autoFocus
          />
        ) : (
          <div
            className="text-white cursor-pointer hover:bg-[#2A2535]/50 px-2 py-1 rounded min-h-[200px]"
            onClick={() => setIsEditingDescription(true)}
          >
            {task.description || "Add a description..."}
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleDelete}
          className="text-gray-400 hover:text-white focus:outline-none"
          aria-label="Delete task"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TaskDetailsSidebar; 