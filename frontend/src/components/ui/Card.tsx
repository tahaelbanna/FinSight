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
            'bg-white border border-stone-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]',
          variant === 'subtle' &&
            'bg-[#F0EFEA] border border-stone-200/60',
          variant === 'elevated' &&
            'bg-white border border-stone-200/80 shadow-[0_8px_24px_rgba(0,0,0,0.04)]',
          variant === 'midnight' &&
            'bg-[#16182E] border border-[#252A4A] text-white shadow-md',
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
