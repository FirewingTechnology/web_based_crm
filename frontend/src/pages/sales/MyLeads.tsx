import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Eye, Calendar, Edit, AlertTriangle, Activity, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { LeadModal } from '../../components/modals/LeadModal';
import { LeadDrawer } from '../../components/modals/LeadDrawer';
import { FollowupModal } from '../../components/modals/FollowupModal';
import { WhatsAppButton } from '../../components/common/WhatsAppButton';
import { leadsApi } from '../../api/leads';
import { followupsApi } from '../../api/followups';
import { Lead, LeadCreateInput } from '../../types/lead';
import { FollowupCreateInput } from '../../types/followup';

export const MyLeads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [healthFilter, setHealthFilter] = useState<'all' | 'leakage' | 'high_value' | 'healthy'>('all');
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);

  const fetchMyLeads = async () => {
    try {
      const data = await leadsApi.getLeads({ my_leads_only: true });
      setLeads(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMyLeads();
  }, []);

  const handleStatusChange = async (leadId: number, newStatus: string) => {
    try {
      await leadsApi.updateLead(leadId, { status: newStatus as any });
      await fetchMyLeads();
      if (selectedLead && selectedLead.id === leadId) {
        const updated = await leadsApi.getLead(leadId);
        setSelectedLead(updated);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleCreateOrUpdateLead = async (data: LeadCreateInput) => {
    if (editingLead) {
      await leadsApi.updateLead(editingLead.id, data);
    } else {
      await leadsApi.createLead(data);
    }
    fetchMyLeads();
  };

  const handleAddNote = async (leadId: number, noteText: string) => {
    await leadsApi.addNote(leadId, noteText);
    const updated = await leadsApi.getLead(leadId);
    setSelectedLead(updated);
    fetchMyLeads();
  };

  const handleScheduleFollowup = async (data: FollowupCreateInput) => {
    await followupsApi.createFollowup(data);
    alert('Followup task scheduled!');
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
      accessorKey: 'budget_max',
      header: 'Budget & Location',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-200">₹{row.original.budget_min || 0}L - ₹{row.original.budget_max || 0}L</p>
          <p className="text-slate-400 text-[11px]">{row.original.preferred_location || 'Any'}</p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status (Quick Change)',
      cell: ({ row }) => (
        <select
          value={row.original.status}
          onChange={(e) => handleStatusChange(row.original.id, e.target.value)}
          className={clsx(
            'text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer bg-slate-900 transition focus:outline-none focus:ring-1 focus:ring-blue-500',
            row.original.status === 'Booked' && 'border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10',
            row.original.status === 'New' && 'border-blue-500/50 text-blue-400 hover:bg-blue-500/10',
            row.original.status === 'Contacted' && 'border-slate-500/50 text-slate-300 hover:bg-slate-500/10',
            row.original.status === 'Qualified' && 'border-amber-500/50 text-amber-400 hover:bg-amber-500/10',
            row.original.status === 'Site Visit Scheduled' && 'border-purple-500/50 text-purple-400 hover:bg-purple-500/10',
            row.original.status === 'Negotiation' && 'border-amber-500/50 text-amber-400 hover:bg-amber-500/10',
            row.original.status === 'Lost' && 'border-rose-500/50 text-rose-400 hover:bg-rose-500/10'
          )}
        >
          <option value="New" className="bg-slate-900 text-slate-200">New</option>
          <option value="Contacted" className="bg-slate-900 text-slate-200">Contacted</option>
          <option value="Qualified" className="bg-slate-900 text-slate-200">Qualified</option>
          <option value="Site Visit Scheduled" className="bg-slate-900 text-slate-200">Site Visit Scheduled</option>
          <option value="Negotiation" className="bg-slate-900 text-slate-200">Negotiation</option>
          <option value="Booked" className="bg-slate-900 text-slate-200">Booked 🎉</option>
          <option value="Lost" className="bg-slate-900 text-slate-200">Lost</option>
        </select>
      ),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => (
        <Badge variant={row.original.priority === 'High' ? 'amber' : 'emerald'}>{row.original.priority}</Badge>
      ),
    },
    {
      accessorKey: 'health_score',
      header: 'Health & Next Action',
      cell: ({ row }) => {
        const score = row.original.health_score ?? 100;
        const category = row.original.health_category || 'Healthy';
        const isHighValue = ((row.original.budget_max || row.original.budget_min || 0) >= 100);
        return (
          <div className="flex flex-col gap-1 min-w-[150px]">
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center justify-center font-bold px-1.5 py-0.5 rounded text-[11px] ${
                score >= 90
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : score >= 70
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                  : score >= 50
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}>
                {score}
              </span>
              <span className="text-xs font-semibold text-slate-300">
                {category}
              </span>
              {isHighValue && (
                <span className="text-[9px] font-extrabold px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  ₹1Cr+
                </span>
              )}
            </div>
            {row.original.recommended_action && (
              <p className="text-[10px] text-slate-400 truncate max-w-[180px]" title={row.original.recommended_action}>
                👉 {row.original.recommended_action}
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
        <div className="flex items-center gap-1.5">
          <WhatsAppButton 
            leadId={row.original.id}
            phone={row.original.phone} 
            leadName={row.original.name} 
            variant="icon" 
            onMessageSent={loadLeads}
          />
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
            title="Edit Lead Details"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const filteredLeads = React.useMemo(() => {
    if (healthFilter === 'leakage') {
      return leads.filter(l => (l.health_score ?? 100) < 70 && l.status !== 'Booked');
    }
    if (healthFilter === 'high_value') {
      return leads.filter(l => ((l.budget_max || l.budget_min || 0) >= 100) && (l.health_score ?? 100) < 70 && l.status !== 'Booked');
    }
    if (healthFilter === 'healthy') {
      return leads.filter(l => (l.health_score ?? 100) >= 70 || l.status === 'Booked');
    }
    return leads;
  }, [leads, healthFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Active Leads</h1>
          <p className="text-xs text-slate-400 mt-1">Real Estate Revenue Operating System • High priority attention & leak prevention</p>
        </div>

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

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setHealthFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition ${
            healthFilter === 'all'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All My Leads ({leads.length})
        </button>
        <button
          onClick={() => setHealthFilter('leakage')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
            healthFilter === 'leakage'
              ? 'bg-rose-600 text-white shadow'
              : 'bg-slate-900 text-rose-400 hover:bg-rose-500/10 border border-slate-800'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          At Risk / Leakage ({leads.filter(l => (l.health_score ?? 100) < 70 && l.status !== 'Booked').length})
        </button>
        <button
          onClick={() => setHealthFilter('high_value')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
            healthFilter === 'high_value'
              ? 'bg-amber-600 text-white shadow'
              : 'bg-slate-900 text-amber-400 hover:bg-amber-500/10 border border-slate-800'
          }`}
        >
          High Value (₹1Cr+) ({leads.filter(l => ((l.budget_max || l.budget_min || 0) >= 100)).length})
        </button>
        <button
          onClick={() => setHealthFilter('healthy')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
            healthFilter === 'healthy'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 text-emerald-400 hover:bg-emerald-500/10 border border-slate-800'
          }`}
        >
          Healthy & Closed ({leads.filter(l => (l.health_score ?? 100) >= 70 || l.status === 'Booked').length})
        </button>
      </div>

      <DataTable columns={columns} data={filteredLeads} searchPlaceholder="Search lead name, phone, location..." />

      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSubmit={handleCreateOrUpdateLead}
        initialLead={editingLead}
      />

      <LeadDrawer
        lead={selectedLead}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onAddNote={handleAddNote}
        onOpenFollowupModal={(l) => {
          setSelectedLead(l);
          setIsFollowupModalOpen(true);
        }}
        onUpdateStatus={handleStatusChange}
      />

      <FollowupModal
        isOpen={isFollowupModalOpen}
        onClose={() => setIsFollowupModalOpen(false)}
        onSubmit={handleScheduleFollowup}
        preselectedLead={selectedLead}
        leads={leads}
      />
    </div>
  );
};
