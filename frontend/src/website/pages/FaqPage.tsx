import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const FaqPage: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does BrokerOS Lite differ from corporate CRMs like Salesforce or Zoho?",
      a: "Corporate CRMs are designed for software companies with hundreds of complex, non-real estate fields. BrokerOS is custom-engineered specifically for Indian Real Estate Channel Partners, featuring RERA registration tracking, Lakhs/Crores unit pricing, single broker networks, and native voice reminder alarms."
    },
    {
      q: "Can sales executives access BrokerOS Lite from mobile devices?",
      a: "Yes! BrokerOS features 100% mobile-responsive slide-over drawers, single-tap phone dialing, and touch navigation."
    },
    {
      q: "Is public self-registration enabled for my sales team?",
      a: "No. For maximum enterprise data security, public self-registration is disabled. The System Admin is the sole authority empowered to register Sales Executives and generate secure login credentials."
    },
    {
      q: "How does the Voice & Audio reminder alarm work?",
      a: "BrokerOS utilizes native Web Audio API sine-wave chimes and Web Speech API text-to-speech to speak out scheduled client callbacks when tasks become due."
    },
    {
      q: "Can I manage single independent brokers as well as broker firms?",
      a: "Yes. BrokerOS allows you to register independent single brokers (e.g. Ramesh Kumar) as well as full brokerage agencies, with custom commission override share tracking."
    }
  ];

  return (
    <div className="bg-[#050505] text-slate-100 min-h-screen pt-32 pb-24 px-6 lg:px-12 selection:bg-[#C8A45D] selection:text-black">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">Everything You Need to Know</span>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Frequently Asked Questions
          </h1>
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
