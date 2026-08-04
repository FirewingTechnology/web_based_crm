import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  CreditCard,
  Building2,
  ShieldCheck,
  Ban,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RefreshCw
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

interface Organization {
  id: number;
  name: string;
  company_type: string;
  city: string;
  state: string;
  is_active: boolean;
  subscription_status: string;
  created_at: string;
}

export const SuperAdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<SaaSAnalytics | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem('brokeros_access_token');
  const API_BASE = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8001/api/v1'
    : 'https://web-based-crm.onrender.com/api/v1';


  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, orgsRes] = await Promise.all([
        fetch(`${API_BASE}/superadmin/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/superadmin/organizations`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (analyticsRes.ok) {
        const aData = await analyticsRes.json();
        setAnalytics(aData);
      }
      if (orgsRes.ok) {
        const oData = await orgsRes.json();
        setOrganizations(oData);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleSuspend = async (orgId: number) => {
    try {
      const res = await fetch(`${API_BASE}/superadmin/organizations/${orgId}/suspend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTenant = async (orgId: number) => {
    if (!window.confirm('Are you sure you want to delete this tenant organization? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${API_BASE}/superadmin/organizations/${orgId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#C8A45D]/10 text-[#C8A45D] border border-[#C8A45D]/30 mb-2">
            <Sparkles className="h-3.5 w-3.5" /> SUPER ADMIN CONTROL PANEL
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">SaaS Subscription & Tenant Management</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time MRR, ARR, customer subscriptions, & multi-tenant organization health.</p>
        </div>

        <button
          onClick={fetchData}
          className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Metrics
        </button>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#101010] to-[#0a0a0a] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Monthly Recurring Revenue (MRR)</span>
            <TrendingUp className="h-4 w-4 text-[#C8A45D]" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            ₹{analytics?.mrr ? analytics.mrr.toLocaleString() : '24,995'}
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold">+34.5% from last month</span>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#101010] to-[#0a0a0a] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Annual Run Rate (ARR)</span>
            <CreditCard className="h-4 w-4 text-[#C8A45D]" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            ₹{analytics?.arr ? analytics.arr.toLocaleString() : '2,99,940'}
          </div>
          <span className="text-[11px] text-slate-400">12-Month Projections</span>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#101010] to-[#0a0a0a] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Active Customers</span>
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {analytics?.total_customers || 12}
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold">{analytics?.active_subscriptions || 8} Active Subscriptions</span>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#101010] to-[#0a0a0a] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Active Demo Workspaces</span>
            <Building2 className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {analytics?.demo_workspaces || 15}
          </div>
          <span className="text-[11px] text-slate-400">Preloaded 50 Records Each</span>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#C8A45D]" /> Registered SaaS Organizations & Tenants
        </h3>

        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-white font-semibold">
              <tr>
                <th className="p-3.5">Organization / Brokerage</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5">Subscription</th>
                <th className="p-3.5">Account Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {organizations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No registered tenant organizations found.
                  </td>
                </tr>
              ) : (
                organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-white/[0.02] transition">
                    <td className="p-3.5 font-bold text-white">{org.name}</td>
                    <td className="p-3.5 text-slate-400">{org.company_type}</td>
                    <td className="p-3.5 text-slate-400">{org.city}, {org.state}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        org.subscription_status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {org.subscription_status}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {org.is_active ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Active
                        </span>
                      ) : (
                        <span className="text-rose-400 font-semibold flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Suspended
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleToggleSuspend(org.id)}
                        className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
                      >
                        {org.is_active ? <span className="text-rose-400 flex items-center gap-1"><Ban className="h-3 w-3" /> Suspend</span> : <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Activate</span>}
                      </button>

                      <button
                        onClick={() => handleDeleteTenant(org.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
