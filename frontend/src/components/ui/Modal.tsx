import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-150 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Container */}
      <div className="relative z-10 flex min-h-full items-center justify-center p-4 sm:p-6 text-center pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            'pointer-events-auto relative w-full transform overflow-hidden rounded-2xl bg-white dark:bg-[#151A2D] text-start shadow-xl transition-all border border-stone-200/80 dark:border-stone-800 duration-150 animate-in zoom-in-95',
            maxWidth === 'sm' && 'max-w-sm',
            maxWidth === 'md' && 'max-w-md',
            maxWidth === 'lg' && 'max-w-lg',
            maxWidth === 'xl' && 'max-w-xl',
            maxWidth === '2xl' && 'max-w-2xl'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 px-6 py-4.5 bg-stone-50/50 dark:bg-stone-900/40">
            <div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-display">{title}</h3>
              {subtitle && <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 text-stone-900 dark:text-stone-100">{children}</div>
        </div>
      </div>
    </div>
  );
};
