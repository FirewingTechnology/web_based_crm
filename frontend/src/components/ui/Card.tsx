import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, glow = false, ...props }) => {
  return (
    <div
      className={clsx(
        'glass-card rounded-xl p-5 relative overflow-hidden transition-all duration-300',
        glow && 'hover:border-blue-500/40 hover:shadow-blue-500/10 hover:shadow-xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
