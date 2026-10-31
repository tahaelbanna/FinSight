import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'danger' | 'warning' | 'success' | 'info';
  title?: string;
}

export const Alert: React.FC<AlertProps> = ({
  className,
  variant = 'info',
  title,
  children,
  ...props
}) => {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border text-sm leading-relaxed',
        variant === 'danger' && 'bg-red-50/80 border-red-200 text-red-900',
        variant === 'warning' && 'bg-amber-50/80 border-amber-200 text-amber-900',
        variant === 'success' && 'bg-emerald-50/80 border-emerald-200 text-emerald-900',
        variant === 'info' && 'bg-indigo-50/80 border-indigo-200 text-indigo-900',
        className
      )}
      {...props}
    >
      <div className="shrink-0 mt-0.5">
        {variant === 'danger' && <AlertCircle className="w-5 h-5 text-red-600" />}
        {variant === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
        {variant === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        {variant === 'info' && <Info className="w-5 h-5 text-indigo-600" />}
      </div>
      <div className="flex-1 min-w-0">
        {title && <h5 className="font-semibold mb-0.5">{title}</h5>}
        <div className="opacity-95">{children}</div>
      </div>
    </div>
  );
};
