import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Car, User, Clock, AlertCircle } from 'lucide-react';
import { siteVisitsApi } from '../../api/siteVisits';
import { projectsApi } from '../../api/projects';
import { Project } from '../../types/project';
import { SiteVisitCreateInput } from '../../types/siteVisit';

interface SiteVisitScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: number;
  leadName: string;
  preferredProjectId?: number;
  onVisitScheduled?: () => void;
}

export const SiteVisitScheduleModal: React.FC<SiteVisitScheduleModalProps> = ({
  isOpen,
  onClose,
  leadId,
  leadName,
  preferredProjectId,
  onVisitScheduled
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<number>(preferredProjectId || 0);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('11:00');
  const [pickupLocation, setPickupLocation] = useState<string>('');
  const [pickupTime, setPickupTime] = useState<string>('10:15 AM');
  const [driverName, setDriverName] = useState<string>('');
  const [driverPhone, setDriverPhone] = useState<string>('');
  const [cabVehicleNumber, setCabVehicleNumber] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
      // Default scheduled date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduledDate(tomorrow.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const loadProjects = async () => {
    try {
      const data = await projectsApi.getProjects();
      setProjects(data);
      if (!projectId && data.length > 0) {
        setProjectId(preferredProjectId || data[0].id);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !scheduledDate || !scheduledTime) {
      setError('Please select a project, date and time.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
      const payload: SiteVisitCreateInput = {
        lead_id: leadId,
        project_id: Number(projectId),
        scheduled_at: scheduledDateTime.toISOString(),
        pickup_location: pickupLocation.trim() || undefined,
        pickup_time: pickupTime.trim() || undefined,
        driver_name: driverName.trim() || undefined,
        driver_phone: driverPhone.trim() || undefined,
        cab_vehicle_number: cabVehicleNumber.trim() || undefined
      };

      await siteVisitsApi.createSiteVisit(payload);
      if (onVisitScheduled) onVisitScheduled();
      onClose();
    } catch (err: any) {
      console.error('Failed to schedule site visit:', err);
      setError(err?.response?.data?.detail || 'Failed to schedule site visit.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Schedule VIP Site Visit</h2>
              <p className="text-xs text-slate-400">
                Client: <strong className="text-white">{leadName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Project Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Destination Project *
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(Number(e.target.value))}
              required
              className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.location})
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Visit Date *
              </label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Visit Time *
              </label>
              <input
                type="time"
                required
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* VIP Chauffeur & Cab Logistics */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Chauffeur & Pickup Logistics (Optional)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Pickup Location
                </label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="e.g. Client Residence / Metro Station"
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Pickup Time
                </label>
                <input
                  type="text"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  placeholder="e.g. 10:15 AM"
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Driver Name
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="e.g. Ramesh"
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Driver Phone
                </label>
                <input
                  type="text"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="+91 98765..."
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Cab Vehicle No.
                </label>
                <input
                  type="text"
                  value={cabVehicleNumber}
                  onChange={(e) => setCabVehicleNumber(e.target.value)}
                  placeholder="e.g. MH-02-AB-1234"
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-[11px] text-emerald-300">
            💡 <strong>Anti-Fraud Security:</strong> REALVION will automatically provision a secure 4-digit arrival OTP for client check-in. Lead status will update to <strong>Site Visit Scheduled</strong>.
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 hover:scale-[1.02] transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Calendar className="h-4 w-4" />
              <span>{loading ? 'Scheduling...' : 'Confirm VIP Site Visit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
