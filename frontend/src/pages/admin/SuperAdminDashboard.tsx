import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import {
  ShieldCheck,
  Building2,
  Users,
  CreditCard,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  X,
  Sparkles,
  TrendingUp,
  ArrowUpCircle,
  CalendarClock,
  Mail,
  Phone,
  KeyRound,
  UserCheck,
  IndianRupee,
  Clock,
  BadgeCheck,
  Zap,
} from 'lucide-react';

interface SaaSAnalytics {
  mrr: number;
  arr: number;
  total_customers: number;
  active_subscriptions: number;
  demo_workspaces: number;
  total_revenue: number;
  growth_rate_pct: number;
}

interface TenantOrg {
  id: number;
  name: string;
  company_type: string;
  city: string;
  state: string;
  is_active: boolean;
  admin_name?: string;
  admin_email?: string;
  subscription_status: string;
  plan_code?: string;
  seats_limit?: number;
  created_at: string;
}

interface TenantAdmin {
  id: number;
  name: string;
  email: string;
  phone: string;
  firm_name: string;
  role: string;
  is_active: boolean;
  plan_name: string;
  team_seats_used: number;
  seats_limit: number;
  total_leads: number;
  max_leads: number;
  has_reached_quota: boolean;
  created_at: string;
}

interface RecentPayment {
  id: number;
  payment_id: string;
  order_id: string;
  org_name: string;
  admin_name: string;
  admin_email: string;
  amount: number;
  total_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
}

const PLAN_CONFIG: Record<string, { label: string; seats: number; leads: number; color: string }> = {
  starter:      { label: 'Starter',      seats: 5,   leads: 1000,  color: 'text-blue-400'   },
  professional: { label: 'Professional', seats: 15,  leads: 5000,  color: 'text-[#C8A45D]'  },
  enterprise:   { label: 'Enterprise',   seats: 50,  leads: 25000, color: 'text-purple-400' },
};

