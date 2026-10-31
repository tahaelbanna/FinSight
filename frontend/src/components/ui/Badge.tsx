import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'indigo';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full select-none',
        // Sizes
        size === 'sm' && 'text-[11px] px-2 py-0.5',
        size === 'md' && 'text-xs px-2.5 py-1',
        // Variants
        variant === 'success' && 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
        variant === 'warning' && 'bg-amber-50 text-amber-700 border border-amber-200/60',
        variant === 'danger' && 'bg-red-50 text-red-700 border border-red-200/60',
        variant === 'info' && 'bg-blue-50 text-blue-700 border border-blue-200/60',
        variant === 'indigo' && 'bg-indigo-50 text-indigo-700 border border-indigo-200/60',
        variant === 'neutral' && 'bg-stone-100 text-stone-700 border border-stone-200',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
