import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'elevated' | 'midnight';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl transition-all duration-150',
          variant === 'default' &&
            'bg-white dark:bg-[#151A2D] border border-stone-200/80 dark:border-stone-800/90 text-stone-900 dark:text-stone-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-none',
          variant === 'subtle' &&
            'bg-[#F0EFEA] dark:bg-[#1C2338] border border-stone-200/60 dark:border-stone-800/60 text-stone-800 dark:text-stone-200',
          variant === 'elevated' &&
            'bg-white dark:bg-[#151A2D] border border-stone-200/80 dark:border-stone-800/90 text-stone-900 dark:text-stone-100 shadow-[0_8px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.3)]',
          variant === 'midnight' &&
            'bg-[#16182E] dark:bg-[#121526] border border-[#252A4A] dark:border-[#202542] text-white shadow-md',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
