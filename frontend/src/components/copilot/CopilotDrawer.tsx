import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles, X, Send, Bot, User as UserIcon, ArrowRight,
  Loader2, Lightbulb, HeadphonesIcon, CheckCircle2, Clock,
  MessageCircle, AlertCircle, Minimize2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { copilotApi, ChatMessage, SupportMessage } from '../../api/copilot';

// ─── Types ────────────────────────────────────────────────────────────────────

type SenderType = 'user' | 'assistant' | 'agent' | 'system';

interface UIMessage {
  sender: SenderType;
  text: string;
  suggested_actions?: Array<{ label: string; url: string }>;
  timestamp: string;
}

type CopilotMode = 'AI' | 'SUPPORT_PENDING' | 'SUPPORT_ACTIVE' | 'SUPPORT_RESOLVED';

// ─── Simple markdown renderer (headers, bold, inline code, lists) ───────────

const RenderMarkdown: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="space-y-1.5 text-xs leading-relaxed">
      {text.split('\n').map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-0.5" />;

        // Header 3: ### Title
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={i} className="text-xs font-bold text-blue-300 mt-2 mb-1 flex items-center gap-1.5 border-b border-slate-800 pb-1">
              {trimmed.replace(/^###\s+/, '')}
            </h4>
          );
        }

        // Header 4: #### Subtitle
        if (trimmed.startsWith('#### ')) {
          return (
            <h5 key={i} className="text-[11px] font-bold text-slate-200 mt-1.5 mb-0.5">
              {trimmed.replace(/^####\s+/, '')}
            </h5>
          );
        }

        const isListItem = trimmed.startsWith('- ') || trimmed.startsWith('• ') || /^\d+\.\s/.test(trimmed);
        const listContent = trimmed.replace(/^[-•]\s+/, '').replace(/^\d+\.\s+/, '');

        // Parse inline bold **text** and inline code `code`
        const parseInline = (str: string) => {
          const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
          return parts.map((p, pi) => {
            if (p.startsWith('**') && p.endsWith('**')) {
              return <strong key={pi} className="text-white font-semibold">{p.slice(2, -2)}</strong>;
            }
            if (p.startsWith('`') && p.endsWith('`')) {
              return <code key={pi} className="px-1 py-0.5 rounded bg-slate-800 text-blue-300 font-mono text-[10px]">{p.slice(1, -1)}</code>;
            }
            return p;
          });
        };

        return (
          <div key={i} className={isListItem ? 'ml-2.5 flex gap-1.5 items-start' : ''}>
            {isListItem && <span className="text-blue-400 mt-0.5 shrink-0 text-[10px]">•</span>}
            <span className="text-slate-200">
              {parseInline(isListItem ? listContent : trimmed)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const CopilotDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<CopilotMode>('AI');
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [assignedAgent, setAssignedAgent] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeenMsgCount, setLastSeenMsgCount] = useState(0);

  const [llmHistory, setLlmHistory] = useState<ChatMessage[]>([]);
  const [messages, setMessages] = useState<UIMessage[]>([
    {
      sender: 'assistant',
      text: '👋 **Hello! I am your REALVION Revenue Copilot.**\n\nI am grounded directly with **live RAG intelligence** from your CRM database:\n\n- 🔍 **Live CRM Search**: Ask about any lead, phone number, or project\n- 🏢 **Inventory Matching**: Ask for 2/3 BHK units, prices, or locations\n- 📅 **Schedule Intelligence**: View today\'s follow-ups and site visits\n- 🎯 **Sales Playbooks**: Get battlecards for price objections or delay fears',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();

  const promptSuggestions = [
    'Show hot high-priority leads',
    'Show projects & inventory',
    'Today\'s follow-ups & tasks',
    'Objection: customer wants discount',
    'Objection: fear of construction delay',
  ];

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // ── Focus input on open ────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // ── Poll for human support messages ───────────────────────────────────────
  const pollTicket = useCallback(async () => {
    if (!ticketId || mode === 'AI') return;
    try {
      const res = await copilotApi.getMyTicket();
      if (!res.ticket) return;

      const ticket = res.ticket;

      // Detect newly assigned agent
      if (ticket.assigned_agent && !assignedAgent) {
        setAssignedAgent(ticket.assigned_agent);
        setMode('SUPPORT_ACTIVE');
      }

      // Detect resolved
      if (ticket.status === 'RESOLVED') {
        setMode('SUPPORT_RESOLVED');
        stopPolling();
      }

      // Sync new messages to UI
      const newMsgs = ticket.messages || [];
      if (newMsgs.length > lastSeenMsgCount) {
        const freshMsgs = newMsgs.slice(lastSeenMsgCount);
        setLastSeenMsgCount(newMsgs.length);

        // Convert to UI messages (skip AI system messages we already added)
        const uiMsgs: UIMessage[] = freshMsgs
          .filter((m: SupportMessage) => m.sender_role !== 'AI' || lastSeenMsgCount > 0)
          .map((m: SupportMessage) => ({
            sender: m.sender_role === 'AGENT' ? 'agent' : m.sender_role === 'AI' ? 'system' : 'user',
            text: m.message,
            timestamp: m.created_at
              ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '',
          }));

        if (uiMsgs.length > 0) {
          setMessages(prev => [...prev, ...uiMsgs]);
          if (!isOpen) setUnreadCount(u => u + uiMsgs.length);
        }
      }
    } catch (e) {
      // Silently ignore polling errors
    }
  }, [ticketId, mode, assignedAgent, lastSeenMsgCount, isOpen]);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(pollTicket, 5000);
  }, [pollTicket]);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    if (mode !== 'AI') startPolling();
    return stopPolling;
  }, [mode, startPolling]);

  // ── Reset on close ─────────────────────────────────────────────────────────
  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
  };

  // ── Send AI Message ────────────────────────────────────────────────────────
  const handleSendAI = async (queryText?: string) => {
    const textToSend = queryText || query;
    if (!textToSend.trim() || loading) return;

    const userMsg: UIMessage = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setQuery('');
    setLoading(true);

    const updatedHistory: ChatMessage[] = [
      ...llmHistory,
      { role: 'user', content: textToSend }
    ];

    try {
      const res = await copilotApi.ask(textToSend, llmHistory);
      const assistantMsg: UIMessage = {
        sender: 'assistant',
        text: res.answer,
        suggested_actions: res.suggested_actions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setLlmHistory([...updatedHistory, { role: 'assistant', content: res.answer }]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          sender: 'system',
          text: '⚠️ I encountered an issue. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ── Send Human Support Message ─────────────────────────────────────────────
  const handleSendSupport = async () => {
    const textToSend = query.trim();
    if (!textToSend || loading || !ticketId) return;

    const userMsg: UIMessage = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      await copilotApi.sendSupportMessage(ticketId, textToSend);
      setLastSeenMsgCount(c => c + 1);
    } catch {
      setMessages(prev => [...prev, {
        sender: 'system',
        text: '⚠️ Failed to send message. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (mode === 'AI') handleSendAI();
    else if (mode === 'SUPPORT_ACTIVE') handleSendSupport();
  };

  // ── Request Human Support ──────────────────────────────────────────────────
  const handleRequestHuman = async () => {
    setLoading(true);
    setMode('SUPPORT_PENDING');

    const sysMsg: UIMessage = {
      sender: 'system',
      text: '🎫 **Requesting human support...**\n\nOpening a support ticket for you.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, sysMsg]);

    try {
      const res = await copilotApi.requestSupport(
        'Sales executive needs assistance via Copilot'
      );
      setTicketId(res.ticket_id);
      setLastSeenMsgCount(1); // Skip the system open message we'll add

      const confirmMsg: UIMessage = {
        sender: 'system',
        text: `✅ **Support ticket #${res.ticket_id} created!**\n\n${
          res.assigned_agent
            ? `You're connected with **${res.assigned_agent}**.`
            : '⏳ A support agent will be assigned shortly. You\'ll be notified here when they connect.\n\nFeel free to describe your issue below.'
        }`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, confirmMsg]);

      if (res.assigned_agent) {
        setAssignedAgent(res.assigned_agent);
        setMode('SUPPORT_ACTIVE');
      }
    } catch {
      setMode('AI');
      setMessages(prev => [...prev, {
        sender: 'system',
        text: '⚠️ Could not create support ticket. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setLoading(false);
    }
  };

  // ── Back to AI Mode ────────────────────────────────────────────────────────
  const handleBackToAI = () => {
    setMode('AI');
    setTicketId(null);
    setAssignedAgent(null);
    setLastSeenMsgCount(0);
    stopPolling();
  };

  // ── Mode header config ─────────────────────────────────────────────────────
  const headerConfig = {
    AI: { badge: 'AI', color: 'text-blue-400', subtitle: 'Live Real Estate Intelligence · GPT-4o' },
    SUPPORT_PENDING: { badge: 'WAITING', color: 'text-amber-400', subtitle: '⏳ Waiting for agent assignment...' },
    SUPPORT_ACTIVE: { badge: 'LIVE', color: 'text-emerald-400', subtitle: `🟢 Connected · ${assignedAgent || 'Support Agent'}` },
    SUPPORT_RESOLVED: { badge: 'RESOLVED', color: 'text-slate-400', subtitle: '✅ Session resolved' },
  };
  const hdr = headerConfig[mode];

  return (
    <>
      {/* ── Floating Trigger ──────────────────────────────────────────────── */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold text-xs rounded-full shadow-2xl shadow-blue-600/50 border border-blue-400/30 transition-all transform hover:scale-105"
          id="copilot-trigger-btn"
        >
          <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
          <span>Ask REALVION Copilot</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* ── Drawer ───────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md bg-[#070b12] border-l border-slate-800/90 shadow-2xl flex flex-col h-full transition-all duration-300 ${isMinimized ? 'translate-y-[calc(100%-60px)]' : ''}`}>

            {/* Header */}
            <div className="p-4 border-b border-slate-800/80 bg-[#0c121e] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md ${
                  mode === 'SUPPORT_ACTIVE' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                  mode === 'SUPPORT_PENDING' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                  'bg-gradient-to-br from-blue-500 to-indigo-600'
                }`}>
                  {mode === 'AI' ? <Sparkles className="w-4 h-4 text-amber-300" /> :
                   mode === 'SUPPORT_ACTIVE' ? <HeadphonesIcon className="w-4 h-4" /> :
                   mode === 'SUPPORT_RESOLVED' ? <CheckCircle2 className="w-4 h-4" /> :
                   <Clock className="w-4 h-4 animate-pulse" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    REALVION Copilot
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                      mode === 'AI' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                      mode === 'SUPPORT_ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      mode === 'SUPPORT_PENDING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                      'bg-slate-500/20 text-slate-400 border-slate-500/30'
                    }`}>{hdr.badge}</span>
                  </h3>
                  <p className={`text-[11px] ${hdr.color}`}>{hdr.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(m => !m)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                  title="Minimize"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Quick Prompts (AI mode only) */}
                {mode === 'AI' && (
                  <div className="p-3 bg-slate-900/40 border-b border-slate-800/60 overflow-x-auto flex gap-1.5 no-scrollbar shrink-0">
                    {promptSuggestions.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendAI(prompt)}
                        disabled={loading}
                        className="whitespace-nowrap text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all flex items-center gap-1 flex-shrink-0 disabled:opacity-40"
                      >
                        <Lightbulb className="w-3 h-3 text-amber-400" />
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Support mode info bar */}
                {mode !== 'AI' && (
                  <div className={`px-4 py-2 border-b border-slate-800/60 flex items-center justify-between shrink-0 ${
                    mode === 'SUPPORT_ACTIVE' ? 'bg-emerald-900/20' :
                    mode === 'SUPPORT_RESOLVED' ? 'bg-slate-900/40' :
                    'bg-amber-900/20'
                  }`}>
                    <div className="flex items-center gap-2 text-xs">
                      <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-400">
                        {mode === 'SUPPORT_PENDING' && 'Waiting for agent...'}
                        {mode === 'SUPPORT_ACTIVE' && `Live with ${assignedAgent}`}
                        {mode === 'SUPPORT_RESOLVED' && 'Session resolved'}
                      </span>
                    </div>
                    <button
                      onClick={handleBackToAI}
                      className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                    >
                      ← Back to AI
                    </button>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Avatar */}
                      {msg.sender !== 'user' && (
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          msg.sender === 'agent' ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400' :
                          msg.sender === 'system' ? 'bg-slate-800/60 border border-slate-700 text-slate-400' :
                          'bg-blue-600/20 border border-blue-500/30 text-blue-400'
                        }`}>
                          {msg.sender === 'agent' ? <HeadphonesIcon className="w-4 h-4" /> :
                           msg.sender === 'system' ? <AlertCircle className="w-3.5 h-3.5" /> :
                           <Bot className="w-4 h-4" />}
                        </div>
                      )}

                      {/* Bubble */}
                      <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-sm'
                          : msg.sender === 'agent'
                          ? 'bg-emerald-900/40 text-emerald-100 border border-emerald-800/60 rounded-tl-sm shadow-sm'
                          : msg.sender === 'system'
                          ? 'bg-slate-800/50 text-slate-300 border border-slate-700/60 rounded-tl-sm'
                          : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-sm shadow-sm'
                      }`}>
                        {msg.sender === 'agent' && (
                          <p className="text-[10px] font-semibold text-emerald-400 mb-1.5 uppercase tracking-wide">
                            🧑‍💼 Support Agent
                          </p>
                        )}
                        <div className="font-sans">
                          <RenderMarkdown text={msg.text} />
                        </div>

                        {/* Action buttons */}
                        {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap gap-2">
                            {msg.suggested_actions.map((act, actIdx) => (
                              <button
                                key={actIdx}
                                onClick={() => { setIsOpen(false); navigate(act.url); }}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] font-semibold transition-all"
                              >
                                <span>{act.label}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="mt-1 text-[10px] text-slate-500 text-right">
                          {msg.timestamp}
                        </div>
                      </div>

                      {msg.sender === 'user' && (
                        <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0 mt-0.5">
                          <UserIcon className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {loading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-slate-900/90 rounded-2xl rounded-tl-sm p-3 border border-slate-800 flex items-center gap-2 text-xs text-slate-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                        {mode === 'AI' ? 'Analyzing live CRM data with GPT-4o...' : 'Sending...'}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <div className="p-3 border-t border-slate-800/80 bg-[#0c121e] shrink-0">
                  {/* "Talk to Human" button — shown after 2+ AI exchanges */}
                  {mode === 'AI' && llmHistory.length >= 2 && (
                    <button
                      onClick={handleRequestHuman}
                      disabled={loading}
                      className="w-full mb-2 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition-all disabled:opacity-40"
                    >
                      <HeadphonesIcon className="w-3.5 h-3.5" />
                      Talk to a Human Support Agent
                    </button>
                  )}

                  {/* Resolved state */}
                  {mode === 'SUPPORT_RESOLVED' ? (
                    <div className="text-center">
                      <p className="text-xs text-slate-400 mb-2">This support session is closed.</p>
                      <button
                        onClick={handleBackToAI}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                      >
                        ← Return to AI Copilot
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                      className="flex items-center gap-2"
                    >
                      <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={
                          mode === 'AI' ? 'Ask Copilot anything...' :
                          mode === 'SUPPORT_PENDING' ? 'Describe your issue...' :
                          'Message your support agent...'
                        }
                        disabled={loading}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className={`p-2.5 disabled:opacity-40 text-white rounded-xl transition-all flex items-center justify-center shadow-md ${
                          mode === 'SUPPORT_ACTIVE'
                            ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                            : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                        }`}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
