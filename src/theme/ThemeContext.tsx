import React, { createContext, useContext, useEffect, useState } from 'react';

import { loadSettings } from '../services/storage/settingsStorage';
import { darkColors, lightColors, type ColorPalette } from './colors';
import type { AppTheme } from '../types';

type ThemeContextValue = {
  isDark: boolean;
  colors: ColorPalette;
  setTheme: (theme: AppTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  colors: lightColors,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => setIsDark(s.theme === 'dark'));
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        colors: isDark ? darkColors : lightColors,
        setTheme: (t) => setIsDark(t === 'dark'),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
