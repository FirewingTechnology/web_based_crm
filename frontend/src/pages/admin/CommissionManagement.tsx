import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Coins, DollarSign, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { commissionsApi } from '../../api/commissions';

export const CommissionManagement: React.FC = () => {
  const [commissions, setCommissions] = useState<any[]>([]);

  const fetchCommissions = async () => {
    try {
      const data = await commissionsApi.getCommissions();
      setCommissions(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, []);

  const handleUpdateStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'Pending' ? 'Paid' : 'Pending';
    if (confirm(`Change payout status to ${nextStatus}?`)) {
      await commissionsApi.updateStatus(id, nextStatus, `Updated by Admin on ${new Date().toLocaleDateString()}`);
      fetchCommissions();
    }
  };

  const statusVariant: Record<string, 'emerald' | 'amber' | 'blue'> = {
    Paid: 'emerald',
    Pending: 'amber',
    Partial: 'blue',
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'booking_number',
      header: 'Booking & Builder',
      cell: ({ row }) => (
        <div>
          <p className="font-bold text-white font-mono text-sm">{row.original.booking_number}</p>
          <p className="text-slate-400 text-xs">{row.original.project_name} ({row.original.builder_name})</p>
        </div>
      ),
    },
    {
      accessorKey: 'builder_commission_amount',
      header: 'Gross Builder Comm',
      cell: ({ row }) => (
        <div>
          <p className="font-bold text-emerald-400 text-xs">
            ₹{row.original.builder_commission_amount.toLocaleString()}
          </p>
          <p className="text-slate-400 text-[10px]">{row.original.builder_commission_rate}% Builder Rate</p>
        </div>
      ),
    },
    {
      accessorKey: 'executive_commission_amount',
      header: 'Executive Incentive',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-200 text-xs">
            ₹{row.original.executive_commission_amount.toLocaleString()}
          </p>
          <p className="text-slate-400 text-[10px]">{row.original.executive_name}</p>
        </div>
      ),
    },
    {
      accessorKey: 'broker_commission_amount',
      header: 'Broker Share',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-amber-400 text-xs">
            ₹{row.original.broker_commission_amount.toLocaleString()}
          </p>
          <p className="text-slate-400 text-[10px]">{row.original.broker_name || 'Direct Deal'}</p>
        </div>
      ),
    },
    {
      accessorKey: 'company_margin_amount',
      header: 'Company Net Margin',
      cell: ({ row }) => (
        <span className="font-bold text-blue-400 text-xs">
          ₹{row.original.company_margin_amount.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'payout_status',
      header: 'Payout Status',
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.payout_status] || 'amber'}>{row.original.payout_status}</Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant={row.original.payout_status === 'Paid' ? 'outline' : 'primary'}
          onClick={() => handleUpdateStatus(row.original.id, row.original.payout_status)}
        >
          {row.original.payout_status === 'Paid' ? 'Mark Pending' : 'Mark Paid'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Commission & Payout Ledger</h1>
        <p className="text-xs text-slate-400 mt-1">Audit builder commissions, executive incentives, CP overrides & net company margin</p>
      </div>

      <DataTable columns={columns} data={commissions} searchPlaceholder="Search booking number, builder, lead..." />
    </div>
  );
};
