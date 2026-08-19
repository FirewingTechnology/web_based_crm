import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Building2, Phone, Mail, MapPin, Edit, Trash2, FolderKanban, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { BuilderModal } from '../../components/modals/BuilderModal';
import { buildersApi } from '../../api/builders';
import { Builder, BuilderCreateInput } from '../../types/builder';

export const BuilderManagement: React.FC = () => {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBuilder, setEditingBuilder] = useState<Builder | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 5000);
  };

  const fetchBuilders = async () => {
    try {
      const data = await buildersApi.getBuilders();
      setBuilders(data);
    } catch (err) {
      console.error('Failed to fetch builders:', err);
    }
  };

  useEffect(() => {
    fetchBuilders();
  }, []);

  const handleCreateOrUpdateBuilder = async (data: BuilderCreateInput) => {
    if (editingBuilder) {
      await buildersApi.updateBuilder(editingBuilder.id, data);
      showNotification('success', `Builder "${data.name}" updated successfully!`);
    } else {
      await buildersApi.createBuilder(data);
      showNotification('success', `Builder "${data.name}" added successfully!`);
    }
    await fetchBuilders();
  };

  const handleDeleteBuilder = async (id: number) => {
    const b = builders.find((x) => x.id === id);
    if (confirm(`Delete builder "${b?.name || 'this builder'}"?`)) {
      try {
        await buildersApi.deleteBuilder(id);
        showNotification('success', `Builder "${b?.name || ''}" removed successfully.`);
        await fetchBuilders();
      } catch (err: any) {
        showNotification('error', err.response?.data?.detail || 'Failed to delete builder.');
      }
    }
  };

  const columns: ColumnDef<Builder>[] = [
    {
      accessorKey: 'name',
      header: 'Builder & Company',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-white">{row.original.name}</p>
            <p className="text-slate-400 text-xs">{row.original.company}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'contact_person',
      header: 'Contact Person',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-200">{row.original.contact_person}</p>
          <p className="text-slate-400 text-[11px]">{row.original.phone}</p>
        </div>
      ),
    },
    {
      accessorKey: 'commission_rate',
      header: 'CP Commission Share',
      cell: ({ row }) => (
        <Badge variant="emerald" size="md">
          {row.original.commission_rate}% Default Comm
        </Badge>
      ),
    },
    {
      accessorKey: 'projects_count',
      header: 'Active Projects',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
          <FolderKanban className="h-4 w-4 text-purple-400" />
          {row.original.projects_count} Projects
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setEditingBuilder(row.original);
              setIsModalOpen(true);
            }}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteBuilder(row.original.id)}
            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm shadow-lg transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Builder Partners</h1>
          <p className="text-xs text-slate-400 mt-1">Manage Tier 1 real estate developers & commission override terms</p>
        </div>

        <Button
          size="sm"
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditingBuilder(null);
            setIsModalOpen(true);
          }}
        >
          Add Builder Partner
        </Button>
      </div>

      {/* Grid of Builder Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {builders.map((builder) => (
          <Card key={builder.id} glow className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                <Building2 className="h-5 w-5" />
              </div>
              <Badge variant="emerald">{builder.commission_rate}% Comm</Badge>
            </div>

            <div>
              <h3 className="font-bold text-white text-base leading-snug">{builder.name}</h3>
              <p className="text-xs text-slate-400">{builder.company}</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs text-slate-300">
              <p className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span>{builder.contact_person} ({builder.phone})</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                <span className="truncate">{builder.email}</span>
              </p>
              {builder.address && (
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{builder.address}</span>
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Main Data Table */}
      <DataTable columns={columns} data={builders} searchPlaceholder="Search builder name, company, contact person..." />

      <BuilderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdateBuilder}
        initialBuilder={editingBuilder}
      />
    </div>
  );
};
