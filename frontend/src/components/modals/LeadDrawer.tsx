import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Phone, Mail, MapPin, Tag, Calendar, Plus, MessageSquare, History, User,
  ShieldAlert, Activity, AlertTriangle, Zap, CheckCircle2, Clock, Sparkles,
  ArrowRight, Lightbulb, Compass, MessageCircle, Car, Calculator
} from 'lucide-react';
import { Lead } from '../../types/lead';
import { NextBestAction } from '../../types/advisor';
import { leadsApi } from '../../api/leads';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { WhatsAppButton } from '../common/WhatsAppButton';
import { SiteVisitScheduleModal } from './SiteVisitScheduleModal';
import { MatchedInventoryTab } from './MatchedInventoryTab';
import { CostSheetModal } from './CostSheetModal';

interface LeadDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onAddNote: (leadId: number, noteText: string) => Promise<void>;
  onOpenFollowupModal: (lead: Lead) => void;
  onUpdateStatus?: (leadId: number, newStatus: string) => Promise<void>;
}

export const LeadDrawer: React.FC<LeadDrawerProps> = ({
  lead,
  isOpen,
  onClose,
  onAddNote,
  onOpenFollowupModal,
  onUpdateStatus,
}) => {
  const [activeLead, setActiveLead] = useState<Lead | null>(lead);
  const [advisorData, setAdvisorData] = useState<NextBestAction | null>(null);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isAdvancingStage, setIsAdvancingStage] = useState(false);
  const [isSiteVisitModalOpen, setIsSiteVisitModalOpen] = useState(false);
  const [selectedVisitProjectId, setSelectedVisitProjectId] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'advisor' | 'inventory'>('advisor');
  const [isCostSheetModalOpen, setIsCostSheetModalOpen] = useState(false);

  const fetchLeadData = async () => {
    if (!lead?.id) return;
    try {
      const updated = await leadsApi.getLead(lead.id);
      setActiveLead(updated);
    } catch (err) {
      console.error('Error auto-syncing lead drawer:', err);
    }
  };

  useEffect(() => {
    setActiveLead(lead);
    setSelectedVisitProjectId(lead?.preferred_project_id || undefined);
  }, [lead]);

  // Fetch Next Best Action Advisor
  useEffect(() => {
    if (!isOpen || !activeLead?.id) return;
    leadsApi.getNextBestAction(activeLead.id)
      .then(setAdvisorData)
      .catch(console.error);
  }, [isOpen, activeLead?.id, activeLead?.status]);

  // Real-time polling to sync notes and status history while drawer is open
  useEffect(() => {
    if (!isOpen || !lead?.id) return;

    fetchLeadData();
    const interval = setInterval(fetchLeadData, 4000);
    return () => clearInterval(interval);
  }, [isOpen, lead?.id]);


  if (!activeLead) return null;

  const handleAdvanceStage = async () => {
    if (!advisorData?.suggested_next_status || !onUpdateStatus || !activeLead) return;
    setIsAdvancingStage(true);
    try {
      await onUpdateStatus(activeLead.id, advisorData.suggested_next_status);
      const updated = await leadsApi.getLead(activeLead.id);
      setActiveLead(updated);
      const updatedAdv = await leadsApi.getNextBestAction(activeLead.id);
      setAdvisorData(updatedAdv);
    } catch (err) {
      console.error('Failed to advance stage:', err);
    } finally {
      setIsAdvancingStage(false);
    }
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setIsAddingNote(true);
    try {
      await onAddNote(activeLead.id, newNote);
      setNewNote('');
      // Instant real-time update
      const updated = await leadsApi.getLead(activeLead.id);
      setActiveLead(updated);
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onUpdateStatus && activeLead) {
      try {
        await onUpdateStatus(activeLead.id, e.target.value);
        const updated = await leadsApi.getLead(activeLead.id);
        setActiveLead(updated);
      } catch (err) {
        console.error('Failed to update status in drawer:', err);
      }
    }
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="glass-modal fixed inset-y-0 right-0 max-w-full sm:max-w-xl w-full p-4 sm:p-6 shadow-2xl z-50 flex flex-col justify-between border-l border-slate-800 text-slate-100"
          >
            {/* Header */}
            <div>
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{activeLead.name}</h3>
                    <Badge variant={statusVariant[activeLead.status] || 'blue'}>{activeLead.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Lead ID: #{activeLead.id} • Source: {activeLead.source}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-3 my-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                <div className="flex items-center justify-between gap-2 text-slate-300">
                  <div className="flex items-center gap-2 min-w-0">
                    <Phone className="h-4 w-4 text-blue-400 shrink-0" />
                    <span className="font-semibold text-white truncate">{activeLead.phone}</span>
                  </div>
                  <WhatsAppButton leadId={activeLead.id} phone={activeLead.phone} leadName={activeLead.name} variant="icon" onMessageSent={onLeadUpdated} />
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="h-4 w-4 text-purple-400 shrink-0" />
                  <span className="truncate">{activeLead.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>{activeLead.preferred_location || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Tag className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>₹{activeLead.budget_min || 0}L - ₹{activeLead.budget_max || 0}L</span>
                </div>
              </div>

              {/* Quick Actions & Status Changer */}
              <div className="flex items-center justify-between gap-2 mb-4 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-400">Change Status:</span>
                  <select
                    value={activeLead.status}
                    onChange={handleStatusChange}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 cursor-pointer hover:border-blue-500/50 transition focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Site Visit Scheduled">Site Visit Scheduled</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Booked">Booked 🎉</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <WhatsAppButton leadId={activeLead.id} phone={activeLead.phone} leadName={activeLead.name} variant="button" onMessageSent={onLeadUpdated} />
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                    icon={<Calculator className="h-4 w-4 text-amber-400" />}
                    onClick={() => setIsCostSheetModalOpen(true)}
                  >
                    Cost Sheet
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
                    icon={<Car className="h-4 w-4 text-emerald-400" />}
                    onClick={() => setIsSiteVisitModalOpen(true)}
                  >
                    Site Visit
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<Calendar className="h-4 w-4" />}
                    onClick={() => onOpenFollowupModal(activeLead)}
                  >
                    Followup
                  </Button>
                </div>
              </div>

              {/* Revenue Operating System - Lead Health & Revenue Leakage Engine */}
              <div className="mb-4 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Revenue Health Score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {((activeLead.budget_max || activeLead.budget_min || 0) >= 100) && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        ₹1Cr+ High Value
                      </span>
                    )}
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      (activeLead.health_score ?? 100) >= 90
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : (activeLead.health_score ?? 100) >= 70
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : (activeLead.health_score ?? 100) >= 50
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      {activeLead.health_score ?? 100}/100 • {activeLead.health_category || 'Healthy'}
                    </span>
                  </div>
                </div>

                {/* Visual Health Score Bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 mb-3 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      (activeLead.health_score ?? 100) >= 90
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : (activeLead.health_score ?? 100) >= 70
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                        : (activeLead.health_score ?? 100) >= 50
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                        : 'bg-gradient-to-r from-rose-600 to-red-400'
                    }`}
                    style={{ width: `${Math.max(5, Math.min(100, activeLead.health_score ?? 100))}%` }}
                  />
                </div>

                {/* Recommended Action Pill */}
                {activeLead.recommended_action && (
                  <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-2.5 flex items-start gap-2">
                    <Zap className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold tracking-wider text-blue-400 uppercase block">Next Recommended Action</span>
                      <p className="text-xs font-semibold text-white mt-0.5">{activeLead.recommended_action}</p>
                    </div>
                  </div>
                )}

                {/* Detected Risk Leakage Drivers */}
                {activeLead.health_reasons && activeLead.health_reasons.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <span className="text-[11px] font-semibold text-slate-400 block">Health Audit & Leakage Factors:</span>
                    {activeLead.health_reasons.map((reason, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-300">
                        {(activeLead.health_score ?? 100) < 70 ? (
                          <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                        )}
                        <span className="text-[11px] leading-tight">{reason}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Postponement & Activity Metadata */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-slate-400">
                  <div>
                    <span className="block text-[10px] text-slate-500">Postponements</span>
                    <span className="font-semibold text-slate-200">{activeLead.postponement_count || 0} times</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500">Stage Entered</span>
                    <span className="font-semibold text-slate-200">
                      {activeLead.stage_entered_at ? new Date(activeLead.stage_entered_at).toLocaleDateString() : 'Initial'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500">Last Action</span>
                    <span className="font-semibold text-slate-200">
                      {activeLead.last_activity_at ? new Date(activeLead.last_activity_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('advisor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'advisor'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Advisor & Activity</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'inventory'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>AI Matched Inventory</span>
              </button>
            </div>

            {/* Middle Scrollable Section */}
            <div className="flex-1 overflow-y-auto space-y-4 my-2 pr-1">
              {activeTab === 'inventory' ? (
                <MatchedInventoryTab
                  leadId={activeLead.id}
                  leadPhone={activeLead.phone}
                  leadName={activeLead.name}
                  onScheduleVisit={(projId) => {
                    setSelectedVisitProjectId(projId);
                    setIsSiteVisitModalOpen(true);
                  }}
                />
              ) : (
                <>
                  {/* Next Best Action & Stage Transition Advisor */}
                  {advisorData && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/30 border border-blue-500/30 shadow-lg space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Compass className="h-4 w-4 text-blue-400" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                            Next Best Action Advisor
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {advisorData.suggested_channel === 'WhatsApp' ? (
                            <WhatsAppButton
                              leadId={activeLead.id}
                              phone={activeLead.phone}
                              leadName={activeLead.name}
                              variant="compact"
                              onMessageSent={onLeadUpdated}
                            />
                          ) : (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              advisorData.suggested_channel === 'Call'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                            }`}>
                              {advisorData.suggested_channel}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            advisorData.urgency === 'Urgent'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : advisorData.urgency === 'High'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {advisorData.urgency}
                          </span>
                        </div>
                      </div>

                      {/* Primary Action */}
                      <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
                        <Zap className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">Recommended Step</span>
                          <p className="text-xs font-bold text-white mt-0.5">{advisorData.primary_action}</p>
                        </div>
                      </div>

                      {/* Contextual Talking Points */}
                      {advisorData.talking_points && advisorData.talking_points.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                            <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                            <span>Recommended Pitch & Talking Points:</span>
                          </div>
                          <div className="space-y-1 pl-1">
                            {advisorData.talking_points.map((pt, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-300">
                                <span className="text-blue-400 font-bold shrink-0">•</span>
                                <span className="text-[11px] leading-relaxed text-slate-300">{pt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stage Transition Readiness Gate */}
                      <div className="pt-2.5 border-t border-slate-800/80">
                        {advisorData.stage_progression_readiness && advisorData.suggested_next_status ? (
                          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                                  Milestone Criteria Met
                                </span>
                                <span className="text-xs text-slate-200">
                                  Ready to advance to: <strong className="text-white font-bold">{advisorData.suggested_next_status}</strong>
                                </span>
                              </div>
                            </div>

                            {onUpdateStatus && (
                              <button
                                onClick={handleAdvanceStage}
                                disabled={isAdvancingStage}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50 shrink-0"
                              >
                                <span>Advance Stage</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ) : advisorData.blockers && advisorData.blockers.length > 0 ? (
                          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
                            <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              <span>Stage Prerequisites Incomplete ({advisorData.current_status} → {advisorData.suggested_next_status || 'Next'}):</span>
                            </div>
                            <ul className="space-y-0.5 pl-5 list-disc text-[11px] text-slate-300">
                              {advisorData.blockers.map((b, idx) => (
                                <li key={idx}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {/* Add Note Input */}
                  <form onSubmit={handleNoteSubmit} className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-blue-400" /> Log Note / Interaction
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Type client remarks or discussion summary..."
                        className="glass-input flex-1 text-xs rounded-lg px-3 py-2"
                      />
                      <Button size="sm" type="submit" isLoading={isAddingNote} icon={<Plus className="h-3.5 w-3.5" />}>
                        Add Note
                      </Button>
                    </div>
                  </form>

                  {/* Notes List */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" /> Activity Notes ({activeLead.notes_list?.length || 0})
                    </h4>
                    {activeLead.notes_list && activeLead.notes_list.length > 0 ? (
                      activeLead.notes_list.map((note) => (
                        <div key={note.id} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 text-xs">
                          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                            <span className="font-semibold text-blue-400 flex items-center gap-1">
                              <User className="h-3 w-3" /> {note.author_name}
                            </span>
                            <span>{new Date(note.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-200">{note.note_text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No notes logged yet.</p>
                    )}
                  </div>

                  {/* Timeline Status History */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5" /> Status History Timeline
                    </h4>
                    {activeLead.history_list && activeLead.history_list.length > 0 ? (
                      <div className="space-y-3 pl-3 border-l-2 border-slate-800">
                        {activeLead.history_list.map((h) => (
                          <div key={h.id} className="relative text-xs">
                            <div className="absolute -left-[17px] top-0.5 h-2.5 w-2.5 rounded-full bg-blue-500 border-2 border-slate-900" />
                            <p className="font-semibold text-slate-200">
                              Changed to <span className="text-blue-400">{h.new_status}</span> by {h.changed_by_name}
                            </p>
                            {h.remarks && <p className="text-slate-400 text-[11px] mt-0.5">{h.remarks}</p>}
                            <p className="text-[10px] text-slate-500 mt-0.5">{new Date(h.created_at).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No status transitions recorded.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Embedded VIP Site Visit Schedule Modal */}
      {activeLead && isSiteVisitModalOpen && (
        <SiteVisitScheduleModal
          isOpen={isSiteVisitModalOpen}
          onClose={() => setIsSiteVisitModalOpen(false)}
          leadId={activeLead.id}
          leadName={activeLead.name}
          preferredProjectId={selectedVisitProjectId || activeLead.preferred_project_id}
          onVisitScheduled={() => {
            fetchLeadData();
          }}
        />
      )}

      {/* Embedded Indian Real Estate Cost Sheet Modal */}
      {activeLead && isCostSheetModalOpen && (
        <CostSheetModal
          isOpen={isCostSheetModalOpen}
          onClose={() => setIsCostSheetModalOpen(false)}
          initialLeadId={activeLead.id}
          initialProjectId={selectedVisitProjectId || activeLead.preferred_project_id || undefined}
          onBookingCreated={() => {
            fetchLeadData();
          }}
        />
      )}
    </AnimatePresence>
  );
};

