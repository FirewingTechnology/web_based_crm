import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:from-amber-400 hover:via-[#d4b26a] hover:to-yellow-300 text-black font-semibold shadow-lg shadow-[#C8A45D]/25 focus:ring-[#C8A45D]',
    secondary: 'bg-white/[0.05] hover:bg-white/[0.08] text-slate-100 border border-white/[0.08] focus:ring-white/20',
    outline: 'bg-transparent hover:bg-white/[0.04] text-slate-300 border border-white/[0.08] focus:ring-white/10',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/25 focus:ring-rose-500',
    glass: 'glass-card hover:bg-white/[0.06] text-slate-200 border-white/10 hover:border-white/20',
  };

  return (
    <button
      className={clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4 text-current mr-1.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
