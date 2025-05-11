import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the shape of our theme
export interface Theme {
  accentColor: string;
  fontStyle: 'mono' | 'sans' | 'serif';
  isDarkMode: boolean;
  // Add other theme-related properties here if needed
}

// Define the shape of our context
interface ThemeContextType {
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  setAccentColor: (color: string) => void;
  setFontStyle: (style: 'mono' | 'sans' | 'serif') => void;
  setIsDarkMode: (isDark: boolean) => void;
}

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Define the initial theme state
const initialTheme: Theme = {
  accentColor: '#1F1B2F', // Default accent color
  fontStyle: 'sans',     // Default font style
  isDarkMode: true,      // Default to dark mode
};

// Create the ThemeProvider component
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const storedTheme = localStorage.getItem('appTheme');
      if (storedTheme) {
        // Ensure the stored theme has all the necessary properties
        const parsedTheme = JSON.parse(storedTheme);
        return { ...initialTheme, ...parsedTheme };
      }
    } catch (error) {
      console.error("Error loading theme from localStorage:", error);
    }
    return initialTheme;
  });

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('appTheme', JSON.stringify(theme));
    } catch (error) {
      console.error("Error saving theme to localStorage:", error);
    }
  }, [theme]);

  // Apply accent color to CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', theme.accentColor);
  }, [theme.accentColor]);

  // Apply theme to document
  useEffect(() => {
    if (theme.isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme.isDarkMode]);

  // Apply font style to document
  useEffect(() => {
    document.documentElement.style.setProperty('--font-style', theme.fontStyle);
  }, [theme.fontStyle]);

  const setAccentColor = (color: string) => {
    setTheme(prevTheme => ({ ...prevTheme, accentColor: color }));
  };

  const setFontStyle = (style: 'mono' | 'sans' | 'serif') => {
    setTheme(prevTheme => ({ ...prevTheme, fontStyle: style }));
  };

  const setIsDarkMode = (isDark: boolean) => {
    setTheme(prevTheme => ({ ...prevTheme, isDarkMode: isDark }));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, setAccentColor, setFontStyle, setIsDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Create a custom hook to use the ThemeContext
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 