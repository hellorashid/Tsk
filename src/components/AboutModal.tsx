'use client';

import React from 'react';
import { Sheet, useClientMediaQuery, type SheetViewProps } from "@silk-hq/components";
import { useModalHistory } from '../hooks/useModalHistory';
import AboutContent from './AboutContent';

interface AboutModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isDarkMode: boolean;
  currentAccentColor: string;
}

export default function AboutModal({ 
  isOpen, 
  setIsOpen,
  isDarkMode,
  currentAccentColor
}: AboutModalProps) {
  const titleId = React.useId();
  const viewRef = React.useRef<HTMLDivElement>(null);
  
  // For Silk Sheet, content placement can be dynamic. We'll default to bottom.
  const largeViewport = useClientMediaQuery("(min-width: 800px)"); // Example, adjust as needed
  const contentPlacement: SheetViewProps["contentPlacement"] = largeViewport ? "center" : "bottom";
  const tracks: SheetViewProps["tracks"] = largeViewport ? ["top", "bottom"] : "bottom";
  
  // Handle browser back button for closing modal
  useModalHistory(isOpen, () => setIsOpen(false), 'about-modal');
  
  const handleCloseAbout = () => {
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
            height: typeof CSS !== 'undefined' && CSS.supports('height', '100dvh') ? '100dvh' : 'calc(var(--vh, 1vh) * 100)',
            maxHeight: typeof CSS !== 'undefined' && CSS.supports('height', '100dvh') ? '100dvh' : 'calc(var(--vh, 1vh) * 100)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: largeViewport ? 'center' : 'stretch',
            justifyContent: largeViewport ? 'center' : 'flex-end',
            padding: largeViewport ? '2rem' : '0',
          }}
        >
          <Sheet.Backdrop 
            themeColorDimming="auto" 
          />
          <Sheet.Content 
            style={{
              backgroundColor: isDarkMode ? '#1F1B2F' : '#FFFFFF', // Adjust based on theme
              borderRadius: largeViewport ? '1rem' : '1rem 1rem 0 0',
              padding: '0px', // Reset padding as inner div will handle it
              display: 'flex',
              flex: largeViewport ? '0 1 auto' : '1',
              // Modern: use dvh (dynamic viewport height) with fallback
              height: typeof CSS !== 'undefined' && CSS.supports('height', '100dvh')
                ? (largeViewport ? 'auto' : '70dvh')
                : (largeViewport ? 'auto' : 'calc(var(--vh, 1vh) * 70)'),
              maxHeight: typeof CSS !== 'undefined' && CSS.supports('height', '100dvh')
                ? (largeViewport ? 'calc(100dvh - 4rem)' : '70dvh')
                : (largeViewport ? 'calc(var(--vh, 1vh) * 100 - 4rem)' : 'calc(var(--vh, 1vh) * 70)'),
              flexDirection: 'column',
              overflow: 'hidden', // Let inner container handle scrolling
              width: largeViewport ? '90%' : '100%',
              maxWidth: largeViewport ? '600px' : '100%',
            }}
            aria-labelledby={titleId}
          >
            <h2 id={titleId} className="sr-only">
              About tsk
            </h2>
            
            <div className="mx-auto w-12 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full my-4 flex-shrink-0" />
            
            <div className={`w-full px-4 flex-grow min-h-0 overflow-y-auto pb-8 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              <AboutContent 
                onClose={handleCloseAbout}
                isDarkMode={isDarkMode}
                currentAccentColor={currentAccentColor}
                isMobileDrawer={true}
              />
            </div>
          </Sheet.Content>
        </Sheet.View>
      </Sheet.Portal>
    </Sheet.Root>
  );
}

