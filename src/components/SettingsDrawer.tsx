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
  const viewRef = React.useRef<HTMLDivElement>(null);
  
  // For Silk Sheet, content placement can be dynamic. We'll default to bottom.
  const largeViewport = useClientMediaQuery("(min-width: 800px)"); // Example, adjust as needed
  const contentPlacement: SheetViewProps["contentPlacement"] = largeViewport ? "center" : "bottom";
  const tracks: SheetViewProps["tracks"] = largeViewport ? ["top", "bottom"] : "bottom";
  
  const handleCloseSettings = () => {
    setIsOpen(false);
  };

  // Dismiss keyboard when sheet is moved (if applicable, good practice from SilkTaskDrawer)
  const travelHandler = React.useCallback<Exclude<SheetViewProps["onTravel"], undefined>>(({ progress }) => {
    if (!viewRef.current) return;

    if (progress < 0.999) {
      // Dismiss the on-screen keyboard
      viewRef.current.focus();
    }
    
    // Close the drawer when user swipes it away - handled by onPresentedChange
    // if (progress < 0.3) {
    //   setIsOpen(false);
    // }
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
          swipeOvershoot={false} // Recommended from SilkTaskDrawer
          nativeEdgeSwipePrevention={true} // Recommended
          onTravel={travelHandler} // Optional: for swipe-to-close
          style={{ 
            height: '90vh', // Increased height
            maxHeight: '90vh', // Increased maxHeight
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Sheet.Backdrop 
            themeColorDimming="auto" 
          />
          <Sheet.Content 
            style={{
              backgroundColor: isDarkMode ? '#1F1B2F' : '#FFFFFF', // Adjust based on theme
              borderTopLeftRadius: '1rem',
              borderTopRightRadius: '1rem',
              padding: '0px', // Reset padding as inner div will handle it
              display: 'flex',
              flex: '1',
              height: '90vh',
              maxHeight: '90vh',
              flexDirection: 'column',
              overflow: 'hidden' // Let inner container handle scrolling
            }}
            aria-labelledby={titleId}
          >
            <h2 id={titleId} className="sr-only">
              Settings
            </h2>
            
            <div className="mx-auto w-12 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full my-4 flex-shrink-0" />
            
            <div className={`w-full px-4 flex-grow min-h-0 overflow-y-auto pb-8 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
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
                isMobileDrawer={true}
              />
            </div>
          </Sheet.Content>
        </Sheet.View>
      </Sheet.Portal>
    </Sheet.Root>
  );
} 