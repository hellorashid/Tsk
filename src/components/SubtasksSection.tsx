import React, { useState, useRef, useEffect } from 'react';
import { Subtask as SubtaskType } from '../utils/types';
import Subtask from './Subtask';

interface SubtasksSectionProps {
  subtasks: SubtaskType[];
  onAddSubtask: (text: string) => void;
  onUpdateSubtask: (id: string, changes: Partial<SubtaskType>) => void;
  onDeleteSubtask: (id: string) => void;
  isDarkMode?: boolean;
}

const SubtasksSection: React.FC<SubtasksSectionProps> = ({
  subtasks = [],
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  isDarkMode = true
}) => {
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  const handleAddSubtask = () => {
    const trimmedText = newSubtaskText.trim();
    if (trimmedText) {
      onAddSubtask(trimmedText);
      setNewSubtaskText('');
      setShowInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddSubtask();
    } else if (e.key === 'Escape') {
      setNewSubtaskText('');
      setShowInput(false);
    }
  };

  const handleInputBlur = () => {
    if (newSubtaskText.trim()) {
      handleAddSubtask();
    } else {
      setShowInput(false);
    }
  };

  const completedCount = subtasks.filter(subtask => subtask.completed).length;
  const totalCount = subtasks.length;

  return (
    <div className="mt-4">
      {/* Header with progress indicator */}
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Subtasks
        </h3>
        {totalCount > 0 && (
          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {completedCount} of {totalCount} completed
          </span>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className={`w-full h-1 rounded-full mb-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      )}

      {/* Subtasks list */}
      <div className="space-y-1">
        {subtasks.map((subtask) => (
          <Subtask
            key={subtask.id}
            subtask={subtask}
            onUpdate={onUpdateSubtask}
            onDelete={onDeleteSubtask}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>

      {/* Add subtask input or button */}
      {showInput ? (
        <div className="flex items-center gap-2 mt-2 py-1 px-2">
          <div className="w-4 h-4 flex-shrink-0" /> {/* Spacer for checkbox alignment */}
          <input
            ref={inputRef}
            type="text"
            value={newSubtaskText}
            onChange={(e) => setNewSubtaskText(e.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder="Add a subtask..."
            className={`flex-1 bg-transparent border border-white/30 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 ${
              isDarkMode ? 'text-gray-100 placeholder-gray-400' : 'text-gray-900 placeholder-gray-600'
            }`}
          />
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className={`flex items-center gap-2 mt-2 py-1 px-2 text-sm rounded hover:bg-white/5 transition-colors duration-200 ${
            isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
          } focus:outline-none focus:ring-2 focus:ring-white/30`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add subtask
        </button>
      )}
    </div>
  );
};

export default SubtasksSection;