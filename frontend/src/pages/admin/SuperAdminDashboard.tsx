import React, { useEffect, useState } from 'react';
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
  Lock,
  Trash2,
  X,
  Sparkles,
  TrendingUp,
  SlidersHorizontal,
  Mail,
  Phone,
  KeyRound,
  UserCheck
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

export const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'admins' | 'organizations'>('admins');
  const [analytics, setAnalytics] = useState<SaaSAnalytics | null>(null);
  const [organizations, setOrganizations] = useState<TenantOrg[]>([]);
  const [adminsList, setAdminsList] = useState<TenantAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [provisionLoading, setProvisionLoading] = useState(false);
  const [provisionSuccess, setProvisionSuccess] = useState<string | null>(null);
  const [provisionError, setProvisionError] = useState<string | null>(null);

  // Form State
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

  const token = localStorage.getItem('brokeros_access_token');
  const API_BASE = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8001/api/v1'
    : 'https://web-based-crm.onrender.com/api/v1';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, orgsRes, adminsRes] = await Promise.all([
        fetch(`${API_BASE}/superadmin/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/superadmin/organizations`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/superadmin/admins`, {
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
      if (adminsRes.ok) {
        const admData = await adminsRes.json();
        setAdminsList(admData);
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

  const handleResetPassword = async (userId: number, adminName: string) => {
    const newPass = prompt(`Enter new password for Admin '${adminName}':`, 'Admin@123');
    if (!newPass) return;

    try {
      const res = await fetch(`${API_BASE}/superadmin/admins/${userId}/reset-password?new_password=${encodeURIComponent(newPass)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Success: ${data.message}`);
        fetchData();
      } else {
        alert(`Error: ${data.detail}`);
      }
    } catch (err: any) {
      alert(`Failed to reset password: ${err.message}`);
    }
  };

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisionLoading(true);
    setProvisionError(null);
    setProvisionSuccess(null);

    try {
      const res = await fetch(`${API_BASE}/superadmin/create-tenant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAdmin),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to provision tenant.');

      setProvisionSuccess(data.message);
      fetchData();
      setTimeout(() => {
        setIsProvisionModalOpen(false);
        setProvisionSuccess(null);
      }, 2000);
    } catch (err: any) {
      setProvisionError(err.message);
    } finally {
      setProvisionLoading(false);
    }
  };

  const filteredAdmins = adminsList.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.firm_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrgs = organizations.filter((o) =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 space-y-8 bg-[#050505] min-h-screen text-slate-100 selection:bg-[#C8A45D] selection:text-black">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#C8A45D] uppercase tracking-widest mb-1">
            <Sparkles className="h-4 w-4" /> Platform Owner Master Control
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            SaaS Multi-Tenant & Admin Control Panel
          </h1>
          <p className="text-xs text-slate-400 font-light mt-1">
            Monitor real-time MRR, ARR, tenant admin quotas, and manually provision offline channel partner accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsProvisionModalOpen(true)}
            className="px-5 py-3 rounded-xl font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 shadow-lg shadow-[#C8A45D]/25 transition flex items-center gap-2 text-xs"
          >
            <Plus className="h-4 w-4" /> Provision Offline Tenant & Admin
          </button>
          <button
            onClick={fetchData}
            className="px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Metrics
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl bg-[#0e0e0e] border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Monthly Recurring Revenue</span>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">
            ₹{analytics?.mrr?.toLocaleString() || '4,165'}
          </div>
          <p className="text-[11px] text-emerald-400 font-medium">+34.5% MoM Growth</p>
        </div>

        <div className="p-6 rounded-3xl bg-[#0e0e0e] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Annual Run Rate (ARR)</span>
            <CreditCard className="h-5 w-5 text-[#C8A45D]" />
          </div>
          <div className="text-3xl font-black text-[#C8A45D]">
            ₹{analytics?.arr?.toLocaleString() || '49,989'}
          </div>
          <p className="text-[11px] text-slate-500 font-light">12-Month Projected Run-Rate</p>
        </div>

        <div className="p-6 rounded-3xl bg-[#0e0e0e] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Tenant Organizations</span>
            <Building2 className="h-5 w-5 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {organizations.length || analytics?.total_customers || 12}
          </div>
          <p className="text-[11px] text-blue-400 font-medium">Active Accounts</p>
        </div>

        <div className="p-6 rounded-3xl bg-[#0e0e0e] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Active Admins</span>
            <UserCheck className="h-5 w-5 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-purple-400">
            {adminsList.length || 8}
          </div>
          <p className="text-[11px] text-slate-400">System Admin Accounts</p>
        </div>
      </div>

      {/* Main Tabbed Interface */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('admins')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'admins'
                  ? 'bg-[#C8A45D] text-black shadow-lg shadow-[#C8A45D]/20'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="h-4 w-4" /> Tenant Admins Directory ({adminsList.length})
            </button>
            <button
              onClick={() => setActiveTab('organizations')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'organizations'
                  ? 'bg-[#C8A45D] text-black shadow-lg shadow-[#C8A45D]/20'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="h-4 w-4" /> Organizations & Subscriptions ({organizations.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by admin, email, firm..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C8A45D]"
            />
          </div>
        </div>

        {/* Tab 1: Tenant Admins Directory & Quotas */}
        {activeTab === 'admins' && (
          <div className="rounded-3xl bg-[#0e0e0e] border border-white/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 border-b border-white/10 uppercase text-[10px] text-slate-400 tracking-wider">
                  <tr>
                    <th className="py-4 px-6">Admin & Contact</th>
                    <th className="py-4 px-6">Firm / Organization</th>
                    <th className="py-4 px-6">Active Plan</th>
                    <th className="py-4 px-6">Team Seats Used</th>
                    <th className="py-4 px-6">Quota Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAdmins.map((adm) => (
                    <tr key={adm.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#C8A45D]/10 border border-[#C8A45D]/30 text-[#C8A45D] flex items-center justify-center font-bold text-xs uppercase">
                            {adm.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{adm.name}</p>
                            <p className="text-slate-400 text-[11px]">{adm.email}</p>
                            <p className="text-slate-500 text-[10px]">{adm.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-semibold text-slate-200">{adm.firm_name}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                          {adm.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 rounded-full bg-[#C8A45D]/10 text-[#C8A45D] border border-[#C8A45D]/30 text-[11px] font-extrabold uppercase">
                          {adm.plan_name}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <p className="font-bold text-white">
                            {adm.team_seats_used} / {adm.seats_limit} seats
                          </p>
                          <div className="w-32 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full ${
                                adm.team_seats_used >= adm.seats_limit
                                  ? 'bg-red-500'
                                  : 'bg-[#C8A45D]'
                              }`}
                              style={{
                                width: `${Math.min(
                                  (adm.team_seats_used / adm.seats_limit) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
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
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleResetPassword(adm.id, adm.name)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs transition inline-flex items-center gap-1.5"
                        >
                          <KeyRound className="h-3.5 w-3.5 text-[#C8A45D]" /> Reset Password
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAdmins.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                        No tenant admin accounts match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Organizations & Subscriptions */}
        {activeTab === 'organizations' && (
          <div className="rounded-3xl bg-[#0e0e0e] border border-white/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 border-b border-white/10 uppercase text-[10px] text-slate-400 tracking-wider">
                  <tr>
                    <th className="py-4 px-6">Organization Name</th>
                    <th className="py-4 px-6">Company Type</th>
                    <th className="py-4 px-6">Location</th>
                    <th className="py-4 px-6">Subscription Status</th>
                    <th className="py-4 px-6">Account Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-4 px-6">
                        <p className="font-bold text-white text-sm">{org.name}</p>
                        <p className="text-[11px] text-slate-400">Admin: {org.admin_email || 'N/A'}</p>
                      </td>
                      <td className="py-4 px-6">{org.company_type}</td>
                      <td className="py-4 px-6">{org.city}, {org.state}</td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          {org.subscription_status} ({org.plan_code || 'pro'})
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {org.is_active ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-bold">
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
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
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                        No registered tenant organizations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Provision Offline Tenant Modal */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-2xl p-6 sm:p-8 rounded-3xl bg-[#0e0e0e] border border-[#C8A45D]/30 shadow-2xl text-white space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5 text-[#C8A45D] font-bold text-base">
                <Sparkles className="h-5 w-5" /> Provision New Offline Tenant & Admin
              </div>
              <button
                onClick={() => setIsProvisionModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {provisionSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center font-bold">
                {provisionSuccess}
              </div>
            )}

            {provisionError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {provisionError}
              </div>
            )}

            <form onSubmit={handleProvisionSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Admin Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newAdmin.admin_name}
                    onChange={(e) => setNewAdmin({ ...newAdmin, admin_name: e.target.value })}
                    placeholder="e.g. Rajesh Malhotra"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#C8A45D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Admin Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newAdmin.admin_email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, admin_email: e.target.value })}
                    placeholder="rajesh@apexrealty.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#C8A45D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={newAdmin.admin_phone}
                    onChange={(e) => setNewAdmin({ ...newAdmin, admin_phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#C8A45D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Initial Admin Password *</label>
                  <input
                    type="text"
                    required
                    value={newAdmin.admin_password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, admin_password: e.target.value })}
                    placeholder="e.g. Admin@123"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#C8A45D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Organization / Brokerage Name *</label>
                  <input
                    type="text"
                    required
                    value={newAdmin.company_name}
                    onChange={(e) => setNewAdmin({ ...newAdmin, company_name: e.target.value })}
                    placeholder="Apex Realty Channel Partners"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#C8A45D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Company Type</label>
                  <select
                    value={newAdmin.company_type}
                    onChange={(e) => setNewAdmin({ ...newAdmin, company_type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#C8A45D]"
                  >
                    <option value="Channel Partner">Channel Partner (CP)</option>
                    <option value="Brokerage Agency">Brokerage Agency</option>
                    <option value="Real Estate Developer">Real Estate Developer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Subscription Plan</label>
                  <select
                    value={newAdmin.plan_code}
                    onChange={(e) => setNewAdmin({ ...newAdmin, plan_code: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#C8A45D]"
                  >
                    <option value="starter">Starter Plan (₹1,999/mo)</option>
                    <option value="professional">Professional Plan (₹4,999/mo)</option>
                    <option value="enterprise">Enterprise Plan (Custom)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Payment Collection Method</label>
                  <input
                    type="text"
                    value={newAdmin.payment_method}
                    onChange={(e) => setNewAdmin({ ...newAdmin, payment_method: e.target.value })}
                    placeholder="Offline Cash / Bank Transfer"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#C8A45D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Max Team Seats Limit</label>
                  <input
                    type="number"
                    value={newAdmin.seats_limit}
                    onChange={(e) => setNewAdmin({ ...newAdmin, seats_limit: parseInt(e.target.value) || 15 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#C8A45D]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-slate-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={provisionLoading}
                  className="px-6 py-3 rounded-xl font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 shadow-lg shadow-[#C8A45D]/25 transition flex items-center gap-2"
                >
                  {provisionLoading ? 'Provisioning...' : 'Provision Tenant & Dispatch Welcome Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
