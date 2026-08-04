import React, { useState } from 'react';
import { Sparkles, ShieldCheck, CreditCard, ArrowRight, Users, Database } from 'lucide-react';
import { PaymentCheckoutModal } from './PaymentCheckoutModal';

export const SubscriptionSettingsCard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isDemo = localStorage.getItem('brokeros_is_demo') === 'true';

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
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          isDemo ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
        }`}>
          {isDemo ? 'DEMO WORKSPACE' : 'ACTIVE ENTERPRISE LICENSE'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Current Active Plan</span>
          <p className="text-lg font-bold text-white">{isDemo ? 'Professional (Demo)' : 'Professional Plan'}</p>
          <span className="text-[10px] text-[#C8A45D]">Renews / Expires: 2027-08-04</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1"><Users className="h-3.5 w-3.5 text-[#C8A45D]" /> User Licenses</span>
            <span className="font-bold text-white">4 / 10 Seats Used</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-[#C8A45D] w-[40%]" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1"><Database className="h-3.5 w-3.5 text-[#C8A45D]" /> Lead Storage Limit</span>
            <span className="font-bold text-white">50 / 10,000 Leads</span>
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
