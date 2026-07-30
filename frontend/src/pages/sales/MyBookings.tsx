import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { FileCheck2, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { BookingModal } from '../../components/modals/BookingModal';
import { bookingsApi } from '../../api/bookings';
import { leadsApi } from '../../api/leads';
import { projectsApi } from '../../api/projects';
import { Booking, BookingCreateInput } from '../../types/booking';
import { Lead } from '../../types/lead';
import { Project } from '../../types/project';

export const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMyBookings = async () => {
    try {
      const data = await bookingsApi.getBookings({ my_bookings_only: true });
      setBookings(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMyBookings();
    leadsApi.getLeads({ my_leads_only: true }).then(setLeads).catch(console.error);
    projectsApi.getProjects().then(setProjects).catch(console.error);
  }, []);

  const handleCreateBooking = async (data: BookingCreateInput) => {
    await bookingsApi.createBooking(data);
    fetchMyBookings();
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
      cell: ({ row }) => <span className="font-semibold text-white text-xs">{row.original.lead_name}</span>,
    },
    {
      accessorKey: 'project_name',
      header: 'Project & Builder',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-200 text-xs">{row.original.project_name}</p>
          <p className="text-slate-400 text-[11px]">{row.original.builder_name}</p>
        </div>
      ),
    },
    {
      accessorKey: 'total_deal_value',
      header: 'Total Deal Value',
      cell: ({ row }) => (
        <div>
          <p className="font-bold text-white text-sm">
            ₹{(row.original.total_deal_value / 100000).toFixed(2)} Lakhs
          </p>
          <p className="text-slate-400 text-[11px]">Token: ₹{row.original.booking_amount.toLocaleString()}</p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <Badge variant="emerald">{row.original.status}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Property Bookings</h1>
          <p className="text-xs text-slate-400 mt-1">Confirmed property deal tokens & executive incentive tracking</p>
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

      <DataTable columns={columns} data={bookings} searchPlaceholder="Search ref, lead name, unit..." />

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateBooking}
        leads={leads}
        projects={projects}
      />
    </div>
  );
};
