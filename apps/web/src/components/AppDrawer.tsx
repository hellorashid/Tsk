import React from 'react';
import { Drawer } from '@base-ui/react/drawer';
import './AppDrawer.css';

export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  React.useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

type AppDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  placement?: 'bottom' | 'center';
  /** Nested drawers omit their own backdrop; the parent drawer dims instead. */
  nested?: boolean;
  popupClassName?: string;
  popupStyle?: React.CSSProperties;
  contentClassName?: string;
};

export function AppDrawer({
  open,
  onOpenChange,
  title,
  children,
  placement = 'bottom',
  nested = false,
  popupClassName,
  popupStyle,
  contentClassName,
}: AppDrawerProps) {
  const centered = placement === 'center';

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} swipeDirection="down">
      <Drawer.VirtualKeyboardProvider>
        <Drawer.Portal>
          {nested ? null : <Drawer.Backdrop className="app-drawer-backdrop" />}
          <Drawer.Viewport className={`app-drawer-viewport${centered ? ' is-centered' : ''}`}>
            <Drawer.Popup
              className={`app-drawer-popup${centered ? ' is-centered' : ''}${popupClassName ? ` ${popupClassName}` : ''}`}
              style={popupStyle}
            >
              <Drawer.Title className="sr-only">{title}</Drawer.Title>
              <Drawer.Content className={`app-drawer-content${contentClassName ? ` ${contentClassName}` : ''}`}>
                {children}
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.VirtualKeyboardProvider>
    </Drawer.Root>
  );
}
