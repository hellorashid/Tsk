import React, { useState } from 'react';
import { useBasic } from "@basictech/react";

interface SettingsSidebarProps {
  onClose: () => void;
  onViewModeChange?: (mode: 'compact' | 'mid' | 'cozy') => void;
  currentViewMode?: 'compact' | 'mid' | 'cozy';
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  onClose,
  onViewModeChange,
  currentViewMode = 'cozy',
}) => {
  const { dbStatus } = useBasic();
  const [viewMode, setViewMode] = useState(currentViewMode);

  const handleViewModeChange = (mode: 'compact' | 'mid' | 'cozy') => {
    setViewMode(mode);
    if (onViewModeChange) {
      onViewModeChange(mode);
    }
  };

  return (
    <div className="w-80 h-full text-white p-6 overflow-y-auto bg-[#1F1B2F]/80 backdrop-blur-sm flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Settings</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-[#2A2535]/50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Database Status</h3>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              dbStatus === "ONLINE" ? "bg-green-500" : 
              dbStatus === "OFFLINE" ? "bg-gray-400" : 
              "bg-yellow-500"
            }`}></div>
            <span className="text-gray-300">
              {dbStatus === "ONLINE" ? "Connected" : 
               dbStatus === "OFFLINE" ? "Offline" : 
               "Connecting..."}
            </span>
          </div>
        </div>

        <div className="bg-[#2A2535]/50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Appearance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Dark Mode</span>
              <label className="swap">
                <input type="checkbox" defaultChecked />
                <div className="swap-on">ON</div>
                <div className="swap-off">OFF</div>
              </label>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">View Mode</span>
                <span className="text-xs text-gray-400">{viewMode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Compact</span>
                <div className="flex-1 mx-2">
                  <input 
                    type="range" 
                    min="0" 
                    max="2" 
                    step="1" 
                    value={viewMode === 'compact' ? 0 : viewMode === 'mid' ? 1 : 2}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      const mode = value === 0 ? 'compact' : value === 1 ? 'mid' : 'cozy';
                      handleViewModeChange(mode);
                    }}
                    className="range range-xs range-primary"
                  />
                </div>
                <span className="text-xs text-gray-400">Cozy</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#2A2535]/50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Notifications</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Task Reminders</span>
              <label className="swap">
                <input type="checkbox" defaultChecked />
                <div className="swap-on">ON</div>
                <div className="swap-off">OFF</div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Due Date Alerts</span>
              <label className="swap">
                <input type="checkbox" defaultChecked />
                <div className="swap-on">ON</div>
                <div className="swap-off">OFF</div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-[#2A2535]/50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">About</h3>
          <p className="text-gray-300 text-sm">
            tsk is a simple task management app designed to help you stay organized without getting in the way.
          </p>
          <p className="text-gray-300 text-sm mt-2">
            Version 1.0.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsSidebar; 