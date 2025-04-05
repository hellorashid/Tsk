'use client';

import React from 'react';
import { Drawer } from 'vaul';
import SettingsSidebar from './SettingsSidebar';

interface SettingsDrawerProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onViewModeChange: (mode: 'compact' | 'cozy' | 'chonky') => void;
  currentViewMode: 'compact' | 'cozy' | 'chonky';
  onAccentColorChange: (color: string) => void;
  currentAccentColor: string;
}

export default function SettingsDrawer({ 
  isOpen, 
  setIsOpen, 
  onViewModeChange,
  currentViewMode,
  onAccentColorChange,
  currentAccentColor
}: SettingsDrawerProps) {
  const titleId = React.useId();
  
  const handleCloseSettings = () => {
    setIsOpen(false);
  };
  
  return (
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content 
          className="text-white h-[80vh] max-h-[85vh] w-full fixed bottom-0 left-0 right-0 outline-none rounded-t-xl overflow-auto"
          style={{ backgroundColor: currentAccentColor }}
          aria-labelledby={titleId}
        >
          {/* Title for accessibility */}
          <h2 id={titleId} className="sr-only">
            Settings
          </h2>
          
          <div className="mx-auto w-12 h-1.5 bg-gray-300 rounded-full my-4" />
          
          <div className="w-full px-4">
            <SettingsSidebar 
              onClose={handleCloseSettings} 
              onViewModeChange={onViewModeChange}
              currentViewMode={currentViewMode}
              onAccentColorChange={onAccentColorChange}
              currentAccentColor={currentAccentColor}
            />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
} 