export const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'admins' | 'organizations' | 'payments'>('admins');
  const [analytics, setAnalytics] = useState<SaaSAnalytics | null>(null);
  const [organizations, setOrganizations] = useState<TenantOrg[]>([]);
  const [adminsList, setAdminsList] = useState<TenantAdmin[]>([]);
  const [payments, setPayments] = useState<RecentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Provision Modal
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [provisionLoading, setProvisionLoading] = useState(false);
  const [provisionSuccess, setProvisionSuccess] = useState<string | null>(null);
  const [provisionError, setProvisionError] = useState<string | null>(null);

  // Upgrade Plan Modal
  const [upgradeTarget, setUpgradeTarget] = useState<TenantAdmin | null>(null);
  const [upgradeForm, setUpgradeForm] = useState({
    plan_code: 'professional',
    seats_limit: 15,
    max_leads: 5000,
    extend_days: 365,
  });
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Extend Subscription Modal
  const [extendTarget, setExtendTarget] = useState<TenantAdmin | null>(null);
  const [extendDays, setExtendDays] = useState(365);
  const [extendLoading, setExtendLoading] = useState(false);
  const [extendMsg, setExtendMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Form State for provision
  const [newAdmin, setNewAdmin] = useState({
    admin_name: '',
    admin_email: '',
    admin_phone: '',
    admin_password: '',
    company_name: '',
    company_type: 'Channel Partner',
    plan_code: 'professional',
    payment_method: 'Offline Cash / Direct Bank Transfer',
    seats_limit: 15,
    city: 'Mumbai',
    state: 'Maharashtra',
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, orgsRes, adminsRes, paymentsRes] = await Promise.all([
        apiClient.get('/superadmin/analytics'),
        apiClient.get('/superadmin/organizations'),
        apiClient.get('/superadmin/admins'),
        apiClient.get('/superadmin/recent-payments'),
      ]);
      setAnalytics(analyticsRes.data);
      setOrganizations(orgsRes.data);
      setAdminsList(adminsRes.data);
      setPayments(paymentsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch SaaS analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Auto-populate seats/leads when plan changes in upgrade form
  const handlePlanChange = (plan_code: string) => {
    const cfg = PLAN_CONFIG[plan_code] || PLAN_CONFIG.professional;
    setUpgradeForm(f => ({ ...f, plan_code, seats_limit: cfg.seats, max_leads: cfg.leads }));
  };

  const handleToggleSuspend = async (orgId: number) => {
    try {
      await apiClient.post(`/superadmin/organizations/${orgId}/suspend`);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteTenant = async (orgId: number) => {
    if (!window.confirm('Delete this tenant organization? This cannot be undone.')) return;
    try {
      await apiClient.delete(`/superadmin/organizations/${orgId}`);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleResetPassword = async (userId: number, adminName: string) => {
    const newPass = prompt(`Enter new password for '${adminName}':`, 'Admin@123');
    if (!newPass) return;
    try {
      const res = await apiClient.post(`/superadmin/admins/${userId}/reset-password?new_password=${encodeURIComponent(newPass)}`);
      alert(`✅ ${res.data.message}`);
      fetchData();
    } catch (err: any) {
      alert(`Failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleUpgradePlan = async () => {
    if (!upgradeTarget) return;
    setUpgradeLoading(true);
    setUpgradeMsg(null);
    try {
      const res = await apiClient.post(`/superadmin/admins/${upgradeTarget.id}/upgrade-plan`, upgradeForm);
      setUpgradeMsg({ type: 'ok', text: res.data.message });
      fetchData();
      setTimeout(() => { setUpgradeTarget(null); setUpgradeMsg(null); }, 2200);
    } catch (err: any) {
      setUpgradeMsg({ type: 'err', text: err.response?.data?.detail || err.message });
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleExtendSubscription = async () => {
    if (!extendTarget) return;
    setExtendLoading(true);
    setExtendMsg(null);
    try {
      const res = await apiClient.post(`/superadmin/admins/${extendTarget.id}/extend-subscription`, { extend_days: extendDays });
      setExtendMsg({ type: 'ok', text: res.data.message });
      fetchData();
      setTimeout(() => { setExtendTarget(null); setExtendMsg(null); }, 2200);
    } catch (err: any) {
      setExtendMsg({ type: 'err', text: err.response?.data?.detail || err.message });
    } finally {
      setExtendLoading(false);
    }
  };

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisionLoading(true);
    setProvisionError(null);
    setProvisionSuccess(null);
    try {
      const res = await apiClient.post('/superadmin/create-tenant', newAdmin);
      setProvisionSuccess(res.data.message);
      fetchData();
      setTimeout(() => { setIsProvisionModalOpen(false); setProvisionSuccess(null); }, 2200);
    } catch (err: any) {
      setProvisionError(err.response?.data?.detail || err.message || 'Failed to provision tenant.');
    } finally {
      setProvisionLoading(false);
    }
  };

  const filteredAdmins = adminsList.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.firm_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrgs = organizations.filter(o =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const planBadge = (plan: string) => {
    const map: Record<string, string> = {
      STARTER:      'bg-blue-500/10 text-blue-400 border-blue-500/30',
      PROFESSIONAL: 'bg-[#C8A45D]/10 text-[#C8A45D] border-[#C8A45D]/30',
      ENTERPRISE:   'bg-purple-500/10 text-purple-400 border-purple-500/30',
    };
    return map[plan?.toUpperCase()] || 'bg-white/5 text-slate-400 border-white/10';
  };

  return (
    <div className="p-6 md:p-10 space-y-8 bg-[#050505] min-h-screen text-slate-100 selection:bg-[#C8A45D] selection:text-black">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#C8A45D] uppercase tracking-widest mb-1">
            <Sparkles className="h-4 w-4" /> Platform Owner Master Control
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            SaaS Multi-Tenant &amp; Admin Control Panel
          </h1>
          <p className="text-xs text-slate-400 font-light mt-1">
            Monitor MRR/ARR · Provision offline tenants · Upgrade plans · View payment history
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsProvisionModalOpen(true)}
            className="px-5 py-3 rounded-xl font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 shadow-lg shadow-[#C8A45D]/25 transition flex items-center gap-2 text-xs"
          >
            <Plus className="h-4 w-4" /> Provision Offline Tenant
          </button>
          <button
            onClick={fetchData}
            className="px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{error}</div>
      )}

      {/* ── Analytics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl bg-[#0e0e0e] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Monthly Recurring Revenue</span>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">₹{analytics?.mrr?.toLocaleString() || '—'}</div>
          <p className="text-[11px] text-emerald-400 font-medium">+{analytics?.growth_rate_pct || 34.5}% MoM</p>
        </div>

        <div className="p-6 rounded-3xl bg-[#0e0e0e] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Annual Run Rate (ARR)</span>
            <IndianRupee className="h-5 w-5 text-[#C8A45D]" />
          </div>
          <div className="text-3xl font-black text-[#C8A45D]">₹{analytics?.arr?.toLocaleString() || '—'}</div>
          <p className="text-[11px] text-slate-500 font-light">12-Month Projected</p>
        </div>

        <div className="p-6 rounded-3xl bg-[#0e0e0e] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Tenants</span>
            <Building2 className="h-5 w-5 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white">{organizations.length || analytics?.total_customers || '—'}</div>
          <p className="text-[11px] text-blue-400 font-medium">{analytics?.active_subscriptions || '—'} Active Subscriptions</p>
        </div>

        <div className="p-6 rounded-3xl bg-[#0e0e0e] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Revenue Collected</span>
            <BadgeCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">₹{analytics?.total_revenue?.toLocaleString() || '—'}</div>
          <p className="text-[11px] text-slate-500">{payments.filter(p => p.status === 'Captured').length} captured payments</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex gap-2 flex-wrap">
            {(['admins', 'organizations', 'payments'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === tab
                    ? 'bg-[#C8A45D] text-black shadow-lg shadow-[#C8A45D]/20'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'admins' && <><UserCheck className="h-4 w-4" /> Tenant Admins ({adminsList.length})</>}
                {tab === 'organizations' && <><Building2 className="h-4 w-4" /> Organizations ({organizations.length})</>}
                {tab === 'payments' && <><CreditCard className="h-4 w-4" /> Recent Payments ({payments.length})</>}
              </button>
            ))}
          </div>
          {activeTab !== 'payments' && (
            <div className="relative w-full sm:w-72">
              <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter by admin, email, firm..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C8A45D]"
              />
            </div>
          )}
        </div>

        {/* ── Tab: Tenant Admins ── */}
        {activeTab === 'admins' && (
          <div className="rounded-3xl bg-[#0e0e0e] border border-white/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 border-b border-white/10 uppercase text-[10px] text-slate-400 tracking-wider">
                  <tr>
                    <th className="py-4 px-5">Admin &amp; Contact</th>
                    <th className="py-4 px-5">Firm / Org</th>
                    <th className="py-4 px-5">Active Plan</th>
                    <th className="py-4 px-5">Seats Used</th>
                    <th className="py-4 px-5">Quota</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAdmins.map(adm => (
                    <tr key={adm.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#C8A45D]/10 border border-[#C8A45D]/30 text-[#C8A45D] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {adm.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-white">{adm.name}</p>
                            <p className="text-slate-400 text-[11px]">{adm.email}</p>
                            <p className="text-slate-500 text-[10px]">{adm.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <p className="font-semibold text-slate-200">{adm.firm_name}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">{adm.role}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-3 py-1 rounded-full border text-[11px] font-extrabold uppercase ${planBadge(adm.plan_name)}`}>
                          {adm.plan_name}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="space-y-1">
                          <p className="font-bold text-white">{adm.team_seats_used} / {adm.seats_limit} seats</p>
                          <div className="w-28 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full ${adm.team_seats_used >= adm.seats_limit ? 'bg-red-500' : 'bg-[#C8A45D]'}`}
                              style={{ width: `${Math.min((adm.team_seats_used / adm.seats_limit) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        {adm.has_reached_quota ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 font-bold text-[11px]">
                            <AlertTriangle className="h-3.5 w-3.5" /> Quota Full
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[11px]">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Available
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {/* Upgrade Plan */}
                          <button
                            onClick={() => {
                              const cfg = PLAN_CONFIG[adm.plan_name?.toLowerCase()] || PLAN_CONFIG.professional;
                              setUpgradeForm({ plan_code: adm.plan_name?.toLowerCase() || 'professional', seats_limit: adm.seats_limit, max_leads: adm.max_leads, extend_days: 365 });
                              setUpgradeTarget(adm);
                              setUpgradeMsg(null);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#C8A45D]/10 border border-[#C8A45D]/30 hover:bg-[#C8A45D]/20 text-[#C8A45D] text-xs transition inline-flex items-center gap-1.5"
                          >
                            <ArrowUpCircle className="h-3.5 w-3.5" /> Upgrade Plan
                          </button>
                          {/* Extend Subscription */}
                          <button
                            onClick={() => { setExtendTarget(adm); setExtendDays(365); setExtendMsg(null); }}
                            className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 text-xs transition inline-flex items-center gap-1.5"
                          >
                            <CalendarClock className="h-3.5 w-3.5" /> Extend
                          </button>
                          {/* Reset Password */}
                          <button
                            onClick={() => handleResetPassword(adm.id, adm.name)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs transition inline-flex items-center gap-1.5"
                          >
                            <KeyRound className="h-3.5 w-3.5 text-[#C8A45D]" /> Reset Password
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAdmins.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-500 text-xs">No tenant admin accounts match your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Tab: Organizations ── */}
        {activeTab === 'organizations' && (
          <div className="rounded-3xl bg-[#0e0e0e] border border-white/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 border-b border-white/10 uppercase text-[10px] text-slate-400 tracking-wider">
                  <tr>
                    <th className="py-4 px-5">Organization</th>
                    <th className="py-4 px-5">Type</th>
                    <th className="py-4 px-5">Location</th>
                    <th className="py-4 px-5">Subscription</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredOrgs.map(org => (
                    <tr key={org.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-4 px-5">
                        <p className="font-bold text-white">{org.name}</p>
                        <p className="text-[11px] text-slate-400">{org.admin_email || 'N/A'}</p>
                      </td>
                      <td className="py-4 px-5">{org.company_type}</td>
                      <td className="py-4 px-5">{org.city}, {org.state}</td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${planBadge(org.plan_code || '')}`}>
                          {org.subscription_status} · {(org.plan_code || 'pro').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${org.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                          {org.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right space-x-2">
                        <button
                          onClick={() => handleToggleSuspend(org.id)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs transition"
                        >
                          {org.is_active ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteTenant(org.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-xs transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredOrgs.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-500 text-xs">No organizations found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Tab: Recent Payments ── */}
        {activeTab === 'payments' && (
          <div className="rounded-3xl bg-[#0e0e0e] border border-white/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 border-b border-white/10 uppercase text-[10px] text-slate-400 tracking-wider">
                  <tr>
                    <th className="py-4 px-5">Payment ID</th>
                    <th className="py-4 px-5">Organization</th>
                    <th className="py-4 px-5">Admin</th>
                    <th className="py-4 px-5">Amount</th>
                    <th className="py-4 px-5">Method</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-4 px-5">
                        <p className="font-mono text-[10px] text-[#C8A45D]">{p.payment_id}</p>
                        <p className="font-mono text-[10px] text-slate-500">{p.order_id}</p>
                      </td>
                      <td className="py-4 px-5 font-semibold text-slate-200">{p.org_name}</td>
                      <td className="py-4 px-5">
                        <p className="text-white">{p.admin_name}</p>
                        <p className="text-slate-400 text-[10px]">{p.admin_email}</p>
                      </td>
                      <td className="py-4 px-5">
                        <p className="font-bold text-white">₹{p.total_amount?.toLocaleString()}</p>
                        <p className="text-slate-500 text-[10px]">base ₹{p.amount?.toLocaleString()}</p>
                      </td>
                      <td className="py-4 px-5 text-slate-400">{p.payment_method}</td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${
                          p.status === 'Captured' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-slate-400">{p.created_at}</td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr><td colSpan={7} className="py-8 text-center text-slate-500 text-xs">No payment records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════
          MODAL: Upgrade Plan
      ════════════════════════════════════════════ */}
      {upgradeTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-[#0e0e0e] border border-[#C8A45D]/30 shadow-2xl text-white space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-[#C8A45D] font-bold">
                <ArrowUpCircle className="h-5 w-5" /> Upgrade Plan — {upgradeTarget.name}
              </div>
              <button onClick={() => setUpgradeTarget(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">Changing plan for <span className="text-white font-semibold">{upgradeTarget.firm_name}</span></p>

            {upgradeMsg && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${upgradeMsg.type === 'ok' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                {upgradeMsg.text}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">New Plan</label>
                <select
                  value={upgradeForm.plan_code}
                  onChange={e => handlePlanChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#C8A45D]"
                >
                  <option value="starter">Starter — 5 seats · 1,000 leads</option>
                  <option value="professional">Professional — 15 seats · 5,000 leads</option>
                  <option value="enterprise">Enterprise — 50 seats · 25,000 leads</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Seats Limit</label>
                  <input
                    type="number" min={1}
                    value={upgradeForm.seats_limit}
                    onChange={e => setUpgradeForm(f => ({ ...f, seats_limit: parseInt(e.target.value) || 1 }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#C8A45D]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Max Leads</label>
                  <input
                    type="number" min={100}
                    value={upgradeForm.max_leads}
                    onChange={e => setUpgradeForm(f => ({ ...f, max_leads: parseInt(e.target.value) || 100 }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#C8A45D]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Subscription Valid For (days)</label>
                <select
                  value={upgradeForm.extend_days}
                  onChange={e => setUpgradeForm(f => ({ ...f, extend_days: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#C8A45D]"
                >
                  <option value={30}>30 days (1 month)</option>
                  <option value={90}>90 days (3 months)</option>
                  <option value={180}>180 days (6 months)</option>
                  <option value={365}>365 days (1 year)</option>
                  <option value={730}>730 days (2 years)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setUpgradeTarget(null)} className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-400 text-xs font-semibold">
                Cancel
              </button>
              <button
                onClick={handleUpgradePlan}
                disabled={upgradeLoading}
                className="px-6 py-2.5 rounded-xl font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 shadow-lg transition text-xs flex items-center gap-2"
              >
                <Zap className="h-3.5 w-3.5" />
                {upgradeLoading ? 'Upgrading...' : 'Confirm Upgrade'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          MODAL: Extend Subscription
      ════════════════════════════════════════════ */}
      {extendTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-sm p-6 rounded-3xl bg-[#0e0e0e] border border-blue-500/30 shadow-2xl text-white space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-blue-400 font-bold">
                <CalendarClock className="h-5 w-5" /> Extend Subscription
              </div>
              <button onClick={() => setExtendTarget(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">Extending subscription for <span className="text-white font-semibold">{extendTarget.name}</span> — {extendTarget.firm_name}</p>

            {extendMsg && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${extendMsg.type === 'ok' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                {extendMsg.text}
              </div>
            )}

            <div className="space-y-1 text-xs">
              <label className="text-slate-300 font-semibold">Days to Add</label>
              <select
                value={extendDays}
                onChange={e => setExtendDays(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-blue-400"
              >
                <option value={30}>+30 days (1 month)</option>
                <option value={90}>+90 days (3 months)</option>
                <option value={180}>+180 days (6 months)</option>
                <option value={365}>+365 days (1 year)</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setExtendTarget(null)} className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-400 text-xs font-semibold">
                Cancel
              </button>
              <button
                onClick={handleExtendSubscription}
                disabled={extendLoading}
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-400 hover:brightness-110 shadow-lg transition text-xs flex items-center gap-2"
              >
                <CalendarClock className="h-3.5 w-3.5" />
                {extendLoading ? 'Extending...' : `Extend by ${extendDays} Days`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          MODAL: Provision Offline Tenant
      ════════════════════════════════════════════ */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-2xl p-6 sm:p-8 rounded-3xl bg-[#0e0e0e] border border-[#C8A45D]/30 shadow-2xl text-white space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5 text-[#C8A45D] font-bold text-base">
                <Sparkles className="h-5 w-5" /> Provision New Offline Tenant &amp; Admin
              </div>
              <button onClick={() => setIsProvisionModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            {provisionSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center font-bold">{provisionSuccess}</div>
            )}
            {provisionError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{provisionError}</div>
            )}

            <form onSubmit={handleProvisionSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Admin Full Name *', key: 'admin_name', type: 'text', placeholder: 'Rajesh Malhotra' },
                  { label: 'Admin Email *', key: 'admin_email', type: 'email', placeholder: 'rajesh@apexrealty.com' },
                  { label: 'Phone Number *', key: 'admin_phone', type: 'text', placeholder: '+91 98765 43210' },
                  { label: 'Initial Password *', key: 'admin_password', type: 'text', placeholder: 'Admin@123' },
                ].map(f => (
                  <div key={f.key} className="space-y-1">
                    <label className="text-slate-300 font-semibold">{f.label}</label>
                    <input
                      type={f.type}
                      required
                      value={(newAdmin as any)[f.key]}
                      onChange={e => setNewAdmin({ ...newAdmin, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#C8A45D]"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Organization Name *</label>
                  <input
                    type="text" required value={newAdmin.company_name}
                    onChange={e => setNewAdmin({ ...newAdmin, company_name: e.target.value })}
                    placeholder="Apex Realty Channel Partners"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#C8A45D]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Company Type</label>
                  <select value={newAdmin.company_type} onChange={e => setNewAdmin({ ...newAdmin, company_type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#C8A45D]">
                    <option>Channel Partner</option>
                    <option>Brokerage Agency</option>
                    <option>Real Estate Developer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Plan</label>
                  <select value={newAdmin.plan_code} onChange={e => setNewAdmin({ ...newAdmin, plan_code: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#C8A45D]">
                    <option value="starter">Starter (₹1,999/mo)</option>
                    <option value="professional">Professional (₹4,999/mo)</option>
                    <option value="enterprise">Enterprise (Custom)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Payment Method</label>
                  <input type="text" value={newAdmin.payment_method}
                    onChange={e => setNewAdmin({ ...newAdmin, payment_method: e.target.value })}
                    placeholder="Offline Cash / Bank Transfer"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#C8A45D]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Team Seats Limit</label>
                  <input type="number" value={newAdmin.seats_limit}
                    onChange={e => setNewAdmin({ ...newAdmin, seats_limit: parseInt(e.target.value) || 15 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#C8A45D]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button type="button" onClick={() => setIsProvisionModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-slate-400 font-semibold text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={provisionLoading}
                  className="px-6 py-3 rounded-xl font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 shadow-lg shadow-[#C8A45D]/25 transition flex items-center gap-2 text-xs">
                  {provisionLoading ? 'Provisioning...' : 'Provision Tenant & Send Welcome Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
