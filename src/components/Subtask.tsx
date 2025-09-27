import React, { useState, useRef, useEffect } from 'react';
import { Subtask as SubtaskType } from '../utils/types';
import Checkbox from './Checkbox';

interface SubtaskProps {
  subtask: SubtaskType;
  onUpdate: (id: string, changes: Partial<SubtaskType>) => void;
  onDelete: (id: string) => void;
  isDarkMode?: boolean;
}

const Subtask: React.FC<SubtaskProps> = ({
  subtask,
  onUpdate,
  onDelete,
  isDarkMode = true
}) => {
  const [text, setText] = useState(subtask.text);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  const handleTextBlur = () => {
    const trimmedText = text.trim();
    if (trimmedText === '') {
      onDelete(subtask.id);
    } else if (trimmedText !== subtask.text) {
      onUpdate(subtask.id, { text: trimmedText });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTextBlur();
    } else if (e.key === 'Escape') {
      setText(subtask.text);
      setIsEditing(false);
    }
  };

  const handleCompletedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(subtask.id, { completed: e.target.checked });
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(subtask.id);
  };

  return (
    <div className={`flex items-center gap-2 group py-1 px-2 rounded hover:bg-white/5 ${
      subtask.completed ? 'opacity-60' : ''
    }`}>
      <Checkbox
        id={subtask.id}
        checked={subtask.completed}
        onChange={handleCompletedChange}
        size="sm"
      />
      
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          onKeyDown={handleKeyDown}
          className={`flex-1 bg-transparent border border-white/30 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}
        />
      ) : (
        <span
          onDoubleClick={handleDoubleClick}
          className={`flex-1 text-sm cursor-pointer select-none ${
            subtask.completed ? 'line-through' : ''
          } ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
        >
          {subtask.text}
        </span>
      )}
      
      <button
        onClick={handleDeleteClick}
        className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
          isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-600'
        } focus:outline-none focus:opacity-100`}
        aria-label="Delete subtask"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default Subtask;