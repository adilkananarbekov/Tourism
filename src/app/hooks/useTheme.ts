import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';
export type ThemePreference = 'system' | ThemeMode;

const THEME_STORAGE_KEY = 'tourism-theme';
const THEME_CHANGE_EVENT = 'tourism-theme-change';

function getSystemTheme(): ThemeMode {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialPreference(): ThemePreference {
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference | null;
  if (stored === 'system' || stored === 'light' || stored === 'dark') {
    return stored;
  }
  return 'system';
}

function resolveTheme(preference: ThemePreference): ThemeMode {
  return preference === 'system' ? getSystemTheme() : preference;
}

export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => getInitialPreference());
  const [systemMode, setSystemMode] = useState<ThemeMode>(() => getSystemTheme());
  const mode = preference === 'system' ? systemMode : preference;

  const setPreference = (nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
    localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
    window.dispatchEvent(
      new CustomEvent<ThemePreference>(THEME_CHANGE_EVENT, { detail: nextPreference })
    );
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.style.colorScheme = mode;
  }, [mode, preference]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      setSystemMode(mediaQuery.matches ? 'dark' : 'light');
    };
    const handleThemeChange = (event: Event) => {
      setPreferenceState((event as CustomEvent<ThemePreference>).detail);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) {
        return;
      }
      const nextPreference = event.newValue;
      if (nextPreference === 'system' || nextPreference === 'light' || nextPreference === 'dark') {
        setPreferenceState(nextPreference);
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const toggle = () => {
    setPreference(resolveTheme(preference) === 'dark' ? 'light' : 'dark');
  };

  return { mode, preference, setPreference, toggle };
}
