import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { 
  Plus, UserCheck, Phone, Mail, Award, Coins, Edit, Trash2, 
  CheckCircle2, AlertCircle, X, Share2, Handshake, Shield, Sparkles, 
  TrendingUp, Users, ArrowUpRight, Crown, Layers
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { BrokerModal } from '../../components/modals/BrokerModal';
import { CollateralsModal } from '../../components/modals/CollateralsModal';
import { CoBrokingModal } from '../../components/modals/CoBrokingModal';
import { brokersApi } from '../../api/brokers';
import { BrokerProfile, BrokerCreateInput, BrokerTierConfig, CoBrokingDeal } from '../../types/broker';

export const BrokerManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'directory' | 'cobroking' | 'tiers'>('directory');
  const [brokers, setBrokers] = useState<BrokerProfile[]>([]);
  const [tiers, setTiers] = useState<BrokerTierConfig[]>([]);
  const [coBrokingDeals, setCoBrokingDeals] = useState<CoBrokingDeal[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCollateralsOpen, setIsCollateralsOpen] = useState(false);
  const [isCoBrokingOpen, setIsCoBrokingOpen] = useState(false);
  const [selectedBrokerForCollaterals, setSelectedBrokerForCollaterals] = useState<BrokerProfile | null>(null);
  const [editingBroker, setEditingBroker] = useState<BrokerProfile | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 5000);
  };

  const fetchBrokersAndData = async () => {
    try {
      const [brokerList, tierList, deals] = await Promise.all([
        brokersApi.getBrokers(),
        brokersApi.getBrokerTiers(),
        brokersApi.getCoBrokingDeals()
      ]);
      setBrokers(brokerList);
      setTiers(tierList);
      setCoBrokingDeals(deals);
    } catch (err) {
      console.error('Failed to fetch broker data:', err);
    }
  };

  useEffect(() => {
    fetchBrokersAndData();
  }, []);

  const handleCreateOrUpdateBroker = async (data: BrokerCreateInput) => {
    if (editingBroker) {
      await brokersApi.updateBroker(editingBroker.id, data);
      showNotification('success', `Broker "${data.firm_name || data.contact_person}" updated successfully!`);
    } else {
      await brokersApi.createBroker(data);
      showNotification('success', `Broker "${data.firm_name || data.contact_person}" registered successfully!`);
    }
    await fetchBrokersAndData();
  };

  const handleTierUpgrade = async (brokerId: number, currentTier: string) => {
    const nextTier = currentTier === 'Silver' ? 'Gold' : currentTier === 'Gold' ? 'Platinum' : 'Silver';
    try {
      await brokersApi.updateBrokerTier(brokerId, nextTier);
      showNotification('success', `Channel Partner upgraded to ${nextTier} tier!`);
      await fetchBrokersAndData();
    } catch (err: any) {
      showNotification('error', err?.response?.data?.detail || 'Failed to update tier');
    }
  };

  const handleDeleteBroker = async (id: number) => {
    const b = brokers.find((x) => x.id === id);
    if (confirm(`Delete broker "${b?.firm_name || b?.contact_person || 'this broker'}"?`)) {
      try {
        await brokersApi.deleteBroker(id);
        showNotification('success', `Broker "${b?.firm_name || b?.contact_person || ''}" removed successfully.`);
        await fetchBrokersAndData();
      } catch (err: any) {
        showNotification('error', err.response?.data?.detail || 'Failed to delete broker.');
      }
    }
  };

  // KPI Calculations
  const totalCPs = brokers.length;
  const platinumCPs = brokers.filter((b) => b.tier?.toLowerCase() === 'platinum').length;
  const goldCPs = brokers.filter((b) => b.tier?.toLowerCase() === 'gold').length;
  const totalRevenueCr = brokers.reduce((acc, b) => acc + (b.total_revenue_generated || 0), 0) / 100.0; // Assuming in Lakhs

  const getTierBadge = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'platinum':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
            <Crown className="h-3 w-3 text-purple-400" /> Platinum
          </span>
        );
      case 'gold':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Sparkles className="h-3 w-3 text-amber-400" /> Gold
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            <Shield className="h-3 w-3 text-slate-400" /> Silver
          </span>
        );
    }
  };

  const directoryColumns: ColumnDef<BrokerProfile>[] = [
    {
      accessorKey: 'firm_name',
      header: 'CP Firm & Hierarchy',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-white">{row.original.firm_name}</p>
              {row.original.sub_broker_count && row.original.sub_broker_count > 0 ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                  {row.original.sub_broker_count} Sub-CPs
                </span>
              ) : null}
            </div>
            <p className="text-slate-400 text-xs">
              {row.original.contact_person} • {row.original.phone}
            </p>
            {row.original.parent_firm_name && (
              <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                <Layers className="h-3 w-3" /> Branch of: {row.original.parent_firm_name}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'tier',
      header: 'CP Tier',
      cell: ({ row }) => (
        <div className="space-y-1">
          {getTierBadge(row.original.tier)}
          <p className="text-[10px] text-slate-400 font-mono">
            {row.original.commission_rate}% Commission
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'total_deals',
      header: 'Closed Deals',
      cell: ({ row }) => (
        <span className="font-bold text-white text-xs">{row.original.total_deals} Deals</span>
      ),
    },
    {
      accessorKey: 'total_revenue_generated',
      header: 'Volume Generated',
      cell: ({ row }) => (
        <span className="font-semibold text-emerald-400 text-xs">
          ₹{(row.original.total_revenue_generated || 0).toFixed(1)}L
        </span>
      ),
    },
    {
      accessorKey: 'performance_score',
      header: 'Rating',
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
          <Award className="h-4 w-4" /> {row.original.performance_score} / 5.0
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Collaboration Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setSelectedBrokerForCollaterals(row.original);
              setIsCollateralsOpen(true);
            }}
            title="Co-Branded Marketing Kits & WhatsApp Share"
            className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition"
          >
            <Share2 className="h-4 w-4" />
          </button>

          <button
            onClick={() => handleTierUpgrade(row.original.id, row.original.tier)}
            title={`Promote CP Tier (${row.original.tier})`}
            className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 transition"
          >
            <ArrowUpRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => {
              setEditingBroker(row.original);
              setIsModalOpen(true);
            }}
            title="Edit CP Profile"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
          >
            <Edit className="h-4 w-4" />
          </button>

          <button
            onClick={() => handleDeleteBroker(row.original.id)}
            title="Delete CP Profile"
            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const coBrokingColumns: ColumnDef<CoBrokingDeal>[] = [
    {
      accessorKey: 'client_name',
      header: 'Buyer / Client',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-white text-xs">{row.original.client_name}</p>
          <p className="text-[11px] text-slate-400">{row.original.client_phone}</p>
          {row.original.project_name && (
            <p className="text-[10px] text-blue-400 font-medium">{row.original.project_name}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'primary_broker_name',
      header: 'Primary Channel Partner',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-slate-200">{row.original.primary_broker_name || 'Primary CP'}</p>
          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
            {row.original.primary_split_pct}% Split
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'secondary_broker_name',
      header: 'Secondary Co-Broker',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-slate-200">{row.original.secondary_broker_name || 'In-House Co-Broker'}</p>
          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            {row.original.secondary_split_pct}% Split
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'expected_deal_value',
      header: 'Target Volume',
      cell: ({ row }) => (
        <span className="text-xs font-bold text-white">
          {row.original.expected_deal_value ? `₹${row.original.expected_deal_value} Lakhs` : 'Open'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          {row.original.status}
        </span>
      ),
    },
  ];

  const [isSingleMode, setIsSingleMode] = useState(false);

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm shadow-lg transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Channel Partner (CP) Collaboration Hub
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium">
              Real Estate OS
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage CP network tiers, volume kickers, co-broking commission splits & co-branded marketing kits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<Handshake className="h-4 w-4" />}
            onClick={() => setIsCoBrokingOpen(true)}
          >
            New Co-Broking Deal
          </Button>

          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setEditingBroker(null);
              setIsSingleMode(false);
              setIsModalOpen(true);
            }}
          >
            Register CP Firm
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Active CP Network</p>
            <h3 className="text-xl font-black text-white mt-1">{totalCPs} Firms</h3>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Platinum & Gold CPs</p>
            <h3 className="text-xl font-black text-amber-400 mt-1">{platinumCPs + goldCPs} Partners</h3>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Crown className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Co-Broking Mandates</p>
            <h3 className="text-xl font-black text-emerald-400 mt-1">{coBrokingDeals.length} Deals</h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Handshake className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">CP Volume Driven</p>
            <h3 className="text-xl font-black text-white mt-1">₹{totalRevenueCr.toFixed(2)} Cr</h3>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'directory'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Channel Partner Directory ({brokers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cobroking')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'cobroking'
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Handshake className="h-4 w-4" />
          <span>Co-Broking Agreements ({coBrokingDeals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tiers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'tiers'
              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Crown className="h-4 w-4" />
          <span>CP Commission Tiers & Kickers ({tiers.length})</span>
        </button>
      </div>

      {/* Tab 1: Directory Table */}
      {activeTab === 'directory' && (
        <DataTable columns={directoryColumns} data={brokers} searchPlaceholder="Search CP firm, contact person..." />
      )}

      {/* Tab 2: Co-Broking Deals */}
      {activeTab === 'cobroking' && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-center justify-between">
            <span>Co-broking agreements allow multiple brokerage firms to jointly market luxury inventory with pre-locked split ratios.</span>
            <Button size="sm" variant="outline" onClick={() => setIsCoBrokingOpen(true)}>
              Register Agreement
            </Button>
          </div>
          <DataTable columns={coBrokingColumns} data={coBrokingDeals} searchPlaceholder="Search buyer or broker..." />
        </div>
      )}

      {/* Tab 3: Commission Tiers & Kickers */}
      {activeTab === 'tiers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((t) => (
            <div 
              key={t.tier}
              className={`p-6 rounded-2xl border flex flex-col justify-between relative overflow-hidden ${
                t.tier === 'Platinum'
                  ? 'bg-gradient-to-b from-purple-950/40 to-slate-900 border-purple-500/40 ring-1 ring-purple-500/30'
                  : t.tier === 'Gold'
                  ? 'bg-gradient-to-b from-amber-950/40 to-slate-900 border-amber-500/40'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-white">{t.tier} Tier</span>
                  {getTierBadge(t.tier)}
                </div>

                <div>
                  <span className="text-3xl font-black text-white">
                    {t.effective_commission_pct}%
                  </span>
                  <span className="text-xs text-slate-400 ml-2">Total Commission</span>
                  <p className="text-xs text-slate-400 mt-1">
                    {t.base_commission_pct}% Base + <strong className="text-emerald-400">{t.volume_kicker_pct}% Volume Kicker</strong>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs">
                  <span className="text-slate-400">Eligibility Threshold:</span>
                  <p className="font-semibold text-slate-200 mt-0.5">
                    {t.min_revenue_lakhs > 0 ? `₹${(t.min_revenue_lakhs / 100).toFixed(1)} Crore cumulative sales` : 'All registered CPs'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Exclusive Tier Perks:
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {t.perks.map((p, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <BrokerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdateBroker}
        initialBroker={editingBroker}
        defaultSingleMode={isSingleMode}
      />

      {selectedBrokerForCollaterals && (
        <CollateralsModal
          isOpen={isCollateralsOpen}
          onClose={() => {
            setIsCollateralsOpen(false);
            setSelectedBrokerForCollaterals(null);
          }}
          broker={selectedBrokerForCollaterals}
        />
      )}

      <CoBrokingModal
        isOpen={isCoBrokingOpen}
        onClose={() => setIsCoBrokingOpen(false)}
        brokers={brokers}
        onDealCreated={fetchBrokersAndData}
      />
    </div>
  );
};
