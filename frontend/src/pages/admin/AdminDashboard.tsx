import React, { useEffect, useState } from 'react';
import { Users, FileCheck2, Coins, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { reportsApi } from '../../api/reports';
import { leadsApi } from '../../api/leads';
import { followupsApi } from '../../api/followups';
import { bookingsApi } from '../../api/bookings';
import { DashboardStats, MonthlySalesChart, LeadSourceDistribution } from '../../types/report';
import { Lead } from '../../types/lead';
import { Followup } from '../../types/followup';
import { Booking } from '../../types/booking';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesChart, setSalesChart] = useState<MonthlySalesChart[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSourceDistribution[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [todaysFollowups, setTodaysFollowups] = useState<Followup[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsData, chartData, sourcesData, leadsData, followupsData, bookingsData] = await Promise.all([
          reportsApi.getDashboardStats(),
          reportsApi.getMonthlySales(),
          reportsApi.getLeadSources(),
          leadsApi.getLeads(),
          followupsApi.getFollowups({ filter_period: 'today' }),
          bookingsApi.getBookings(),
        ]);

        setStats(statsData);
        setSalesChart(chartData);
        setLeadSources(sourcesData);
        setRecentLeads(leadsData.slice(0, 5));
        setTodaysFollowups(followupsData.slice(0, 5));
        setRecentBookings(bookingsData.slice(0, 5));
      } catch (err) {
        console.error('Error loading admin dashboard', err);
      }
    };
    loadDashboard();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Executive Control Dashboard</h1>
        <p className="text-xs text-slate-400 mt-1">Real-time oversight across leads, revenue funnel & CP commissions</p>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Active Leads"
          value={stats?.total_leads || 0}
          subtext={`${stats?.new_leads_today || 0} new today`}
          icon={<Users className="h-6 w-6" />}
          trend="12%"
          color="blue"
        />
        <StatCard
          title="Pipeline Valuation"
          value={`₹${(stats?.total_pipeline_value || 0).toFixed(1)} L`}
          subtext="Estimated active buyer interest"
          icon={<TrendingUp className="h-6 w-6" />}
          trend="18%"
          color="purple"
        />
        <StatCard
          title="Confirmed Bookings"
          value={stats?.total_bookings || 0}
          subtext={`₹${((stats?.total_revenue_generated || 0) / 10000000).toFixed(2)} Cr Revenue`}
          icon={<FileCheck2 className="h-6 w-6" />}
          trend="8%"
          color="emerald"
        />
        <StatCard
          title="Company Net Margin"
          value={`₹${((stats?.total_commission_earned || 0) / 100000).toFixed(2)} L`}
          subtext="Net brokerage after overrides"
          icon={<Coins className="h-6 w-6" />}
          trend="15%"
          color="amber"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Trend Area Chart */}
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Monthly Gross Revenue Trend</h3>
              <p className="text-xs text-slate-400">Total deal value closed per month (in INR)</p>
            </div>
            <Badge variant="blue">Past 6 Months</Badge>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChart}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#f8fafc',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{ color: '#38bdf8', fontWeight: 600 }}
                  labelStyle={{ color: '#f8fafc', fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Lead Source Breakdown Bar Chart */}
        <Card className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Lead Acquisition Channels</h3>
            <p className="text-xs text-slate-400">Lead counts grouped by marketing source</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadSources}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="source" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#f8fafc',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{ color: '#a78bfa', fontWeight: 600 }}
                  labelStyle={{ color: '#f8fafc', fontWeight: 700 }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Grid: Recent Leads & Today's Followups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" /> Recent Inbound Leads
            </h3>
            <Badge variant="slate">{recentLeads.length} Recent</Badge>
          </div>
          <div className="divide-y divide-slate-800/80">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-white">{lead.name}</p>
                  <p className="text-slate-400 text-[11px]">{lead.phone} • {lead.preferred_location}</p>
                </div>
                <div className="text-right">
                  <Badge variant={lead.status === 'Booked' ? 'emerald' : 'blue'} size="sm">
                    {lead.status}
                  </Badge>
                  <p className="text-[10px] text-slate-500 mt-0.5">Assigned: {lead.assigned_to_name || 'Unassigned'}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Today's Followups */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-400" /> Today's Scheduled Followups
            </h3>
            <Badge variant="purple">{todaysFollowups.length} Tasks</Badge>
          </div>
          <div className="divide-y divide-slate-800/80">
            {todaysFollowups.length > 0 ? (
              todaysFollowups.map((f) => (
                <div key={f.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white">{f.title}</p>
                    <p className="text-slate-400 text-[11px]">Lead: {f.lead_name} ({f.lead_phone})</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={f.status === 'Completed' ? 'emerald' : 'amber'} size="sm">
                      {f.type} • {f.status}
                    </Badge>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(f.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-slate-500 text-xs flex flex-col items-center gap-1">
                <AlertCircle className="h-5 w-5 text-slate-600" />
                No followups scheduled for today.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
