'use client';

import React, { useState } from 'react';
import { Sheet, useClientMediaQuery, type SheetViewProps } from "@silk-hq/components";
import { useModalHistory } from '../hooks/useModalHistory';
import { Folder } from '../utils/types';

interface FolderSettingsProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  folders: Folder[];
  onCreateFolder: (name: string, labels?: string, color?: string) => Promise<void>;
  onUpdateFolder: (folderId: string, name: string, labels: string, color?: string) => Promise<void>;
  onDeleteFolder: (folderId: string) => Promise<void>;
  isDarkMode: boolean;
  accentColor: string;
}

// Predefined subtle colors for folders
const FOLDER_COLORS = [
  { name: 'None', value: '' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Gray', value: '#6b7280' },
];

export default function FolderSettings({ 
  isOpen, 
  setIsOpen, 
  folders,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  isDarkMode,
  accentColor
}: FolderSettingsProps) {
  const titleId = React.useId();
  const viewRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editLabels, setEditLabels] = useState('');
  const [editColor, setEditColor] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const largeViewport = useClientMediaQuery("(min-width: 800px)");
  const contentPlacement: SheetViewProps["contentPlacement"] = largeViewport ? "center" : "bottom";
  const tracks: SheetViewProps["tracks"] = largeViewport ? ["top", "bottom"] : "bottom";
  
  // Handle browser back button for closing modal
  useModalHistory(isOpen, () => setIsOpen(false), 'folder-settings');
  
  // Focus input when modal opens
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  const handleClose = () => {
    setNewFolderName('');
    setNewFolderColor('');
    setEditingFolderId(null);
    setEditName('');
    setEditLabels('');
    setEditColor('');
    setIsOpen(false);
  };

  const handleCreateNew = async () => {
    if (!newFolderName.trim()) return;
    
    setIsCreating(true);
    try {
      await onCreateFolder(newFolderName.trim(), undefined, newFolderColor);
      setNewFolderName('');
      setNewFolderColor('');
    } catch (error) {
      console.error('Failed to create folder:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartEdit = (e: React.MouseEvent, folder: Folder) => {
    e.stopPropagation();
    setEditingFolderId(folder.id);
    setEditName(folder.name);
    setEditLabels(folder.labels);
    setEditColor(folder.color || '');
  };

  const handleSaveEdit = async (folderId: string) => {
    if (!editName.trim()) return;
    
    try {
      await onUpdateFolder(folderId, editName.trim(), editLabels.trim(), editColor);
      setEditingFolderId(null);
      setEditName('');
      setEditLabels('');
      setEditColor('');
    } catch (error) {
      console.error('Failed to update folder:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingFolderId(null);
    setEditName('');
    setEditLabels('');
    setEditColor('');
  };

  const handleDelete = async (folderId: string) => {
    if (confirm('Delete this folder? Tasks will not be deleted.')) {
      try {
        await onDeleteFolder(folderId);
      } catch (error) {
        console.error('Failed to delete folder:', error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      action();
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  // Dismiss keyboard when sheet is moved
  const travelHandler = React.useCallback<Exclude<SheetViewProps["onTravel"], undefined>>(({ progress }) => {
    if (!viewRef.current) return;

    if (progress < 0.999) {
      viewRef.current.focus();
    }
  }, []);
  
  return (
    <Sheet.Root 
      license="non-commercial"
      presented={isOpen}
      onPresentedChange={setIsOpen}
    >
      <Sheet.Portal>
        <Sheet.View
          ref={viewRef}
          contentPlacement={contentPlacement}
          tracks={tracks}
          swipeOvershoot={false}
          nativeEdgeSwipePrevention={true}
          onTravel={travelHandler}
          style={{ 
            height: typeof CSS !== 'undefined' && CSS.supports('height', '100dvh') ? '100dvh' : 'calc(var(--vh, 1vh) * 100)',
            maxHeight: typeof CSS !== 'undefined' && CSS.supports('height', '100dvh') ? '100dvh' : 'calc(var(--vh, 1vh) * 100)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: largeViewport ? 'center' : 'stretch',
            justifyContent: largeViewport ? 'center' : 'flex-end',
            padding: largeViewport ? '2rem' : '0',
          }}
        >
          <Sheet.Backdrop 
            themeColorDimming="auto" 
          />
          <Sheet.Content 
            style={{
              backgroundColor: isDarkMode ? '#1F1B2F' : '#FFFFFF',
              borderRadius: largeViewport ? '1rem' : '1rem 1rem 0 0',
              padding: '0px',
              display: 'flex',
              flex: largeViewport ? '0 1 auto' : '1',
              flexDirection: 'column',
              height: typeof CSS !== 'undefined' && CSS.supports('height', '100dvh')
                ? (largeViewport ? 'calc(100dvh - 4rem)' : '90dvh')
                : (largeViewport ? 'calc(var(--vh, 1vh) * 100 - 4rem)' : 'calc(var(--vh, 1vh) * 90)'),
              maxHeight: typeof CSS !== 'undefined' && CSS.supports('height', '100dvh')
                ? (largeViewport ? 'calc(100dvh - 4rem)' : '90dvh')
                : (largeViewport ? 'calc(var(--vh, 1vh) * 100 - 4rem)' : 'calc(var(--vh, 1vh) * 90)'),
              overflow: 'hidden',
              width: largeViewport ? '90%' : '100%',
              maxWidth: largeViewport ? '700px' : '100%',
            }}
            aria-labelledby={titleId}
          >
            <h2 id={titleId} className="sr-only">
              Folder Settings
            </h2>
            
            {/* Header with close button */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
              {!largeViewport && (
                <div className="mx-auto w-12 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full absolute top-4 left-1/2 -translate-x-1/2" />
              )}
              <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Folder Settings</h3>
              <button
                onClick={handleClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'hover:bg-white/10 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className={`w-full px-6 py-6 flex-1 overflow-y-auto ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              
              {/* Add New Folder */}
              <div className="mb-6">
                <label 
                  htmlFor="new-folder" 
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Add New Folder
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      id="new-folder"
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, handleCreateNew)}
                      placeholder="Folder name"
                      className={`flex-1 px-4 py-2 rounded-lg border transition-colors duration-200 ${
                        isDarkMode
                          ? 'bg-white/5 border-white/20 text-gray-100 placeholder-gray-500 focus:border-white/40'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-white/20`}
                      autoComplete="off"
                    />
                    <button
                      onClick={handleCreateNew}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                        isDarkMode
                          ? 'bg-white/20 hover:bg-white/30 text-white'
                          : 'bg-gray-800 hover:bg-gray-900 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      disabled={!newFolderName.trim() || isCreating}
                    >
                      {isCreating ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                  
                  {/* Color Picker */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Color:</span>
                    <div className="flex gap-1.5">
                      {FOLDER_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setNewFolderColor(color.value)}
                          className={`w-6 h-6 rounded-full transition-all ${
                            newFolderColor === color.value 
                              ? 'ring-2 ring-offset-2 ring-white/50' 
                              : 'hover:scale-110'
                          }`}
                          style={{
                            backgroundColor: color.value || (isDarkMode ? '#374151' : '#e5e7eb'),
                            border: color.value === '' ? `2px solid ${isDarkMode ? '#6b7280' : '#9ca3af'}` : 'none'
                          }}
                          title={color.name}
                          aria-label={`Select ${color.name} color`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Existing Folders */}
              <div>
                <h4 className={`text-sm font-medium mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Existing Folders
                </h4>
                
                {folders && folders.length > 0 ? (
                  <div className="space-y-2">
                    {folders.map((folder) => (
                      <div
                        key={folder.id}
                        className={`rounded-lg border transition-colors ${
                          isDarkMode
                            ? 'bg-white/5 border-white/10'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        {editingFolderId === folder.id ? (
                          // Edit mode
                          <div className="p-3 space-y-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, () => handleSaveEdit(folder.id))}
                              placeholder="Folder name"
                              className={`w-full px-3 py-2 rounded-lg border transition-colors text-sm ${
                                isDarkMode
                                  ? 'bg-white/5 border-white/20 text-gray-100 placeholder-gray-500'
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                              } focus:outline-none focus:ring-2 focus:ring-white/20`}
                              autoFocus
                            />
                            <input
                              type="text"
                              value={editLabels}
                              onChange={(e) => setEditLabels(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, () => handleSaveEdit(folder.id))}
                              placeholder="Labels (comma-separated)"
                              className={`w-full px-3 py-2 rounded-lg border transition-colors text-sm ${
                                isDarkMode
                                  ? 'bg-white/5 border-white/20 text-gray-100 placeholder-gray-500'
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                              } focus:outline-none focus:ring-2 focus:ring-white/20`}
                            />
                            
                            {/* Color Picker */}
                            <div className="flex items-center gap-2 pt-1">
                              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Color:</span>
                              <div className="flex gap-1.5">
                                {FOLDER_COLORS.map((color) => (
                                  <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => setEditColor(color.value)}
                                    className={`w-5 h-5 rounded-full transition-all ${
                                      editColor === color.value 
                                        ? 'ring-2 ring-offset-1 ring-white/50' 
                                        : 'hover:scale-110'
                                    }`}
                                    style={{
                                      backgroundColor: color.value || (isDarkMode ? '#374151' : '#e5e7eb'),
                                      border: color.value === '' ? `2px solid ${isDarkMode ? '#6b7280' : '#9ca3af'}` : 'none'
                                    }}
                                    title={color.name}
                                    aria-label={`Select ${color.name} color`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveEdit(folder.id)}
                                className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                  isDarkMode
                                    ? 'bg-white/20 hover:bg-white/30 text-white'
                                    : 'bg-gray-800 hover:bg-gray-900 text-white'
                                }`}
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                  isDarkMode
                                    ? 'bg-white/5 hover:bg-white/10 text-gray-300'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <div className="p-3 flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {folder.color && (
                                  <div 
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: folder.color }}
                                  />
                                )}
                                <div className="font-medium capitalize">{folder.name}</div>
                              </div>
                              {folder.labels && (
                                <div className={`text-xs mt-1 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {folder.labels}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => handleStartEdit(e, folder)}
                                className={`p-2 rounded-lg transition-colors ${
                                  isDarkMode
                                    ? 'hover:bg-white/10 text-gray-300'
                                    : 'hover:bg-gray-200 text-gray-700'
                                }`}
                                aria-label="Edit folder"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(folder.id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  isDarkMode
                                    ? 'hover:bg-red-400/10 text-red-400'
                                    : 'hover:bg-red-100 text-red-600'
                                }`}
                                aria-label="Delete folder"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    No folders yet. Add one above to get started.
                  </p>
                )}
              </div>
            </div>
          </Sheet.Content>
        </Sheet.View>
      </Sheet.Portal>
    </Sheet.Root>
  );
}

