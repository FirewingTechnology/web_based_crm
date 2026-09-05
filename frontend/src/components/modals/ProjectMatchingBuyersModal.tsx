import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Users, Sparkles, Building2, MapPin, Tag, Phone, Mail, 
  MessageCircle, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight 
} from 'lucide-react';
import { ProjectMatchingLeadsResponse, MatchedLeadItem } from '../../types/inventoryMatch';
import { inventoryMatchApi } from '../../api/inventoryMatch';
import { WhatsAppModal } from './WhatsAppModal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ProjectMatchingBuyersModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
}

export const ProjectMatchingBuyersModal: React.FC<ProjectMatchingBuyersModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
}) => {
  const [data, setData] = useState<ProjectMatchingLeadsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLeadPitch, setActiveLeadPitch] = useState<MatchedLeadItem | null>(null);

  useEffect(() => {
    if (!isOpen || !projectId) return;

    setIsLoading(true);
    inventoryMatchApi.getMatchingLeadsForProject(projectId)
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="glass-modal relative w-full max-w-3xl max-h-[90vh] rounded-2xl p-6 shadow-2xl z-50 flex flex-col border border-slate-800 text-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-800 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">AI Buyer Matchmaker</h3>
                  <p className="text-xs text-slate-400">
                    Active buyers in CRM looking for inventory in <strong className="text-white">{projectName}</strong>
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
                <RefreshCw className="h-7 w-7 animate-spin text-purple-400" />
                <p className="text-xs font-medium">Scanning all qualified pipeline leads...</p>
              </div>
            ) : !data || data.matched_leads.length === 0 ? (
              <div className="py-14 text-center text-slate-400 space-y-2">
                <Users className="h-10 w-10 mx-auto text-slate-600 opacity-60" />
                <h4 className="text-sm font-semibold text-slate-300">No Direct Buyer Matches Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  None of the active leads currently match this budget range or location criteria.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>
                    Found <strong className="text-white font-bold">{data.matched_leads.length}</strong> matching buyers (out of {data.total_leads_evaluated} leads evaluated)
                  </span>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    Sorted by Match Score
                  </span>
                </div>

                <div className="space-y-3">
                  {data.matched_leads.map((lead) => {
                    const scoreColor =
                      lead.match_score >= 85 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                      lead.match_score >= 70 ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' :
                      'text-amber-400 border-amber-500/30 bg-amber-500/10';

                    return (
                      <div
                        key={lead.lead_id}
                        className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition space-y-3 shadow-md"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`px-2.5 py-1.5 rounded-lg border font-mono font-black text-center shrink-0 ${scoreColor}`}>
                              <div className="text-sm leading-none">{lead.match_score}%</div>
                              <div className="text-[8px] uppercase tracking-tighter opacity-80 mt-0.5">Match</div>
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-white">{lead.lead_name}</h4>
                                <Badge variant="slate">{lead.status}</Badge>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2">
                                <span className="flex items-center gap-1 text-slate-300">
                                  <Phone className="h-3 w-3 text-blue-400" /> {lead.phone}
                                </span>
                                {lead.assigned_to_name && (
                                  <span>• Rep: {lead.assigned_to_name}</span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setActiveLeadPitch(lead)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 shrink-0"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span>Pitch via WhatsApp</span>
                            </button>
                          </div>
                        </div>

                        {/* Buyer Spec vs Match Breakdown */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 text-xs">
                          <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/60">
                            <span className="text-[10px] text-slate-500 block">Budget Requirement</span>
                            <span className="font-bold text-emerald-400">{lead.budget_range}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/60">
                            <span className="text-[10px] text-slate-500 block">Preferred Location</span>
                            <span className="font-semibold text-slate-300 truncate block">
                              {lead.preferred_location || 'Any'}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/60">
                            <span className="text-[10px] text-slate-500 block">Configuration</span>
                            <span className="font-semibold text-slate-300 truncate block">
                              {lead.preferred_configuration || 'Any'}
                            </span>
                          </div>
                        </div>

                        {/* Match reasons */}
                        {lead.match_reasons.length > 0 && (
                          <div className="space-y-1">
                            {lead.match_reasons.map((r, idx) => (
                              <p key={idx} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                                <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                                <span>{r}</span>
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* WhatsApp Modal for Selected Lead */}
        {activeLeadPitch && (
          <WhatsAppModal
            isOpen={!!activeLeadPitch}
            onClose={() => setActiveLeadPitch(null)}
            leadId={activeLeadPitch.lead_id}
            leadPhone={activeLeadPitch.phone}
            leadName={activeLeadPitch.lead_name}
            defaultTemplate="CUSTOM"
            customText={activeLeadPitch.whatsapp_pitch}
          />
        )}
      </div>
    </AnimatePresence>
  );
};
