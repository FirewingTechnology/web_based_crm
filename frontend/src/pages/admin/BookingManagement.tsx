import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, FileCheck2, Building2, FolderKanban, User, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { BookingModal } from '../../components/modals/BookingModal';
import { bookingsApi } from '../../api/bookings';
import { leadsApi } from '../../api/leads';
import { projectsApi } from '../../api/projects';
import { usersApi } from '../../api/users';
import { brokersApi } from '../../api/brokers';
import { Booking, BookingCreateInput } from '../../types/booking';
import { Lead } from '../../types/lead';
import { Project } from '../../types/project';
import { User as UserType } from '../../types/user';
import { BrokerProfile } from '../../types/broker';

export const BookingManagement: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [executives, setExecutives] = useState<UserType[]>([]);
  const [brokers, setBrokers] = useState<BrokerProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 5000);
  };

  const fetchBookings = async () => {
    try {
      const data = await bookingsApi.getBookings();
      setBookings(data);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
  };

  useEffect(() => {
    fetchBookings();
    leadsApi.getLeads().then(setLeads).catch(console.error);
    projectsApi.getProjects().then(setProjects).catch(console.error);
    usersApi.getUsers().then(setExecutives).catch(console.error);
    brokersApi.getBrokers().then(setBrokers).catch(console.error);
  }, []);

  const handleCreateBooking = async (data: BookingCreateInput) => {
    try {
      await bookingsApi.createBooking(data);
      showNotification('success', `Property Booking created successfully! Token & commission recorded.`);
      await fetchBookings();
      leadsApi.getLeads().then(setLeads).catch(console.error);
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Failed to create property booking.');
    }
  };

  const statusVariant: Record<string, 'emerald' | 'amber' | 'rose' | 'blue'> = {
    Confirmed: 'emerald',
    Pending: 'amber',
    Cancelled: 'rose',
    Completed: 'blue',
  };

  const columns: ColumnDef<Booking>[] = [
    {
      accessorKey: 'booking_number',
      header: 'Booking Ref & Unit',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-white font-mono text-sm">{row.original.booking_number}</p>
            <p className="text-emerald-400 font-semibold text-xs">{row.original.unit_number}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'lead_name',
      header: 'Buyer Lead',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-white">{row.original.lead_name}</p>
          <p className="text-slate-400 text-xs">Closing Exec: {row.original.executive_name}</p>
        </div>
      ),
    },
    {
      accessorKey: 'project_name',
      header: 'Project & Builder',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-200">{row.original.project_name}</p>
          <p className="text-slate-400 text-[11px]">{row.original.builder_name}</p>
        </div>
      ),
    },
    {
      accessorKey: 'total_deal_value',
      header: 'Total Deal Value',
      cell: ({ row }) => {
        const val = row.original.total_deal_value;
        const formattedLakhs = (val / 100000).toFixed(2);
        const formattedDisplay = val >= 10000000 ? `₹${(val / 10000000).toFixed(2)} Cr (₹${formattedLakhs}L)` : `₹${formattedLakhs} Lakhs`;
        return (
          <div>
            <p className="font-bold text-white text-sm">
              {formattedDisplay}
            </p>
            <p className="text-slate-400 text-[11px]">
              Token: <span className="text-emerald-400 font-semibold">₹{row.original.booking_amount.toLocaleString('en-IN')}</span>
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.status] || 'emerald'}>{row.original.status}</Badge>
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Booking Management</h1>
          <p className="text-xs text-slate-400 mt-1">Confirmed property deals, token records & automated commission calculations</p>
        </div>

        <Button
          size="sm"
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Create Booking Token
        </Button>
      </div>

      <DataTable columns={columns} data={bookings} searchPlaceholder="Search booking ref, lead name, unit number..." />

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateBooking}
        leads={leads}
        projects={projects}
        executives={executives}
        brokers={brokers}
      />
    </div>
  );
};
