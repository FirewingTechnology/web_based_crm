import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Target, Trophy, TrendingUp, Edit, UserPlus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { SalesTargetModal } from '../../components/modals/SalesTargetModal';
import { UserCreateModal } from '../../components/modals/UserCreateModal';
import { salesApi } from '../../api/sales';
import { usersApi } from '../../api/users';
import { SalesTarget, SalesTargetCreateInput } from '../../types/sales';
import { User } from '../../types/user';

export const SalesManagement: React.FC = () => {
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [executives, setExecutives] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<SalesTarget | null>(null);

  const fetchTargets = async () => {
    try {
      const data = await salesApi.getSalesTargets();
      setTargets(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExecutives = async () => {
    try {
      const data = await usersApi.getUsers('Sales Executive');
      setExecutives(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTargets();
    fetchExecutives();
  }, []);

  const handleCreateOrUpdateTarget = async (data: SalesTargetCreateInput) => {
    if (editingTarget) {
      await salesApi.updateSalesTarget(editingTarget.id, data);
    } else {
      await salesApi.createSalesTarget(data);
    }
    fetchTargets();
  };

  const columns: ColumnDef<SalesTarget>[] = [
    {
      accessorKey: 'user_name',
      header: 'Sales Executive',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-white">{row.original.user_name}</p>
            <p className="text-slate-400 text-[11px]">Target Period: {row.original.month_year}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'target_amount',
      header: 'Revenue Target (INR)',
      cell: ({ row }) => (
        <span className="font-medium text-slate-200 text-xs">
          ₹{row.original.target_amount} Lakhs Target
        </span>
      ),
    },
    {
      accessorKey: 'achieved_amount',
      header: 'Achieved Revenue',
      cell: ({ row }) => (
        <span className="font-semibold text-emerald-400 text-xs">
          ₹{row.original.achieved_amount} Lakhs Closed
        </span>
      ),
    },
    {
      accessorKey: 'achievement_percentage',
      header: 'Goal Achievement',
      cell: ({ row }) => {
        const pct = row.original.achievement_percentage || 0;
        return (
          <div className="w-36 space-y-1">
            <div className="flex justify-between text-[11px] font-semibold">
              <span className="text-slate-300">{pct}%</span>
              <span className="text-slate-500">{row.original.achieved_bookings}/{row.original.target_bookings} Deals</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <button
          onClick={() => {
            setEditingTarget(row.original);
            setIsModalOpen(true);
          }}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
        >
          <Edit className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sales Team Performance</h1>
          <p className="text-xs text-slate-400 mt-1">Assign monthly revenue targets & track executive deal closures</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<UserPlus className="h-4 w-4" />}
            onClick={() => setIsUserModalOpen(true)}
          >
            Add Sales Executive
          </Button>

          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setEditingTarget(null);
              setIsModalOpen(true);
            }}
          >
            Assign Sales Target
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={targets} searchPlaceholder="Search executive name..." />

      <SalesTargetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdateTarget}
        initialTarget={editingTarget}
        executives={executives}
      />

      <UserCreateModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSuccess={() => {
          fetchExecutives();
          fetchTargets();
        }}
        defaultRole="Sales Executive"
      />
    </div>
  );
};
