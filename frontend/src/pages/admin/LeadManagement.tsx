import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Download, Upload, Eye, Calendar, Trash2, Edit, ShieldAlert, AlertTriangle, Activity, Sparkles, RefreshCw } from 'lucide-react';
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
import { Lead, LeadCreateInput, LeadHealthSummary } from '../../types/lead';
import { User } from '../../types/user';
import { Project } from '../../types/project';
import { FollowupCreateInput } from '../../types/followup';

export const LeadManagement: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [executives, setExecutives] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [healthSummary, setHealthSummary] = useState<LeadHealthSummary | null>(null);
  const [healthFilter, setHealthFilter] = useState<'all' | 'leakage' | 'high_value' | 'healthy'>('all');
  const [isRecalculating, setIsRecalculating] = useState(false);

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

  const fetchHealthSummary = async () => {
    try {
      const summary = await leadsApi.getHealthSummary();
      setHealthSummary(summary);
    } catch (err) {
      console.error('Failed to fetch health summary:', err);
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

  const handleRecalculateHealth = async () => {
    setIsRecalculating(true);
    try {
      await leadsApi.recalculateHealth();
      await Promise.all([fetchLeads(), fetchHealthSummary()]);
    } catch (err) {
      console.error('Failed to recalculate health:', err);
    } finally {
      setIsRecalculating(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchHealthSummary();
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
      accessorKey: 'health_score',
      header: 'Revenue Health',
      cell: ({ row }) => {
        const score = row.original.health_score ?? 100;
        const category = row.original.health_category || 'Healthy';
        const isHighValue = ((row.original.budget_max || row.original.budget_min || 0) >= 100);
        return (
          <div className="flex flex-col gap-1 min-w-[145px]">
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
              <p className="text-[10px] text-slate-400 truncate max-w-[170px]" title={row.original.recommended_action}>
                👉 {row.original.recommended_action}
              </p>
            )}
          </div>
        );
      },
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Lead Management Pipeline</h1>
          <p className="text-xs text-slate-400 mt-1">Real Estate Revenue Operating System • Health scoring, leakage tracking & pipeline velocity</p>
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

      {/* Real Estate Revenue Health & Leakage Banner */}
      {healthSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Value at Risk */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-rose-500/30 transition shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Pipeline Value at Risk</span>
              <ShieldAlert className="h-4 w-4 text-rose-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white">
                ₹{healthSummary.pipeline_value_at_risk >= 100 
                  ? `${(healthSummary.pipeline_value_at_risk / 100).toFixed(2)} Cr` 
                  : `${healthSummary.pipeline_value_at_risk.toFixed(1)} L`}
              </span>
              <span className="text-xs text-rose-400 font-medium">
                {healthSummary.critical_count + healthSummary.at_risk_count + healthSummary.lost_risk_count} leads
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {healthSummary.high_value_at_risk_count} high-ticket deals (≥₹1 Cr) slipping
            </p>
          </div>

          {/* Card 2: Critical Leads */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/30 transition shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Critical & Slipping Leads</span>
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-amber-400">
                {healthSummary.critical_count}
              </span>
              <span className="text-xs text-slate-400">
                Score &lt; 50/100
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Requires immediate sales manager escalation</p>
          </div>

          {/* Card 3: Healthy & Excellent */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/30 transition shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Healthy Pipeline</span>
              <Activity className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-400">
                {healthSummary.healthy_count + healthSummary.excellent_count}
              </span>
              <span className="text-xs text-slate-400">
                / {healthSummary.total_leads} Total
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Active cadence, timely follow-ups maintained</p>
          </div>

          {/* Card 4: Leakage Engine Status / Recalculate */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Leakage Engine</span>
              <Sparkles className="h-4 w-4 text-blue-400" />
            </div>
            <div className="my-1">
              <span className="text-[11px] font-medium text-slate-300 block truncate" title={healthSummary.top_leakage_reasons[0]?.reason}>
                Top leak: {healthSummary.top_leakage_reasons[0]?.reason || "Inactivity"}
              </span>
            </div>
            <button
              onClick={handleRecalculateHealth}
              disabled={isRecalculating}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 text-xs font-semibold transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
              {isRecalculating ? 'Auditing Pipeline...' : 'Audit Revenue Health'}
            </button>
          </div>
        </div>
      )}

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
          All Leads ({leads.length})
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
          Revenue Leakage / At Risk ({leads.filter(l => (l.health_score ?? 100) < 70 && l.status !== 'Booked').length})
        </button>
        <button
          onClick={() => setHealthFilter('high_value')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
            healthFilter === 'high_value'
              ? 'bg-amber-600 text-white shadow'
              : 'bg-slate-900 text-amber-400 hover:bg-amber-500/10 border border-slate-800'
          }`}
        >
          High Value At Risk (₹1Cr+) ({leads.filter(l => ((l.budget_max || l.budget_min || 0) >= 100) && (l.health_score ?? 100) < 70 && l.status !== 'Booked').length})
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

      {/* Main Data Table */}
      <DataTable columns={columns} data={filteredLeads} searchPlaceholder="Search lead name, phone, email, location..." />

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
