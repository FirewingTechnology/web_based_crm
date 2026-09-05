import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { 
  Download, 
  BarChart3, 
  FileSpreadsheet, 
  PieChart as PieIcon, 
  TrendingUp, 
  AlertTriangle, 
  Layers, 
  ArrowRight, 
  Coins, 
  Calendar, 
  Sparkles,
  Award,
  Filter
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { reportsApi } from '../../api/reports';
import { revenueAnalyticsApi } from '../../api/revenueAnalytics';
import { MonthlySalesChart, LeadSourceDistribution, LeadStatusDistribution } from '../../types/report';
import { RevenueAnalyticsResponse, ChannelAttributionMetric, FunnelStageMetric } from '../../types/revenueAnalytics';

export const ReportManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'FUNNEL' | 'EXPORTS'>('FUNNEL');
  const [salesData, setSalesData] = useState<MonthlySalesChart[]>([]);
  const [sourceData, setSourceData] = useState<LeadSourceDistribution[]>([]);
  const [statusData, setStatusData] = useState<LeadStatusDistribution[]>([]);
  const [funnelData, setFunnelData] = useState<RevenueAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAllReports = async () => {
    setLoading(true);
    try {
      const [sales, sources, statuses, funnel] = await Promise.all([
        reportsApi.getMonthlySales().catch(() => []),
        reportsApi.getLeadSources().catch(() => []),
        reportsApi.getLeadStatuses().catch(() => []),
        revenueAnalyticsApi.getRevenueFunnel().catch(() => null),
      ]);
      setSalesData(sales);
      setSourceData(sources);
      setStatusData(statuses);
      setFunnelData(funnel);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReports();
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const gradeVariant = (grade: string): 'emerald' | 'blue' | 'amber' | 'rose' | 'slate' => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'emerald';
      case 'B':
        return 'blue';
      case 'C':
        return 'amber';
      case 'D':
        return 'rose';
      default:
        return 'slate';
    }
  };

  const channelColumns: ColumnDef<ChannelAttributionMetric>[] = [
    {
      accessorKey: 'source',
      header: 'Lead Source Channel',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white text-xs">{row.original.source}</span>
          <Badge variant={gradeVariant(row.original.grade)}>Grade {row.original.grade}</Badge>
        </div>
      ),
    },
    {
      accessorKey: 'inquiries',
      header: 'Inquiries',
      cell: ({ row }) => (
        <span className="text-slate-300 font-mono text-xs">{row.original.inquiries}</span>
      ),
    },
    {
      accessorKey: 'site_visits',
      header: 'Site Visits',
      cell: ({ row }) => (
        <span className="text-blue-400 font-semibold text-xs">{row.original.site_visits}</span>
      ),
    },
    {
      accessorKey: 'bookings',
      header: 'Bookings',
      cell: ({ row }) => (
        <span className="text-emerald-400 font-bold text-xs">{row.original.bookings}</span>
      ),
    },
    {
      accessorKey: 'deal_value_inr',
      header: 'Deal Value (INR)',
      cell: ({ row }) => (
        <span className="font-bold text-white text-xs">
          ₹{(row.original.deal_value_inr / 10000000).toFixed(2)} Cr
        </span>
      ),
    },
    {
      accessorKey: 'commission_inr',
      header: 'Commission (INR)',
      cell: ({ row }) => (
        <span className="font-semibold text-amber-400 text-xs">
          ₹{(row.original.commission_inr / 100000).toFixed(1)} Lakhs
        </span>
      ),
    },
    {
      accessorKey: 'conversion_rate',
      header: 'Conversion %',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-purple-400 text-xs">{row.original.conversion_rate}%</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Revenue Analytics & Funnel Leakage</h1>
            <Badge variant="blue">Revenue Ops</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end buyer conversion funnel, attrition leakage diagnosis, and multi-channel marketing ROI
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveTab('FUNNEL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'FUNNEL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Conversion Funnel & Attribution
          </button>
          <button
            onClick={() => setActiveTab('EXPORTS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'EXPORTS'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Charts & CSV Exports
          </button>
        </div>
      </div>

      {activeTab === 'FUNNEL' ? (
        <div className="space-y-6">
          {/* Top KPI Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <p className="text-xs text-slate-400 font-medium">Total Closed Revenue</p>
              <p className="text-xl font-black text-emerald-400 mt-1">
                ₹{((funnelData?.total_closed_revenue || 0) / 10000000).toFixed(2)} Crores
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                From {funnelData?.total_bookings || 0} confirmed bookings
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <p className="text-xs text-slate-400 font-medium">Total Builder Commission</p>
              <p className="text-xl font-black text-amber-400 mt-1">
                ₹{((funnelData?.total_commission || 0) / 100000).toFixed(1)} Lakhs
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Gross brokerage receivable & earned
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <p className="text-xs text-slate-400 font-medium">Overall Inquire-to-Book %</p>
              <p className="text-xl font-black text-purple-400 mt-1">
                {funnelData?.overall_conversion_rate || 0}%
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Benchmark: 2.5% - 4.5% in Indian Real Estate
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <p className="text-xs text-slate-400 font-medium">Avg Sales Velocity</p>
              <p className="text-xl font-black text-blue-400 mt-1">
                {funnelData?.avg_cycle_days || 14.5} Days
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Inquiry creation to booking confirmation
              </p>
            </div>
          </div>

          {/* Bottleneck Leakage Alert */}
          {funnelData && funnelData.bottleneck_stage !== 'None' && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/30 shadow-lg flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-rose-400">
                    Revenue Leakage Bottleneck Detected
                  </span>
                  <Badge variant="rose">{funnelData.bottleneck_stage}</Badge>
                </div>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {funnelData.bottleneck_insight}
                </p>
              </div>
            </div>
          )}

          {/* 6-Stage Visual Conversion Funnel Strip */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                End-to-End Sales Pipeline Funnel & Stage Drop-off
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Stage Attrition Analysis</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-2 relative">
              {funnelData?.funnel_stages.map((st, idx) => {
                const isHighDropoff = st.dropoff_pct >= 50;
                return (
                  <div
                    key={st.stage_key}
                    className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between space-y-2 relative"
                  >
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block truncate">
                        {st.stage_label}
                      </span>
                      <p className="text-lg font-black text-white mt-1">{st.count}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        ₹{(st.value_inr / 10000000).toFixed(1)} Cr
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-700/60">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Conv:</span>
                        <span className="font-bold text-emerald-400">{st.conversion_from_prev_pct}%</span>
                      </div>
                      {idx > 0 && (
                        <div className="flex items-center justify-between text-[10px] mt-0.5">
                          <span className="text-slate-400">Drop:</span>
                          <span className={`font-semibold ${isHighDropoff ? 'text-rose-400' : 'text-slate-400'}`}>
                            -{st.dropoff_count} ({st.dropoff_pct}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Marketing Source Channel Attribution */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Lead Source Channel Quality & Revenue Attribution
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track inquiries, site visit yields, deal closures and gross brokerage generated per marketing channel
                </p>
              </div>
            </div>

            <DataTable
              columns={channelColumns}
              data={funnelData?.channels || []}
              searchPlaceholder="Search lead source channel..."
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* CSV Export Hub */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Automated CSV Data Exports
                </h3>
                <p className="text-xs text-slate-400">Download formatted CSV reports for offline accounting & audit</p>
              </div>
              <Badge variant="emerald">CSV Engine</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                icon={<Download className="h-4 w-4" />}
                onClick={() => reportsApi.exportReportCSV('bookings')}
              >
                Bookings Report CSV
              </Button>
              <Button
                variant="outline"
                icon={<Download className="h-4 w-4" />}
                onClick={() => reportsApi.exportReportCSV('commissions')}
              >
                Commissions Report CSV
              </Button>
              <Button
                variant="outline"
                icon={<Download className="h-4 w-4" />}
                onClick={() => reportsApi.exportReportCSV('builders')}
              >
                Builders Report CSV
              </Button>
              <Button
                variant="outline"
                icon={<Download className="h-4 w-4" />}
                onClick={() => reportsApi.exportReportCSV('leads')}
              >
                Leads Pipeline CSV
              </Button>
            </div>
          </Card>

          {/* Visual Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-400" /> Monthly Revenue Performance
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
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
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                      }}
                      itemStyle={{ color: '#38bdf8', fontWeight: 600 }}
                      labelStyle={{ color: '#f8fafc', fontWeight: 700 }}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-purple-400" /> Lead Pipeline Status Distribution
              </h3>
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="status"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#f8fafc',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                      }}
                      itemStyle={{ color: '#f8fafc', fontWeight: 600 }}
                      labelStyle={{ color: '#f8fafc', fontWeight: 700 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
