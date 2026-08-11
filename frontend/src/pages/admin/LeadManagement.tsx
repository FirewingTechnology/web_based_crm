import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Download, Upload, Eye, Calendar, Trash2, Edit } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { LeadModal } from '../../components/modals/LeadModal';
import { LeadDrawer } from '../../components/modals/LeadDrawer';
import { FollowupModal } from '../../components/modals/FollowupModal';
import { CSVImportModal } from '../../components/modals/CSVImportModal';
import { WhatsAppButton } from '../../components/common/WhatsAppButton';
import { leadsApi } from '../../api/leads';
import { followupsApi } from '../../api/followups';
import { usersApi } from '../../api/users';
import { projectsApi } from '../../api/projects';
import { Lead, LeadCreateInput } from '../../types/lead';
import { User } from '../../types/user';
import { Project } from '../../types/project';
import { FollowupCreateInput } from '../../types/followup';

export const LeadManagement: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [executives, setExecutives] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Modals state
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const fetchLeads = async () => {
    try {
      const data = await leadsApi.getLeads();
      setLeads(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExecutives = async () => {
    try {
      const data = await usersApi.getUsers();
      setExecutives(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjects = async () => {
    try {
      const data = await projectsApi.getProjects();
      setProjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchExecutives();
    fetchProjects();
  }, []);

  const handleCreateOrUpdateLead = async (data: LeadCreateInput) => {
    if (editingLead) {
      await leadsApi.updateLead(editingLead.id, data);
    } else {
      await leadsApi.createLead(data);
    }
    fetchLeads();
  };

  const handleDeleteLead = async (id: number) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      await leadsApi.deleteLead(id);
      fetchLeads();
    }
  };

  const handleAddNote = async (leadId: number, noteText: string) => {
    await leadsApi.addNote(leadId, noteText);
    const updated = await leadsApi.getLead(leadId);
    setSelectedLead(updated);
    fetchLeads();
  };

  const handleScheduleFollowup = async (data: FollowupCreateInput) => {
    await followupsApi.createFollowup(data);
    alert('Followup task scheduled successfully!');
  };

  const handleImportCSV = async (file: File) => {
    await leadsApi.importCSV(file);
    fetchLeads();
  };

  const statusVariant: Record<string, 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate'> = {
    New: 'blue',
    Contacted: 'slate',
    Qualified: 'amber',
    'Site Visit Scheduled': 'purple',
    Negotiation: 'amber',
    Booked: 'emerald',
    Lost: 'rose',
  };

  const priorityVariant: Record<string, 'blue' | 'emerald' | 'amber' | 'rose'> = {
    Low: 'blue',
    Medium: 'emerald',
    High: 'amber',
    Urgent: 'rose',
  };

  const columns: ColumnDef<Lead>[] = [
    {
      accessorKey: 'name',
      header: 'Lead Name & Phone',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-white">{row.original.name}</p>
          <p className="text-slate-400 text-xs">{row.original.phone}</p>
        </div>
      ),
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }) => <span className="text-slate-300 text-xs font-medium">{row.original.source}</span>,
    },
    {
      accessorKey: 'budget_max',
      header: 'Budget & Location',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-200">
            ₹{row.original.budget_min || 0}L - ₹{row.original.budget_max || 0}L
          </p>
          <p className="text-slate-400 text-[11px]">{row.original.preferred_location || 'Any location'}</p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.status] || 'blue'}>{row.original.status}</Badge>
      ),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => (
        <Badge variant={priorityVariant[row.original.priority] || 'emerald'}>{row.original.priority}</Badge>
      ),
    },
    {
      accessorKey: 'assigned_to_name',
      header: 'Assigned Exec',
      cell: ({ row }) => (
        <span className="text-xs text-slate-300 font-medium">
          {row.original.assigned_to_name || 'Unassigned'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <WhatsAppButton phone={row.original.phone} leadName={row.original.name} variant="icon" />
          <button
            onClick={() => {
              setSelectedLead(row.original);
              setIsDrawerOpen(true);
            }}
            title="360° Lead View"
            className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setSelectedLead(row.original);
              setIsFollowupModalOpen(true);
            }}
            title="Schedule Followup"
            className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition"
          >
            <Calendar className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setEditingLead(row.original);
              setIsLeadModalOpen(true);
            }}
            title="Edit Lead"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteLead(row.original.id)}
            title="Delete Lead"
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Lead Management Pipeline</h1>
          <p className="text-xs text-slate-400 mt-1">Track buyer requirements, assign executives & log timeline history</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<Download className="h-4 w-4" />}
            onClick={() => leadsApi.exportCSV()}
          >
            Export CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<Upload className="h-4 w-4" />}
            onClick={() => setIsImportModalOpen(true)}
          >
            Import CSV
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setEditingLead(null);
              setIsLeadModalOpen(true);
            }}
          >
            Add New Lead
          </Button>
        </div>
      </div>

      {/* Main Data Table */}
      <DataTable columns={columns} data={leads} searchPlaceholder="Search lead name, phone, email, location..." />

      {/* Lead Add/Edit Modal */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSubmit={handleCreateOrUpdateLead}
        initialLead={editingLead}
        executives={executives}
        projects={projects}
      />

      {/* 360° Lead View Drawer */}
      <LeadDrawer
        lead={selectedLead}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onAddNote={handleAddNote}
        onOpenFollowupModal={(l) => {
          setSelectedLead(l);
          setIsFollowupModalOpen(true);
        }}
      />

      {/* Schedule Followup Modal */}
      <FollowupModal
        isOpen={isFollowupModalOpen}
        onClose={() => setIsFollowupModalOpen(false)}
        onSubmit={handleScheduleFollowup}
        preselectedLead={selectedLead}
        leads={leads}
        executives={executives}
      />

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportCSV}
      />
    </div>
  );
};
