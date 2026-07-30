import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, MapPin, Tag, Calendar, Plus, MessageSquare, History, User } from 'lucide-react';
import { Lead } from '../../types/lead';
import { leadsApi } from '../../api/leads';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

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
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  useEffect(() => {
    setActiveLead(lead);
  }, [lead]);

  // Real-time polling to sync notes and status history while drawer is open
  useEffect(() => {
    if (!isOpen || !lead?.id) return;

    const fetchLatestLead = async () => {
      try {
        const updated = await leadsApi.getLead(lead.id);
        setActiveLead(updated);
      } catch (err) {
        console.error('Error auto-syncing lead drawer:', err);
      }
    };

    fetchLatestLead();
    const interval = setInterval(fetchLatestLead, 4000);
    return () => clearInterval(interval);
  }, [isOpen, lead?.id]);

  if (!activeLead) return null;

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
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="h-4 w-4 text-blue-400 shrink-0" />
                  <span className="font-semibold text-white">{activeLead.phone}</span>
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

                <Button
                  size="sm"
                  variant="primary"
                  icon={<Calendar className="h-4 w-4" />}
                  onClick={() => onOpenFollowupModal(activeLead)}
                >
                  Schedule Followup
                </Button>
              </div>
            </div>

            {/* Middle Scrollable History & Notes */}
            <div className="flex-1 overflow-y-auto space-y-4 my-2 pr-1">
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
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
