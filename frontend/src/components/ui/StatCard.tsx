import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  trend?: string;
  color?: 'blue' | 'emerald' | 'purple' | 'amber';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon,
  trend,
  color = 'blue',
}) => {
  const colorGradients = {
    blue: 'from-blue-500/20 to-indigo-500/5 text-blue-400 border-blue-500/20',
    emerald: 'from-emerald-500/20 to-teal-500/5 text-emerald-400 border-emerald-500/20',
    purple: 'from-purple-500/20 to-pink-500/5 text-purple-400 border-purple-500/20',
    amber: 'from-amber-500/20 to-orange-500/5 text-amber-400 border-amber-500/20',
  };

  return (
    <Card glow className="relative group overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1 tracking-tight">{value}</h3>
          {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
          {trend && (
            <span className="inline-flex items-center text-xs font-semibold text-emerald-400 mt-2">
              ↑ {trend} vs last month
            </span>
          )}
        </div>
        <div
          className={`h-12 w-12 rounded-xl border bg-gradient-to-br flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${colorGradients[color]}`}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
};
