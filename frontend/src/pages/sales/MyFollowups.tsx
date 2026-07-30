import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, CheckCircle, Phone, MessageSquare, Calendar, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { FollowupModal } from '../../components/modals/FollowupModal';
import { followupsApi } from '../../api/followups';
import { leadsApi } from '../../api/leads';
import { Followup, FollowupCreateInput } from '../../types/followup';
import { Lead } from '../../types/lead';

export const MyFollowups: React.FC = () => {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMyFollowups = async () => {
    try {
      const data = await followupsApi.getFollowups({ my_followups_only: true });
      setFollowups(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMyFollowups();
    leadsApi.getLeads({ my_leads_only: true }).then(setLeads).catch(console.error);
  }, []);

  const handleCreateFollowup = async (data: FollowupCreateInput) => {
    await followupsApi.createFollowup(data);
    await fetchMyFollowups();
  };

  const handleMarkComplete = async (id: number) => {
    const outcome = prompt('Enter followup interaction outcome notes:', 'Client agreed to site visit.');
    if (outcome !== null) {
      await followupsApi.updateFollowup(id, { status: 'Completed', outcome });
      fetchMyFollowups();
    }
  };

  const statusVariant: Record<string, 'blue' | 'emerald' | 'amber' | 'rose'> = {
    Pending: 'amber',
    Completed: 'emerald',
    Overdue: 'rose',
    Cancelled: 'blue',
  };

  const columns: ColumnDef<Followup>[] = [
    {
      accessorKey: 'title',
      header: 'Task Title & Type',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-white">{row.original.title}</p>
          <p className="text-slate-400 text-xs">{row.original.type} • {row.original.notes || 'No notes'}</p>
        </div>
      ),
    },
    {
      accessorKey: 'lead_name',
      header: 'Buyer Lead',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-200">{row.original.lead_name}</p>
          <p className="text-slate-400 text-[11px]">{row.original.lead_phone}</p>
        </div>
      ),
    },
    {
      accessorKey: 'scheduled_at',
      header: 'Scheduled Date & Time',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-200">
            {new Date(row.original.scheduled_at).toLocaleDateString()}
          </p>
          <p className="text-slate-400 text-[11px]">
            {new Date(row.original.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.status] || 'amber'}>{row.original.status}</Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div>
          {row.original.status !== 'Completed' && (
            <Button
              size="sm"
              variant="primary"
              icon={<CheckCircle className="h-3 w-3" />}
              onClick={() => handleMarkComplete(row.original.id)}
            >
              Complete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Followup Agenda</h1>
          <p className="text-xs text-slate-400 mt-1">Scheduled calls, WhatsApp followups & site visit pickup tasks</p>
        </div>

        <Button
          size="sm"
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Schedule Followup
        </Button>
      </div>

      <DataTable columns={columns} data={followups} searchPlaceholder="Search tasks, title, lead name..." />

      <FollowupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateFollowup}
        leads={leads}
      />
    </div>
  );
};
