import React, { useState, useEffect } from 'react';
import { Target, Users, CalendarCheck, FileCheck2, Plus, ArrowUpRight, Trophy } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { leadsApi } from '../../api/leads';
import { followupsApi } from '../../api/followups';
import { bookingsApi } from '../../api/bookings';
import { salesApi } from '../../api/sales';
import { Lead } from '../../types/lead';
import { Followup } from '../../types/followup';
import { Booking } from '../../types/booking';
import { SalesTarget } from '../../types/sales';
import { LeadModal } from '../../components/modals/LeadModal';

export const SalesDashboard: React.FC = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [myTarget, setMyTarget] = useState<SalesTarget | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  useEffect(() => {
    leadsApi.getLeads({ my_leads_only: true }).then((data) => setLeads(data.slice(0, 5))).catch(console.error);
    followupsApi.getFollowups({ my_followups_only: true, filter_period: 'today' }).then(setFollowups).catch(console.error);
    bookingsApi.getBookings({ my_bookings_only: true }).then((data) => setBookings(data.slice(0, 5))).catch(console.error);
    
    const currMonth = new Date().toISOString().slice(0, 7);
    salesApi.getSalesTargets(currMonth).then((data) => {
      if (data.length > 0) setMyTarget(data[0]);
    }).catch(console.error);
  }, []);

  const handleCreateLead = async (data: any) => {
    await leadsApi.createLead(data);
    leadsApi.getLeads({ my_leads_only: true }).then((d) => setLeads(d.slice(0, 5)));
  };

  const targetPct = myTarget?.achievement_percentage || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back, {user?.name}!</h1>
          <p className="text-xs text-slate-400 mt-1">Here is your daily performance summary & scheduled followups</p>
        </div>

        <Button
          size="sm"
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setIsLeadModalOpen(true)}
        >
          Add New Lead
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="My Assigned Leads"
          value={leads.length}
          subtext="Active in your pipeline"
          icon={<Users className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Today's Followups"
          value={followups.length}
          subtext="Calls & site visits"
          icon={<CalendarCheck className="h-6 w-6" />}
          color="purple"
        />
        <StatCard
          title="My Closed Bookings"
          value={bookings.length}
          subtext="Confirmed property deals"
          icon={<FileCheck2 className="h-6 w-6" />}
          color="emerald"
        />
        <StatCard
          title="Monthly Target Progress"
          value={myTarget?.target_amount && myTarget.target_amount > 0 ? `${targetPct}%` : 'Not Set'}
          subtext={myTarget?.target_amount && myTarget.target_amount > 0 ? `₹${myTarget.achieved_amount}L of ₹${myTarget.target_amount}L` : 'Awaiting Admin Target'}
          icon={<Target className="h-6 w-6" />}
          color="amber"
        />
      </div>

      {/* Target Progress Card */}
      {myTarget && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#0e0e0e] to-slate-900 border border-amber-500/30 shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-2">
                  Current Month Target <span className="text-xs font-normal text-slate-400">({myTarget.month_year})</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {myTarget.target_amount > 0 
                    ? `Goal: ₹${myTarget.target_amount} Lakhs (${myTarget.target_bookings} Deals)` 
                    : 'Target limit is not assigned by admin yet'}
                </p>
              </div>
            </div>
            
            <div>
              {myTarget.target_amount > 0 ? (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                  {targetPct}% Goal Reached
                </span>
              ) : (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-400 border border-white/10 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-500"></span>
                  Target Not Set (₹0 Goal)
                </span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5 pt-1">
            <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 rounded-full transition-all duration-500 shadow-sm shadow-amber-500/50"
                style={{ width: `${myTarget.target_amount > 0 ? Math.min(targetPct, 100) : 0}%` }}
              />
            </div>
            
            <div className="flex justify-between text-[11px] font-medium text-slate-400">
              <span>Closed: <strong className="text-emerald-400 font-bold">₹{myTarget.achieved_amount} Lakhs</strong> ({myTarget.achieved_bookings} Deals)</span>
              <span>Target: <strong className="text-white font-bold">{myTarget.target_amount > 0 ? `₹${myTarget.target_amount} Lakhs (${myTarget.target_bookings} Deals)` : 'Not Set by Admin'}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Grid: My Leads & Today's Followups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Recent Assigned Leads</h3>
            <Badge variant="blue">{leads.length} Leads</Badge>
          </div>
          <div className="divide-y divide-slate-800/80">
            {leads.map((l) => (
              <div key={l.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-white">{l.name}</p>
                  <p className="text-slate-400 text-[11px]">{l.phone} • {l.preferred_location}</p>
                </div>
                <Badge variant={l.status === 'Booked' ? 'emerald' : 'blue'} size="sm">
                  {l.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Today's Scheduled Tasks</h3>
            <Badge variant="purple">{followups.length} Tasks</Badge>
          </div>
          <div className="divide-y divide-slate-800/80">
            {followups.length > 0 ? (
              followups.map((f) => (
                <div key={f.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white">{f.title}</p>
                    <p className="text-slate-400 text-[11px]">Lead: {f.lead_name}</p>
                  </div>
                  <Badge variant={f.status === 'Completed' ? 'emerald' : 'amber'} size="sm">
                    {f.type}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="py-4 text-xs text-slate-500 text-center">No tasks scheduled for today.</p>
            )}
          </div>
        </Card>
      </div>

      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSubmit={handleCreateLead}
      />
    </div>
  );
};
