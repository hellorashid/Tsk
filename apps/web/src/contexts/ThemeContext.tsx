import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useSyncExternalStore,
  ReactNode,
} from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface Theme {
  accentColor: string;
  fontStyle: 'mono' | 'sans' | 'serif';
  themeMode: ThemeMode;
  /** Resolved from themeMode + system preference. Not persisted. */
  isDarkMode: boolean;
  location: {
    latitude: number;
    longitude: number;
    name: string;
  };
}

interface StoredTheme {
  accentColor: string;
  fontStyle: Theme['fontStyle'];
  themeMode: ThemeMode;
  location: Theme['location'];
}

interface ThemeContextType {
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<StoredTheme>>;
  setAccentColor: (color: string) => void;
  setFontStyle: (style: Theme['fontStyle']) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setIsDarkMode: (isDark: boolean) => void;
  setLocation: (latitude: number, longitude: number, name: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const LIGHT_SURFACE = '#F2F3F5';
export const DEFAULT_ACCENT = '#1F1B2F';

const initialStoredTheme: StoredTheme = {
  accentColor: DEFAULT_ACCENT,
  fontStyle: 'sans',
  themeMode: 'system',
  location: {
    latitude: 37.7749,
    longitude: -122.4194,
    name: 'San Francisco',
  },
};

function subscribeToSystemTheme(onStoreChange: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', onStoreChange);
  return () => media.removeEventListener('change', onStoreChange);
}

function getSystemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveIsDarkMode(themeMode: ThemeMode, systemPrefersDark: boolean) {
  if (themeMode === 'system') return systemPrefersDark;
  return themeMode === 'dark';
}

function normalizeStoredTheme(raw: unknown): StoredTheme {
  if (!raw || typeof raw !== 'object') return initialStoredTheme;
  const parsed = raw as Partial<StoredTheme> & { isDarkMode?: boolean };
  const themeMode: ThemeMode =
    parsed.themeMode === 'system' || parsed.themeMode === 'light' || parsed.themeMode === 'dark'
      ? parsed.themeMode
      : typeof parsed.isDarkMode === 'boolean'
        ? parsed.isDarkMode
          ? 'dark'
          : 'light'
        : initialStoredTheme.themeMode;

  return {
    ...initialStoredTheme,
    ...parsed,
    themeMode,
    location: {
      ...initialStoredTheme.location,
      ...(parsed.location ?? {}),
    },
  };
}

export function getAppSurface(accentColor: string, isDarkMode: boolean) {
  return isDarkMode ? accentColor : LIGHT_SURFACE;
}

/** Frosted panels (drawers, islands, sidebars) — dark uses accent tint; light uses white glass. */
export function getGlassSurface(accentColor: string, isDarkMode: boolean) {
  return isDarkMode ? `${accentColor}E6` : 'rgba(255, 255, 255, 0.9)';
}

export function getPhotoOverlay(isDarkMode: boolean) {
  return isDarkMode
    ? 'linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.4))'
    : 'linear-gradient(rgba(242, 243, 245, 0.72), rgba(242, 243, 245, 0.88))';
}

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [storedTheme, setStoredTheme] = useState<StoredTheme>(() => {
    try {
      const stored = localStorage.getItem('appTheme');
      if (stored) return normalizeStoredTheme(JSON.parse(stored));
    } catch (error) {
      console.error('Error loading theme from localStorage:', error);
    }
    return initialStoredTheme;
  });

  const systemPrefersDark = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemPrefersDark,
    () => true,
  );

  const isDarkMode = resolveIsDarkMode(storedTheme.themeMode, systemPrefersDark);

  const theme = useMemo<Theme>(
    () => ({
      ...storedTheme,
      isDarkMode,
    }),
    [storedTheme, isDarkMode],
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        'appTheme',
        JSON.stringify({
          accentColor: storedTheme.accentColor,
          fontStyle: storedTheme.fontStyle,
          themeMode: storedTheme.themeMode,
          location: storedTheme.location,
        }),
      );
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
  }, [storedTheme]);

  useEffect(() => {
    const surface = getAppSurface(theme.accentColor, theme.isDarkMode);
    document.documentElement.style.setProperty('--accent-color', theme.accentColor);
    document.documentElement.style.setProperty('--app-surface', surface);
    document.body.style.backgroundColor = surface;
    document.documentElement.style.backgroundColor = surface;
    document.documentElement.style.colorScheme = theme.isDarkMode ? 'dark' : 'light';
  }, [theme.accentColor, theme.isDarkMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme.isDarkMode);
    document.documentElement.classList.toggle('light', !theme.isDarkMode);
  }, [theme.isDarkMode]);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-style', theme.fontStyle);
  }, [theme.fontStyle]);

  const setAccentColor = useCallback((color: string) => {
    setStoredTheme((prev) => ({ ...prev, accentColor: color }));
  }, []);

  const setFontStyle = useCallback((style: Theme['fontStyle']) => {
    setStoredTheme((prev) => ({ ...prev, fontStyle: style }));
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setStoredTheme((prev) => ({ ...prev, themeMode: mode }));
  }, []);

  const setIsDarkMode = useCallback((isDark: boolean) => {
    setStoredTheme((prev) => ({ ...prev, themeMode: isDark ? 'dark' : 'light' }));
  }, []);

  const setLocation = useCallback((latitude: number, longitude: number, name: string) => {
    setStoredTheme((prev) => ({ ...prev, location: { latitude, longitude, name } }));
  }, []);

  const contextValue = useMemo(
    () => ({
      theme,
      setTheme: setStoredTheme,
      setAccentColor,
      setFontStyle,
      setThemeMode,
      setIsDarkMode,
      setLocation,
    }),
    [theme, setAccentColor, setFontStyle, setThemeMode, setIsDarkMode, setLocation],
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
