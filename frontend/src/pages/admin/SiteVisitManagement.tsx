import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { 
  Calendar, MapPin, Car, Phone, Star, CheckCircle2, ShieldCheck, 
  Clock, AlertCircle, RefreshCw, X, Plus, Filter, UserCheck, Flame, Layers
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { WhatsAppButton } from '../../components/common/WhatsAppButton';
import { SiteVisitScheduleModal } from '../../components/modals/SiteVisitScheduleModal';
import { SiteVisitFeedbackModal } from '../../components/modals/SiteVisitFeedbackModal';
import { siteVisitsApi } from '../../api/siteVisits';
import { SiteVisit } from '../../types/siteVisit';

export const SiteVisitManagement: React.FC = () => {
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('All');
  
  const [selectedVisitForFeedback, setSelectedVisitForFeedback] = useState<SiteVisit | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 5000);
  };

  const loadVisits = async () => {
    setLoading(true);
    try {
      const data = await siteVisitsApi.getSiteVisits();
      setSiteVisits(data);
    } catch (err) {
      console.error('Failed to load site visits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisits();
  }, []);

  // Filtered visits
  const filteredVisits = siteVisits.filter((v) => {
    if (activeStatusFilter === 'All') return true;
    return v.status === activeStatusFilter;
  });

  // KPI Calculations
  const totalVisits = siteVisits.length;
  const inTransitCount = siteVisits.filter((v) => v.status === 'In Transit').length;
  const completedCount = siteVisits.filter((v) => v.status === 'Completed').length;
  const verifiedOtpCount = siteVisits.filter((v) => v.is_otp_verified).length;
  const verificationRate = totalVisits > 0 ? Math.round((verifiedOtpCount / totalVisits) * 100) : 100;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Completed
          </span>
        );
      case 'In Transit':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 animate-pulse">
            <Car className="h-3 w-3 text-blue-400" /> In Transit
          </span>
        );
      case 'Scheduled':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Clock className="h-3 w-3 text-amber-400" /> Scheduled
          </span>
        );
      case 'Cancelled':
      case 'No Show':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30">
            <X className="h-3 w-3 text-rose-400" /> {status}
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
  };

  const columns: ColumnDef<SiteVisit>[] = [
    {
      accessorKey: 'scheduled_at',
      header: 'Visit Schedule',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-white flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-emerald-400" />
            {new Date(row.original.scheduled_at).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}
          </p>
          <p className="text-[11px] text-slate-400">
            {new Date(row.original.scheduled_at).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'lead_name',
      header: 'Client / Buyer',
      cell: ({ row }) => (
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-white">{row.original.lead_name || 'Client'}</p>
            <p className="text-[11px] text-slate-400">{row.original.lead_phone}</p>
          </div>
          {row.original.lead_phone && (
            <WhatsAppButton
              leadId={row.original.lead_id}
              phone={row.original.lead_phone}
              leadName={row.original.lead_name}
              variant="icon"
              onMessageSent={loadVisits}
            />
          )}
        </div>
      ),
    },
    {
      accessorKey: 'project_name',
      header: 'Destination Project',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-white">{row.original.project_name}</p>
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <UserCheck className="h-3 w-3 text-slate-500" />
            Host: {row.original.sales_executive_name || 'Assigned Rep'}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'driver_name',
      header: 'Chauffeur Logistics',
      cell: ({ row }) => (
        <div className="text-[11px]">
          {row.original.driver_name ? (
            <div className="space-y-0.5">
              <p className="font-semibold text-slate-200 flex items-center gap-1">
                <Car className="h-3 w-3 text-blue-400" />
                {row.original.driver_name} ({row.original.cab_vehicle_number || 'Cab'})
              </p>
              <p className="text-slate-400">
                Pickup: {row.original.pickup_location || 'Designated Point'}
              </p>
            </div>
          ) : (
            <span className="text-slate-500 italic">Self / Direct Walk-in</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'otp_code',
      header: 'Security OTP',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-400">
              {row.original.otp_code}
            </span>
          </div>
          {row.original.is_otp_verified ? (
            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-semibold">
              <ShieldCheck className="h-3 w-3" /> Verified Arrival
            </span>
          ) : (
            <span className="text-[10px] text-amber-400/80">Pending Verification</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Visit Status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'feedback_rating',
      header: 'Outcome / Rating',
      cell: ({ row }) => (
        <div className="text-xs">
          {row.original.feedback_rating ? (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                <span>{row.original.feedback_rating} / 5</span>
              </div>
              {row.original.buyer_interest_level && (
                <span className="inline-block text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                  {row.original.buyer_interest_level}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-slate-500 italic">Awaiting completion</span>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          {row.original.status !== 'Completed' && (
            <button
              onClick={() => setSelectedVisitForFeedback(row.original)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition"
            >
              Log Feedback
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm shadow-lg transition-all ${
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Site Visit Operating System
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
              VIP Logistics & Revenue Pipeline
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end VIP chauffeur dispatch, arrival OTP verification & post-visit deal progression
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={loadVisits}
          >
            Refresh
          </Button>

          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setIsScheduleModalOpen(true)}
          >
            Schedule VIP Site Visit
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Site Visits</p>
            <h3 className="text-xl font-black text-white mt-1">{totalVisits}</h3>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">In Transit Right Now</p>
            <h3 className="text-xl font-black text-blue-400 mt-1">{inTransitCount}</h3>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Car className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Completed Visits</p>
            <h3 className="text-xl font-black text-emerald-400 mt-1">{completedCount}</h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">OTP Verified Rate</p>
            <h3 className="text-xl font-black text-amber-400 mt-1">{verificationRate}%</h3>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {['All', 'Scheduled', 'In Transit', 'Completed', 'Cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveStatusFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeStatusFilter === tab
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span>{tab}</span>
            {tab === 'In Transit' && inTransitCount > 0 && (
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
            )}
          </button>
        ))}
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={filteredVisits}
        searchPlaceholder="Search buyer, project, driver or vehicle..."
      />

      {/* Feedback Modal */}
      {selectedVisitForFeedback && (
        <SiteVisitFeedbackModal
          isOpen={!!selectedVisitForFeedback}
          onClose={() => setSelectedVisitForFeedback(null)}
          visit={selectedVisitForFeedback}
          onVisitUpdated={() => {
            loadVisits();
            showNotification('success', 'Site visit completed and pipeline updated!');
          }}
        />
      )}

      {/* Schedule Modal from Lead Picker */}
      {isScheduleModalOpen && (
        <SiteVisitScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          leadId={1} // Default or prompt
          leadName="Prospective Buyer"
          onVisitScheduled={() => {
            loadVisits();
            showNotification('success', 'VIP Site Visit scheduled successfully!');
          }}
        />
      )}
    </div>
  );
};
