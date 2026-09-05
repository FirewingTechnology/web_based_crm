import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { 
  Plus, 
  Target, 
  Trophy, 
  TrendingUp, 
  Edit, 
  UserPlus, 
  Crown, 
  Medal, 
  Flame, 
  Calendar, 
  CheckCircle2, 
  Car, 
  Zap, 
  ArrowUpRight,
  ShieldCheck,
  Award
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { SalesTargetModal } from '../../components/modals/SalesTargetModal';
import { UserCreateModal } from '../../components/modals/UserCreateModal';
import { ExecutiveScorecardModal } from '../../components/performance/ExecutiveScorecardModal';
import { salesApi } from '../../api/sales';
import { usersApi } from '../../api/users';
import { performanceApi } from '../../api/performance';
import { SalesTarget, SalesTargetCreateInput } from '../../types/sales';
import { User } from '../../types/user';
import { LeaderboardSummary, ExecutiveScorecard } from '../../types/performance';

export const SalesManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LEADERBOARD' | 'TARGETS'>('LEADERBOARD');
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [executives, setExecutives] = useState<User[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardSummary | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7)
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<SalesTarget | null>(null);

  const [selectedScorecard, setSelectedScorecard] = useState<ExecutiveScorecard | null>(null);
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);

  const fetchTargets = async () => {
    try {
      const data = await salesApi.getSalesTargets(selectedMonth);
      setTargets(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExecutives = async () => {
    try {
      const data = await usersApi.getUsers('Sales Executive');
      setExecutives(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const data = await performanceApi.getLeaderboard(selectedMonth);
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to load sales leaderboard:', err);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    fetchTargets();
    fetchExecutives();
  }, [selectedMonth]);

  const handleCreateOrUpdateTarget = async (data: SalesTargetCreateInput) => {
    if (editingTarget) {
      await salesApi.updateSalesTarget(editingTarget.id, data);
    } else {
      await salesApi.createSalesTarget(data);
    }
    fetchTargets();
    fetchLeaderboard();
  };

  const handleOpenScorecard = (sc: ExecutiveScorecard) => {
    setSelectedScorecard(sc);
    setIsScorecardOpen(true);
  };

  // Month Options for selector
  const monthOptions = [
    { label: 'Current Month (Sep 2026)', value: '2026-09' },
    { label: 'Aug 2026', value: '2026-08' },
    { label: 'Jul 2026', value: '2026-07' },
  ];

  // Leaderboard Columns
  const leaderboardColumns: ColumnDef<ExecutiveScorecard>[] = [
    {
      accessorKey: 'rank',
      header: 'Rank',
      cell: ({ row }) => {
        const rank = row.original.rank;
        return (
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                rank === 1
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : rank === 2
                  ? 'bg-slate-300/20 text-slate-200 border border-slate-400/40'
                  : rank === 3
                  ? 'bg-orange-700/20 text-orange-400 border border-orange-600/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'name',
      header: 'Sales Executive',
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-white text-xs hover:text-blue-400 cursor-pointer" onClick={() => handleOpenScorecard(row.original)}>
              {row.original.name}
            </p>
            {row.original.rank === 1 && <Crown className="w-3.5 h-3.5 text-amber-400 inline" />}
          </div>
          <p className="text-[11px] text-slate-400">{row.original.role}</p>
        </div>
      ),
    },
    {
      accessorKey: 'achieved_amount',
      header: 'Revenue Closed',
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-emerald-400 text-xs">
            ₹{row.original.achieved_amount} Lakhs
          </span>
          <p className="text-[10px] text-slate-400">Target: ₹{row.original.target_amount}L</p>
        </div>
      ),
    },
    {
      accessorKey: 'achievement_percentage',
      header: 'Quota Progress',
      cell: ({ row }) => {
        const pct = row.original.achievement_percentage;
        return (
          <div className="w-32 space-y-1">
            <div className="flex justify-between text-[10px] font-semibold">
              <span className="text-slate-300">{pct}%</span>
              <span className="text-slate-400">{row.original.achieved_bookings}/{row.original.target_bookings} Deals</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'site_visits_conducted',
      header: 'Site Visits',
      cell: ({ row }) => (
        <span className="font-semibold text-blue-400 text-xs">
          {row.original.site_visits_conducted} visits
        </span>
      ),
    },
    {
      accessorKey: 'conversion_rate',
      header: 'Conversion',
      cell: ({ row }) => (
        <span className="font-semibold text-purple-400 text-xs">
          {row.original.conversion_rate}%
        </span>
      ),
    },
    {
      accessorKey: 'badges',
      header: 'Accolades',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {row.original.badges.slice(0, 3).map((b) => (
            <span
              key={b.code}
              title={`${b.title}: ${b.description}`}
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 border border-slate-700 text-slate-200"
            >
              {b.title}
            </span>
          ))}
          {row.original.badges.length > 3 && (
            <span className="text-[10px] text-slate-400">+{row.original.badges.length - 3}</span>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Scorecard',
      cell: ({ row }) => (
        <Button size="sm" variant="outline" onClick={() => handleOpenScorecard(row.original)}>
          View Card
        </Button>
      ),
    },
  ];

  // Target Allocations Columns
  const targetColumns: ColumnDef<SalesTarget>[] = [
    {
      accessorKey: 'user_name',
      header: 'Sales Executive',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-white">{row.original.user_name}</p>
            <p className="text-slate-400 text-[11px]">Period: {row.original.month_year}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'target_amount',
      header: 'Revenue Target (INR)',
      cell: ({ row }) => (
        <span className="font-medium text-slate-200 text-xs">
          ₹{row.original.target_amount} Lakhs Target
        </span>
      ),
    },
    {
      accessorKey: 'achieved_amount',
      header: 'Achieved Revenue',
      cell: ({ row }) => (
        <span className="font-semibold text-emerald-400 text-xs">
          ₹{row.original.achieved_amount} Lakhs Closed
        </span>
      ),
    },
    {
      accessorKey: 'achievement_percentage',
      header: 'Goal Achievement',
      cell: ({ row }) => {
        const pct = row.original.achievement_percentage || 0;
        return (
          <div className="w-36 space-y-1">
            <div className="flex justify-between text-[11px] font-semibold">
              <span className="text-slate-300">{pct}%</span>
              <span className="text-slate-500">{row.original.achieved_bookings}/{row.original.target_bookings} Deals</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <button
          onClick={() => {
            setEditingTarget(row.original);
            setIsModalOpen(true);
          }}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
        >
          <Edit className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar with Title and Month Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Sales Leaderboard & Revenue Scorecards
            </h1>
            <Badge variant="blue">Gamified Performance</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time monthly revenue run rates, deal podium rankings, site visit velocity & gamified accolades
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant="outline"
            icon={<UserPlus className="h-4 w-4" />}
            onClick={() => setIsUserModalOpen(true)}
          >
            Add Rep
          </Button>

          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setEditingTarget(null);
              setIsModalOpen(true);
            }}
          >
            Set Target
          </Button>
        </div>
      </div>

      {/* Organization Monthly Pacing Banner */}
      {leaderboard && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shadow-xl">
          <div>
            <p className="text-xs text-slate-400 font-medium">Monthly Team Quota</p>
            <p className="text-xl font-black text-white mt-1">
              ₹{leaderboard.total_org_target} Lakhs
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Across all assigned executive targets
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400 font-medium">Team Revenue Closed</p>
            <p className="text-xl font-black text-emerald-400 mt-1">
              ₹{leaderboard.total_org_achieved} Lakhs
            </p>
            <p className="text-[11px] text-emerald-400/90 mt-0.5">
              {leaderboard.org_achievement_percentage}% of monthly quota reached
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400 font-medium">Projected Run-Rate</p>
            <p className="text-xl font-black text-blue-400 mt-1">
              ₹{leaderboard.projected_org_run_rate} Lakhs
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Day {leaderboard.days_elapsed} of {leaderboard.total_days} elapsed
            </p>
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-xs text-slate-400 font-medium mb-1.5">Pace Status</p>
            <Badge
              variant={
                leaderboard.org_pace_status === 'EXCEEDING'
                  ? 'emerald'
                  : leaderboard.org_pace_status === 'ON_TRACK'
                  ? 'blue'
                  : leaderboard.org_pace_status === 'BEHIND_PACE'
                  ? 'amber'
                  : 'rose'
              }
            >
              {leaderboard.org_pace_status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      )}

      {/* Top Podium 3 Cards */}
      {leaderboard && leaderboard.podium.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {leaderboard.podium.map((sc, idx) => {
            const isGold = idx === 0;
            const isSilver = idx === 1;
            const isBronze = idx === 2;
            return (
              <div
                key={sc.user_id}
                onClick={() => handleOpenScorecard(sc)}
                className={`p-5 rounded-2xl border transition hover:scale-[1.01] cursor-pointer ${
                  isGold
                    ? 'bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-900 border-amber-500/30 shadow-amber-500/5'
                    : isSilver
                    ? 'bg-gradient-to-b from-slate-400/10 via-slate-900 to-slate-900 border-slate-700/60'
                    : 'bg-gradient-to-b from-orange-700/10 via-slate-900 to-slate-900 border-orange-700/30'
                } shadow-xl relative overflow-hidden`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{isGold ? '👑' : isSilver ? '🥈' : '🥉'}</span>
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      {isGold ? '1st Place' : isSilver ? '2nd Place' : '3rd Place'}
                    </span>
                  </div>
                  <Badge variant={isGold ? 'amber' : 'blue'}>
                    {sc.achievement_percentage}% Quota
                  </Badge>
                </div>

                <div className="mt-3">
                  <h3 className="text-base font-bold text-white">{sc.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{sc.role}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-medium">Closed</p>
                    <p className="text-xs font-bold text-emerald-400 mt-0.5">₹{sc.achieved_amount}L</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-medium">Deals</p>
                    <p className="text-xs font-bold text-white mt-0.5">{sc.achieved_bookings}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-medium">Visits</p>
                    <p className="text-xs font-bold text-blue-400 mt-0.5">{sc.site_visits_conducted}</p>
                  </div>
                </div>

                {sc.badges.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {sc.badges.map((b) => (
                      <span
                        key={b.code}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold"
                      >
                        {b.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('LEADERBOARD')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'LEADERBOARD'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          Live Leaderboard & Accolades
        </button>

        <button
          onClick={() => setActiveTab('TARGETS')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'TARGETS'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          Target Quotas & Roster
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'LEADERBOARD' ? (
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
          <DataTable
            columns={leaderboardColumns}
            data={leaderboard?.rankings || []}
            searchPlaceholder="Search executive name..."
          />
        </div>
      ) : (
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
          <DataTable
            columns={targetColumns}
            data={targets}
            searchPlaceholder="Search executive name..."
          />
        </div>
      )}

      {/* Modals */}
      <SalesTargetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdateTarget}
        initialTarget={editingTarget}
        executives={executives}
      />

      <UserCreateModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSuccess={() => {
          fetchExecutives();
          fetchTargets();
          fetchLeaderboard();
        }}
        defaultRole="Sales Executive"
      />

      <ExecutiveScorecardModal
        scorecard={selectedScorecard}
        isOpen={isScorecardOpen}
        onClose={() => setIsScorecardOpen(false)}
      />
    </div>
  );
};
