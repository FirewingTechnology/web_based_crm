import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-xs font-medium text-slate-300 mb-1.5">{label}</label>}
        <div className="relative rounded-lg shadow-sm">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'glass-input w-full rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 transition duration-150',
              icon && 'pl-10',
              error && 'border-rose-500 focus:ring-rose-500',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
