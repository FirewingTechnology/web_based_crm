import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'slate', size = 'md', dot = true }) => {
  const variantStyles = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    slate: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
  };

  const dotColors = {
    blue: 'bg-blue-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    purple: 'bg-purple-400',
    slate: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border backdrop-blur-sm',
        variantStyles[variant],
        sizeStyles[size]
      )}
    >
      {dot && <span className={clsx('h-1.5 w-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
};
