'use client';

import { useState, useEffect } from 'react';

export function useDarkMode(): [boolean, (dark: boolean) => void] {
  const [dark, setDark] = useState(false);

  // Initialise from localStorage (user override) → system preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('dark-mode');
    if (stored !== null) {
      setDark(stored === 'true');
    } else {
      setDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  // Apply/remove `dark` class on <html>
  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('dark-mode', String(dark));
  }, [dark]);

  return [dark, setDark];
}
