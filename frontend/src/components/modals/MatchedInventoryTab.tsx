import React, { useState, useEffect } from 'react';
import { 
  Building2, MapPin, Tag, Sparkles, CheckCircle2, AlertTriangle, 
  Download, Car, MessageCircle, ExternalLink, ChevronDown, ChevronUp,
  RefreshCw, ShieldCheck, ArrowUpRight
} from 'lucide-react';
import { LeadInventoryMatch, LeadInventoryMatchResponse } from '../../types/inventoryMatch';
import { inventoryMatchApi } from '../../api/inventoryMatch';
import { Button } from '../ui/Button';
import { WhatsAppModal } from './WhatsAppModal';

interface MatchedInventoryTabProps {
  leadId: number;
  leadPhone: string;
  leadName: string;
  onScheduleVisit: (projectId: number) => void;
}

export const MatchedInventoryTab: React.FC<MatchedInventoryTabProps> = ({
  leadId,
  leadPhone,
  leadName,
  onScheduleVisit,
}) => {
  const [data, setData] = useState<LeadInventoryMatchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);
  const [customPitchProject, setCustomPitchProject] = useState<LeadInventoryMatch | null>(null);
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);

  const fetchMatches = async () => {
    setIsLoading(true);
    try {
      const res = await inventoryMatchApi.getMatchedInventoryForLead(leadId);
      setData(res);
      if (res.matches.length > 0) {
        setExpandedProjectId(res.matches[0].project_id);
      }
    } catch (err) {
      console.error('Error fetching inventory matches:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [leadId]);

  const toggleExpand = (projectId: number) => {
    setExpandedProjectId(expandedProjectId === projectId ? null : projectId);
  };

  const handleOpenPitch = (match: LeadInventoryMatch) => {
    setCustomPitchProject(match);
    setIsPitchModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
        <p className="text-xs font-medium">Analyzing developer inventory against buyer requirements...</p>
      </div>
    );
  }

  if (!data || data.matches.length === 0) {
    return (
      <div className="py-10 px-4 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-3">
        <Building2 className="h-8 w-8 mx-auto text-slate-500 opacity-60" />
        <h4 className="text-sm font-semibold text-slate-300">No Projects in Inventory</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Add developer projects in the Projects Catalog to activate AI inventory matchmaking.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Buyer Criteria Recap Bar */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-purple-950/30 border border-blue-500/20 text-xs">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span className="font-bold uppercase tracking-wider text-slate-200 text-[11px]">
              AI Matchmaker Profile
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {data.total_projects_evaluated} projects evaluated
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-slate-800/80 text-[11px]">
          <div>
            <span className="text-slate-500 block text-[10px]">Budget</span>
            <span className="font-bold text-emerald-400">{data.buyer_budget}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Preferred Loc</span>
            <span className="font-semibold text-slate-200 truncate block">
              {data.buyer_location || 'Any Location'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Configuration</span>
            <span className="font-semibold text-slate-200 truncate block">
              {data.buyer_configuration || 'Any BHK'}
            </span>
          </div>
        </div>
      </div>

      {/* Ranked Matched Projects */}
      <div className="space-y-3">
        {data.matches.map((match) => {
          const isExpanded = expandedProjectId === match.project_id;
          const scoreColor = 
            match.match_score >= 85 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
            match.match_score >= 70 ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' :
            match.match_score >= 50 ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
            'text-rose-400 border-rose-500/30 bg-rose-500/10';

          return (
            <div
              key={match.project_id}
              className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden transition hover:border-slate-700 shadow-md"
            >
              {/* Main Card Header */}
              <div 
                onClick={() => toggleExpand(match.project_id)}
                className="p-3.5 cursor-pointer flex items-center justify-between gap-3 hover:bg-slate-800/30 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Score Badge */}
                  <div className={`px-2.5 py-1.5 rounded-lg border font-mono font-black text-center shrink-0 ${scoreColor}`}>
                    <div className="text-sm leading-none">{match.match_score}%</div>
                    <div className="text-[8px] uppercase tracking-tighter opacity-80 mt-0.5">Match</div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">{match.project_name}</h4>
                      {match.rera_id && (
                        <span className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 shrink-0 hidden sm:inline-block">
                          RERA
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-purple-400 shrink-0" />
                      <span>{match.builder_name}</span>
                      <span>•</span>
                      <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
                      <span className="truncate">{match.location}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-emerald-400">
                      ₹{match.min_price}L - ₹{match.max_price}L
                    </div>
                    <div className="text-[10px] text-slate-400">{match.configuration}</div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Collapsible Details */}
              {isExpanded && (
                <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-800/60 space-y-3 bg-slate-950/40">
                  {/* Criteria Tags */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-2">
                    {match.criteria_breakdown.map((crit, idx) => (
                      <div 
                        key={idx}
                        className={`p-2 rounded-lg border text-[10px] ${
                          crit.status === 'MATCHED'
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                            : crit.status === 'PARTIAL'
                            ? 'bg-amber-500/5 border-amber-500/20 text-amber-300'
                            : crit.status === 'UNSPECIFIED'
                            ? 'bg-slate-800/40 border-slate-700/50 text-slate-400'
                            : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>{crit.criterion}</span>
                          {crit.status === 'MATCHED' && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                          {crit.status === 'PARTIAL' && <AlertTriangle className="h-3 w-3 text-amber-400" />}
                        </div>
                        <div className="text-[9px] opacity-80 mt-0.5 truncate">{crit.detail}</div>
                      </div>
                    ))}
                  </div>

                  {/* Why it matches reasons */}
                  {match.match_reasons.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Why this matches buyer:
                      </span>
                      {match.match_reasons.map((reason, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-[11px] leading-relaxed">{reason}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Gaps or Stretch Warnings */}
                  {match.gap_reasons.length > 0 && (
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Consideration / Gap Factors:
                      </span>
                      {match.gap_reasons.map((gap, idx) => (
                        <p key={idx} className="text-[11px] text-slate-300 pl-4 list-item">
                          {gap}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Quick Action Footer */}
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[10px] text-slate-400">
                      Recommendation: <strong className="text-slate-200">{match.recommended_action}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {match.brochure_url && (
                        <a
                          href={match.brochure_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <Download className="h-3.5 w-3.5" /> Brochure
                        </a>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 text-xs"
                        icon={<Car className="h-3.5 w-3.5 text-emerald-400" />}
                        onClick={() => onScheduleVisit(match.project_id)}
                      >
                        Schedule Visit
                      </Button>

                      <button
                        onClick={() => handleOpenPitch(match)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/30"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>Pitch on WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* WhatsApp Pitch Modal */}
      {customPitchProject && isPitchModalOpen && (
        <WhatsAppModal
          isOpen={isPitchModalOpen}
          onClose={() => {
            setIsPitchModalOpen(false);
            setCustomPitchProject(null);
          }}
          leadId={leadId}
          leadPhone={leadPhone}
          leadName={leadName}
          defaultTemplate="CUSTOM"
          customText={customPitchProject.whatsapp_pitch}
        />
      )}
    </div>
  );
};
