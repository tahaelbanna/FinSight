import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leadingIcon,
      trailingIcon,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const isPasswordType = type === 'password';
    const computedType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full flex flex-col gap-1.5 text-start">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-stone-700"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leadingIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-stone-400">
              {leadingIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={computedType}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={cn(
              'w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
              leadingIcon ? 'pl-10' : 'pl-3.5',
              isPasswordType || trailingIcon ? 'pr-10' : 'pr-3.5',
              error
                ? 'border-red-300 bg-red-50/20 text-red-900 focus:ring-red-400 focus:border-red-400'
                : 'border-stone-200 hover:border-stone-300',
              className
            )}
            {...props}
          />
          {isPasswordType ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3.5 flex items-center text-stone-400 hover:text-stone-600 transition-colors p-0.5"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          ) : trailingIcon ? (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-stone-400">
              {trailingIcon}
            </div>
          ) : null}
        </div>
        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-xs font-medium text-red-600 mt-0.5">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-stone-500 mt-0.5">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
