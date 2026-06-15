import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  mode: 'light' | 'dark';
  colors: {
    background: string;
    surface: string;
    surfaceElevated: string;
    primary: string;
    primaryLight: string;
    secondary: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    borderLight: string;
    success: string;
    successLight: string;
    error: string;
    errorLight: string;
    warning: string;
    warningLight: string;
    shadow: string;
  };
}

const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceElevated: '#fafafa',
    primary: '#2f95dc',
    primaryLight: '#e3f2fd',
    secondary: '#666666',
    text: '#1a1a1a',
    textSecondary: '#666666',
    textMuted: '#888888',
    border: '#e8e8e8',
    borderLight: '#eeeeee',
    success: '#4caf50',
    successLight: '#f0f9f0',
    error: '#f44336',
    errorLight: '#ffebee',
    warning: '#ff9800',
    warningLight: '#fff3e0',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
};

const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: '#121212',
    surface: '#1e1e1e',
    surfaceElevated: '#2a2a2a',
    primary: '#4da6ff',
    primaryLight: '#1a3a52',
    secondary: '#a0a0a0',
    text: '#ffffff',
    textSecondary: '#b0b0b0',
    textMuted: '#808080',
    border: '#333333',
    borderLight: '#2a2a2a',
    success: '#66bb6a',
    successLight: '#1a3a1a',
    error: '#ef5350',
    errorLight: '#3a1a1a',
    warning: '#ffa726',
    warningLight: '#3a2a1a',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = '@gym_tracker_theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadThemeMode();
  }, []);

  const loadThemeMode = async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemeModeState(stored);
      }
    } catch (error) {
      console.error('Error loading theme mode:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  const theme = isDark ? darkTheme : lightTheme;

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
