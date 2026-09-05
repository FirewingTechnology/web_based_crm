import React, { useState } from 'react';
import { X, Star, Flame, CheckCircle2, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { siteVisitsApi } from '../../api/siteVisits';
import { SiteVisit, SiteVisitStatusUpdateInput } from '../../types/siteVisit';

interface SiteVisitFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  visit: SiteVisit;
  onVisitUpdated: () => void;
}

export const SiteVisitFeedbackModal: React.FC<SiteVisitFeedbackModalProps> = ({
  isOpen,
  onClose,
  visit,
  onVisitUpdated
}) => {
  const [rating, setRating] = useState<number>(visit.feedback_rating || 5);
  const [interestLevel, setInterestLevel] = useState<'Hot' | 'Warm' | 'Cold' | 'Ready to Book'>(
    visit.buyer_interest_level || 'Warm'
  );
  const [preferredUnit, setPreferredUnit] = useState<string>(visit.preferred_unit || '');
  const [discussionNotes, setDiscussionNotes] = useState<string>(visit.discussion_notes || '');
  const [autoAdvanceLead, setAutoAdvanceLead] = useState<boolean>(true);
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpVerified, setOtpVerified] = useState<boolean>(visit.is_otp_verified);

  const [loading, setLoading] = useState<boolean>(false);
  const [verifyingOtp, setVerifyingOtp] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerifyOtp = async () => {
    if (!otpInput.trim()) {
      setError('Please enter the OTP code provided by the client.');
      return;
    }
    setVerifyingOtp(true);
    setError(null);
    try {
      const res = await siteVisitsApi.verifyOtp(visit.id, otpInput.trim());
      if (res.verified) {
        setOtpVerified(true);
        setOtpNotice('OTP verified successfully!');
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid OTP code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: SiteVisitStatusUpdateInput = {
        status: 'Completed',
        feedback_rating: rating,
        buyer_interest_level: interestLevel,
        preferred_unit: preferredUnit.trim() || undefined,
        discussion_notes: discussionNotes.trim() || undefined,
        auto_advance_lead: autoAdvanceLead
      };

      await siteVisitsApi.updateSiteVisitStatus(visit.id, payload);
      onVisitUpdated();
      onClose();
    } catch (err: any) {
      console.error('Failed to update site visit outcome:', err);
      setError(err?.response?.data?.detail || 'Failed to record site visit feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Site Visit Outcome & Feedback
            </h2>
            <p className="text-xs text-slate-400">
              {visit.lead_name} • {visit.project_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {otpNotice && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{otpNotice}</span>
            </div>
          )}

          {/* OTP Verification Gate */}
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/70 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Anti-Fraud Client OTP: <span className="font-mono text-emerald-400">{visit.otp_code}</span>
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {otpVerified ? 'Arrival verified by executive' : 'Confirm client presence with 4-digit code'}
              </p>
            </div>

            {otpVerified ? (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5" /> Verified
              </span>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  maxLength={4}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="Code"
                  className="w-16 px-2 py-1 text-xs text-center font-mono font-bold bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp || otpInput.length !== 4}
                  className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition disabled:opacity-50"
                >
                  Verify
                </button>
              </div>
            )}
          </div>

          {/* Experience Star Rating */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Buyer Experience Rating (1 - 5 Stars)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 text-slate-600 hover:scale-110 transition"
                >
                  <Star 
                    className={`h-7 w-7 ${
                      star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                    }`} 
                  />
                </button>
              ))}
              <span className="ml-2 text-xs font-bold text-amber-400">
                {rating === 5 ? 'Exceptional Experience' : rating === 4 ? 'Very Positive' : rating === 3 ? 'Neutral / Undecided' : 'Needs Improvement'}
              </span>
            </div>
          </div>

          {/* Interest Level Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Buyer Interest Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Ready to Book', 'Hot', 'Warm', 'Cold'] as const).map((level) => {
                const isSelected = interestLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setInterestLevel(level)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                      isSelected
                        ? level === 'Ready to Book'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                          : level === 'Hot'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500'
                          : level === 'Warm'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                          : 'bg-slate-700 text-slate-300 border-slate-600'
                        : 'bg-slate-800/40 text-slate-400 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {level === 'Ready to Book' && '🎉 '}
                    {level === 'Hot' && '🔥 '}
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unit of Interest */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Shortlisted Unit / Floor / Configuration
            </label>
            <input
              type="text"
              value={preferredUnit}
              onChange={(e) => setPreferredUnit(e.target.value)}
              placeholder="e.g. Tower 2, Flat 1404 (3 BHK East Facing)"
              className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Discussion Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Discussion Summary & Objections Handled
            </label>
            <textarea
              rows={3}
              value={discussionNotes}
              onChange={(e) => setDiscussionNotes(e.target.value)}
              placeholder="e.g. Client loved the master bedroom view. Budget discussion ongoing regarding parking slots. Requested price sheet by 5 PM."
              className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Auto-Advance Pipeline Switch */}
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/70 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">
                Advance Pipeline to 'Negotiation' Stage
              </span>
              <span className="text-[11px] text-slate-400">
                Move deal forward automatically in the revenue funnel
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoAdvanceLead}
              onChange={(e) => setAutoAdvanceLead(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
            />
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
              <CheckCircle2 className="h-4 w-4" />
              <span>{loading ? 'Saving...' : 'Complete Visit & Advance Stage'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
