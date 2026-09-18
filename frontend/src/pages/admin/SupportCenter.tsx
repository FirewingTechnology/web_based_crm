import React, { useState, useEffect, useCallback } from 'react';
import {
  HeadphonesIcon, Clock, CheckCircle2, AlertCircle, UserCheck,
  MessageSquare, RefreshCw, X, Send, ChevronDown, Users,
  Ticket, Filter
} from 'lucide-react';
import { copilotApi, SupportTicket, SupportMessage, SupportAgent } from '../../api/copilot';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  ASSIGNED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  RESOLVED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  CLOSED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  OPEN: <AlertCircle className="w-3.5 h-3.5" />,
  ASSIGNED: <UserCheck className="w-3.5 h-3.5" />,
  RESOLVED: <CheckCircle2 className="w-3.5 h-3.5" />,
  CLOSED: <X className="w-3.5 h-3.5" />,
};

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Thread Panel ─────────────────────────────────────────────────────────────

interface ThreadPanelProps {
  ticket: SupportTicket;
  agents: SupportAgent[];
  onAssign: (ticketId: number, agentId: number) => Promise<void>;
  onResolve: (ticketId: number) => Promise<void>;
  onClose: () => void;
}

const ThreadPanel: React.FC<ThreadPanelProps> = ({ ticket, agents, onAssign, onResolve, onClose }) => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<number | ''>('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    try {
      const res = await copilotApi.getTicketMessages(ticket.id);
      setMessages(res.messages);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [ticket.id]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 8000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    try {
      await copilotApi.sendSupportMessage(ticket.id, reply.trim());
      setReply('');
      await loadMessages();
    } finally {
      setSending(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAgentId) return;
    setAssigning(true);
    try {
      await onAssign(ticket.id, Number(selectedAgentId));
      await loadMessages();
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-sm font-bold text-white">Ticket #{ticket.id}</h3>
          <p className="text-[11px] text-slate-400">{ticket.subject}</p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Assign Agent Row (if OPEN) */}
      {ticket.status === 'OPEN' && (
        <div className="p-3 border-b border-slate-800 bg-amber-900/10 flex items-center gap-2 shrink-0">
          <select
            value={selectedAgentId}
            onChange={e => setSelectedAgentId(e.target.value ? Number(e.target.value) : '')}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">— Select agent to assign —</option>
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
            ))}
          </select>
          <button
            onClick={handleAssign}
            disabled={!selectedAgentId || assigning}
            className="px-3 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1"
          >
            {assigning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
            Assign
          </button>
        </div>
      )}

      {/* Assigned Agent Banner */}
      {ticket.assigned_agent_name && (
        <div className="px-4 py-2 bg-blue-900/20 border-b border-blue-800/40 text-xs text-blue-300 flex items-center gap-2 shrink-0">
          <HeadphonesIcon className="w-3.5 h-3.5" />
          Assigned to <strong>{ticket.assigned_agent_name}</strong>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-xs">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-slate-500 text-xs mt-8">No messages yet.</div>
        ) : messages.map(m => (
          <div key={m.id} className={`flex gap-2 ${m.sender_role === 'EXECUTIVE' ? 'justify-end' : 'justify-start'}`}>
            {m.sender_role !== 'EXECUTIVE' && (
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold ${
                m.sender_role === 'AI' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' :
                'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {m.sender_role === 'AI' ? '🤖' : '🧑'}
              </div>
            )}
            <div className={`max-w-[80%] rounded-xl p-2.5 text-xs ${
              m.sender_role === 'EXECUTIVE'
                ? 'bg-blue-600 text-white rounded-tr-sm'
                : m.sender_role === 'AI'
                ? 'bg-slate-800/60 text-slate-300 border border-slate-700/60 rounded-tl-sm'
                : 'bg-emerald-900/40 text-emerald-100 border border-emerald-800/60 rounded-tl-sm'
            }`}>
              <p className="text-[10px] font-semibold mb-1 opacity-70">{m.sender_name}</p>
              <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>
              <p className="text-[9px] mt-1 opacity-50 text-right">
                {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply / Actions */}
      {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' ? (
        <div className="p-3 border-t border-slate-800 bg-[#0c121e] shrink-0">
          <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2 mb-2">
            <input
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder="Reply to executive..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!reply.trim() || sending}
              className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition"
            >
              {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
          <button
            onClick={() => onResolve(ticket.id)}
            className="w-full text-xs py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition font-medium flex items-center justify-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
          </button>
        </div>
      ) : (
        <div className="p-3 border-t border-slate-800 text-center text-xs text-emerald-400">
          ✅ Ticket resolved
        </div>
      )}
    </div>
  );
};


// ── Main Page ─────────────────────────────────────────────────────────────────

export const SupportCenter: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [agents, setAgents] = useState<SupportAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [tRes, aRes] = await Promise.all([
        copilotApi.getTickets(statusFilter || undefined),
        copilotApi.getAgents().catch(() => ({ agents: [] }))
      ]);
      setTickets(tRes.tickets);
      setAgents(aRes.agents);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleAssign = async (ticketId: number, agentId: number) => {
    await copilotApi.assignTicket(ticketId, agentId);
    await loadData();
    // Refresh selected ticket
    if (selectedTicket?.id === ticketId) {
      const updated = tickets.find(t => t.id === ticketId);
      if (updated) setSelectedTicket({ ...updated, status: 'ASSIGNED' });
    }
  };

  const handleResolve = async (ticketId: number) => {
    await copilotApi.resolveTicket(ticketId);
    await loadData();
    if (selectedTicket?.id === ticketId) setSelectedTicket(null);
  };

  const openCount = tickets.filter(t => t.status === 'OPEN').length;
  const assignedCount = tickets.filter(t => t.status === 'ASSIGNED').length;

  return (
    <div className="flex h-full bg-[#080d18] text-white">
      {/* Left: Ticket List */}
      <div className={`flex flex-col ${selectedTicket ? 'w-1/2 border-r border-slate-800' : 'w-full'} transition-all duration-300`}>
        {/* Header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <HeadphonesIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Support Center</h1>
                <p className="text-xs text-slate-400">Human agent escalation queue</p>
              </div>
            </div>
            <button
              onClick={loadData}
              disabled={refreshing}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Open', count: openCount, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
              { label: 'Active', count: assignedCount, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
              { label: 'Total', count: tickets.length, color: 'text-slate-300', bg: 'bg-slate-800/60 border-slate-700/40' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-3 border ${s.bg} text-center`}>
                <p className={`text-lg font-bold ${s.color}`}>{s.count}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="mt-3 flex gap-1.5 flex-wrap">
            {['', 'OPEN', 'ASSIGNED', 'RESOLVED'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-[11px] px-3 py-1 rounded-full border transition font-medium ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading tickets...
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-600">
              <Ticket className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No support tickets yet</p>
              <p className="text-xs mt-1 text-slate-700">Tickets appear when executives request human help</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {tickets.map(ticket => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full text-left p-4 hover:bg-slate-800/30 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-slate-800/50 border-l-2 border-blue-500' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[ticket.status]}`}>
                          {STATUS_ICONS[ticket.status]}
                          {ticket.status}
                        </span>
                        <span className="text-[10px] text-slate-500">#{ticket.id}</span>
                      </div>
                      <p className="text-xs font-semibold text-white truncate">{ticket.requester_name}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{ticket.subject}</p>
                      {ticket.assigned_agent_name && (
                        <p className="text-[10px] text-blue-400 mt-0.5 flex items-center gap-1">
                          <HeadphonesIcon className="w-3 h-3" /> {ticket.assigned_agent_name}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-slate-500">{ticket.created_at ? timeAgo(ticket.created_at) : ''}</p>
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        <MessageSquare className="w-3 h-3 text-slate-600" />
                        <span className="text-[10px] text-slate-500">{ticket.message_count}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Thread Panel */}
      {selectedTicket && (
        <div className="flex-1 flex flex-col">
          <ThreadPanel
            ticket={selectedTicket}
            agents={agents}
            onAssign={handleAssign}
            onResolve={handleResolve}
            onClose={() => setSelectedTicket(null)}
          />
        </div>
      )}
    </div>
  );
};
