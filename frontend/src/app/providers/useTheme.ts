import { useContext, useState } from 'react';
import {
  ThemeContext,
  type ThemeContextValue,
  type ThemePreference,
  applyDocumentTheme,
  persistTheme,
  readStoredTheme,
  resolveTheme,
} from './theme-context';

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  const [fallbackPreference, setFallbackPreference] = useState<ThemePreference>(() =>
    readStoredTheme(),
  );

  if (context) {
    return context;
  }

  const resolvedTheme = resolveTheme(fallbackPreference);
  const setTheme = (next: ThemePreference) => {
    setFallbackPreference(next);
    persistTheme(next);
    applyDocumentTheme(resolveTheme(next));
  };
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return {
    theme: fallbackPreference,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };
};
