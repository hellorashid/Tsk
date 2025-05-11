// @ts-nocheck

import React, { useState, useEffect } from "react";
import { Task } from "../utils/types";
import { useBasic } from "@basictech/react";
import Checkbox from "./Checkbox";
interface ListItemProps {
  task: Task;
  deleteTask: (id: string) => void;
  updateTask: (id: string, changes: any) => void;
  isSelected?: boolean;
  viewMode?: 'compact' | 'cozy' | 'chonky';
  accentColor?: string;
  isDarkMode?: boolean;
}

const ListItem: React.FC<ListItemProps> = ({
  task,
  deleteTask,
  updateTask,
  isSelected = false,
  viewMode = 'cozy',
  accentColor = '#1F1B2F',
  isDarkMode = true
}) => {
  const { dbStatus } = useBasic();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.name);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTitleClick = () => {
    if (!isMobile) {
      setIsEditing(true);
    }
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
    e.stopPropagation();
    updateTask(task.id, { completed: e.target.checked });
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteTask(task.id);
  };

  // Get view mode specific styles
  const getViewModeStyles = () => {
    switch (viewMode) {
      case 'compact':
        return {
          container: 'py-1',
          checkbox: 'checkbox-sm',
          title: 'text-md',
          deleteButton: 'btn-sm',
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
          title: 'text-md',
          deleteButton: 'btn-sm',
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
      } transition-all duration-200 backdrop-blur-sm hover:bg-opacity-80 ${
        isDarkMode ? 'text-gray-100' : 'text-gray-900'
      }`}
      style={{ 
        backgroundColor: getBackgroundColor(),
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
     
          <Checkbox
            id={task.id}
            size="md"
            checked={task.completed}
            onChange={handleCheckboxChange}
          />
          {isEditing ? (
            <input
              type="text"
              value={editedTitle}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              onKeyDown={handleKeyDown}
              className={`input input-sm w-full bg-transparent ${styles.title} focus:outline-none ${
                isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}
              autoFocus
            />
          ) : (
            <span
              className={`pl-2 ${styles.title} ${!isMobile ? 'cursor-pointer' : ''} ${
                task.completed ? (isDarkMode ? "text-gray-400" : "text-gray-500") : ""
              }`}
              onClick={handleTitleClick}
            >
              {task.name}
            </span>
          )}
        </div>
        {!isMobile && (
          <button
            onClick={handleDelete}
            className={`rounded-full btn btn-ghost ${styles.deleteButton} transition-opacity duration-200 ${
              isSelected ? 'opacity-0' : 'opacity-0 group-hover:opacity-70'
            }`}
            aria-label="Delete task"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ListItem;
