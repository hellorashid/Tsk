'use client';

import React from 'react';
import { AppDrawer, useMediaQuery } from './AppDrawer';
import { useModalHistory } from '../hooks/useModalHistory';
import AboutContent from './AboutContent';
import { DEFAULT_ACCENT } from '../contexts/ThemeContext';

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
  const largeViewport = useMediaQuery('(min-width: 800px)');
  const supportsDvh = typeof CSS !== 'undefined' && CSS.supports('height', '100dvh');

  useModalHistory(isOpen, () => setIsOpen(false), 'about-modal');

  return (
    <AppDrawer
      open={isOpen}
      onOpenChange={setIsOpen}
      title="About tsk"
      placement={largeViewport ? 'center' : 'bottom'}
      popupStyle={{
        backgroundColor: isDarkMode ? currentAccentColor || DEFAULT_ACCENT : '#FFFFFF',
        height: largeViewport ? 'auto' : supportsDvh ? '70dvh' : 'calc(var(--vh, 1vh) * 70)',
        maxHeight: largeViewport
          ? (supportsDvh ? 'calc(100dvh - 4rem)' : 'calc(var(--vh, 1vh) * 100 - 4rem)')
          : (supportsDvh ? '70dvh' : 'calc(var(--vh, 1vh) * 70)'),
        width: largeViewport ? 'min(600px, 90vw)' : '100%',
      }}
    >
      <div className={`mx-auto w-12 h-1.5 rounded-full my-4 shrink-0 ${isDarkMode ? 'bg-gray-400' : 'bg-gray-300'}`} />

      <div className={`w-full px-4 flex-grow min-h-0 overflow-y-auto pb-8 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
        <AboutContent
          onClose={() => setIsOpen(false)}
          isDarkMode={isDarkMode}
          currentAccentColor={currentAccentColor}
          isMobileDrawer={true}
        />
      </div>
    </AppDrawer>
  );
}
