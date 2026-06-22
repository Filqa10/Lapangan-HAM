'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let active = true;
    requestAnimationFrame(() => {
      if (active) setMounted(true);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!mounted) {
    return (
      <div className="h-7 w-12 rounded-full border border-[#d2cecb] dark:border-slate-800 bg-[#f4f2f0] dark:bg-slate-900" />
    );
  }

  return (
    <button
      type="button"
      id="theme-toggle"
      onClick={toggleTheme}
      className="relative flex h-7 w-12 cursor-pointer items-center rounded-full border border-[#d2cecb] dark:border-slate-800 bg-[#f4f2f0] dark:bg-slate-900 p-0.5 transition-[border-color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#999ba3] active:scale-[0.97] focus:outline-none"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div
        className={`flex h-5.5 w-5.5 transform items-center justify-center rounded-full bg-white dark:bg-[#0c0a08] shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
        }`}
      >
        {theme === 'dark' ? (
          <Moon size={11} className="text-[#0c0a08] dark:text-white" />
        ) : (
          <Sun size={11} className="text-[#0c0a08] dark:text-white" />
        )}
      </div>
    </button>
  );
}

