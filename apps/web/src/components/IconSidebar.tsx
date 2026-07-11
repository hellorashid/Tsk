import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import UserAvatarButton from './UserAvatarButton';

interface IconSidebarProps {
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  currentView: 'home' | 'settings';
}

const IconSidebar: React.FC<IconSidebarProps> = ({
  onOpenSettings,
  onOpenAbout,
  currentView,
}) => {
  const { theme } = useTheme();
  const { isDarkMode, accentColor } = theme;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="hidden md:flex flex-col h-full w-14 flex-shrink-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top - Logo with backdrop on hover */}
      <div className="flex-shrink-0 p-2 flex items-center justify-center">
        <div 
          className={`rounded-xl transition-all duration-200 ${
            isHovered ? 'backdrop-blur-sm' : ''
          }`}
          style={{ 
            backgroundColor: isHovered ? `${accentColor}80` : 'transparent'
          }}
        >
          <button
            onClick={onOpenAbout}
            className={`p-2 rounded-xl transition-colors duration-200 ${
              isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'
            }`}
            aria-label="About tsk"
            title="About tsk"
          >
            <img className="w-6 h-6" src="/tsk-logo.png" alt="tsk logo" />
          </button>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom - Settings and User with backdrop on hover */}
      <div className="flex-shrink-0 p-2 pb-4 flex flex-col items-center">
        <div 
          className={`rounded-xl p-1.5 space-y-1 transition-all duration-200 ${
            isHovered ? 'backdrop-blur-sm' : ''
          }`}
          style={{ 
            backgroundColor: isHovered ? `${accentColor}80` : 'transparent'
          }}
        >
          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              currentView === 'settings'
                ? (isDarkMode ? 'bg-white/20' : 'bg-black/20')
                : 'opacity-70 hover:opacity-100'
            } ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'} ${
              isDarkMode ? 'text-gray-200' : 'text-gray-700'
            }`}
            aria-label="Settings"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>

          {/* User Avatar */}
          <UserAvatarButton />
        </div>
      </div>
    </div>
  );
};

export default IconSidebar;
