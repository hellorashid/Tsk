// @ts-nocheck

import React, { useState, useRef, useEffect } from 'react';
import { Task } from '../utils/types';
import Checkbox from './Checkbox';

interface SubtasksListProps {
  parentTaskId: string;
  subtasks: Task[];
  onAddSubtask: (parentTaskId: string, name: string) => void;
  onUpdateSubtask: (id: string, changes: Partial<Task>) => void;
  onDeleteSubtask: (id: string) => void;
  accentColor?: string;
  isDarkMode?: boolean;
}

const SubtasksList: React.FC<SubtasksListProps> = ({
  parentTaskId,
  subtasks,
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  accentColor = '#1F1B2F',
  isDarkMode = true,
}) => {
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleAddSubtask = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newSubtaskName.trim()) {
      onAddSubtask(parentTaskId, newSubtaskName.trim());
      setNewSubtaskName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubtask();
    } else if (e.key === 'Escape') {
      setNewSubtaskName('');
    }
  };

  const handleEditStart = (subtask: Task) => {
    setEditingId(subtask.id);
    setEditingValue(subtask.name);
  };

  const handleEditSave = (subtaskId: string) => {
    if (editingValue.trim() !== subtasks.find(s => s.id === subtaskId)?.name) {
      onUpdateSubtask(subtaskId, { name: editingValue.trim() });
    }
    setEditingId(null);
    setEditingValue('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingValue('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, subtaskId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditSave(subtaskId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleEditCancel();
    }
  };

  const handleCheckboxChange = (subtaskId: string, checked: boolean) => {
    onUpdateSubtask(subtaskId, { completed: checked });
  };

  const handleDelete = (subtaskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteSubtask(subtaskId);
  };

  // Convert hex color to rgba with opacity
  const hexToRgba = (hex: string, opacity: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  return (
    <div className="mt-4">
      <div className="rounded-lg" 
      style={{ backgroundColor: hexToRgba(accentColor, 0.3) }}
      >
        {subtasks.length > 0 && (
          <div>
            {subtasks.map((subtask, index) => (
            <div
              key={subtask.id}
              className={`group pl-4 pr-2 py-1.5 transition-all duration-200 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-900'
              } ${index === 0 ? 'rounded-t-lg' : ''}`}
              onDoubleClick={() => handleEditStart(subtask)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  <Checkbox
                    id={`subtask-${subtask.id}`}
                    size="sm"
                    checked={subtask.completed || false}
                    onChange={(e) => handleCheckboxChange(subtask.id, e.target.checked)}
                  />
                  <div className="flex-1 min-w-0 ml-2">
                    {editingId === subtask.id ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={() => handleEditSave(subtask.id)}
                        onKeyDown={(e) => handleEditKeyDown(e, subtask.id)}
                        onClick={(e) => e.stopPropagation()}
                        className={`px-2 py-0.5 text-sm w-full bg-transparent border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-white/30 ${
                          isDarkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}
                      />
                    ) : (
                      <span
                        className={`text-sm ${
                          subtask.completed
                            ? isDarkMode
                              ? 'text-gray-400 line-through opacity-60'
                              : 'text-gray-500 line-through opacity-60'
                            : ''
                        }`}
                      >
                        {subtask.name}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(subtask.id, e)}
                  className={`w-6 h-6 rounded-full bg-transparent hover:bg-white/10 flex items-center justify-center transition-opacity duration-200 opacity-0 group-hover:opacity-70 ${
                    isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-600'
                  }`}
                  aria-label="Delete subtask"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddSubtask}>
          <div
            className={`pl-4 pr-2 py-2.5 md:py-1.5 transition-all duration-200 group ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            } ${subtasks.length === 0 ? 'rounded-lg' : 'rounded-b-lg'}`}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = hexToRgba(accentColor, 0.8);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
          <div className="flex items-center">
            <div className="flex-shrink-0 relative opacity-30">
              <Checkbox
                id={`subtask-add-${parentTaskId}`}
                size="sm"
                checked={false}
                onChange={() => {}}
                disabled
              />
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-3 md:w-3 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </div>
        <input
          ref={inputRef}
          type="text"
          value={newSubtaskName}
          onChange={(e) => setNewSubtaskName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={subtasks.length === 0 ? "Add a subtask..." : "Add another subtask..."}
          className={`flex-1 min-w-0 ml-2 text-base md:text-sm bg-transparent focus:outline-none placeholder-opacity-50 ${
            isDarkMode ? 'text-gray-100 placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
          }`}
          autoComplete="off"
          inputMode="text"
        />
          </div>
        </div>
      </form>
      </div>
    </div>
  );
};

export default SubtasksList;

