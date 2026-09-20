import React, { useRef } from 'react';
import { Folder } from '../utils/types';

interface FoldersBarProps {
  folders: Folder[];
  activeFolder: string | null; // 'other' = "Tasks", 'all' = "All", 'today' = "Today"
  onFolderSelect: (folderId: string | null) => void;
  showAllFolder?: boolean;
  showOtherFolder?: boolean;
  showTodayFolder?: boolean;
  showSharedFolder?: boolean;
  isDarkMode?: boolean;
}

const FoldersBar: React.FC<FoldersBarProps> = ({
  folders,
  activeFolder,
  onFolderSelect,
  showAllFolder = false,
  showOtherFolder = true,
  showTodayFolder = true,
  showSharedFolder = true,
  isDarkMode = true,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getActiveColor = () => {
    return isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';
  };

  const getInactiveColor = () => {
    return isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
  };

  const isChipActive = (folderId: string) => {
    if (folderId === 'all') {
      return activeFolder === null || activeFolder === 'all';
    }
    return activeFolder === folderId;
  };

  const renderChip = (folderId: string, label: string) => {
    const isActive = isChipActive(folderId);

    return (
      <button
        key={folderId}
        onClick={() => onFolderSelect(folderId)}
        className={`pressable shrink-0 px-3 py-1.5 rounded-md transition-colors duration-100 font-medium whitespace-nowrap text-base ${
          isActive ? 'backdrop-blur-md' : ''
        }`}
        style={{
          color: isActive ? getActiveColor() : getInactiveColor(),
          backgroundColor: isActive
            ? isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            : 'transparent',
          transform: isActive ? 'scale(1.125)' : undefined,
          transformOrigin: 'left center',
          transition: 'transform 160ms var(--ease-out), background-color 100ms ease, color 100ms ease',
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div 
      className="z-30 shrink-0 group"
      style={{
        paddingTop: 'max(0.25rem, env(safe-area-inset-top, 0px))',
      }}
    >
      <div className="mx-auto max-w-2xl">
        <div 
          ref={scrollContainerRef}
          className="flex items-center gap-1.5 px-5 md:px-4 py-3 overflow-x-auto scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
        {showOtherFolder ? renderChip('other', 'Tasks') : null}

        {folders?.map((folder) => (
          renderChip(
            folder.id,
            folder.name.charAt(0).toUpperCase() + folder.name.slice(1).toLowerCase(),
          )
        ))}

        {showTodayFolder ? renderChip('today', 'Today') : null}

        {showSharedFolder ? renderChip('shared', 'Shared') : null}

        {showAllFolder ? renderChip('all', 'All') : null}
        </div>
      </div>
    </div>
  );
};

export default FoldersBar;
