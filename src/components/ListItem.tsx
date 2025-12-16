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
  handleTaskSelect: (task: Task) => void;
  onEnterFocus?: (task: Task) => void;
  onAddToSchedule?: (task: Task) => void;
}

const ListItem: React.FC<ListItemProps> = ({
  task,
  deleteTask,
  updateTask,
  isSelected = false,
  viewMode = 'cozy',
  accentColor = '#1F1B2F',
  isDarkMode = true,
  handleTaskSelect,
  onEnterFocus,
  onAddToSchedule
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
          container: 'py-2 md:py-1',
          title: 'text-lg md:text-md',
        };
      case 'cozy':
        return {
          container: 'py-3 md:py-2',
          title: 'text-lg md:text-base',
        };
      case 'chonky':
      default:
        return {
          container: 'py-3 md:py-2',
          title: 'text-lg md:text-md',
        };
    }
  };

  const styles = getViewModeStyles();

  // Calculate background colors based on accent color
  const getBackgroundColor = () => {
    if (isSelected && !isMobile) {
      return accentColor;
    } else {
      return `${accentColor}70`; // 70% opacity
    }
  };

  const getHoverBackgroundColor = () => {
    return `${accentColor}80`; // 80% opacity
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // Don't open task if we're editing
    if (isEditing) return;
    handleTaskSelect(task);
  };

  return (
    <div
      className={`group px-3 md:px-2 relative ${styles.container} ${viewMode === 'compact' ? '' : 'rounded-lg'
        } transition-all duration-200 backdrop-blur-sm hover:bg-opacity-80 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'
        } cursor-pointer`}
      style={{
        backgroundColor: getBackgroundColor(),
      }}
      onClick={handleContainerClick}
      onDoubleClick={() => setIsEditing(true)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">

          <div onClick={(e) => e.stopPropagation()} className="md:mr-0 mr-2">
            <Checkbox
              id={task.id}
              size="md"
              checked={task.completed}
              onChange={handleCheckboxChange}
            />
          </div>
          <div className="flex-1"
          >

            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className={`px-2 py-1 text-sm w-full bg-transparent border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-white/30 ${styles.title} ${isDarkMode ? 'text-gray-100' : 'text-gray-900'
                  }`}
                autoFocus
                autoComplete="off"
                inputMode="text"
              />
            ) : (
              <span
                className={`pl-2 ${styles.title} ${task.completed ? (isDarkMode ? "text-gray-400" : "text-gray-500") : ""
                  }`}
              >
                {task.name}
              </span>
            )}
          </div>
        </div>

        {!isMobile && (
          <div className="flex gap-1">
            {onAddToSchedule && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToSchedule(task);
                }}
                className={`w-8 h-8 rounded-full bg-transparent hover:bg-white/10 flex items-center justify-center transition-opacity duration-200 ${isSelected ? 'opacity-0' : 'opacity-0 group-hover:opacity-70'
                  }`}
                aria-label="Add to Today"
                title="Add to Today"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            {onEnterFocus && (
          <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEnterFocus(task);
                }}
            className={`w-8 h-8 rounded-full bg-transparent hover:bg-white/10 flex items-center justify-center transition-opacity duration-200 ${isSelected ? 'opacity-0' : 'opacity-0 group-hover:opacity-70'
              }`}
                aria-label="Enter focus mode"
                title="Focus mode"
          >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </button>
            )}
          </div>
        )}


      </div>
    </div>
  );
};

export default ListItem;
