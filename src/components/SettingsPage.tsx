import React, { useState, useRef, useEffect } from 'react';
import { useBasic } from "@basictech/react";
import { useTheme } from '../contexts/ThemeContext';
import * as Switch from '@radix-ui/react-switch';
import { Folder } from '../utils/types';

type SettingsTab = 'general' | 'folders' | 'appearance';

interface SettingsPageProps {
  onBack: () => void;
  onViewModeChange: (mode: 'compact' | 'cozy' | 'chonky') => void;
  currentViewMode: 'compact' | 'cozy' | 'chonky';
  // Folder props
  folders: Folder[];
  onCreateFolder: (name: string, labels?: string, color?: string) => Promise<void>;
  onUpdateFolder: (folderId: string, name: string, labels: string, color?: string) => Promise<void>;
  onDeleteFolder: (folderId: string) => Promise<void>;
  showAllFolder: boolean;
  showOtherFolder: boolean;
  showTodayFolder: boolean;
  onToggleAllFolder: (show: boolean) => void;
  onToggleOtherFolder: (show: boolean) => void;
  onToggleTodayFolder: (show: boolean) => void;
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

const SettingsPage: React.FC<SettingsPageProps> = ({
  onBack,
  onViewModeChange,
  currentViewMode,
  folders,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  showAllFolder,
  showOtherFolder,
  showTodayFolder,
  onToggleAllFolder,
  onToggleOtherFolder,
  onToggleTodayFolder,
}) => {
  const { dbStatus } = useBasic();
  const { theme, setAccentColor, setIsDarkMode, setFontStyle } = useTheme();
  const { accentColor, isDarkMode, fontStyle } = theme;
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const defaultAccentColor = '#1F1B2F';
  
  // Folder state
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editLabels, setEditLabels] = useState('');
  const [editColor, setEditColor] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const handleResetAccentColor = () => {
    setAccentColor(defaultAccentColor);
  };

