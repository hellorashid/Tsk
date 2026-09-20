import React, { useState, useRef, useEffect, useActionState } from 'react';
import { Task } from '../utils/types';
import { useTheme } from '../contexts/ThemeContext';
import Checkbox from './Checkbox';

interface SubtasksListProps {
  parentTaskId: string;
  subtasks: Task[];
  onAddSubtask: (parentTaskId: string, name: string) => void;
  onUpdateSubtask: (id: string, changes: Partial<Task>) => void;
  onDeleteSubtask: (id: string) => void;
  showHeader?: boolean;
}

const SubtasksList: React.FC<SubtasksListProps> = ({
  parentTaskId,
  subtasks,
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  showHeader = false,
}) => {
  const { theme } = useTheme();
  const { accentColor, isDarkMode } = theme;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Track previous pending state to detect when submission completes
  const wasPendingRef = useRef(false);

  // Use React 19's useActionState for form submission
  const [, submitAction, isPending] = useActionState(
    async (_previousState: null, formData: FormData) => {
      const name = formData.get('subtaskName') as string;
      if (name?.trim()) {
        onAddSubtask(parentTaskId, name.trim());
        setNewSubtaskName('');
      }
      return null;
    },
    null
  );

  // Refocus input after submission completes (isPending goes from true to false)
  useEffect(() => {
    if (wasPendingRef.current && !isPending) {
      // Submission just completed - refocus the input
      inputRef.current?.focus();
    }
    wasPendingRef.current = isPending;
  }, [isPending]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.currentTarget.blur();
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

  const completedCount = subtasks.filter(s => s.completed).length;

  const shellBg = isDarkMode ? hexToRgba(accentColor, 0.3) : 'rgba(0, 0, 0, 0.04)';
  const addRowBg = isDarkMode ? hexToRgba(accentColor, 0.6) : 'rgba(0, 0, 0, 0.06)';
  const addRowHoverBg = isDarkMode ? hexToRgba(accentColor, 0.8) : 'rgba(0, 0, 0, 0.09)';

  return (
    <div className="mt-4">
      <div 
        className="rounded-lg flex flex-col" 
        style={{ backgroundColor: shellBg }}
      >
        {/* Sticky Header */}
        {showHeader && (
          <div 
            className={`sticky top-0 z-10 px-4 py-2 rounded-t-lg ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
            style={{ 
              backgroundColor: isDarkMode ? accentColor : 'rgba(0, 0, 0, 0.08)',
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider">
              Subtasks {subtasks.length > 0 && `(${completedCount}/${subtasks.length})`}
            </h3>
          </div>
        )}

        {/* Content */}
        {subtasks.length > 0 && (
          <div className="flex-1 min-h-0">
            {subtasks.map((subtask, index) => (
            <div
              key={subtask.id}
              className={`group px-2 py-1.5 transition-colors duration-200 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-900'
              } ${!showHeader && index === 0 ? 'rounded-t-lg' : ''}`}
              onDoubleClick={() => handleEditStart(subtask)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  <Checkbox
                    id={`subtask-${subtask.id}`}
                    size="sm"
                    checked={subtask.completed || false}
                    onChange={(e) => handleCheckboxChange(subtask.id, e.target.checked)}
                    accentColor={accentColor}
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
                        className={`px-2 py-0.5 text-sm w-full bg-transparent border rounded focus:outline-hidden focus:ring-2 ${
                          isDarkMode
                            ? 'border-white/20 focus:ring-white/30 text-gray-100'
                            : 'border-black/15 focus:ring-black/20 text-gray-900'
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
                  className={`w-6 h-6 rounded-full bg-transparent flex items-center justify-center transition-opacity duration-200 opacity-0 group-hover:opacity-70 ${
                    isDarkMode
                      ? 'hover:bg-white/10 text-gray-400 hover:text-red-400'
                      : 'hover:bg-black/10 text-gray-600 hover:text-red-600'
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

        {/* Footer - Add subtask input using React 19 form actions */}
        <form action={submitAction}>
          <div
            className={`px-2 py-1.5 transition-colors duration-200 group ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            } ${subtasks.length === 0 && !showHeader ? 'rounded-lg' : 'rounded-b-lg'}`}
            style={{ backgroundColor: addRowBg }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = addRowHoverBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = addRowBg;
            }}
          >
          <div className="flex items-center min-h-7">
            <div className="shrink-0 relative opacity-30">
              <Checkbox
                id={`subtask-add-${parentTaskId}`}
                size="sm"
                checked={false}
                onChange={() => undefined}
                accentColor={accentColor}
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
              name="subtaskName"
              type="text"
              value={newSubtaskName}
              onChange={(e) => setNewSubtaskName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={subtasks.length === 0 ? "Add a subtask..." : "Add another subtask..."}
              className={`flex-1 min-w-0 ml-2 text-base md:text-sm bg-transparent focus:outline-hidden placeholder:opacity-50 ${
                isDarkMode ? 'text-gray-100 placeholder:text-gray-400' : 'text-gray-900 placeholder:text-gray-500'
              } ${isPending ? 'opacity-50' : ''}`}
              autoComplete="off"
              inputMode="text"
              disabled={isPending}
            />
            <button
              type="submit"
              disabled={isPending || !newSubtaskName.trim()}
              className={`shrink-0 w-7 h-7 ml-1 rounded-full flex items-center justify-center transition-[colors,opacity] ${
                isDarkMode
                  ? 'text-gray-300 hover:text-white hover:bg-white/10'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
              } disabled:opacity-40 ${
                newSubtaskName.trim() ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              aria-label="Add subtask"
              tabIndex={newSubtaskName.trim() ? 0 : -1}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </form>
      </div>
    </div>
  );
};

export default SubtasksList;
