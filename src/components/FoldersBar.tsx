import React, { useRef, useEffect } from 'react';
import { Folder } from '../utils/types';

interface FoldersBarProps {
  folders: Folder[];
  activeFolder: string | null; // null = "All"
  onFolderSelect: (folderId: string | null) => void;
  accentColor?: string;
  isDarkMode?: boolean;
  onOpenSettings?: () => void;
}

const FoldersBar: React.FC<FoldersBarProps> = ({
  folders,
  activeFolder,
  onFolderSelect,
  accentColor = '#1F1B2F',
  isDarkMode = true,
  onOpenSettings
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getActiveColor = () => {
    return isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';
  };

  const getInactiveColor = () => {
    return isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
  };

  return (
    <div 
      className="z-30 flex-shrink-0 group"
    >
      <div className="mx-auto max-w-2xl">
        <div 
          ref={scrollContainerRef}
          className="flex items-center gap-1 px-4 py-3 overflow-x-auto scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
        {/* "All" option */}
        <button
          onClick={() => onFolderSelect(null)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-md transition-all duration-100 font-medium whitespace-nowrap text-base ${
            activeFolder === null ? 'backdrop-blur-md' : ''
          }`}
          style={{
            color: activeFolder === null ? getActiveColor() : getInactiveColor(),
            backgroundColor: activeFolder === null 
              ? isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
              : 'transparent',
            transform: activeFolder === null ? 'scale(1.125)' : 'scale(1)',
            transformOrigin: 'left center',
          }}
        >
          All
        </button>

        {/* Folder options */}
        {folders?.map((folder) => (
          <button
            key={folder.id}
            onClick={() => onFolderSelect(folder.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-md transition-all duration-100 font-medium whitespace-nowrap text-base ${
              activeFolder === folder.id ? 'backdrop-blur-md' : ''
            }`}
            style={{
              color: activeFolder === folder.id ? getActiveColor() : getInactiveColor(),
              backgroundColor: activeFolder === folder.id
                ? isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                : 'transparent',
              transform: activeFolder === folder.id ? 'scale(1.125)' : 'scale(1)',
              transformOrigin: 'left center',
            }}
          >
            {folder.name.charAt(0).toUpperCase() + folder.name.slice(1).toLowerCase()}
          </button>
        ))}

        {/* Settings button - shown on hover on desktop */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="hidden md:block flex-shrink-0 px-2 py-1.5 rounded-md transition-all duration-200 text-sm font-medium whitespace-nowrap opacity-0 hover:opacity-100 group-hover:opacity-60 ml-2"
            style={{
              color: getInactiveColor(),
            }}
            aria-label="Folder settings"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
              />
            </svg>
          </button>
        )}
        </div>
      </div>
    </div>
  );
};

export default FoldersBar;

