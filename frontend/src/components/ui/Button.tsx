import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none',
          // Variants
          variant === 'primary' &&
            'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm focus-visible:ring-indigo-500',
          variant === 'secondary' &&
            'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/60 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 dark:text-indigo-200 dark:border-indigo-800/60 focus-visible:ring-indigo-400',
          variant === 'outline' &&
            'border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900/60 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 focus-visible:ring-stone-400',
          variant === 'ghost' &&
            'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 focus-visible:ring-stone-400',
          variant === 'danger' &&
            'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm focus-visible:ring-red-500',
          // Sizes
          size === 'sm' && 'text-xs px-3 py-1.5 gap-1.5',
          size === 'md' && 'text-sm px-4 py-2.5 gap-2',
          size === 'lg' && 'text-base px-5 py-3 gap-2.5',
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
