'use client';

/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light';

export function useThemeMode() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('muneri_theme') as ThemeMode;
    if (savedTheme) {
      setThemeMode(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setThemeMode('light');
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('muneri_theme', themeMode);
    }
  }, [themeMode, mounted]);

  const toggleThemeMode = () => {
    setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return { themeMode, toggleThemeMode, mounted };
}
