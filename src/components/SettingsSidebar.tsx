import React from 'react';
import { useBasic } from "@basictech/react";

interface SettingsSidebarProps {
  onClose: () => void;
  onViewModeChange: (mode: 'compact' | 'cozy' | 'chonky') => void;
  currentViewMode: 'compact' | 'cozy' | 'chonky';
  onAccentColorChange: (color: string) => void;
  currentAccentColor: string;
  onThemeChange: (isDark: boolean) => void;
  isDarkMode: boolean;
  onFontStyleChange: (style: 'mono' | 'sans' | 'serif') => void;
  currentFontStyle: 'mono' | 'sans' | 'serif';
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  onClose,
  onViewModeChange,
  currentViewMode,
  onAccentColorChange,
  currentAccentColor,
  onThemeChange,
  isDarkMode,
  onFontStyleChange,
  currentFontStyle
}) => {
  const { dbStatus } = useBasic();
  const defaultAccentColor = '#1F1B2F';

  // Calculate background colors based on accent color
  const getBackgroundColor = () => {
    return `${currentAccentColor}80`; // 80% opacity
  };

  const handleResetAccentColor = () => {
    onAccentColorChange(defaultAccentColor);
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onThemeChange(e.target.checked);
  };

  return (
    <div 
      className={`w-full h-full p-6 overflow-y-auto backdrop-blur-sm  rounded-md flex flex-col ${
        isDarkMode ? 'text-gray-100' : 'text-gray-900'
      }`}
      style={{ backgroundColor: getBackgroundColor() }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Settings</h2>
        <button
          onClick={onClose}
          className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} focus:outline-none`}
          aria-label="Close settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="space-y-6">
        {/* Database Status */}
        <div>
          <h3 className="text-lg font-medium mb-2">Database Status</h3>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              dbStatus === "ONLINE" ? "bg-green-500" : 
              dbStatus === "OFFLINE" ? "bg-red-500" : "bg-yellow-500"
            }`}></div>
            <span>{dbStatus || "CONNECTING..."}</span>
          </div>
        </div>

        {/* Appearance */}
        <div>
          <h3 className="text-lg font-medium mb-2">Appearance</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span>Dark Mode</span>
                <label className={`relative inline-flex items-center cursor-pointer ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
                  <input 
                    type="checkbox" 
                    checked={isDarkMode}
                    onChange={handleThemeChange}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full peer ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} peer-focus:outline-none peer-focus:ring-4 ${isDarkMode ? 'peer-focus:ring-gray-700' : 'peer-focus:ring-gray-300'}`}></div>
                  <span className={`absolute left-1 top-1 bg-white rounded-full h-4 w-4 transition-all ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`}></span>
                </label>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span>View Mode</span>
              </div>
              <div className="flex space-x-2">
                <button 
                  className={`btn btn-sm ${currentViewMode === 'compact' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => onViewModeChange('compact')}
                >
                  Compact
                </button>
                <button 
                  className={`btn btn-sm ${currentViewMode === 'cozy' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => onViewModeChange('cozy')}
                >
                  Cozy
                </button>
                <button 
                  className={`btn btn-sm ${currentViewMode === 'chonky' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => onViewModeChange('chonky')}
                >
                  Chonky
                </button>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span>Font Style</span>
              </div>
              <div className="flex space-x-2">
                <button 
                  className={`btn btn-sm ${currentFontStyle === 'mono' ? 'btn-primary' : 'btn-ghost'} font-mono`}
                  onClick={() => onFontStyleChange('mono')}
                >
                  Mono
                </button>
                <button 
                  className={`btn btn-sm ${currentFontStyle === 'sans' ? 'btn-primary' : 'btn-ghost'} font-sans`}
                  onClick={() => onFontStyleChange('sans')}
                >
                  Sans
                </button>
                <button 
                  className={`btn btn-sm ${currentFontStyle === 'serif' ? 'btn-primary' : 'btn-ghost'} font-serif`}
                  onClick={() => onFontStyleChange('serif')}
                >
                  Serif
                </button>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span>Accent Color</span>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="color" 
                  value={currentAccentColor}
                  onChange={(e) => onAccentColorChange(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <span className="text-sm">{currentAccentColor}</span>
                <button 
                  onClick={handleResetAccentColor}
                  className="btn btn-xs btn-ghost ml-auto"
                  title="Reset to default"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <h3 className="text-lg font-medium mb-2">Notifications</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Task Reminders</span>
              <label className="switch">
                <input type="checkbox" defaultChecked />
                <span className="slider round"></span>
              </label>
            </div>
            <div className="flex justify-between items-center">
              <span>Due Date Alerts</span>
              <label className="switch">
                <input type="checkbox" defaultChecked />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </div>

        {/* About */}
        <div>
          <h3 className="text-lg font-medium mb-2">About</h3>
          <p className="text-sm text-gray-300">
            TSK is a simple task management app built with React and TypeScript.
          </p>
          <p className="text-sm text-gray-300 mt-1">
            Version 1.0.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsSidebar; 