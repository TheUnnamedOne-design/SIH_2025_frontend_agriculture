import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';

interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryLight: string;
  chatBubbleUser: string;
  chatBubbleBot: string;
  border: string;
  error: string;
}

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
}

const lightTheme: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F8F9FA',
  text: '#000000',
  textSecondary: '#666666',
  primary: '#4CAF50',
  primaryLight: '#81C784',
  chatBubbleUser: '#4CAF50',
  chatBubbleBot: '#E0E0E0',
  border: '#E0E0E0',
  error: '#F44336',
};

const darkTheme: ThemeColors = {
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  primary: '#81C784',
  primaryLight: '#A5D6A7',
  chatBubbleUser: '#81C784',
  chatBubbleBot: '#333333',
  border: '#333333',
  error: '#EF5350',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [manualTheme, setManualTheme] = useState<'light' | 'dark' | null>(null);
  const systemColorScheme = useColorScheme();
  
  const toggleTheme = () => {
    setManualTheme((prev) => {
      if (prev === null) return systemColorScheme === 'dark' ? 'light' : 'dark';
      return prev === 'light' ? 'dark' : 'light';
    });
  };

  const isDark = manualTheme !== null ? manualTheme === 'dark' : systemColorScheme === 'dark';
  
  const value: ThemeContextType = {
    colors: isDark ? darkTheme : lightTheme,
    isDark,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}