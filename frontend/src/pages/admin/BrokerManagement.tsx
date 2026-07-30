import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, UserCheck, Phone, Mail, Award, Coins, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { BrokerModal } from '../../components/modals/BrokerModal';
import { brokersApi } from '../../api/brokers';
import { BrokerProfile, BrokerCreateInput } from '../../types/broker';

export const BrokerManagement: React.FC = () => {
  const [brokers, setBrokers] = useState<BrokerProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState<BrokerProfile | null>(null);

  const fetchBrokers = async () => {
    try {
      const data = await brokersApi.getBrokers();
      setBrokers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBrokers();
  }, []);

  const handleCreateOrUpdateBroker = async (data: BrokerCreateInput) => {
    if (editingBroker) {
      await brokersApi.updateBroker(editingBroker.id, data);
    } else {
      await brokersApi.createBroker(data);
    }
    fetchBrokers();
  };

  const handleDeleteBroker = async (id: number) => {
    if (confirm('Delete this broker firm?')) {
      await brokersApi.deleteBroker(id);
      fetchBrokers();
    }
  };

  const columns: ColumnDef<BrokerProfile>[] = [
    {
      accessorKey: 'firm_name',
      header: 'Firm Name & Contact',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-white">{row.original.firm_name}</p>
            <p className="text-slate-400 text-xs">{row.original.contact_person} • {row.original.phone}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'commission_rate',
      header: 'Commission Share',
      cell: ({ row }) => (
        <Badge variant="amber" size="md">
          {row.original.commission_rate}% Override
        </Badge>
      ),
    },
    {
      accessorKey: 'total_deals',
      header: 'Total Deals',
      cell: ({ row }) => (
        <span className="font-bold text-white text-xs">{row.original.total_deals} Closed Deals</span>
      ),
    },
    {
      accessorKey: 'total_revenue_generated',
      header: 'Revenue Generated',
      cell: ({ row }) => (
        <span className="font-semibold text-emerald-400 text-xs">
          ₹{(row.original.total_revenue_generated / 100000).toFixed(2)} Lakhs
        </span>
      ),
    },
    {
      accessorKey: 'performance_score',
      header: 'Performance Rating',
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
          <Award className="h-4 w-4" /> {row.original.performance_score} / 5.0
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setEditingBroker(row.original);
              setIsModalOpen(true);
            }}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteBroker(row.original.id)}
            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const [isSingleMode, setIsSingleMode] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">External Broker Network</h1>
          <p className="text-xs text-slate-400 mt-1">Manage Channel Partner brokers, performance scores & payouts</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setEditingBroker(null);
              setIsSingleMode(true);
              setIsModalOpen(true);
            }}
          >
            Add Single Broker
          </Button>

          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setEditingBroker(null);
              setIsSingleMode(false);
              setIsModalOpen(true);
            }}
          >
            Register Broker Firm
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={brokers} searchPlaceholder="Search firm name, contact person..." />

      <BrokerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdateBroker}
        initialBroker={editingBroker}
        defaultSingleMode={isSingleMode}
      />
    </div>
  );
};
