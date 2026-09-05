import React, { useState, useEffect } from 'react';
import { 
  X, Send, MessageSquare, Check, CheckCheck, Clock, 
  MapPin, Calendar, CreditCard, Sparkles, RefreshCw, AlertCircle, ExternalLink
} from 'lucide-react';
import { whatsappApi } from '../../api/whatsapp';
import { WhatsAppTemplate, WhatsAppMessage } from '../../types/whatsapp';
import { normalizePhoneNumber } from '../common/WhatsAppButton';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: number;
  leadName: string;
  phone: string;
  onMessageSent?: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  leadId,
  leadName,
  phone,
  onMessageSent
}) => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('QUALIFICATION');
  const [messageBody, setMessageBody] = useState<string>('');
  const [history, setHistory] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && leadId) {
      loadTemplatesAndHistory();
    }
  }, [isOpen, leadId]);

  const loadTemplatesAndHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tplData, histData] = await Promise.all([
        whatsappApi.getTemplates(leadId),
        whatsappApi.getLeadMessages(leadId)
      ]);
      setTemplates(tplData);
      setHistory(histData);

      // Default select qualification or first template
      const defaultTpl = tplData.find(t => t.key === selectedTemplateKey) || tplData[0];
      if (defaultTpl) {
        setSelectedTemplateKey(defaultTpl.key);
        setMessageBody(defaultTpl.rendered_body);
      }
    } catch (err: any) {
      console.error('Failed to load WhatsApp data:', err);
      setError('Could not load WhatsApp templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (tpl: WhatsAppTemplate) => {
    setSelectedTemplateKey(tpl.key);
    setMessageBody(tpl.rendered_body);
  };

  const handleSend = async () => {
    if (!messageBody.trim()) {
      setError('Message body cannot be empty.');
      return;
    }

    const { normalized, isValid } = normalizePhoneNumber(phone);
    if (!isValid) {
      setError('Recipient phone number is invalid.');
      return;
    }

    setSending(true);
    setError(null);
    try {
      const recorded = await whatsappApi.sendMessage({
        lead_id: leadId,
        template_key: selectedTemplateKey,
        recipient_phone: normalized,
        message_body: messageBody.trim()
      });

      // Open WhatsApp Web / App
      if (recorded.wa_link) {
        window.open(recorded.wa_link, '_blank', 'noopener,noreferrer');
      } else {
        const encoded = encodeURIComponent(messageBody.trim());
        window.open(`https://wa.me/${normalized}?text=${encoded}`, '_blank', 'noopener,noreferrer');
      }

      setSuccessNotice('Message logged and WhatsApp launched successfully!');
      setTimeout(() => setSuccessNotice(null), 4000);

      // Refresh history & notify parent
      const updatedHist = await whatsappApi.getLeadMessages(leadId);
      setHistory(updatedHist);
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (err: any) {
      console.error('Failed to send WhatsApp message:', err);
      setError(err?.response?.data?.detail || 'Failed to dispatch WhatsApp message.');
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (msgId: number, nextStatus: 'DELIVERED' | 'READ' | 'REPLIED') => {
    try {
      await whatsappApi.updateMessageStatus(msgId, nextStatus);
      const updated = await whatsappApi.getLeadMessages(leadId);
      setHistory(updated);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Qualification': return <Sparkles className="h-3.5 w-3.5 text-blue-400" />;
      case 'Site Visit': return <MapPin className="h-3.5 w-3.5 text-emerald-400" />;
      case 'Follow-up': return <Clock className="h-3.5 w-3.5 text-amber-400" />;
      case 'Closing': return <CreditCard className="h-3.5 w-3.5 text-purple-400" />;
      case 'Reactivation': return <RefreshCw className="h-3.5 w-3.5 text-rose-400" />;
      default: return <MessageSquare className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
            <Check className="h-3 w-3 text-slate-400" /> Sent
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-600">
            <CheckCheck className="h-3 w-3 text-slate-400" /> Delivered
          </span>
        );
      case 'READ':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
            <CheckCheck className="h-3 w-3 text-cyan-400" /> Read
          </span>
        );
      case 'REPLIED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/40">
            <MessageSquare className="h-3 w-3 text-emerald-400" /> Replied
          </span>
        );
      default:
        return <span className="text-[11px] text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl shadow-emerald-950/20 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                WhatsApp Revenue Workflow
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                  Direct Click-to-Chat
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Recipient: <span className="text-slate-200 font-semibold">{leadName}</span> ({phone})
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Template Selection Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
              Select High-Conversion Template
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {templates.map((tpl) => {
                const isSelected = selectedTemplateKey === tpl.key;
                return (
                  <button
                    key={tpl.key}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`p-2.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/60 ring-1 ring-emerald-500/40 text-white'
                        : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {getCategoryIcon(tpl.category)}
                      <span className="text-xs font-bold truncate">{tpl.category}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{tpl.title}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* WhatsApp Message Preview Bubble & Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Personalized Message Editor
              </label>
              <span className="text-[11px] text-slate-500">
                {messageBody.length} characters
              </span>
            </div>

            {/* Simulated WhatsApp Chat Bubble */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-emerald-900/30 relative">
              <div className="bg-[#054740] border border-[#0a5c53] rounded-2xl rounded-tr-none p-3.5 shadow-lg max-w-xl ml-auto relative">
                <textarea
                  rows={4}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Type your WhatsApp message..."
                  className="w-full bg-transparent text-emerald-50 text-xs sm:text-sm leading-relaxed focus:outline-none resize-y placeholder-emerald-200/40"
                />
                <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-emerald-300/60">
                  <span>Just now</span>
                  <CheckCheck className="h-3.5 w-3.5 text-cyan-400" />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 italic">
              * Variables like buyer name, property coordinates, budget, and sales rep details have been automatically merged. You can customize the text before launching.
            </p>
          </div>

          {/* Communication History */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                Logged WhatsApp History ({history.length})
              </h3>
              <button
                type="button"
                onClick={loadTemplatesAndHistory}
                className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition"
              >
                <RefreshCw className="h-3 w-3" /> Refresh
              </button>
            </div>

            {history.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 text-center text-xs text-slate-500">
                No outbound WhatsApp messages logged for this lead yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {history.map((msg) => (
                  <div 
                    key={msg.id}
                    className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">{msg.template_key || 'Custom'}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400 text-[11px]">
                          {new Date(msg.sent_at).toLocaleString()}
                        </span>
                        {msg.sender_name && (
                          <span className="text-[10px] text-slate-500">
                            by {msg.sender_name}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 text-[11px] line-clamp-1 truncate">
                        "{msg.message_body}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(msg.status)}

                      {/* Quick status progress buttons */}
                      {msg.status === 'SENT' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(msg.id, 'DELIVERED')}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                        >
                          Mark Delivered
                        </button>
                      )}
                      {msg.status === 'DELIVERED' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(msg.id, 'READ')}
                          className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 transition"
                        >
                          Mark Read
                        </button>
                      )}
                      {(msg.status === 'SENT' || msg.status === 'DELIVERED' || msg.status === 'READ') && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(msg.id, 'REPLIED')}
                          className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 transition"
                        >
                          Mark Replied
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !messageBody.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 hover:scale-[1.02] active:scale-[0.98] transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Logging & Launching...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Launch WhatsApp & Log Activity</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
