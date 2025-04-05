// @ts-nocheck

import React, { useState } from "react";
import { Task } from "../utils/types";
import { useBasic } from "@basictech/react";

interface ListItemProps {
  task: Task;
  deleteTask: (id: string) => void;
  updateTask: (id: string, changes: any) => void;
  isSelected?: boolean;
  viewMode?: 'cozy' | 'mid' | 'compact';
}

const ListItem: React.FC<ListItemProps> = ({
  task,
  deleteTask,
  updateTask,
  isSelected = false,
  viewMode = 'mid',
}) => {
  const { dbStatus } = useBasic();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleTitleClick = () => {
    setIsEditing(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    setIsEditing(false);
    if (editedTitle.trim() !== task.name) {
      updateTask(task.id, { name: editedTitle.trim() });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleBlur();
    } else if (e.key === "Escape") {
      setEditedTitle(task.name);
      setIsEditing(false);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateTask(task.id, { completed: e.target.checked });
  };

  const handleDelete = () => {
    deleteTask(task.id);
    setShowDeleteConfirm(false);
  };

  // Get view mode specific styles
  const getViewModeStyles = () => {
    switch (viewMode) {
      case 'compact':
        return {
          container: 'py-1',
          checkbox: 'checkbox-xs',
          title: 'text-sm',
          deleteButton: 'btn-xs',
        };
      case 'mid':
        return {
          container: 'py-2',
          checkbox: 'checkbox-sm',
          title: 'text-base',
          deleteButton: 'btn-sm',
        };
      case 'cozy':
      default:
        return {
          container: 'py-2',
          checkbox: 'checkbox-md',
          title: 'text-lg',
          deleteButton: 'btn-md',
        };
    }
  };

  const styles = getViewModeStyles();

  return (
    <div
      className={`group px-2 relative ${styles.container} ${
        viewMode === 'compact' ? '' : 'rounded-lg'
      } ${
        isSelected
          ? "bg-[#2A2535]"
          : "bg-[#1F1B2F]/70 hover:bg-[#2A2535]/50"
      } transition-all duration-200
      backdrop-blur-sm
      `}
    >
      <div className="flex items-center">
        <div className="flex items-center flex-1 min-w-0">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={handleCheckboxChange}
            className={`checkbox ${styles.checkbox} mr-3 ${
              task.completed ? "checkbox-primary" : "checkbox-ghost"
            }`}
          />
          {isEditing ? (
            <input
              type="text"
              value={editedTitle}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              className={`input input-ghost w-full ${styles.title} focus:outline-none`}
            />
          ) : (
            <span
              onClick={handleTitleClick}
              className={`${styles.title}  truncate ${
                task.completed ? "text-gray-500" : "text-white"
              }`}
            >
              {task.name}
            </span>
          )}
        </div>

        <div className="flex items-center">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className={`rounded-full btn btn-ghost ${styles.deleteButton} pb-7 transition-opacity duration-200 ${
              isSelected ? 'opacity-0' : 'opacity-0 group-hover:opacity-70'
            }`}
            aria-label="Delete task"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="absolute right-0 top-0 bg-[#2A2535] p-2 rounded-lg shadow-lg z-10">
          <p className="text-sm text-white mb-2">Delete this task?</p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="btn btn-xs btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-xs btn-error"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListItem;
