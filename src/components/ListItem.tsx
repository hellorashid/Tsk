// @ts-nocheck

import React, { useState } from "react";
import { Task } from "../utils/types";
import { useBasic } from "@basictech/react";

interface ListItemProps {
  task: Task;
  deleteTask: (id: string) => void;
  updateTask: (id: string, changes: any) => void;
  isSelected?: boolean;
  viewMode?: 'compact' | 'cozy' | 'chonky';
  accentColor?: string;
}

const ListItem: React.FC<ListItemProps> = ({
  task,
  deleteTask,
  updateTask,
  isSelected = false,
  viewMode = 'cozy',
  accentColor = '#1F1B2F',
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
      case 'cozy':
        return {
          container: 'py-2',
          checkbox: 'checkbox-sm',
          title: 'text-base',
          deleteButton: 'btn-sm',
        };
      case 'chonky':
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

  // Calculate background colors based on accent color
  const getBackgroundColor = () => {
    if (isSelected) {
      return accentColor;
    } else {
      return `${accentColor}70`; // 70% opacity
    }
  };

  const getHoverBackgroundColor = () => {
    return `${accentColor}80`; // 80% opacity
  };

  return (
    <div
      className={`group px-2 relative ${styles.container} ${
        viewMode === 'compact' ? '' : 'rounded-lg'
      } transition-all duration-200 backdrop-blur-sm`}
      style={{ 
        backgroundColor: getBackgroundColor(),
        '--tw-hover-bg-opacity': '0.8',
      }}
    >
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={handleCheckboxChange}
          className={`checkbox ${styles.checkbox} mr-2`}
        />
        {isEditing ? (
          <input
            type="text"
            value={editedTitle}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={handleKeyDown}
            className={`input input-sm w-full bg-transparent ${styles.title} focus:outline-none`}
            autoFocus
          />
        ) : (
          <span
            className={`${styles.title} cursor-pointer ${
              task.completed ? "line-through text-gray-400" : ""
            }`}
            onClick={handleTitleClick}
          >
            {task.name}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirm(true);
          }}
          className={`rounded-full btn btn-ghost ${styles.deleteButton} pb-7 transition-opacity duration-200 ${
            isSelected ? 'opacity-0' : 'opacity-0 group-hover:opacity-70'
          }`}
          aria-label="Delete task"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-white mb-2">Delete this task?</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                className="btn btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="btn btn-sm btn-error"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListItem;
