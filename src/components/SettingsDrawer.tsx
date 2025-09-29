'use client';

import React from 'react';
import { Sheet, useClientMediaQuery, type SheetViewProps } from "@silk-hq/components";
import SettingsSidebar from './SettingsSidebar';

// Error boundary for Safari compatibility
class SettingsDrawerErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SettingsDrawer Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

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

function SettingsDrawerContent({ 
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
  
  // Safari-compatible media query check with fallback
  const [largeViewport, setLargeViewport] = React.useState(false);
  const [mediaQuerySupported, setMediaQuerySupported] = React.useState(true);
  const [isStable, setIsStable] = React.useState(false);
  
  React.useEffect(() => {
    try {
      // Try using the Silk hook first
      const checkViewport = () => {
        try {
          return window.innerWidth >= 800;
        } catch (e) {
          return false;
        }
      };
      
      setLargeViewport(checkViewport());
      
      const handleResize = () => {
        setLargeViewport(checkViewport());
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    } catch (error) {
      console.warn('Media query not supported, falling back to mobile view:', error);
      setMediaQuerySupported(false);
      setLargeViewport(false);
    }
  }, []);
  
  // Use Silk's useClientMediaQuery only if supported, otherwise use our fallback
  let silkLargeViewport = false;
  try {
    silkLargeViewport = useClientMediaQuery("(min-width: 800px)");
  } catch (error) {
    console.warn('Silk useClientMediaQuery failed, using fallback:', error);
  }
  
  const effectiveLargeViewport = mediaQuerySupported ? (silkLargeViewport || largeViewport) : largeViewport;
  const contentPlacement: SheetViewProps["contentPlacement"] = effectiveLargeViewport ? "center" : "bottom";
  const tracks: SheetViewProps["tracks"] = effectiveLargeViewport ? ["top", "bottom"] : "bottom";
  
  const handleCloseSettings = () => {
    setIsOpen(false);
  };

  // Enhanced travel handler to prevent accidental closing
  const travelHandler = React.useCallback<Exclude<SheetViewProps["onTravel"], undefined>>(({ progress }) => {
    if (!viewRef.current) return;

    // Only dismiss keyboard when sheet is being moved significantly
    if (progress < 0.95) {
      try {
        // Dismiss the on-screen keyboard safely
        viewRef.current.focus();
      } catch (error) {
        console.warn('Failed to focus viewRef:', error);
      }
    }
    
    // Prevent accidental closing - only close when swiped down significantly
    // This is now handled by onPresentedChange with better logic
  }, []);

  // Track when drawer is stable to prevent premature closing
  React.useEffect(() => {
    if (isOpen) {
      // Mark as stable after a short delay when opened
      const timer = setTimeout(() => {
        setIsStable(true);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setIsStable(false);
    }
  }, [isOpen]);

  // Enhanced presented change handler to prevent flickering
  const handlePresentedChange = React.useCallback((presented: boolean) => {
    if (!presented) {
      // Only allow closing if the drawer was stable (open for at least 200ms)
      if (isStable) {
        setTimeout(() => {
          setIsOpen(presented);
        }, 50);
      }
    } else {
      setIsOpen(presented);
    }
  }, [setIsOpen, isStable]);
  
  // Safari-compatible Sheet rendering with error handling
  try {
    return (
      <Sheet.Root 
        license="non-commercial"
        presented={isOpen}
        onPresentedChange={handlePresentedChange}
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
              height: '90vh', // Increased height
              maxHeight: '90vh', // Increased maxHeight
              display: 'flex',
              flexDirection: 'column',
              // Safari-specific fixes
              WebkitTransform: 'translate3d(0,0,0)',
              transform: 'translate3d(0,0,0)',
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
                overflow: 'hidden', // Let inner container handle scrolling
                // Safari-specific fixes
                WebkitTransform: 'translate3d(0,0,0)',
                transform: 'translate3d(0,0,0)',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
              }}
              aria-labelledby={titleId}
            >
              <h2 id={titleId} className="sr-only">
                Settings
              </h2>
              
              <div className="mx-auto w-12 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full my-4 flex-shrink-0" />
              
              <div 
                className={`w-full px-4 flex-grow min-h-0 overflow-y-auto pb-8 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
              >
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
  } catch (error) {
    console.error('Sheet component failed to render:', error);
    // Fallback to a simple modal for Safari
    return (
      <div 
        className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}
        onClick={() => setIsOpen(false)}
      >
        <div className="fixed inset-0 bg-black bg-opacity-50" />
        <div 
          className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-lg p-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: isDarkMode ? '#1F1B2F' : '#FFFFFF',
          }}
        >
          <div className="mx-auto w-12 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full my-4" />
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
      </div>
    );
  }
}

export default function SettingsDrawer(props: SettingsDrawerProps) {
  // Fallback component for when Sheet fails
  const FallbackModal = () => (
    <div 
      className={`fixed inset-0 z-50 ${props.isOpen ? 'block' : 'hidden'}`}
      onClick={() => props.setIsOpen(false)}
    >
      <div className="fixed inset-0 bg-black bg-opacity-50" />
      <div 
        className="fixed bottom-0 left-0 right-0 rounded-t-lg p-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: props.isDarkMode ? '#1F1B2F' : '#FFFFFF',
        }}
      >
        <div className="mx-auto w-12 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full my-4" />
        <SettingsSidebar 
          onClose={() => props.setIsOpen(false)} 
          onViewModeChange={props.onViewModeChange}
          currentViewMode={props.currentViewMode}
          onAccentColorChange={props.onAccentColorChange}
          currentAccentColor={props.currentAccentColor}
          onThemeChange={props.onThemeChange}
          isDarkMode={props.isDarkMode}
          onFontStyleChange={props.onFontStyleChange}
          currentFontStyle={props.currentFontStyle}
          isMobileDrawer={true}
        />
      </div>
    </div>
  );

  return (
    <SettingsDrawerErrorBoundary fallback={<FallbackModal />}>
      <SettingsDrawerContent {...props} />
    </SettingsDrawerErrorBoundary>
  );
} 