"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Theme = "default" | "theme-dark-blue" | "theme-forest" | "theme-sunset" | "theme-midnight-plum" | "theme-cyber-neon" | "theme-oceanic-deep";

const VALID_THEMES: Theme[] = ["default", "theme-dark-blue", "theme-forest", "theme-sunset", "theme-midnight-plum", "theme-cyber-neon", "theme-oceanic-deep"];

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isThemeInitialized: boolean;
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "default",
  storageKey = "chance-central-theme", // Default matches usage in RootLayout
}: {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [isThemeInitialized, setIsThemeInitialized] = useState(false);

  useEffect(() => {
    const storedValue = localStorage.getItem(storageKey) as Theme;
    if (storedValue && VALID_THEMES.includes(storedValue)) {
      setThemeState(storedValue);
    }
    // Else, it remains `defaultTheme` as set initially by useState.
    setIsThemeInitialized(true);
  }, [storageKey, defaultTheme]);

  useEffect(() => {
    if (typeof window === 'undefined' || !isThemeInitialized) return;

    const root = window.document.documentElement;
    
    VALID_THEMES.forEach(tClass => {
      if (tClass !== "default") { 
        root.classList.remove(tClass);
      }
    });

    if (theme !== "default") {
      root.classList.add(theme);
    }
  }, [theme, isThemeInitialized]);

  const setTheme = useCallback((newTheme: Theme) => {
    if (VALID_THEMES.includes(newTheme)) {
      setThemeState(currentInternalTheme => {
        if (currentInternalTheme !== newTheme) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(storageKey, newTheme);
          }
          return newTheme;
        }
        return currentInternalTheme; // No change needed
      });
    }
  }, [storageKey]);

  const value = { theme, setTheme, isThemeInitialized };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};