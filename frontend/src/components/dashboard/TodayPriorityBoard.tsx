import React, { useState, useEffect } from 'react';
import { 
  Zap, AlertTriangle, CalendarCheck, Flame, Award, ShieldAlert,
  Clock, ArrowRight, RefreshCw, Eye, Calendar, Phone, CheckCircle2
} from 'lucide-react';
import { salesApi } from '../../api/sales';
import { PriorityItem, TodayPrioritiesResponse } from '../../types/priority';
import { WhatsAppButton } from '../common/WhatsAppButton';
import { Button } from '../ui/Button';

interface TodayPriorityBoardProps {
  onOpenLeadDrawer?: (leadId: number) => void;
  onOpenFollowupModal?: (leadId: number, leadName: string) => void;
}

export const TodayPriorityBoard: React.FC<TodayPriorityBoardProps> = ({
  onOpenLeadDrawer,
  onOpenFollowupModal,
}) => {
  const [data, setData] = useState<TodayPrioritiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchPriorities = async () => {
    try {
      setRefreshing(true);
      const res = await salesApi.getTodayPriorities();
      setData(res);
    } catch (err) {
      console.error('Failed to load today priorities:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPriorities();
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse flex items-center justify-center min-h-[220px]">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
          <span>Evaluating today's revenue priorities...</span>
        </div>
      </div>
    );
  }

  const items = data?.items || [];

  const filteredItems = items.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'overdue') return item.type === 'overdue_followup';
    if (activeTab === 'today') return item.type === 'today_site_visit' || item.type === 'today_followup';
    if (activeTab === 'post_visit') return item.type === 'post_visit';
    if (activeTab === 'hot') return item.type === 'hot_lead';
    if (activeTab === 'closers') return item.type === 'closing_opportunity';
    if (activeTab === 'risk') return item.type === 'lead_at_risk';
    return true;
  });

  const getCardStyle = (type: PriorityItem['type'], rank: number) => {
    switch (type) {
      case 'overdue_followup':
        return {
          border: 'border-rose-500/30 hover:border-rose-500/60',
          badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          icon: <AlertTriangle className="h-4 w-4 text-rose-400" />
        };
      case 'today_site_visit':
      case 'today_followup':
        return {
          border: 'border-purple-500/30 hover:border-purple-500/60',
          badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          icon: <CalendarCheck className="h-4 w-4 text-purple-400" />
        };
      case 'post_visit':
        return {
          border: 'border-cyan-500/30 hover:border-cyan-500/60',
          badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          icon: <Clock className="h-4 w-4 text-cyan-400" />
        };
      case 'hot_lead':
        return {
          border: 'border-amber-500/30 hover:border-amber-500/60',
          badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: <Flame className="h-4 w-4 text-amber-400" />
        };
      case 'closing_opportunity':
        return {
          border: 'border-emerald-500/30 hover:border-emerald-500/60',
          badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: <Award className="h-4 w-4 text-emerald-400" />
        };
      case 'lead_at_risk':
      default:
        return {
          border: 'border-amber-500/20 hover:border-amber-500/50',
          badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: <ShieldAlert className="h-4 w-4 text-amber-400" />
        };
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
      {/* Title & Stats Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Today's Revenue Action Board
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {data?.total_priorities || 0} Actions Due
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Prioritized execution queue: Execute top revenue actions to drive site visits and deal closures today.
          </p>
        </div>

        <button
          onClick={fetchPriorities}
          disabled={refreshing}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition"
          title="Refresh priorities"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All ({data?.total_priorities || 0})
        </button>
        {(data?.overdue_count || 0) > 0 && (
          <button
            onClick={() => setActiveTab('overdue')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'overdue'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-slate-950 text-rose-400 hover:bg-rose-500/10 border border-slate-800'
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            Overdue ({data?.overdue_count})
          </button>
        )}
        {(data?.today_actions_count || 0) > 0 && (
          <button
            onClick={() => setActiveTab('today')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'today'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-950 text-purple-400 hover:bg-purple-500/10 border border-slate-800'
            }`}
          >
            <CalendarCheck className="h-3 w-3" />
            Today's Visits & Calls ({data?.today_actions_count})
          </button>
        )}
        {(data?.post_visit_count || 0) > 0 && (
          <button
            onClick={() => setActiveTab('post_visit')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'post_visit'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-950 text-cyan-400 hover:bg-cyan-500/10 border border-slate-800'
            }`}
          >
            <Clock className="h-3 w-3" />
            Post-Visit ({data?.post_visit_count})
          </button>
        )}
        {(data?.hot_leads_count || 0) > 0 && (
          <button
            onClick={() => setActiveTab('hot')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'hot'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-slate-950 text-amber-400 hover:bg-amber-500/10 border border-slate-800'
            }`}
          >
            <Flame className="h-3 w-3" />
            Hot Leads ({data?.hot_leads_count})
          </button>
        )}
        {(data?.closing_count || 0) > 0 && (
          <button
            onClick={() => setActiveTab('closers')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'closers'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-950 text-emerald-400 hover:bg-emerald-500/10 border border-slate-800'
            }`}
          >
            <Award className="h-3 w-3" />
            Closing Deals ({data?.closing_count})
          </button>
        )}
        {(data?.risk_count || 0) > 0 && (
          <button
            onClick={() => setActiveTab('risk')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'risk'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-slate-950 text-amber-400 hover:bg-amber-500/10 border border-slate-800'
            }`}
          >
            <ShieldAlert className="h-3 w-3" />
            Leads at Risk ({data?.risk_count})
          </button>
        )}
      </div>

      {/* Priority Cards Queue */}
      {filteredItems.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center space-y-2">
          <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
          <p className="text-sm font-bold text-white">No urgent priorities in this category!</p>
          <p className="text-xs text-slate-400">All scheduled actions are up to date. Keep maintaining momentum.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[580px] overflow-y-auto pr-1">
          {filteredItems.map((item, index) => {
            const style = getCardStyle(item.type, item.priority_rank);
            const isHighVal = item.deal_value >= 100;
            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl bg-slate-950/60 border ${style.border} transition-all duration-200 flex flex-col justify-between space-y-3 shadow-md`}
              >
                {/* Top Row: Priority Badge, Rank, Value & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${style.badgeBg}`}>
                      {style.icon}
                      {item.badge_label}
                    </span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      P{item.priority_rank}
                    </span>
                    <span className="text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                      {item.due_label}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-white block">
                      {item.deal_value > 0 ? `₹${item.deal_value}L` : 'Budget N/A'}
                    </span>
                    {isHighVal && (
                      <span className="text-[9px] font-extrabold text-amber-400 bg-amber-500/10 px-1 rounded">
                        High Value
                      </span>
                    )}
                  </div>
                </div>

                {/* Lead Info & Task Title */}
                <div>
                  <h4 className="text-sm font-bold text-white leading-snug">
                    {item.lead_name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Stage: <span className="text-slate-200 font-medium">{item.status}</span> • Assigned: {item.assigned_to_name || 'Unassigned'}
                  </p>
                </div>

                {/* Reason Callout */}
                <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Context & Urgency</span>
                  <p className="text-[11px] text-slate-300">{item.reason}</p>
                </div>

                {/* Next Recommended Action */}
                <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-2">
                  <Zap className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold tracking-wider text-blue-400 uppercase block">Recommended Action</span>
                    <p className="text-xs font-semibold text-white truncate">{item.recommended_action}</p>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <WhatsAppButton 
                      leadId={item.lead_id} 
                      phone={item.lead_phone} 
                      leadName={item.lead_name} 
                      variant="icon" 
                      onMessageSent={loadPriorities}
                    />
                    <a
                      href={`tel:${item.lead_phone}`}
                      className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                      title="Call Phone"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onOpenFollowupModal && (
                      <button
                        onClick={() => onOpenFollowupModal(item.lead_id, item.lead_name)}
                        className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 text-xs font-semibold transition flex items-center gap-1"
                        title="Schedule Follow-up"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        Task
                      </button>
                    )}
                    {onOpenLeadDrawer && (
                      <button
                        onClick={() => onOpenLeadDrawer(item.lead_id)}
                        className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-semibold transition flex items-center gap-1"
                        title="360° View"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        360°
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
