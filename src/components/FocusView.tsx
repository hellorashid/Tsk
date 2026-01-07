import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Task } from '../utils/types';
import { useBasic, useQuery } from '@basictech/react';
import { useTheme } from '../contexts/ThemeContext';
import Checkbox from './Checkbox';
import SubtasksList from './SubtasksList';

interface FocusViewProps {
  task: Task;
  onExit: () => void;
  onUpdateTask: (id: string, changes: any) => void;
  onTaskToggle: (taskId: string, completed: boolean) => void;
  onAddSubtask?: (parentTaskId: string, name: string) => Promise<string | null>;
  onDeleteSubtask?: (id: string) => void;
}

const FocusView: React.FC<FocusViewProps> = ({
  task,
  onExit,
  onUpdateTask,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTaskToggle,
  onAddSubtask,
  onDeleteSubtask
}) => {
  const { db } = useBasic();
  const { theme } = useTheme();
  const { accentColor, isDarkMode } = theme;
  
  // Clock state
  const [isClockExpanded, setIsClockExpanded] = useState(true);
  const [sessionStartTime] = useState(() => Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Local state for description to prevent cursor jumping
  const [localDescription, setLocalDescription] = useState(task?.description || '');
  
  // Fetch live task data
  const liveTask = useQuery(
    () => task?.id ? db.collection('tasks').get(task.id) : null,
    [task?.id]
  );
  
  // Use live task data if available
  const currentTask = liveTask || task;
  
  // Fetch subtasks
  const subtasks = (useQuery(
    () => currentTask?.id && !currentTask?.parentTaskId
      ? db.collection('tasks').filter((t) => (t as Task).parentTaskId === currentTask.id)
      : null,
    [currentTask?.id, currentTask?.parentTaskId]
  ) || []) as Task[];

  // Update elapsed time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Format elapsed time as M:SS or H:MM:SS
  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  const handleTaskComplete = async () => {
    // Exit focus mode first (which will update the session end time)
    if (!currentTask.completed) {
      // If marking as complete (not uncompleting), exit after updating
      await onUpdateTask(currentTask.id, { completed: !currentTask.completed });
      setTimeout(() => {
        onExit();
      }, 300);
    } else {
      onUpdateTask(currentTask.id, { completed: !currentTask.completed });
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateTask(currentTask.id, { name: e.target.value });
  };

  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalDescription(e.target.value);
  };

  const handleDescriptionBlur = () => {
    if (localDescription !== currentTask.description) {
      onUpdateTask(currentTask.id, { description: localDescription });
    }
  };

  // Sync local description when task changes (e.g., switching tasks)
  useEffect(() => {
    setLocalDescription(currentTask.description || '');
  }, [currentTask.id]);

  // Auto-resize description on mount and when content changes
  useEffect(() => {
    if (descriptionRef.current && scrollContainerRef.current) {
      // Save scroll position
      const scrollTop = scrollContainerRef.current.scrollTop;
      
      // Resize textarea
      descriptionRef.current.style.height = 'auto';
      descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
      
      // Restore scroll position
      scrollContainerRef.current.scrollTop = scrollTop;
    }
  }, [localDescription]);

  // Wrapper for subtask update to match SubtasksList interface
  const handleUpdateSubtask = (id: string, changes: Partial<Task>) => {
    onUpdateTask(id, changes);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        backgroundColor: isDarkMode ? '#0a0a0a' : '#f5f5f5',
      }}
    >
      {/* Clock Pill - Top Left */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        onClick={() => setIsClockExpanded(!isClockExpanded)}
        className={`absolute top-6 left-6 flex items-center gap-2 transition-all duration-200 ${
          isClockExpanded ? 'px-4 py-3 rounded-full' : 'p-3 rounded-full'
        } ${
          isDarkMode
            ? 'bg-white/10 hover:bg-white/20 text-gray-300'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        }`}
        aria-label={isClockExpanded ? 'Collapse timer' : 'Expand timer'}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {isClockExpanded && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="text-sm font-medium tabular-nums"
          >
            {formatElapsedTime(elapsedTime)}
          </motion.span>
        )}
      </motion.button>

      {/* Top Right Buttons */}
      <div className="absolute top-6 right-6 flex flex-col gap-3">
        {/* Close button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          onClick={onExit}
          className={`p-3 rounded-full transition-colors ${
            isDarkMode
              ? 'bg-white/10 hover:bg-white/20 text-gray-300'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
          aria-label="Exit focus mode"
          title="Press ESC to exit"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>

        {/* Done button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          onClick={handleTaskComplete}
          className={`p-3 rounded-full transition-colors ${
            isDarkMode
              ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
              : 'bg-green-100 hover:bg-green-200 text-green-600'
          }`}
          aria-label="Mark as done"
          title="Mark task as done"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </motion.button>
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="w-full max-w-2xl mx-auto px-8 pt-24 pb-8 flex flex-col"
        style={{ height: '100vh' }}
      >
        {/* Task info - extends to fill available space */}
        <div className={`p-6 rounded-xl transition-colors duration-300 flex flex-col flex-1 overflow-hidden ${
          isDarkMode ? 'bg-white/3 hover:bg-white/4' : 'bg-white shadow-lg'
        }`}>
          {/* Task title with checkbox - sticky header */}
          <div className="flex items-center gap-3 pb-6 flex-shrink-0">
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                id={`focus-task-${currentTask.id}`}
                size="md"
                checked={currentTask.completed}
                onChange={() => handleTaskComplete()}
              />
            </div>
            <input
              type="text"
              value={currentTask.name}
              onChange={handleTitleChange}
              className={`text-2xl font-semibold flex-1 bg-transparent border-none outline-none ${
                currentTask.completed ? 'line-through opacity-60' : ''
              } ${isDarkMode ? 'text-gray-100 placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`}
              placeholder="Task name..."
            />
          </div>

          {/* Scrollable content area - subtasks first, then description */}
          <div 
            ref={scrollContainerRef} 
            className="flex-1 overflow-y-auto min-h-0 space-y-6 pr-6"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: isDarkMode ? 'rgba(255,255,255,0.2) transparent' : 'rgba(0,0,0,0.2) transparent',
            }}
          >
            {/* Subtasks - show section if task is not a subtask itself */}
            {!currentTask.parentTaskId && onAddSubtask && onDeleteSubtask && (
              <SubtasksList
                parentTaskId={currentTask.id}
                subtasks={subtasks}
                onAddSubtask={onAddSubtask}
                onUpdateSubtask={handleUpdateSubtask}
                onDeleteSubtask={onDeleteSubtask}
                showHeader={true}
              />
            )}

            {/* Description - expands naturally with content */}
            <textarea
              ref={descriptionRef}
              value={localDescription}
              onChange={handleDescriptionChange}
              onBlur={handleDescriptionBlur}
              placeholder="Add description..."
              className={`w-full min-h-[100px] text-base leading-relaxed resize-none overflow-hidden bg-transparent border-none outline-none ${
                isDarkMode ? 'text-gray-300 placeholder-gray-600' : 'text-gray-700 placeholder-gray-400'
              }`}
              style={{ height: 'auto' }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FocusView;

