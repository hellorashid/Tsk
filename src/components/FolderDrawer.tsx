'use client';

import React from 'react';
import { Sheet, useClientMediaQuery, type SheetViewProps } from "@silk-hq/components";
import { useModalHistory } from '../hooks/useModalHistory';
import { Folder } from '../utils/types';

interface FolderDrawerProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  folders: Folder[];
  activeFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onOpenSettings: () => void;
  isDarkMode: boolean;
  accentColor: string;
}

export default function FolderDrawer({ 
  isOpen, 
  setIsOpen, 
  folders,
  activeFolder,
  onFolderSelect,
  onOpenSettings,
  isDarkMode,
  accentColor
}: FolderDrawerProps) {
  const titleId = React.useId();
  const viewRef = React.useRef<HTMLDivElement>(null);
  
  const largeViewport = useClientMediaQuery("(min-width: 800px)");
  const contentPlacement: SheetViewProps["contentPlacement"] = "bottom";
  const tracks: SheetViewProps["tracks"] = "bottom";
  
  // Handle browser back button for closing drawer
  useModalHistory(isOpen, () => setIsOpen(false), 'folder-drawer');
  
  const handleFolderClick = (folderId: string | null) => {
    onFolderSelect(folderId);
    setIsOpen(false);
  };

  const handleOpenSettings = () => {
    setIsOpen(false);
    // Small delay to ensure drawer closes before opening settings
    setTimeout(() => {
      onOpenSettings();
    }, 100);
  };

  // Dismiss keyboard when sheet is moved
  const travelHandler = React.useCallback<Exclude<SheetViewProps["onTravel"], undefined>>(({ progress }) => {
    if (!viewRef.current) return;

    if (progress < 0.999) {
      // Dismiss the on-screen keyboard
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
            alignItems: 'stretch',
            justifyContent: 'flex-end',
            padding: '0',
          }}
        >
          <Sheet.Backdrop 
            themeColorDimming="auto" 
          />
          <Sheet.Content 
            style={{
              backgroundColor: isDarkMode ? '#1F1B2F' : '#FFFFFF',
              borderRadius: '1rem 1rem 0 0',
              padding: '0px',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '60vh',
              overflow: 'hidden',
            }}
            aria-labelledby={titleId}
          >
            <h2 id={titleId} className="sr-only">
              Folders
            </h2>
            
            <div className="mx-auto w-12 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full my-4 flex-shrink-0" />
            
            <div className={`w-full px-4 pb-8 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              <h3 className="text-lg font-semibold mb-4">Folders</h3>
              
              <div className="space-y-2">
                {/* All option */}
                <button
                  onClick={() => handleFolderClick(null)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                    activeFolder === null
                      ? isDarkMode
                        ? 'bg-white/20'
                        : 'bg-gray-200'
                      : isDarkMode
                        ? 'bg-white/5 hover:bg-white/10'
                        : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M4 6h16M4 12h16M4 18h16" 
                      />
                    </svg>
                    <span className="font-medium">All Tasks</span>
                  </div>
                </button>

                {/* Folder options */}
                {folders?.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => handleFolderClick(folder.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                      activeFolder === folder.id
                        ? isDarkMode
                          ? 'bg-white/20'
                          : 'bg-gray-200'
                        : isDarkMode
                          ? 'bg-white/5 hover:bg-white/10'
                          : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" 
                        />
                      </svg>
                      <span className="font-medium">{folder.name.charAt(0).toUpperCase() + folder.name.slice(1).toLowerCase()}</span>
                    </div>
                  </button>
                ))}

                {/* Folder Settings button */}
                <button
                  onClick={handleOpenSettings}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                    isDarkMode
                      ? 'bg-white/5 hover:bg-white/10 border border-white/20'
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5" 
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
                    <span className="font-medium">Folder Settings</span>
                  </div>
                </button>
              </div>
            </div>
          </Sheet.Content>
        </Sheet.View>
      </Sheet.Portal>
    </Sheet.Root>
  );
}

