import React from 'react';
import { 
  X, 
  Trophy, 
  Crown, 
  Car, 
  Target, 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  Award
} from 'lucide-react';
import { ExecutiveScorecard, PerformanceBadge } from '../../types/performance';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ExecutiveScorecardModalProps {
  scorecard: ExecutiveScorecard | null;
  isOpen: boolean;
  onClose: () => void;
}

const renderBadgeIcon = (iconName: string) => {
  switch (iconName) {
    case 'Crown':
      return <Crown className="w-4 h-4 text-amber-400" />;
    case 'Car':
      return <Car className="w-4 h-4 text-blue-400" />;
    case 'Target':
      return <Target className="w-4 h-4 text-emerald-400" />;
    case 'Zap':
      return <Zap className="w-4 h-4 text-indigo-400" />;
    case 'ShieldCheck':
      return <ShieldCheck className="w-4 h-4 text-cyan-400" />;
    default:
      return <Award className="w-4 h-4 text-purple-400" />;
  }
};

export const ExecutiveScorecardModal: React.FC<ExecutiveScorecardModalProps> = ({
  scorecard,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !scorecard) return null;

  const paceColor = {
    EXCEEDING: 'emerald',
    ON_TRACK: 'blue',
    BEHIND_PACE: 'amber',
    AT_RISK: 'rose',
  }[scorecard.pace_status] || 'slate';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center font-black text-lg text-white">
              #{scorecard.rank}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{scorecard.name}</h2>
                <Badge variant={paceColor as any}>{scorecard.pace_status.replace('_', ' ')}</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{scorecard.role} • {scorecard.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Badges Shelf */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Earned Accolades & Badges ({scorecard.badges.length})
          </p>
          {scorecard.badges.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-800/40 rounded-xl">
              No badges unlocked yet this month. Close more deals & site visits to earn badges.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {scorecard.badges.map((b) => (
                <div
                  key={b.code}
                  className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/70 flex items-start gap-2.5"
                >
                  <div className="p-2 rounded-lg bg-slate-900 shrink-0 mt-0.5">
                    {renderBadgeIcon(b.icon)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{b.title}</p>
                    <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue Quota & Progress */}
        <div className="mt-5 p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Revenue Quota Progress</span>
            <span className="font-bold text-emerald-400">{scorecard.achievement_percentage}%</span>
          </div>

          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                scorecard.achievement_percentage >= 100
                  ? 'bg-emerald-500'
                  : scorecard.achievement_percentage >= 60
                  ? 'bg-blue-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(scorecard.achievement_percentage, 100)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-medium">Target</p>
              <p className="text-sm font-bold text-white mt-0.5">₹{scorecard.target_amount}L</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-medium">Achieved</p>
              <p className="text-sm font-bold text-emerald-400 mt-0.5">₹{scorecard.achieved_amount}L</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-medium">Projected Run-Rate</p>
              <p className="text-sm font-bold text-blue-400 mt-0.5">₹{scorecard.projected_run_rate}L</p>
            </div>
          </div>
        </div>

        {/* Operational Statistics */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase font-medium">Bookings</p>
            <p className="text-base font-extrabold text-white mt-0.5">
              {scorecard.achieved_bookings} <span className="text-xs text-slate-500">/ {scorecard.target_bookings}</span>
            </p>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase font-medium">Site Visits</p>
            <p className="text-base font-extrabold text-blue-400 mt-0.5">
              {scorecard.site_visits_conducted}
            </p>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase font-medium">Conversion Rate</p>
            <p className="text-base font-extrabold text-purple-400 mt-0.5">
              {scorecard.conversion_rate}%
            </p>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase font-medium">Task Adherence</p>
            <p className="text-base font-extrabold text-emerald-400 mt-0.5">
              {scorecard.followup_adherence_rate}%
            </p>
          </div>
        </div>

        {scorecard.overdue_followups > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>
              Executive has <strong>{scorecard.overdue_followups} overdue client follow-ups</strong> requiring immediate management escalation.
            </span>
          </div>
        )}

        <div className="flex justify-end pt-5 border-t border-slate-800 mt-5">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close Scorecard
          </Button>
        </div>
      </div>
    </div>
  );
};
