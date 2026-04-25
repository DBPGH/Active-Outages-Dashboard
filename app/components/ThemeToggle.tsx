'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle light/dark mode"
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700/50 transition-colors"
    >
      <span className="text-sm leading-none">{isDark ? '🌙' : '☀️'}</span>
      <div
        className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${
          isDark ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <div
          className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-200 ${
            isDark ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </div>
    </button>
  );
}
