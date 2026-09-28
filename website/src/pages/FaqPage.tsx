import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const FaqPage: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "What is a Real Estate Revenue Operating System and how does it differ from a traditional CRM?",
      a: "Traditional CRMs are passive databases that record past activity notes. REALVION is an active Revenue Operating System that connects the entire real estate sales journey: Lead Intake ➔ Smart Routing ➔ Property Matching ➔ Chauffeur Site Visit OS ➔ Configurable Indian Cost Sheets ➔ 1-Click Booking ➔ Commission Aging ➔ Revenue Intelligence."
    },
    {
      q: "How does REALVION handle Indian GST, RERA cost sheets, and tax calculations?",
      a: "REALVION provides configurable tax and cost-sheet workflows allowing agencies to set base rates, floor rise premiums, preferred location charges (PLC), parking, and tax treatments (e.g., 5% GST on under-construction units vs. 0% Ready-to-Move with OC). REALVION provides software tools for calculation and does not provide formal legal or tax counsel."
    },
    {
      q: "How do telephony logging, call recording, and consent handling work?",
      a: "Where supported by your connected telephony provider and subject to applicable consent and legal requirements, call recordings and durations can be associated with CRM records. REALVION does not engage in covert surveillance; all telephony logging is designed for compliant business recordkeeping."
    },
    {
      q: "How does the Site Visit OS handle chauffeur dispatch and arrival verification?",
      a: "When a VIP property tour is scheduled, REALVION coordinates driver details and generates a 4-digit pickup and on-site arrival verification OTP. All location and site-visit checkpoints are strictly permission-based."
    },
    {
      q: "How does the AI Sales Copilot assist sales executives?",
      a: "Powered by OpenAI GPT-4o-mini with a deterministic local fallback, the AI Copilot retrieves live property specifications and real estate objection playbooks (price, location, Vastu, possession delays), with 1-click human manager escalation when required."
    },
    {
      q: "Can sales executives access REALVION on mobile devices?",
      a: "Yes. REALVION is fully mobile-responsive with slide-over drawers, single-tap phone dialing, and touch navigation."
    },
    {
      q: "Is public self-registration enabled for sales team members?",
      a: "No. To maintain strict multi-tenant security and data isolation, public self-registration is restricted. Agency Admins invite and provision Sales Executives with granular role-based permissions."
    }
  ];

  return (
    <div className="bg-[#050505] text-slate-100 min-h-screen pt-32 pb-24 px-6 lg:px-12 selection:bg-[#C8A45D] selection:text-black">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">THE REAL ESTATE REVENUE OPERATING SYSTEM</span>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-light max-w-xl mx-auto">
            Everything you need to know about REALVION architecture, compliance, workflows, and commercial activation.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((f, idx) => (
            <div key={idx} className="rounded-2xl bg-[#101010] border border-white/[0.08] overflow-hidden">
              <button
                onClick={() => setActiveIdx(activeIdx === idx ? null : idx)}
                className="w-full p-6 text-left text-sm font-bold text-white flex items-center justify-between hover:text-[#C8A45D] transition"
              >
                <span>{f.q}</span>
                <ChevronDown className={`h-5 w-5 transition-transform ${activeIdx === idx ? 'rotate-180 text-[#C8A45D]' : 'text-slate-500'}`} />
              </button>
              {activeIdx === idx && (
                <div className="p-6 pt-0 text-xs text-slate-400 font-light leading-relaxed border-t border-white/[0.04]">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
