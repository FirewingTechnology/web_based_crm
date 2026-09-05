import React, { useState, useEffect } from 'react';
import { X, Share2, Copy, Check, Download, Building2, MapPin, Tag, RefreshCw, AlertCircle } from 'lucide-react';
import { brokersApi } from '../../api/brokers';
import { BrokerProfile, ProjectCollateral } from '../../types/broker';
import { WhatsAppIcon } from '../common/WhatsAppButton';

interface CollateralsModalProps {
  isOpen: boolean;
  onClose: () => void;
  broker: BrokerProfile;
}

export const CollateralsModal: React.FC<CollateralsModalProps> = ({
  isOpen,
  onClose,
  broker
}) => {
  const [collaterals, setCollaterals] = useState<ProjectCollateral[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && broker) {
      loadCollaterals();
    }
  }, [isOpen, broker]);

  const loadCollaterals = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await brokersApi.getBrokerCollaterals(broker.id);
      setCollaterals(data);
    } catch (err: any) {
      console.error('Failed to load project collaterals:', err);
      setError('Could not load project collaterals.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Co-Branded Marketing Collaterals & Kits
              </h2>
              <p className="text-xs text-slate-400">
                Prepared exclusively for: <strong className="text-amber-400 font-semibold">{broker.firm_name}</strong> ({broker.contact_person} • {broker.phone})
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-amber-400" />
              <span>Generating co-branded collaterals for {broker.firm_name}...</span>
            </div>
          ) : collaterals.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No active project collaterals available.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {collaterals.map((c) => (
                <div 
                  key={c.project_id}
                  className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between hover:border-amber-500/40 transition gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Building2 className="h-4 w-4 text-amber-400 shrink-0" />
                          {c.project_name}
                        </h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          {c.location}
                        </p>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                        {c.price_range}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-700/60 border border-slate-600">
                        Config: {c.configuration}
                      </span>
                      {c.amenities.slice(0, 2).map((a, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-700/40 border border-slate-600 text-slate-400">
                          {a}
                        </span>
                      ))}
                    </div>

                    {/* Preview Box */}
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto custom-scrollbar">
                      {c.co_branded_share_text}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-700/50">
                    <button
                      type="button"
                      onClick={() => handleCopyText(c.project_id, c.co_branded_share_text)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        copiedId === c.project_id
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600'
                      }`}
                    >
                      {copiedId === c.project_id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Pitch</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      {c.brochure_url && (
                        <a
                          href={c.brochure_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition"
                          title="Download Brochure PDF"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      )}

                      <a
                        href={c.co_branded_whatsapp_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition"
                      >
                        <WhatsAppIcon className="h-3.5 w-3.5" />
                        <span>Share on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
