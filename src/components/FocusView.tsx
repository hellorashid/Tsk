import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Task } from '../utils/types';
import { useBasic, useQuery } from '@basictech/react';
import Checkbox from './Checkbox';
import PomodoroTimer from './PomodoroTimer';

interface FocusViewProps {
  task: Task;
  onExit: () => void;
  onUpdateTask: (id: string, changes: any) => void;
  onTaskToggle: (taskId: string, completed: boolean) => void;
  onAddSubtask?: (parentTaskId: string, name: string) => Promise<string | null>;
  accentColor?: string;
  isDarkMode?: boolean;
}

const FocusView: React.FC<FocusViewProps> = ({
  task,
  onExit,
  onUpdateTask,
  onTaskToggle,
  onAddSubtask,
  accentColor = '#1F1B2F',
  isDarkMode = true
}) => {
  const { db } = useBasic();
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateTask(currentTask.id, { description: e.target.value });
  };

  const handleAddSubtask = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newSubtaskName.trim() && onAddSubtask) {
      await onAddSubtask(currentTask.id, newSubtaskName.trim());
      setNewSubtaskName('');
    }
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubtask();
    } else if (e.key === 'Escape') {
      setNewSubtaskName('');
      subtaskInputRef.current?.blur();
    }
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
      {/* Close button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        onClick={onExit}
        className={`absolute top-6 right-6 p-3 rounded-full transition-colors ${
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

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="w-full max-w-2xl px-8 py-8 flex flex-col"
        style={{ minHeight: 'calc(100vh - 120px)' }}
      >
        {/* Spacer to move task info down */}
        <div style={{ flex: '0.4' }} />

        {/* Task info */}
        <div className={`space-y-8 p-6 rounded-xl transition-colors duration-300 ${
          isDarkMode ? 'bg-white/3 hover:bg-white/4' : 'bg-white shadow-lg'
        }`}>
          {/* Task title with checkbox */}
          <div className="flex items-center gap-3">
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                id={`focus-task-${currentTask.id}`}
                size="md"
                checked={currentTask.completed}
                onChange={() => handleTaskComplete()}
                accentColor={accentColor}
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

          {/* Description */}
          <textarea
            value={currentTask.description || ''}
            onChange={handleDescriptionChange}
            placeholder="Add description..."
            className={`w-full min-h-[100px] text-base leading-relaxed resize-none bg-transparent border-none outline-none ${
              isDarkMode ? 'text-gray-300 placeholder-gray-600' : 'text-gray-700 placeholder-gray-400'
            }`}
          />

          {/* Subtasks - show section if task is not a subtask itself */}
          {!currentTask.parentTaskId && (
            <div className="space-y-4 pt-6 border-t" style={{
              borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
            }}>
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                Subtasks {subtasks.length > 0 && `(${subtasks.filter((s) => s.completed).length}/${subtasks.length})`}
              </h3>
              <div className="space-y-3">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-3">
                    <Checkbox
                      id={`focus-subtask-${subtask.id}`}
                      size="sm"
                      checked={subtask.completed}
                      onChange={() => onTaskToggle(subtask.id, !subtask.completed)}
                      accentColor={accentColor}
                    />
                    <input
                      type="text"
                      value={subtask.name}
                      onChange={(e) => onUpdateTask(subtask.id, { name: e.target.value })}
                      className={`text-sm flex-1 bg-transparent border-none outline-none ${
                        subtask.completed ? 'line-through opacity-60' : ''
                      } ${isDarkMode ? 'text-gray-300 placeholder-gray-600' : 'text-gray-700 placeholder-gray-400'}`}
                    />
                  </div>
                ))}
                {/* Add subtask input */}
                {onAddSubtask && (
                  <form onSubmit={handleAddSubtask} className="flex items-center gap-3">
                    <div className="flex-shrink-0 opacity-40">
                      <div className="relative">
                        <Checkbox
                          id={`focus-add-subtask-${currentTask.id}`}
                          size="sm"
                          checked={false}
                          onChange={() => undefined}
                          disabled
                        />
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <input
                      ref={subtaskInputRef}
                      type="text"
                      value={newSubtaskName}
                      onChange={(e) => setNewSubtaskName(e.target.value)}
                      onKeyDown={handleSubtaskKeyDown}
                      placeholder={subtasks.length === 0 ? "Add a subtask..." : "Add another subtask..."}
                      className={`text-sm flex-1 bg-transparent border-none outline-none ${
                        isDarkMode ? 'text-gray-300 placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'
                      }`}
                      autoComplete="off"
                    />
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Spacer to push timer to bottom */}
        <div style={{ flex: '0.6' }} />

        {/* Stopwatch Timer - at the bottom */}
        <div className="flex justify-center pt-8">
          <PomodoroTimer 
            accentColor={accentColor} 
            isDarkMode={isDarkMode}
            onMarkDone={() => handleTaskComplete()}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FocusView;

