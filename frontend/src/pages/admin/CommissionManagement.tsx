import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { 
  Coins, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Receipt, 
  TrendingUp, 
  ArrowUpRight, 
  Filter,
  CheckCircle
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { commissionsApi } from '../../api/commissions';
import { 
  CommissionCommandCenterResponse, 
  CommissionItem, 
  CommissionStage 
} from '../../types/commissionLedger';
import { CommissionStageModal } from '../../components/commissions/CommissionStageModal';

export const CommissionManagement: React.FC = () => {
  const [commandCenter, setCommandCenter] = useState<CommissionCommandCenterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('ALL');
  const [selectedAgingFilter, setSelectedAgingFilter] = useState<string>('ALL');

  // Modal State
  const [selectedCommission, setSelectedCommission] = useState<CommissionItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const data = await commissionsApi.getCommandCenter();
      setCommandCenter(data);
    } catch (err) {
      console.error('Failed to load commission command center:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const handleOpenStageModal = (comm: CommissionItem) => {
    setSelectedCommission(comm);
    setIsModalOpen(true);
  };

  const stageVariant = (stage: string): 'blue' | 'amber' | 'emerald' | 'rose' | 'slate' => {
    switch (stage.toUpperCase()) {
      case 'PAID':
        return 'emerald';
      case 'SUBMITTED':
      case 'APPROVED':
      case 'PAYABLE':
        return 'blue';
      case 'DISPUTED':
        return 'rose';
      case 'EXPECTED':
        return 'amber';
      default:
        return 'slate';
    }
  };

  const agingColor = (bucket: string, days: number): string => {
    if (bucket === 'Paid') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (days > 90) return 'text-rose-400 bg-rose-500/10 border-rose-500/30 font-bold animate-pulse';
    if (days > 60) return 'text-orange-400 bg-orange-500/10 border-orange-500/20 font-semibold';
    if (days > 30) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-slate-300 bg-slate-800/60 border-slate-700/60';
  };

  const filteredCommissions = useMemo(() => {
    if (!commandCenter) return [];
    return commandCenter.commissions.filter((item) => {
      const stageMatch =
        selectedStageFilter === 'ALL' ||
        item.stage.toUpperCase() === selectedStageFilter.toUpperCase();
      const agingMatch =
        selectedAgingFilter === 'ALL' ||
        item.aging_bucket.toUpperCase() === selectedAgingFilter.toUpperCase();
      return stageMatch && agingMatch;
    });
  }, [commandCenter, selectedStageFilter, selectedAgingFilter]);

  const columns: ColumnDef<CommissionItem>[] = [
    {
      accessorKey: 'booking_number',
      header: 'Booking & Deal',
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white font-mono text-xs">{row.original.booking_number}</span>
            <span className="text-[11px] text-blue-400 font-medium">{row.original.unit_number}</span>
          </div>
          <p className="text-slate-400 text-[11px] mt-0.5">
            {row.original.project_name} <span className="text-slate-500">({row.original.builder_name})</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Buyer: <span className="text-slate-300">{row.original.lead_name}</span> • Deal: ₹{(row.original.total_deal_value / 100000).toFixed(1)}L
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'builder_commission_amount',
      header: 'Statutory GST & Net Comm',
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-emerald-400 text-xs">
              ₹{row.original.net_receivable.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Net</span>
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Base: ₹{row.original.builder_commission_amount.toLocaleString('en-IN')} ({row.original.builder_commission_rate}%)
          </p>
          <p className="text-[10px] text-slate-400">
            +18% GST (₹{row.original.gst_amount.toLocaleString('en-IN')}) | -5% TDS (₹{row.original.tds_amount.toLocaleString('en-IN')})
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'company_margin_amount',
      header: 'Margin Split',
      cell: ({ row }) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Company Net:</span>
            <span className="font-bold text-blue-400 font-mono">
              ₹{row.original.company_margin_amount.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>Exec ({row.original.executive_name}):</span>
            <span className="text-slate-300">₹{row.original.executive_commission_amount.toLocaleString('en-IN')}</span>
          </div>
          {row.original.broker_name && (
            <div className="flex items-center justify-between text-[10px] text-amber-400/90">
              <span>CP ({row.original.broker_name}):</span>
              <span>₹{row.original.broker_commission_amount.toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'stage',
      header: 'Stage & Invoicing',
      cell: ({ row }) => (
        <div>
          <Badge variant={stageVariant(row.original.stage)}>
            {row.original.stage}
          </Badge>
          {row.original.invoice_number && (
            <p className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1">
              <Receipt className="w-3 h-3 text-slate-500" />
              {row.original.invoice_number}
            </p>
          )}
          {row.original.payment_reference && (
            <p className="text-[10px] font-mono text-emerald-400/90 mt-0.5 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              UTR: {row.original.payment_reference}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'aging_bucket',
      header: 'Aging & Overdue',
      cell: ({ row }) => {
        const isOverdue = row.original.days_overdue > 0;
        return (
          <div>
            <span
              className={`inline-block px-2 py-0.5 rounded text-[11px] border ${agingColor(
                row.original.aging_bucket,
                row.original.days_overdue
              )}`}
            >
              {row.original.aging_bucket}
            </span>
            {isOverdue && (
              <p className="text-[10px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                {row.original.days_overdue} days overdue
              </p>
            )}
            {!isOverdue && row.original.stage.toUpperCase() !== 'PAID' && row.original.due_date && (
              <p className="text-[10px] text-slate-500 mt-1">
                Due: {new Date(row.original.due_date).toLocaleDateString()}
              </p>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant={row.original.stage.toUpperCase() === 'PAID' ? 'outline' : 'primary'}
          onClick={() => handleOpenStageModal(row.original)}
        >
          {row.original.stage.toUpperCase() === 'PAID' ? 'View / Edit' : 'Update Stage'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Commission Command Center & Aging Ledger
            </h1>
            <Badge variant="blue">Revenue Ops</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-tier broker commissions, 18% GST statutory invoicing, 5% Sec 194H TDS & automated aging buckets
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={fetchLedger}
          disabled={loading}
          className="flex items-center gap-1 self-start md:self-auto"
        >
          <Clock className="w-3.5 h-3.5" />
          Refresh Metrics
        </Button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Total Active Receivable</p>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-white mt-2">
            ₹{(commandCenter?.total_receivable || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-blue-400 mt-1">Submitted & Invoiced to Builders</p>
        </div>

        <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-4 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-rose-300">Total Overdue Aging</p>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-rose-400 mt-2">
            ₹{(commandCenter?.total_overdue || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-rose-400/80 mt-1">Overdue past builder credit terms</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Unbilled Pipeline (Expected)</p>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-amber-400 mt-2">
            ₹{(commandCenter?.total_expected_unbilled || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Booked deals awaiting milestone invoice</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Total Collected & Reconciled</p>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-400 mt-2">
            ₹{(commandCenter?.total_collected || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-emerald-400 mt-1">Settled with UTR confirmation</p>
        </div>
      </div>

      {/* Aging Buckets Horizontal Strip */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Receivable Aging Distribution
            </h3>
          </div>
          {selectedAgingFilter !== 'ALL' && (
            <button
              onClick={() => setSelectedAgingFilter('ALL')}
              className="text-[11px] text-blue-400 hover:underline"
            >
              Clear Aging Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {commandCenter?.aging_buckets.map((b) => {
            const isSelected = selectedAgingFilter === b.bucket;
            const isSevere = b.bucket.includes('90+');
            return (
              <button
                key={b.bucket}
                onClick={() => setSelectedAgingFilter(isSelected ? 'ALL' : b.bucket)}
                className={`p-3 rounded-lg border text-left transition ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/15'
                    : isSevere && b.count > 0
                    ? 'border-rose-500/40 bg-rose-500/10 hover:border-rose-500'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isSevere && b.count > 0 ? 'text-rose-300' : 'text-slate-300'}`}>
                    {b.bucket}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${b.count > 0 ? (isSevere ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400') : 'bg-slate-800 text-slate-500'}`}>
                    {b.count} {b.count === 1 ? 'deal' : 'deals'}
                  </span>
                </div>
                <p className="text-sm font-bold text-white mt-1">
                  ₹{b.total_amount.toLocaleString('en-IN')}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stage Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <span className="text-xs text-slate-400 flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5" /> Stage:
        </span>
        {['ALL', 'EXPECTED', 'SUBMITTED', 'APPROVED', 'PAYABLE', 'PAID', 'DISPUTED'].map((st) => {
          const isSelected = selectedStageFilter === st;
          const count =
            st === 'ALL'
              ? commandCenter?.commissions.length || 0
              : commandCenter?.stage_breakdown[st]?.count || 0;
          return (
            <button
              key={st}
              onClick={() => setSelectedStageFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{st === 'ALL' ? 'All Ledger' : st}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-blue-800 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table Section */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredCommissions}
          searchPlaceholder="Search booking number, builder, lead, invoice #..."
        />
      </div>

      {/* Stage Update Modal */}
      <CommissionStageModal
        commission={selectedCommission}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchLedger();
        }}
      />
    </div>
  );
};
