import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Coins, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { commissionsApi } from '../../api/commissions';

export const MyCommission: React.FC = () => {
  const [commissions, setCommissions] = useState<any[]>([]);

  useEffect(() => {
    commissionsApi.getCommissions().then(setCommissions).catch(console.error);
  }, []);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'booking_number',
      header: 'Booking Ref',
      cell: ({ row }) => (
        <div>
          <p className="font-bold text-white font-mono text-sm">{row.original.booking_number}</p>
          <p className="text-slate-400 text-xs">{row.original.project_name}</p>
        </div>
      ),
    },
    {
      accessorKey: 'lead_name',
      header: 'Lead Name',
      cell: ({ row }) => <span className="font-semibold text-slate-200 text-xs">{row.original.lead_name}</span>,
    },
    {
      accessorKey: 'total_deal_value',
      header: 'Total Deal Value',
      cell: ({ row }) => (
        <span className="font-medium text-slate-200 text-xs">
          ₹{(row.original.total_deal_value / 100000).toFixed(2)} Lakhs
        </span>
      ),
    },
    {
      accessorKey: 'executive_commission_amount',
      header: 'My Incentive / Share',
      cell: ({ row }) => (
        <span className="font-bold text-emerald-400 text-xs">
          ₹{(row.original.executive_commission_amount || row.original.broker_commission_amount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'payout_status',
      header: 'Payout Status',
      cell: ({ row }) => (
        <Badge variant={row.original.payout_status === 'Paid' ? 'emerald' : 'amber'}>
          {row.original.payout_status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">My Commission & Incentives</h1>
        <p className="text-xs text-slate-400 mt-1">Track your deal closing earnings and payout settlement status</p>
      </div>

      <DataTable columns={columns} data={commissions} searchPlaceholder="Search booking number, lead name..." />
    </div>
  );
};
