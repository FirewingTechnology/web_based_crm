import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  MapPin,
  Clock,
  Phone,
  ShieldAlert,
  DollarSign,
  CheckCircle2,
  ArrowUpRight,
  Activity,
  Sparkles,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { reportsApi } from '../../api/reports';
import { automationApi } from '../../api/automation';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface BusinessTodayData {
  date: string;
  kpis: {
    active_pipeline_cr: number;
    at_risk_lakhs: number;
    site_visits_today: number;
    site_visits_verified: number;
    site_visits_pending: number;
    pending_commissions_lakhs: number;
    sla_breaches_count: number;
    leads_ingested_today: number;
    calls_logged_today: number;
  };
  urgent_action_items: Array<{
    type: string;
    title: string;
    lead_id: number;
    phone: string;
    project: string;
    budget: string;
    reason: string;
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}

interface BusinessTodayCommandCenterProps {
  onOpenCallLogger?: (leadId: number, phone: string) => void;
  onOpenLead?: (leadId: number) => void;
}

export const BusinessTodayCommandCenter: React.FC<BusinessTodayCommandCenterProps> = ({
  onOpenCallLogger,
  onOpenLead
}) => {
  const [data, setData] = useState<BusinessTodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningSlaCheck, setRunningSlaCheck] = useState(false);
  const [slaResultMsg, setSlaResultMsg] = useState<string | null>(null);

  const loadCommandCenter = async () => {
    try {
      setLoading(true);
      const res = await reportsApi.getBusinessToday();
      setData(res);
    } catch (err) {
      console.error('Failed to load Business Today command center', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommandCenter();
  }, []);

  const handleRunSlaCheck = async () => {
    try {
      setRunningSlaCheck(true);
      setSlaResultMsg(null);
      const res = await automationApi.triggerSlaCheck();
      setSlaResultMsg(`Evaluated ${res.evaluated_leads} leads for SLA escalation.`);
      await loadCommandCenter();
    } catch (err) {
      console.error('Failed to trigger SLA check', err);
      setSlaResultMsg('Failed to trigger SLA check');
    } finally {
      setRunningSlaCheck(false);
      setTimeout(() => setSlaResultMsg(null), 4000);
    }
  };

  if (loading && !data) {
    return (
      <div className="bg-[#0b0f17] border border-slate-800/80 rounded-2xl p-6 animate-pulse mb-8">
        <div className="h-6 w-64 bg-slate-800 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-24 bg-slate-800/60 rounded-xl"></div>
          <div className="h-24 bg-slate-800/60 rounded-xl"></div>
          <div className="h-24 bg-slate-800/60 rounded-xl"></div>
          <div className="h-24 bg-slate-800/60 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-gradient-to-br from-[#0c121e] via-[#090d16] to-[#06080d] border border-blue-900/40 shadow-2xl shadow-blue-950/20 rounded-2xl p-5 sm:p-6 mb-8 relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/60 relative z-10">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                Business Today <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Command Center</span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{data.date} • Live Revenue Operating System</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {slaResultMsg && (
            <span className="text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-lg">
              {slaResultMsg}
            </span>
          )}
          <button
            onClick={handleRunSlaCheck}
            disabled={runningSlaCheck}
            className="flex items-center gap-1.5 text-xs font-medium text-amber-300 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-700/40 px-3 py-1.5 rounded-lg transition-all"
          >
            <Clock className={`w-3.5 h-3.5 ${runningSlaCheck ? 'animate-spin' : ''}`} />
            {runningSlaCheck ? 'Evaluating...' : 'Verify SLA Escalations'}
          </button>
          <button
            onClick={loadCommandCenter}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-750 border border-slate-700/60 px-3 py-1.5 rounded-lg transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 relative z-10">
        {/* KPI 1: Active Pipeline */}
        <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 transition-all hover:border-blue-700/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Pipeline</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-white tracking-tight">₹{data.kpis.active_pipeline_cr}</span>
            <span className="text-xs font-semibold text-blue-400">Cr</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
            <span className="text-emerald-400 font-semibold">{data.kpis.leads_ingested_today} new today</span>
            <span>•</span>
            <span>{data.kpis.calls_logged_today} calls</span>
          </div>
        </div>

        {/* KPI 2: At Risk Deals */}
        <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 transition-all hover:border-rose-700/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">At-Risk Value</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-rose-400 tracking-tight">₹{data.kpis.at_risk_lakhs}</span>
            <span className="text-xs font-semibold text-rose-400/80">Lakhs</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-rose-300/80">
            <span>{data.kpis.sla_breaches_count} SLA breaches</span>
            <span>•</span>
            <span className="font-semibold text-rose-400">Needs Outreach</span>
          </div>
        </div>

        {/* KPI 3: Site Visits Today */}
        <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 transition-all hover:border-emerald-700/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Site Visits Today</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-white tracking-tight">{data.kpis.site_visits_today}</span>
            <span className="text-xs font-semibold text-slate-400">Scheduled</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
            <span className="text-emerald-400 font-semibold">{data.kpis.site_visits_verified} GPS Verified</span>
            <span>•</span>
            <span>{data.kpis.site_visits_pending} Pending</span>
          </div>
        </div>

        {/* KPI 4: Pending Commissions */}
        <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 transition-all hover:border-amber-700/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pending Commissions</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-amber-300 tracking-tight">₹{data.kpis.pending_commissions_lakhs}</span>
            <span className="text-xs font-semibold text-amber-300/80">Lakhs</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
            <span>Stage: Post-Booking</span>
            <span>•</span>
            <span className="text-amber-400 font-semibold">Active Ledger</span>
          </div>
        </div>
      </div>

      {/* Urgent Action Items Section */}
      {data.urgent_action_items.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-800/60 relative z-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Immediate Revenue Action Items ({data.urgent_action_items.length})
            </h3>
            <span className="text-[11px] text-slate-500">Auto-ranked by urgency & deal size</span>
          </div>

          <div className="space-y-2.5">
            {data.urgent_action_items.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-900/50 hover:bg-slate-850/70 border border-slate-800/70 hover:border-slate-700 transition-all gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-1.5 rounded-lg ${
                    item.urgency === 'HIGH' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {item.type === 'SITE_VISIT_TODAY' ? (
                      <MapPin className="w-4 h-4" />
                    ) : (
                      <Phone className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white hover:text-blue-400 cursor-pointer" onClick={() => onOpenLead && onOpenLead(item.lead_id)}>
                        {item.title}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                        {item.project}
                      </span>
                      <span className="text-xs font-bold text-emerald-400">{item.budget}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{item.reason}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {item.phone && (
                    <button
                      onClick={() => onOpenCallLogger && onOpenCallLogger(item.lead_id, item.phone)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/50 px-2.5 py-1.5 rounded-lg transition-all"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Log Call
                    </button>
                  )}
                  {item.phone && (
                    <a
                      href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/20 hover:bg-emerald-900/40 border border-emerald-800/40 px-2 py-1.5 rounded-lg transition-all"
                      title="Open WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => onOpenLead && onOpenLead(item.lead_id)}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-300 bg-slate-800/60 hover:bg-slate-700 border border-slate-700/60 px-2.5 py-1.5 rounded-lg transition-all"
                  >
                    View
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
