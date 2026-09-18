import React, { useState } from 'react';
import { Phone, Clock, Mic, CheckCircle2, X, Calendar, AlertCircle } from 'lucide-react';
import { callsApi, CallLogPayload } from '../../api/calls';

interface CallLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: number;
  leadName?: string;
  leadPhone?: string;
  onCallLogged?: () => void;
}

export const CallLoggerModal: React.FC<CallLoggerModalProps> = ({
  isOpen,
  onClose,
  leadId,
  leadName,
  leadPhone,
  onCallLogged
}) => {
  const [direction, setDirection] = useState<'Outbound' | 'Inbound'>('Outbound');
  const [callStatus, setCallStatus] = useState('Connected');
  const [outcome, setOutcome] = useState('Interested');
  const [durationMinutes, setDurationMinutes] = useState(3);
  const [notes, setNotes] = useState('');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [scheduleFollowup, setScheduleFollowup] = useState(true);
  const [followupHours, setFollowupHours] = useState(24);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const payload: CallLogPayload = {
        lead_id: leadId,
        phone_number: leadPhone,
        direction,
        call_status: callStatus,
        outcome,
        duration_seconds: durationMinutes * 60,
        notes,
        recording_url: recordingUrl.trim() || undefined,
        schedule_followup: scheduleFollowup,
        followup_hours: followupHours
      };

      await callsApi.logCall(payload);
      if (onCallLogged) onCallLogged();
      onClose();
    } catch (err: any) {
      console.error('Failed to log call', err);
      setError(err?.response?.data?.detail || 'Failed to record call activity');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Log Call Intelligence</h2>
              <p className="text-xs text-slate-400">
                {leadName ? `${leadName} • ` : ''}{leadPhone || 'Lead ID: ' + leadId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Direction & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Call Direction</label>
              <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
                {(['Outbound', 'Inbound'] as const).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => setDirection(dir)}
                    className={`flex-1 text-xs py-1.5 font-medium rounded-md transition-all ${
                      direction === dir
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Call Status</label>
              <select
                value={callStatus}
                onChange={(e) => setCallStatus(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Connected">Connected</option>
                <option value="Busy">Busy</option>
                <option value="No Answer">No Answer</option>
                <option value="Left Voicemail">Left Voicemail</option>
                <option value="Failed">Failed / Invalid</option>
              </select>
            </div>
          </div>

          {/* Outcome & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Call Outcome</label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Interested">Interested</option>
                <option value="Site Visit Requested">Site Visit Requested</option>
                <option value="Callback Requested">Callback Requested</option>
                <option value="Follow-up Needed">Follow-up Needed</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Wrong Number">Wrong Number</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Duration (Minutes)</label>
              <input
                type="number"
                min="0"
                max="120"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Call Summary / Key Discussion Notes
            </label>
            <textarea
              rows={3}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g. Buyer is interested in 3BHK high floor, requested updated payment milestone breakdown..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Recording URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-blue-400" />
                Recording URL (Optional VoIP Audio)
              </span>
              <span className="text-[10px] text-slate-500">Lawfully secured with signed tokens</span>
            </label>
            <input
              type="url"
              value={recordingUrl}
              onChange={(e) => setRecordingUrl(e.target.value)}
              placeholder="https://storage.realvion.com/recordings/call_123.mp3"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Automated Next Action / Followup */}
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="scheduleFollowup"
                checked={scheduleFollowup}
                onChange={(e) => setScheduleFollowup(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-0"
              />
              <label htmlFor="scheduleFollowup" className="text-xs font-medium text-slate-300 cursor-pointer">
                Auto-schedule next follow-up in:
              </label>
            </div>
            <select
              disabled={!scheduleFollowup}
              value={followupHours}
              onChange={(e) => setFollowupHours(parseInt(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs text-white disabled:opacity-50"
            >
              <option value="4">4 Hours (Urgent)</option>
              <option value="24">24 Hours (Tomorrow)</option>
              <option value="48">48 Hours</option>
              <option value="72">3 Days</option>
              <option value="168">1 Week</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? 'Logging Call...' : 'Save & Complete SLA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
