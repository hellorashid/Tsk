import React, { useRef } from 'react';
import { Folder } from '../utils/types';

interface FoldersBarProps {
  folders: Folder[];
  activeFolder: string | null; // 'other' = "Tasks", 'all' = "All", 'today' = "Today"
  onFolderSelect: (folderId: string | null) => void;
  showAllFolder?: boolean;
  showOtherFolder?: boolean;
  showTodayFolder?: boolean;
  isDarkMode?: boolean;
}

const FoldersBar: React.FC<FoldersBarProps> = ({
  folders,
  activeFolder,
  onFolderSelect,
  showAllFolder = false,
  showOtherFolder = true,
  showTodayFolder = true,
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
        className={`flex-shrink-0 px-3 py-1.5 rounded-md transition-all duration-100 font-medium whitespace-nowrap text-base ${
          isActive ? 'backdrop-blur-md' : ''
        }`}
        style={{
          color: isActive ? getActiveColor() : getInactiveColor(),
          backgroundColor: isActive
            ? isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            : 'transparent',
          transform: isActive ? 'scale(1.125)' : 'scale(1)',
          transformOrigin: 'left center',
        }}
      >
        {label}
      </button>
    );
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
        {showOtherFolder ? renderChip('other', 'Tasks') : null}

        {folders?.map((folder) => (
          renderChip(
            folder.id,
            folder.name.charAt(0).toUpperCase() + folder.name.slice(1).toLowerCase(),
          )
        ))}

        {showTodayFolder ? renderChip('today', 'Today') : null}

        {showAllFolder ? renderChip('all', 'All') : null}
        </div>
      </div>
    </div>
  );
};

export default FoldersBar;
