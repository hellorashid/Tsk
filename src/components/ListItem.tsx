import React, { useState, useEffect, useOptimistic } from "react";
import { Task } from "../utils/types";
import { useBasic } from "@basictech/react";
import { useTheme } from "../contexts/ThemeContext";
import Checkbox from "./Checkbox";

interface ListItemProps {
  task: Task;
  deleteTask: (id: string) => void;
  updateTask: (id: string, changes: any) => void;
  isSelected?: boolean;
  viewMode?: 'compact' | 'cozy' | 'chonky';
  handleTaskSelect: (task: Task) => void;
  onEnterFocus?: (task: Task) => void;
  onAddToSchedule?: (task: Task) => void;
  isSuggested?: boolean;
}

const ListItem: React.FC<ListItemProps> = ({
  task,
  deleteTask,
  updateTask,
  isSelected = false,
  viewMode = 'cozy',
  handleTaskSelect,
  onEnterFocus,
  onAddToSchedule,
  isSuggested = false
}) => {
  const { dbStatus } = useBasic();
  const { theme } = useTheme();
  const { accentColor, isDarkMode } = theme;
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.name);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Optimistic UI for checkbox - provides instant feedback while update is in progress
  const [optimisticCompleted, setOptimisticCompleted] = useOptimistic(
    task.completed,
    (_currentState, newCompleted: boolean) => newCompleted
  );

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

  const handleCheckboxChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newCompleted = e.target.checked;
    // Optimistically update the UI immediately
    setOptimisticCompleted(newCompleted);
    // Then persist to database (async)
    updateTask(task.id, { completed: newCompleted });
  };

  const handleDelete = (e: React.MouseEvent) => {
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

  // Extract folder from task labels for badge display
  const folderLabel = task.labels?.split(',').find(l => l.trim().startsWith('folder:'));
  const folderName = folderLabel?.replace('folder:', '').trim();

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
              checked={optimisticCompleted}
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
              <div className="flex items-center gap-2">
                <span
                  className={`pl-2 ${styles.title} ${optimisticCompleted ? (isDarkMode ? "text-gray-400 line-through" : "text-gray-500 line-through") : ""
                    }`}
                >
                  {task.name}
                </span>
                {folderName && (
                  <span className={`px-1.5 py-0.5 text-xs rounded capitalize ${
                    isDarkMode ? 'bg-white/10 text-gray-400' : 'bg-black/10 text-gray-600'
                  }`}>
                    {folderName}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {!isMobile && (
          <div className="flex gap-1">
            {optimisticCompleted && (
              <button
                onClick={handleDelete}
                className={`w-8 h-8 rounded-full bg-transparent hover:bg-white/10 flex items-center justify-center transition-opacity duration-200 ${isSelected ? 'opacity-0' : 'opacity-0 group-hover:opacity-70'
                  }`}
                aria-label="Delete task"
                title="Delete task"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            {onAddToSchedule && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToSchedule(task);
                }}
                className={`${isSuggested ? 'px-3 py-1.5 rounded-md' : 'w-8 h-8 rounded-full'} bg-transparent hover:bg-white/10 flex items-center justify-center gap-2 transition-opacity duration-200 ${
                  isSuggested ? 'opacity-70' : (isSelected ? 'opacity-0' : 'opacity-0 group-hover:opacity-70')
                }`}
                aria-label="Add to Today"
                title="Add to Today"
              >
                {isSuggested && <span className="text-sm whitespace-nowrap">Add to Today</span>}
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
