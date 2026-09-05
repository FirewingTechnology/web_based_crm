import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Calendar, Hash, FileText } from 'lucide-react';
import { CommissionItem, CommissionStage, CommissionStageUpdatePayload } from '../../types/commissionLedger';
import { commissionsApi } from '../../api/commissions';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface CommissionStageModalProps {
  commission: CommissionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STAGES: { value: CommissionStage; label: string; description: string }[] = [
  { value: 'EXPECTED', label: 'Expected', description: 'Deal closed, awaiting builder invoice cycle' },
  { value: 'SUBMITTED', label: 'Submitted', description: 'GST invoice submitted to builder accounts team' },
  { value: 'APPROVED', label: 'Approved', description: 'Verified and cleared by builder finance department' },
  { value: 'PAYABLE', label: 'Payable', description: 'Payment advice issued, in bank queue' },
  { value: 'PAID', label: 'Paid', description: 'Funds credited to company bank account (UTR available)' },
  { value: 'DISPUTED', label: 'Disputed', description: 'Discrepancy / deduction under query' },
];

export const CommissionStageModal: React.FC<CommissionStageModalProps> = ({
  commission,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !commission) return null;

  const currentStage = (commission.stage || 'EXPECTED').toUpperCase() as CommissionStage;

  const [selectedStage, setSelectedStage] = useState<CommissionStage>(currentStage);
  const [invoiceNumber, setInvoiceNumber] = useState(commission.invoice_number || '');
  const [invoiceDate, setInvoiceDate] = useState(
    commission.invoice_date ? commission.invoice_date.split('T')[0] : ''
  );
  const [dueDate, setDueDate] = useState(
    commission.due_date ? commission.due_date.split('T')[0] : ''
  );
  const [paidDate, setPaidDate] = useState(
    commission.paid_date ? commission.paid_date.split('T')[0] : ''
  );
  const [paymentReference, setPaymentReference] = useState(commission.payment_reference || '');
  const [remarks, setRemarks] = useState(commission.remarks || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: CommissionStageUpdatePayload = {
        stage: selectedStage,
        invoice_number: invoiceNumber || undefined,
        invoice_date: invoiceDate ? new Date(invoiceDate).toISOString() : undefined,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        paid_date: paidDate ? new Date(paidDate).toISOString() : undefined,
        payment_reference: paymentReference || undefined,
        remarks: remarks || undefined,
      };

      await commissionsApi.updateStage(commission.id, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || 'Failed to update commission stage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Update Commission Lifecycle Stage</h2>
              <Badge variant="blue">#{commission.booking_number}</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {commission.project_name} • {commission.builder_name} • Unit {commission.unit_number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Tax & Amount Overview */}
        <div className="mt-4 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Base Commission</p>
            <p className="text-sm font-bold text-white mt-0.5">
              ₹{commission.builder_commission_amount.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-slate-400">({commission.builder_commission_rate}%)</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-indigo-300">+ GST (18%) / - TDS (5%)</p>
            <p className="text-xs font-semibold text-slate-300 mt-0.5">
              +₹{(commission.gst_amount || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-rose-400">
              -₹{(commission.tds_amount || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-emerald-400">Net Receivable</p>
            <p className="text-base font-extrabold text-emerald-400 mt-0.5">
              ₹{(commission.net_receivable || commission.builder_commission_amount).toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-slate-400 font-mono">{commission.aging_bucket}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Stage Selector Cards */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select Lifecycle Stage</label>
            <div className="grid grid-cols-2 gap-2">
              {STAGES.map((s) => {
                const isSelected = selectedStage === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSelectedStage(s.value)}
                    className={`p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                        : 'bg-slate-800/40 border-slate-750 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{s.label}</span>
                      {isSelected && <CheckCircle className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">{s.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Hash className="w-3 h-3 text-slate-400" /> GST Invoice Number
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2026-904"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> Invoice Date
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-400" /> Payment Ref (UTR / Cheque)
              </label>
              <input
                type="text"
                placeholder="e.g. HDFCUTR11223344"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {selectedStage === 'PAID' && (
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-400" /> Settlement / Credit Date
              </label>
              <input
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Internal Finance Remarks / Follow-up Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Followed up with Accounts Head Mr. Sharma. Cheque in clearance."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Update Stage & Ledger'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
