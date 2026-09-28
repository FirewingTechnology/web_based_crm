import React from 'react';
import { ShieldCheck, Target, Award, ArrowRight } from 'lucide-react';

export const AboutPage: React.FC<{ onOpenDemo: () => void }> = ({ onOpenDemo }) => {
  return (
    <div className="bg-[#050505] text-slate-100 min-h-screen pt-32 pb-24 px-6 lg:px-12 selection:bg-[#C8A45D] selection:text-black">
      <div className="max-w-5xl mx-auto space-y-16">
        <div className="space-y-4">
          <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">REALVION • THE REAL ESTATE REVENUE OPERATING SYSTEM</span>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
            Turn Every Real Estate Lead Into a <br />
            <span className="text-[#C8A45D]">Managed Revenue Opportunity.</span>
          </h1>
          <p className="text-base text-slate-300 font-light leading-relaxed max-w-2xl">
            "Your leads are everywhere. Your revenue shouldn't be."
          </p>
          <p className="text-sm text-slate-400 font-light leading-relaxed max-w-2xl">
            Real estate sales operations are fundamentally fragmented across portals, spreadsheets, personal WhatsApp chats, chauffeur dispatches, and delayed builder invoices. REALVION connects every milestone into a single intelligent operating system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-8 rounded-3xl bg-[#101010] border border-white/[0.08] space-y-3">
            <ShieldCheck className="h-8 w-8 text-[#C8A45D]" />
            <h3 className="text-lg font-bold text-white">The Problem</h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Leads arrive from 5+ portals, site visits happen without verified arrival or objection logs, and deals stall without manager visibility.
            </p>
          </div>
          <div className="p-8 rounded-3xl bg-[#101010] border border-white/[0.08] space-y-3">
            <Target className="h-8 w-8 text-[#C8A45D]" />
            <h3 className="text-lg font-bold text-white">The Solution</h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              REALVION synchronizes Lead Intake, Smart Assignment, Property Matching, Site Visit OS, Cost Sheets, Bookings, and Commission Aging into one loop.
            </p>
          </div>
          <div className="p-8 rounded-3xl bg-[#101010] border border-white/[0.08] space-y-3">
            <Award className="h-8 w-8 text-[#C8A45D]" />
            <h3 className="text-lg font-bold text-white">The Outcome</h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Managers gain complete pipeline visibility, sales executives receive clear daily next actions, and owners safeguard every rupee of earned commission.
            </p>
          </div>
        </div>

        <div className="p-10 rounded-3xl bg-gradient-to-r from-[#101010] via-[#141414] to-[#0a0a0a] border border-white/10 space-y-6 text-left">
          <h2 className="text-2xl font-bold text-white">Built Specifically for Indian Real Estate Operations</h2>
          <p className="text-xs text-slate-300 font-light leading-relaxed">
            Generic corporate CRMs record static address books. REALVION was designed around the actual reality of Indian property sales: RERA registrations, Lakhs and Crores budget brackets, tiered builder commission overrides, on-site OTP visit check-ins, and automated cost sheets.
          </p>

          <div className="pt-2">
            <button
              onClick={onOpenDemo}
              className="px-6 py-3.5 rounded-xl text-xs font-bold text-black bg-[#C8A45D] hover:bg-yellow-400 transition flex items-center gap-2"
            >
              BOOK A REALVION DEMO <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
