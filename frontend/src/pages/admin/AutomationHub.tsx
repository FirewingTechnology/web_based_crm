import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Globe,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Copy,
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Eye,
  RefreshCw
} from 'lucide-react';
import { leadSourcesApi, LeadSourceIntegration, LeadSourceEvent } from '../../api/leadSources';
import { automationApi, AutomationRule } from '../../api/automation';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const AutomationHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'integrations' | 'rules' | 'audit'>('integrations');
  const [integrations, setIntegrations] = useState<LeadSourceIntegration[]>([]);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [auditLogs, setAuditLogs] = useState<LeadSourceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Modal State for Rule Creation
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('LEAD_CREATED');
  const [conditionField, setConditionField] = useState('deal_value');
  const [conditionOp, setConditionOp] = useState('>=');
  const [conditionVal, setConditionVal] = useState('100');
  const [actionType, setActionType] = useState('SET_PRIORITY');
  const [actionVal, setActionVal] = useState('Urgent');
  const [savingRule, setSavingRule] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [integrationsData, rulesData, logsData] = await Promise.all([
        leadSourcesApi.getIntegrations(),
        automationApi.getRules(),
        leadSourcesApi.getAuditLogs({ limit: 50 })
      ]);
      setIntegrations(integrationsData);
      setRules(rulesData);
      setAuditLogs(logsData);
    } catch (err) {
      console.error('Failed to load automation hub data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleToggleRule = async (rule: AutomationRule) => {
    try {
      await automationApi.updateRule(rule.id, { is_active: !rule.is_active });
      setRules(rules.map(r => r.id === rule.id ? { ...r, is_active: !r.is_active } : r));
    } catch (err) {
      console.error('Failed to toggle rule', err);
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this automation rule?')) return;
    try {
      await automationApi.deleteRule(id);
      setRules(rules.filter(r => r.id !== id));
    } catch (err) {
      console.error('Failed to delete rule', err);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingRule(true);
      const newRule = await automationApi.createRule({
        name: ruleName,
        description: ruleDescription,
        trigger_event: triggerEvent,
        conditions_json: [
          {
            field: conditionField,
            operator: conditionOp,
            value: isNaN(Number(conditionVal)) ? conditionVal : Number(conditionVal)
          }
        ],
        actions_json: [
          {
            action_type: actionType,
            value: actionVal
          }
        ],
        is_active: true
      });
      setRules([newRule, ...rules]);
      setIsRuleModalOpen(false);
      setRuleName('');
      setRuleDescription('');
    } catch (err) {
      console.error('Failed to create automation rule', err);
    } finally {
      setSavingRule(false);
    }
  };

  // Base API origin for webhooks
  const apiBase = window.location.origin;

  const standardIntegrations = [
    {
      source_type: 'Meta',
      name: 'Meta Ads (Facebook & Instagram)',
      endpoint: `${apiBase}/api/v1/ingest/meta`,
      description: 'Official Webhook Listener with leadgen instant ingestion, +91 normalization, and SLA assignment.',
      routing: 'High-Value / Least-Loaded',
      badge: 'Certified Adapter'
    },
    {
      source_type: 'Housing',
      name: 'Housing.com Lead Webhook',
      endpoint: `${apiBase}/api/v1/ingest/housing`,
      description: 'Ingests buyer budget, preferred unit type, and project interest with automatic duplicate timelines.',
      routing: 'Round-Robin Rotation',
      badge: 'Certified Adapter'
    },
    {
      source_type: '99acres',
      name: '99acres Ingestion Listener',
      endpoint: `${apiBase}/api/v1/ingest/99acres`,
      description: 'Standard 99acres verification and lead parser with multi-source attribution tagging.',
      routing: 'Round-Robin Rotation',
      badge: 'Certified Adapter'
    },
    {
      source_type: 'Website',
      name: 'Official Developer Website Form',
      endpoint: `${apiBase}/api/v1/ingest/website`,
      description: 'Collects project landing page inquiries, UTM source tags, and starts response timers immediately.',
      routing: 'Project Specialist Routing',
      badge: 'Native Form'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Cpu className="w-6 h-6 text-blue-400" />
              Automation Center & Integration Hub
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold">
              Revenue OS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Deterministic lead assignment, universal webhooks, SLA enforcement, and event-driven automation rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700/80 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsRuleModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Automation Rule
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('integrations')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-all relative ${
            activeTab === 'integrations'
              ? 'text-blue-400 border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Lead Source Adapters & Webhooks
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-all relative ${
            activeTab === 'rules'
              ? 'text-blue-400 border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Visual Automation Rules ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-all relative ${
            activeTab === 'audit'
              ? 'text-blue-400 border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Ingestion Audit Vault ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: INTEGRATIONS */}
      {activeTab === 'integrations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {standardIntegrations.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-bold text-white">{item.name}</h3>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {item.description}
                </p>

                {/* Webhook Endpoint Box */}
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Webhook Listener URL
                    </span>
                    <button
                      onClick={() => handleCopyUrl(item.endpoint)}
                      className="text-[11px] font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedUrl === item.endpoint ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <code className="text-[11px] text-slate-300 font-mono break-all select-all">
                    {item.endpoint}
                  </code>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Routing: <strong className="text-slate-200">{item.routing}</strong>
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Listener Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: RULES */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {rules.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center">
              <Zap className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white mb-1">No Custom Automation Rules Yet</h3>
              <p className="text-xs text-slate-400 mb-4">
                Create event-driven rules to auto-route luxury buyers, assign SLA tags, and schedule follow-ups.
              </p>
              <button
                onClick={() => setIsRuleModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md"
              >
                + Create First Rule
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-4">Rule Name</th>
                    <th className="p-4">Trigger Event</th>
                    <th className="p-4">Conditions</th>
                    <th className="p-4">Automated Actions</th>
                    <th className="p-4 text-center">Trigger Count</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="p-4 font-semibold text-white">
                        <div>{rule.name}</div>
                        {rule.description && (
                          <div className="text-[11px] text-slate-400 font-normal">{rule.description}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-md bg-blue-950/60 text-blue-400 border border-blue-800/40 font-mono text-[11px]">
                          {rule.trigger_event}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-amber-300/90">
                        {rule.conditions_json.map((c, i) => (
                          <div key={i}>
                            {c.field} {c.operator} {String(c.value)}
                          </div>
                        ))}
                      </td>
                      <td className="p-4 font-mono text-[11px] text-emerald-300">
                        {rule.actions_json.map((a, i) => (
                          <div key={i}>
                            {a.action_type} &rarr; {String(a.value)}
                          </div>
                        ))}
                      </td>
                      <td className="p-4 text-center font-bold text-white">
                        {rule.execution_count}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleRule(rule)}
                          className={`px-2 py-1 rounded-full text-[10px] font-semibold transition-all ${
                            rule.is_active
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          {rule.is_active ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Source</th>
                <th className="p-4">External Event ID</th>
                <th className="p-4">Processing Status</th>
                <th className="p-4">Attached Lead ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No webhook ingestion events recorded yet. Send a test webhook from Meta, Housing, or Website.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="p-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-semibold text-white">
                      {log.source_type}
                    </td>
                    <td className="p-4 font-mono text-[11px] text-slate-400">
                      {log.external_event_id || '—'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        log.status === 'PROCESSED'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : log.status === 'DUPLICATE_ATTACHED'
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 text-blue-400 font-semibold">
                      {log.lead_id ? `#${log.lead_id}` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Rule Modal */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c121e] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <h2 className="text-base font-bold text-white mb-1">Create Visual Automation Rule</h2>
            <p className="text-xs text-slate-400 mb-4">Define trigger conditions and automatic revenue actions.</p>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="E.g. Auto-Prioritize High Value Leads"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Trigger Event</label>
                <select
                  value={triggerEvent}
                  onChange={(e) => setTriggerEvent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="LEAD_CREATED">Lead Created / Ingested</option>
                  <option value="CALL_LOGGED">Call Logged</option>
                  <option value="SITE_VISIT_VERIFIED">Site Visit GPS Verified</option>
                  <option value="SLA_BREACHED">SLA Response Breached</option>
                </select>
              </div>

              {/* Condition Row */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">IF Condition Matches</label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={conditionField}
                    onChange={(e) => setConditionField(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white"
                  >
                    <option value="deal_value">Deal Value (₹ L)</option>
                    <option value="budget_max">Budget Max (₹ L)</option>
                    <option value="source">Lead Source</option>
                    <option value="preferred_configuration">Configuration</option>
                  </select>

                  <select
                    value={conditionOp}
                    onChange={(e) => setConditionOp(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white"
                  >
                    <option value=">=">&gt;= (Greater or Equal)</option>
                    <option value="<=">&lt;= (Less or Equal)</option>
                    <option value="==">== (Exact Match)</option>
                    <option value="in">Contains</option>
                  </select>

                  <input
                    type="text"
                    required
                    value={conditionVal}
                    onChange={(e) => setConditionVal(e.target.value)}
                    placeholder="Value"
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Action Row */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">THEN Execute Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white"
                  >
                    <option value="SET_PRIORITY">Set Lead Priority</option>
                    <option value="SET_SLA">Set SLA Response (Minutes)</option>
                    <option value="CREATE_FOLLOWUP">Auto-Create Followup</option>
                  </select>

                  <input
                    type="text"
                    required
                    value={actionVal}
                    onChange={(e) => setActionVal(e.target.value)}
                    placeholder="Urgent / 15 / Call"
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRule}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30"
                >
                  {savingRule ? 'Saving...' : 'Save Automation Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
