import React, { useState } from 'react';
import { Sparkles, ShieldCheck, CreditCard, ArrowRight, Users, Database, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PaymentCheckoutModal } from './PaymentCheckoutModal';

export const SubscriptionSettingsCard: React.FC = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isSuperAdmin = user?.role === 'Super Admin' || (user?.role as any) === 'SUPERADMIN' || user?.email === 'superadmin@realvion.com';
  const isDemo = localStorage.getItem('brokeros_is_demo') === 'true' || !!(user?.trial_expires_at);
  const isExpired = user?.is_trial_expired === true;
  const isTrialActive = !isSuperAdmin && (user?.trial_seconds_remaining || 0) > 0 && !isExpired;

  const getExpirationText = () => {
    if (isSuperAdmin) return 'Lifetime SuperAdmin Master Access';
    if (isExpired) return 'Trial Expired (Upgrade Required)';
    if (isTrialActive && user?.trial_seconds_remaining) {
      const mins = Math.floor(user.trial_seconds_remaining / 60);
      const secs = user.trial_seconds_remaining % 60;
      return `Trial Expires in: ${mins}m ${secs}s`;
    }
    if (user?.trial_expires_at) {
      const expDate = new Date(user.trial_expires_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      return `Trial Expires: ${expDate}`;
    }
    return 'Active Subscription (Annual Billing)';
  };

  const getBadge = () => {
    if (isSuperAdmin) {
      return { text: 'SUPERADMIN SYSTEM LICENSE', style: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    }
    if (isExpired) {
      return { text: 'TRIAL EXPIRED', style: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
    }
    if (isTrialActive || isDemo) {
      return { text: '1-HOUR FREE TRIAL WORKSPACE', style: 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse' };
    }
    return { text: 'ACTIVE ENTERPRISE LICENSE', style: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  };

  const badge = getBadge();

  return (
    <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#C8A45D]/10 text-[#C8A45D] border border-[#C8A45D]/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">SaaS Subscription & License Status</h3>
            <p className="text-xs text-slate-400">Current plan limits, workspace seat allocation, and billing cycle.</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badge.style}`}>
          {badge.text}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Current Active Plan</span>
          <p className="text-lg font-bold text-white">
            {isSuperAdmin ? 'Platform Master Admin' : (isTrialActive || isDemo ? 'Professional 1-Hour Trial' : (isExpired ? 'Trial Expired' : 'Professional Plan'))}
          </p>
          <span className="text-[10px] text-[#C8A45D] flex items-center gap-1">
            <Clock className="h-3 w-3 inline" /> {getExpirationText()}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1"><Users className="h-3.5 w-3.5 text-[#C8A45D]" /> User Licenses</span>
            <span className="font-bold text-white">{isSuperAdmin ? 'Unlimited Seats' : '4 / 10 Seats Used'}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-[#C8A45D] w-[40%]" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1"><Database className="h-3.5 w-3.5 text-[#C8A45D]" /> Lead Storage Limit</span>
            <span className="font-bold text-white">{isSuperAdmin ? 'Unlimited Storage' : '50 / 10,000 Leads'}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 w-[5%]" />
          </div>
        </div>
      </div>

      <div className="pt-2 flex justify-end gap-3">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 shadow-md flex items-center gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" /> Upgrade Plan & Pay Invoice <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <PaymentCheckoutModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