  // Folder handlers
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
    }
  };

  // Handle Escape key to go back
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [onBack]);

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'general',
      label: 'General',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: 'folders',
      label: 'Folders',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
    },
  ];

  return (
    <div 
      className={`w-full h-full flex flex-col ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
      style={{ 
        backgroundColor: accentColor,
      }}
    >
      {/* Header with back button and tabs */}
      <div className="flex-shrink-0 sticky top-0 z-10 backdrop-blur-xl" style={{ backgroundColor: `${accentColor}E6` }}>
        <div className="max-w-2xl mx-auto px-4">
          {/* Title row */}
          <div className="py-4 flex items-center gap-4">
            <button
              onClick={onBack}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'
              }`}
              aria-label="Back to home"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>

          {/* Tab navigation */}
          <div className="flex gap-1 pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white/20'
                    : `${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'} opacity-60 hover:opacity-100`
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-20">
          
          {/* General Tab */}
          {activeTab === 'general' && (
            <>
              {/* Sync Status */}
              <section className={`rounded-xl p-4 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                <h2 className="text-lg font-semibold mb-3">Sync Status</h2>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    dbStatus === "ONLINE" ? "bg-green-500" : 
                    dbStatus === "OFFLINE" ? "bg-red-500" : "bg-yellow-500"
                  }`}></div>
                  <span>{dbStatus || "CONNECTING..."}</span>
                </div>
              </section>

              {/* About */}
              <section className={`rounded-xl p-4 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                <h2 className="text-lg font-semibold mb-3">About</h2>
                <div className="space-y-3">
                  <p className="text-sm">
                    tsk is a cozy & customizable task & time manager.
                  </p>
                  <ul className={`list-disc list-inside text-sm space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <li>Fully customizable and expandable</li>
                    <li>Your data is private and stored locally</li>
                    <li>Open source - make it your own</li>
                  </ul>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    tsk.lol
                  </p>
                </div>
              </section>
            </>
          )}

          {/* Folders Tab */}
          {activeTab === 'folders' && (
            <>
              {/* Add New Folder */}
              <section className={`rounded-xl p-4 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                <h2 className="text-lg font-semibold mb-4">Add New Folder</h2>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, handleCreateNew)}
                      placeholder="Folder name"
                      className={`flex-1 px-4 py-2 rounded-lg transition-colors duration-200 ${
                        isDarkMode
                          ? 'bg-white/5 text-gray-100 placeholder-gray-500 focus:bg-white/10'
                          : 'bg-white text-gray-900 placeholder-gray-400 focus:bg-gray-50'
                      } focus:outline-none focus:ring-2 focus:ring-white/20 border-0`}
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
              </section>

              {/* Default Folders */}
              <section className={`rounded-xl p-4 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                <h2 className="text-lg font-semibold mb-4">Default Folders</h2>
                
                <div className="space-y-2">
                  {/* All Folder Toggle */}
                  <div className={`p-3 rounded-lg flex items-center justify-between ${
                    isDarkMode ? 'bg-white/5' : 'bg-black/5'
                  }`}>
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      <span className="font-medium">All Tasks</span>
                    </div>
                    <Switch.Root
                      checked={showAllFolder}
                      onCheckedChange={onToggleAllFolder}
                      className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                        showAllFolder ? 'bg-white/30' : isDarkMode ? 'bg-white/10' : 'bg-gray-300'
                      }`}
                    >
                      <Switch.Thumb
                        className={`inline-block h-5 w-5 transform rounded-full transition-transform ${
                          showAllFolder ? 'translate-x-5 bg-white' : 'translate-x-0.5 bg-gray-400'
                        }`}
                      />
                    </Switch.Root>
                  </div>

                  {/* Other Folder Toggle */}
                  <div className={`p-3 rounded-lg flex items-center justify-between ${
                    isDarkMode ? 'bg-white/5' : 'bg-black/5'
                  }`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <span className="font-medium">Other</span>
                      </div>
                      <p className={`text-xs mt-1 ml-7 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Tasks not in any folder
                      </p>
                    </div>
                    <Switch.Root
                      checked={showOtherFolder}
                      onCheckedChange={onToggleOtherFolder}
                      className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                        showOtherFolder ? 'bg-white/30' : isDarkMode ? 'bg-white/10' : 'bg-gray-300'
                      }`}
                    >
                      <Switch.Thumb
                        className={`inline-block h-5 w-5 transform rounded-full transition-transform ${
                          showOtherFolder ? 'translate-x-5 bg-white' : 'translate-x-0.5 bg-gray-400'
                        }`}
                      />
                    </Switch.Root>
                  </div>

                  {/* Today Folder Toggle */}
                  <div className={`p-3 rounded-lg flex items-center justify-between ${
                    isDarkMode ? 'bg-white/5' : 'bg-black/5'
                  }`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">Today</span>
                      </div>
                      <p className={`text-xs mt-1 ml-7 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Tasks scheduled for today
                      </p>
                    </div>
                    <Switch.Root
                      checked={showTodayFolder}
                      onCheckedChange={onToggleTodayFolder}
                      className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                        showTodayFolder ? 'bg-white/30' : isDarkMode ? 'bg-white/10' : 'bg-gray-300'
                      }`}
                    >
                      <Switch.Thumb
                        className={`inline-block h-5 w-5 transform rounded-full transition-transform ${
                          showTodayFolder ? 'translate-x-5 bg-white' : 'translate-x-0.5 bg-gray-400'
                        }`}
                      />
                    </Switch.Root>
                  </div>
                </div>
              </section>

              {/* Custom Folders */}
              <section className={`rounded-xl p-4 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                <h2 className="text-lg font-semibold mb-4">Custom Folders</h2>
                
                {folders && folders.length > 0 ? (
                  <div className="space-y-2">
                    {folders.map((folder) => (
                      <div
                        key={folder.id}
                        className={`rounded-lg transition-colors ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}
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
                              className={`w-full px-3 py-2 rounded-lg transition-colors text-sm ${
                                isDarkMode
                                  ? 'bg-white/5 text-gray-100 placeholder-gray-500'
                                  : 'bg-white text-gray-900 placeholder-gray-400'
                              } focus:outline-none focus:ring-2 focus:ring-white/20 border-0`}
                              autoFocus
                            />
                            <input
                              type="text"
                              value={editLabels}
                              onChange={(e) => setEditLabels(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, () => handleSaveEdit(folder.id))}
                              placeholder="Labels (comma-separated)"
                              className={`w-full px-3 py-2 rounded-lg transition-colors text-sm ${
                                isDarkMode
                                  ? 'bg-white/5 text-gray-100 placeholder-gray-500'
                                  : 'bg-white text-gray-900 placeholder-gray-400'
                              } focus:outline-none focus:ring-2 focus:ring-white/20 border-0`}
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
                                <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {folder.labels}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => handleStartEdit(e, folder)}
                                className={`p-2 rounded-lg transition-colors ${
                                  isDarkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
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
                                  isDarkMode ? 'hover:bg-red-400/10 text-red-400' : 'hover:bg-red-100 text-red-600'
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
              </section>
            </>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <>
              {/* Theme */}
              <section className={`rounded-xl p-4 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                <h2 className="text-lg font-semibold mb-4">Theme</h2>
                
                <div className="space-y-5">
                  {/* Dark Mode */}
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">Dark Mode</span>
                      <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Toggle between light and dark themes
                      </p>
                    </div>
                    <Switch.Root
                      className={`relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        isDarkMode ? 'bg-white/30' : 'bg-gray-300'
                      }`}
                      checked={isDarkMode}
                      onCheckedChange={setIsDarkMode}
                      id="dark-mode-switch"
                    >
                      <Switch.Thumb
                        className={`pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isDarkMode ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </Switch.Root>
                  </div>
                  
                  {/* Accent Color */}
                  <div>
                    <span className="font-medium block mb-1">Accent Color</span>
                    <p className={`text-xs mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Customize the app's primary color
                    </p>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-10 h-10 rounded-lg p-0 bg-transparent cursor-pointer border-0"
                      />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{accentColor}</span>
                      <button 
                        onClick={handleResetAccentColor}
                        className={`ml-auto px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'
                        }`}
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Layout */}
              <section className={`rounded-xl p-4 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                <h2 className="text-lg font-semibold mb-4">Layout</h2>
                
                <div className="space-y-5">
                  {/* View Mode */}
                  <div>
                    <span className="font-medium block mb-1">View Mode</span>
                    <p className={`text-xs mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Adjust spacing and density of task items
                    </p>
                    <div className="flex space-x-2">
                      {(['compact', 'cozy', 'chonky'] as const).map((mode) => (
                        <button
                          key={mode}
                          className={`px-4 py-2 text-sm rounded-lg transition-colors duration-200 capitalize ${
                            currentViewMode === mode 
                              ? 'bg-white/30 font-medium' 
                              : `${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`
                          }`}
                          onClick={() => onViewModeChange(mode)}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Typography */}
              <section className={`rounded-xl p-4 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                <h2 className="text-lg font-semibold mb-4">Typography</h2>
                
                <div>
                  <span className="font-medium block mb-1">Font Style</span>
                  <p className={`text-xs mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Choose your preferred font family
                  </p>
                  <div className="flex space-x-2">
                    {(['mono', 'sans', 'serif'] as const).map((style) => (
                      <button
                        key={style}
                        className={`px-4 py-2 text-sm rounded-lg transition-colors duration-200 capitalize ${
                          fontStyle === style 
                            ? 'bg-white/30 font-medium' 
                            : `${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`
                        } font-${style}`}
                        onClick={() => setFontStyle(style)}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
