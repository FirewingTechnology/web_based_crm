import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, CheckCircle, Calendar, Phone, MessageSquare, MapPin, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { FollowupModal } from '../../components/modals/FollowupModal';
import { followupsApi } from '../../api/followups';
import { leadsApi } from '../../api/leads';
import { usersApi } from '../../api/users';
import { Followup, FollowupCreateInput } from '../../types/followup';
import { Lead } from '../../types/lead';
import { User } from '../../types/user';

export const FollowupManagement: React.FC = () => {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [executives, setExecutives] = useState<User[]>([]);
  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);

  const fetchFollowups = async () => {
    try {
      const data = await followupsApi.getFollowups({
        filter_period: filterPeriod !== 'all' ? filterPeriod : undefined,
      });
      setFollowups(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, [filterPeriod]);

  useEffect(() => {
    leadsApi.getLeads().then(setLeads).catch(console.error);
    usersApi.getUsers().then(setExecutives).catch(console.error);
  }, []);

  const handleCreateFollowup = async (data: FollowupCreateInput) => {
    await followupsApi.createFollowup(data);
    fetchFollowups();
  };

  const handleMarkComplete = async (id: number) => {
    const outcome = prompt('Enter followup outcome notes:', 'Call answered. Scheduled site visit.');
    if (outcome !== null) {
      await followupsApi.updateFollowup(id, { status: 'Completed', outcome });
      fetchFollowups();
    }
  };

  const handleDeleteFollowup = async (id: number) => {
    if (confirm('Delete this scheduled task?')) {
      await followupsApi.deleteFollowup(id);
      fetchFollowups();
    }
  };

  const typeIcons: Record<string, React.ReactNode> = {
    Call: <Phone className="h-4 w-4 text-blue-400" />,
    WhatsApp: <MessageSquare className="h-4 w-4 text-emerald-400" />,
    Meeting: <Calendar className="h-4 w-4 text-purple-400" />,
    'Site Visit': <MapPin className="h-4 w-4 text-amber-400" />,
    Task: <Clock className="h-4 w-4 text-slate-400" />,
    Reminder: <AlertTriangle className="h-4 w-4 text-rose-400" />,
  };

  const statusVariant: Record<string, 'blue' | 'emerald' | 'amber' | 'rose'> = {
    Pending: 'amber',
    Completed: 'emerald',
    Overdue: 'rose',
    Cancelled: 'blue',
  };

  const columns: ColumnDef<Followup>[] = [
    {
      accessorKey: 'type',
      header: 'Type & Title',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
            {typeIcons[row.original.type] || <Clock className="h-4 w-4 text-slate-400" />}
          </div>
          <div>
            <p className="font-semibold text-white">{row.original.title}</p>
            <p className="text-slate-400 text-xs">{row.original.notes || 'No specific agenda notes'}</p>
          </div>
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
      accessorKey: 'assigned_to_name',
      header: 'Assigned Exec',
      cell: ({ row }) => <span className="text-xs text-slate-300 font-medium">{row.original.assigned_to_name}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.status !== 'Completed' && (
            <Button
              size="sm"
              variant="primary"
              icon={<CheckCircle className="h-3.5 w-3.5" />}
              onClick={() => handleMarkComplete(row.original.id)}
            >
              Complete
            </Button>
          )}
          <button
            onClick={() => handleDeleteFollowup(row.original.id)}
            className="text-xs text-rose-400 hover:underline px-2 py-1"
          >
            Remove
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Followup Calendar & Tasks</h1>
          <p className="text-xs text-slate-400 mt-1">Manage call schedules, chauffeur site visits & meeting reminders</p>
        </div>

        <Button
          size="sm"
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setIsFollowupModalOpen(true)}
        >
          Schedule Followup
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { label: 'All Tasks', value: 'all' },
          { label: "Today's Followups", value: 'today' },
          { label: 'Pending', value: 'pending' },
          { label: 'Overdue Alerts', value: 'overdue' },
          { label: 'Completed', value: 'completed' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterPeriod(f.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterPeriod === f.value
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'glass-card text-slate-400 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable columns={columns} data={followups} searchPlaceholder="Search tasks, title, lead name..." />

      <FollowupModal
        isOpen={isFollowupModalOpen}
        onClose={() => setIsFollowupModalOpen(false)}
        onSubmit={handleCreateFollowup}
        leads={leads}
        executives={executives}
      />
    </div>
  );
};
