/**
 * src/design/ThemeProvider.tsx
 * Provides the active Theme (light baseline, matching the mockup default).
 */
import React, { createContext, useContext, type ReactNode } from 'react';
import { lightTheme, type Theme } from './theme';

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ children, theme = lightTheme }: { children: ReactNode; theme?: Theme }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
