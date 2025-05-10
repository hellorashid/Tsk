'use client';

import React from 'react';
import { Sheet, useClientMediaQuery, type SheetViewProps } from "@silk-hq/components";
import SettingsSidebar from './SettingsSidebar';

interface SettingsDrawerProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onViewModeChange: (mode: 'compact' | 'cozy' | 'chonky') => void;
  currentViewMode: 'compact' | 'cozy' | 'chonky';
  onAccentColorChange: (color: string) => void;
  currentAccentColor: string;
  onThemeChange: (isDark: boolean) => void;
  isDarkMode: boolean;
  onFontStyleChange: (style: 'mono' | 'sans' | 'serif') => void;
  currentFontStyle: 'mono' | 'sans' | 'serif';
}

export default function SettingsDrawer({ 
  isOpen, 
  setIsOpen, 
  onViewModeChange,
  currentViewMode,
  onAccentColorChange,
  currentAccentColor,
  onThemeChange,
  isDarkMode,
  onFontStyleChange,
  currentFontStyle
}: SettingsDrawerProps) {
  const titleId = React.useId();
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const viewRef = React.useRef<HTMLDivElement>(null);
  const wasOpenRef = React.useRef<boolean>(false);
  
  // For Silk Sheet, content placement can be dynamic. We'll default to bottom.
  const largeViewport = useClientMediaQuery("(min-width: 800px)"); // Example, adjust as needed
  const contentPlacement: SheetViewProps["contentPlacement"] = largeViewport ? "center" : "bottom";
  const tracks: SheetViewProps["tracks"] = largeViewport ? ["top", "bottom"] : "bottom";

  React.useEffect(() => {
    if (isOpen && !wasOpenRef.current && triggerRef.current) {
      triggerRef.current.click();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);
  
  const handleCloseSettings = () => {
    setIsOpen(false);
  };

  const handleSheetChange = () => {
    setIsOpen(false);
  };

  // Dismiss keyboard when sheet is moved (if applicable, good practice from SilkTaskDrawer)
  const travelHandler = React.useCallback<Exclude<SheetViewProps["onTravel"], undefined>>(({ progress }) => {
    if (!viewRef.current) return;

    if (progress < 0.999) {
      // Example:
      // const activeElement = document.activeElement as HTMLElement;
      // if (activeElement && typeof activeElement.blur === 'function') {
      //   activeElement.blur();
      // }
    }
    
    // Close the drawer when user swipes it away (less than 30%)
    if (progress < 0.3) {
      setIsOpen(false);
    }
  }, [setIsOpen]);
  
  return (
    <Sheet.Root license="commercial">
      <Sheet.Trigger asChild>
        <button 
          ref={triggerRef} 
          className="hidden" 
          aria-hidden="true"
        >
          Open Settings
        </button>
      </Sheet.Trigger>
      
      <Sheet.Portal>
        <Sheet.View
          ref={viewRef}
          onChange={handleSheetChange}
          contentPlacement={contentPlacement}
          tracks={tracks}
          swipeOvershoot={false} // Recommended from SilkTaskDrawer
          nativeEdgeSwipePrevention={true} // Recommended
          onTravel={travelHandler} // Optional: for swipe-to-close
          style={{ 
            height: '90vh', // Increased height
            maxHeight: '95vh', // Increased maxHeight
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* <Sheet.Backdrop 
            themeColorDimming="auto" 
          /> */}
          <Sheet.Content 
            style={{
              backgroundColor: isDarkMode ? '#1F1B2F' : '#FFFFFF', // Adjust based on theme
              color: isDarkMode ? 'text-gray-100' : 'text-gray-900',
              borderTopLeftRadius: '1rem',
              borderTopRightRadius: '1rem',
              padding: '0px', // Reset padding as inner div will handle it
              display: 'flex',
              flex: '1',
              height: '100%',
              flexDirection: 'column',
              overflow: 'auto' // Ensure content scrolls
            }}
            aria-labelledby={titleId}
          >
            <h2 id={titleId} className="sr-only">
              Settings
            </h2>
            
            <div className="mx-auto w-12 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full my-4 flex-shrink-0" />
            
            <div className="w-full px-4 flex-grow">
              <SettingsSidebar 
                onClose={handleCloseSettings} 
                onViewModeChange={onViewModeChange}
                currentViewMode={currentViewMode}
                onAccentColorChange={onAccentColorChange}
                currentAccentColor={currentAccentColor}
                onThemeChange={onThemeChange}
                isDarkMode={isDarkMode}
                onFontStyleChange={onFontStyleChange}
                currentFontStyle={currentFontStyle}
              />
            </div>
          </Sheet.Content>
        </Sheet.View>
      </Sheet.Portal>
    </Sheet.Root>
  );
} 