import React, { useState, useEffect } from 'react';
import { X, Handshake, Users, DollarSign, Percent, AlertCircle, Check } from 'lucide-react';
import { brokersApi } from '../../api/brokers';
import { BrokerProfile, CoBrokingDealCreateInput } from '../../types/broker';

interface CoBrokingModalProps {
  isOpen: boolean;
  onClose: () => void;
  brokers: BrokerProfile[];
  onDealCreated: () => void;
}

export const CoBrokingModal: React.FC<CoBrokingModalProps> = ({
  isOpen,
  onClose,
  brokers,
  onDealCreated
}) => {
  const [primaryBrokerId, setPrimaryBrokerId] = useState<number>(brokers[0]?.id || 0);
  const [secondaryBrokerId, setSecondaryBrokerId] = useState<number | undefined>(undefined);
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [primarySplitPct, setPrimarySplitPct] = useState<number>(50.0);
  const [expectedDealValue, setExpectedDealValue] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (brokers.length > 0 && !primaryBrokerId) {
      setPrimaryBrokerId(brokers[0].id);
    }
  }, [brokers]);

  const secondarySplitPct = Math.max(0, 100 - primarySplitPct);

  const handleSplitPreset = (primaryPct: number) => {
    setPrimarySplitPct(primaryPct);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      setError('Please provide client name and phone number.');
      return;
    }

    if (!primaryBrokerId) {
      setError('Please select a primary broker.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload: CoBrokingDealCreateInput = {
        primary_broker_id: primaryBrokerId,
        secondary_broker_id: secondaryBrokerId ? Number(secondaryBrokerId) : undefined,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        primary_split_pct: primarySplitPct,
        secondary_split_pct: secondarySplitPct,
        expected_deal_value: expectedDealValue ? parseFloat(expectedDealValue) : undefined,
        notes: notes.trim() || undefined
      };

      await brokersApi.createCoBrokingDeal(payload);
      onDealCreated();
      onClose();
    } catch (err: any) {
      console.error('Failed to create co-broking deal:', err);
      setError(err?.response?.data?.detail || 'Failed to register co-broking agreement.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Handshake className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Register Co-Broking Agreement</h2>
              <p className="text-xs text-slate-400">Joint Channel Partner Mandate & Commission Split</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Primary & Secondary Broker Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Primary CP (Listing / Source) *
              </label>
              <select
                value={primaryBrokerId}
                onChange={(e) => setPrimaryBrokerId(Number(e.target.value))}
                className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              >
                {brokers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.firm_name} ({b.contact_person})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Secondary CP (Co-Agent / Sourcing)
              </label>
              <select
                value={secondaryBrokerId || ''}
                onChange={(e) => setSecondaryBrokerId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Direct In-House / Independent --</option>
                {brokers
                  .filter((b) => b.id !== primaryBrokerId)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.firm_name} ({b.contact_person})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Commission Split Controls */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5 text-blue-400" />
                Commission Split Ledger
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleSplitPreset(50)}
                  className={`px-2 py-0.5 rounded border text-[10px] ${
                    primarySplitPct === 50
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  50 / 50
                </button>
                <button
                  type="button"
                  onClick={() => handleSplitPreset(60)}
                  className={`px-2 py-0.5 rounded border text-[10px] ${
                    primarySplitPct === 60
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  60 / 40
                </button>
                <button
                  type="button"
                  onClick={() => handleSplitPreset(70)}
                  className={`px-2 py-0.5 rounded border text-[10px] ${
                    primarySplitPct === 70
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  70 / 30
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-blue-400">Primary: {primarySplitPct}%</span>
                <span className="text-emerald-400">Secondary: {secondarySplitPct}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={90}
                step={5}
                value={primarySplitPct}
                onChange={(e) => setPrimarySplitPct(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Client Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Client Name *
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Rahul Singhal"
                className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Client Phone *
              </label>
              <input
                type="text"
                required
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Deal Value & Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Expected Deal Value (in Lakhs)
            </label>
            <input
              type="number"
              step="any"
              value={expectedDealValue}
              onChange={(e) => setExpectedDealValue(e.target.value)}
              placeholder="e.g. 150 for ₹1.5 Cr"
              className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Agreement Notes / Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Sourced via luxury investor network, joint inspection scheduled..."
              className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-950/40 hover:scale-[1.02] transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Handshake className="h-4 w-4" />
              <span>{loading ? 'Registering...' : 'Register Co-Broking Deal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
