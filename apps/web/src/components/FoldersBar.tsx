import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeChipRef = useRef<HTMLButtonElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  useLayoutEffect(() => {
    updateOverflow();
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => updateOverflow();
    el.addEventListener('scroll', onScroll, { passive: true });

    const resizeObserver = new ResizeObserver(() => updateOverflow());
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', onScroll);
      resizeObserver.disconnect();
    };
  }, [updateOverflow, folders, showAllFolder, showOtherFolder, showTodayFolder, showSharedFolder]);

  // Keep the active folder visible when selection or layout changes
  useEffect(() => {
    const chip = activeChipRef.current;
    const scroller = scrollRef.current;
    if (!chip || !scroller) return;

    const chipLeft = chip.offsetLeft;
    const chipRight = chipLeft + chip.offsetWidth;
    const viewLeft = scroller.scrollLeft;
    const viewRight = viewLeft + scroller.clientWidth;
    const pad = 28;

    if (chipLeft < viewLeft + pad) {
      scroller.scrollTo({ left: Math.max(0, chipLeft - pad), behavior: 'smooth' });
    } else if (chipRight > viewRight - pad) {
      scroller.scrollTo({ left: chipRight - scroller.clientWidth + pad, behavior: 'smooth' });
    }
  }, [activeFolder, folders]);

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(180, el.clientWidth * 0.55), behavior: 'smooth' });
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
        ref={isActive ? activeChipRef : undefined}
        type="button"
        onClick={() => onFolderSelect(folderId)}
        className={`pressable shrink-0 px-3 py-1.5 rounded-full text-[15px] tracking-wide transition-[color,background-color,box-shadow] duration-150 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-inset ${
          isActive
            ? isDarkMode
              ? 'text-white bg-white/12 focus-visible:ring-white/35'
              : 'text-gray-900 bg-white/80 shadow-sm focus-visible:ring-black/25'
            : isDarkMode
              ? 'text-white/45 hover:text-white/75 hover:bg-white/5 focus-visible:ring-white/25'
              : 'text-black/65 hover:text-black/90 hover:bg-white/50 focus-visible:ring-black/20'
        }`}
        style={{ fontWeight: isActive ? 600 : 500 }}
      >
        {label}
      </button>
    );
  };

  const maskImage = (() => {
    if (canScrollLeft && canScrollRight) {
      return 'linear-gradient(to right, transparent, black 1.75rem, black calc(100% - 1.75rem), transparent)';
    }
    if (canScrollLeft) {
      return 'linear-gradient(to right, transparent, black 1.75rem, black 100%)';
    }
    if (canScrollRight) {
      return 'linear-gradient(to right, black 0%, black calc(100% - 1.75rem), transparent)';
    }
    return undefined;
  })();

  const chevronClass = `pressable absolute top-1/2 z-10 -translate-y-1/2 p-1.5 rounded-full transition-[opacity,background-color,color] duration-150 ${
    isDarkMode
      ? 'text-white/80 hover:text-white hover:bg-white/10'
      : 'text-black/70 hover:text-black hover:bg-white/60'
  }`;

  return (
    <div
      className="z-30 shrink-0"
      style={{
        paddingTop: 'max(0.25rem, env(safe-area-inset-top, 0px))',
      }}
    >
      <div className="mx-auto max-w-2xl relative">
        {canScrollLeft ? (
          <button
            type="button"
            aria-label="Scroll folders left"
            onClick={() => scrollByDir(-1)}
            className={`${chevronClass} left-1`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        ) : null}

        {canScrollRight ? (
          <button
            type="button"
            aria-label="Scroll folders right"
            onClick={() => scrollByDir(1)}
            className={`${chevronClass} right-1`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        ) : null}

        <div
          ref={scrollRef}
          className="flex items-center gap-2 px-5 md:px-4 py-3 overflow-x-auto"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitMaskImage: maskImage,
            maskImage,
          }}
        >
          {showOtherFolder ? renderChip('other', 'Tasks') : null}

          {folders?.map((folder) =>
            renderChip(
              folder.id,
              folder.name.charAt(0).toUpperCase() + folder.name.slice(1).toLowerCase(),
            ),
          )}

          {showTodayFolder ? renderChip('today', 'Today') : null}

          {showSharedFolder ? renderChip('shared', 'Shared') : null}

          {showAllFolder ? renderChip('all', 'All') : null}
        </div>
      </div>
    </div>
  );
};

export default FoldersBar;
