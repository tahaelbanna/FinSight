import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  size = 'md',
  showLabel = false,
}) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'relative inline-flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer select-none',
        'border border-stone-200/80 hover:border-stone-300 bg-white/80 hover:bg-stone-100/80 text-stone-600 hover:text-stone-900',
        'dark:border-stone-800 dark:bg-stone-900/80 dark:hover:bg-stone-800 dark:text-stone-300 dark:hover:text-stone-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900',
        size === 'sm' && 'p-1.5 text-xs gap-1.5',
        size === 'md' && 'p-2 text-sm gap-2',
        className
      )}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {/* Sun Icon (shown in dark mode to switch to light) */}
        <Sun
          className={cn(
            'w-4 h-4 transition-all duration-300 absolute text-amber-400',
            isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0'
          )}
        />
        {/* Moon Icon (shown in light mode to switch to dark) */}
        <Moon
          className={cn(
            'w-4 h-4 transition-all duration-300 absolute text-stone-600 group-hover:text-stone-900',
            isDark ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
          )}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};
