import React, { useState, useEffect } from 'react';
import { Download, BarChart3, FileSpreadsheet, PieChart as PieIcon, TrendingUp } from 'lucide-react';
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
import { reportsApi } from '../../api/reports';
import { MonthlySalesChart, LeadSourceDistribution, LeadStatusDistribution } from '../../types/report';

export const ReportManagement: React.FC = () => {
  const [salesData, setSalesData] = useState<MonthlySalesChart[]>([]);
  const [sourceData, setSourceData] = useState<LeadSourceDistribution[]>([]);
  const [statusData, setStatusData] = useState<LeadStatusDistribution[]>([]);

  useEffect(() => {
    reportsApi.getMonthlySales().then(setSalesData).catch(console.error);
    reportsApi.getLeadSources().then(setSourceData).catch(console.error);
    reportsApi.getLeadStatuses().then(setStatusData).catch(console.error);
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Executive Reports & Intelligence</h1>
        <p className="text-xs text-slate-400 mt-1">Export full system reports and analyze sales conversion analytics</p>
      </div>

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
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
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
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
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
  );
};
