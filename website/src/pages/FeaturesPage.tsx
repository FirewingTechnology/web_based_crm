import React from 'react';

export const FeaturesPage: React.FC<{ onOpenDemo: () => void }> = ({ onOpenDemo }) => {
  const featureList = [
    { 
      title: "Lead Health & Leakage Detection Engine", 
      desc: "Algorithmic 0-100 health scoring with explainable audit trails detecting follow-up delays, postponement fatigue, and revenue drop-offs." 
    },
    { 
      title: "Next Best Action & Stage Advisor", 
      desc: "Actionable stage recommendations calculating recommended communication channels (WhatsApp/Call), urgency tiers, and 1-click advancement." 
    },
    { 
      title: "WhatsApp Revenue Automation System", 
      desc: "Instant template-driven WhatsApp messaging for site visit passes, PDF brochures, cost sheets, and payment receipts with delivery logging." 
    },
    { 
      title: "Co-Broking & CP Collaboration Hub", 
      desc: "Manage broker networks, co-broking commission splits (50-50 / 60-40), sub-broker tiers, and collaborative deals with real-time tracking." 
    },
    { 
      title: "VIP Site Visit Operating System", 
      desc: "Complete field-visit execution suite: VIP cab booking, driver assignment, OTP visitor check-in, and post-visit buyer sentiment audits." 
    },
    { 
      title: "Intelligent Inventory Matchmaking Engine", 
      desc: "Multi-parameter matching engine ranking available developer units against buyer budget, preferred BHK, location, and possession date." 
    },
    { 
      title: "Indian Real Estate Cost Sheet & Booking", 
      desc: "Complete Indian pricing engine: Base price, floor rise, PLC, covered car parking, 5% GST, stamp duty, registration, and RERA milestone plans." 
    },
    { 
      title: "Commission Command Center & Aging Ledger", 
      desc: "End-to-end broker receivables ledger with statutory 18% GST, 5% TDS (Sec 194H), and automated aging brackets (0-30, 31-60, 61-90, 90+ days)." 
    },
    { 
      title: "Sales Gamification & Live Leaderboard", 
      desc: "Top closer podiums, deal velocity metrics, monthly target pacing (On Track / At Risk), and executive achievement badges." 
    },
    { 
      title: "Buyer KYC Vault & Document Compliance", 
      desc: "Secure document repository tracking PAN Card, Aadhaar Card, Booking Cheque, and Builder-Buyer Agreement (BBA) verification for RERA audits." 
    },
    { 
      title: "6-Stage Revenue Funnel Drop-Off Analytics", 
      desc: "Full conversion analytics from Lead → Contacted → Qualified → Site Visit → Booking → Commission with bottleneck diagnostics." 
    },
    { 
      title: "Intelligent Real-Time Priority Alert Engine", 
      desc: "Automated real-time alert evaluation scanning for high-value leads at risk, overdue site visits, and aged commission invoices." 
    }
  ];

  return (
    <div className="bg-[#050505] text-slate-100 min-h-screen pt-32 pb-24 px-6 lg:px-12 selection:bg-[#C8A45D] selection:text-black">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C8A45D]/30 bg-[#C8A45D]/10 text-[#C8A45D] text-xs font-semibold tracking-wide">
            Real Estate Revenue Operating System
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
            Engineered Capabilities Overview
          </h1>
          <p className="text-base text-slate-400 font-light max-w-2xl mx-auto">
            From first inquiry to commission realization: Explore the 12 specialized modules driving predictable real estate revenue.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featureList.map((f, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-[#101010] border border-white/[0.08] hover:border-[#C8A45D]/40 transition space-y-3 text-left group">
              <div className="h-8 w-8 rounded-xl bg-[#C8A45D]/10 group-hover:bg-[#C8A45D]/20 text-[#C8A45D] flex items-center justify-center font-bold text-xs font-mono transition">
                {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[#C8A45D] transition">{f.title}</h3>
              <p className="text-xs text-slate-400 font-light leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="p-10 rounded-3xl bg-gradient-to-r from-[#101010] via-[#14120c] to-[#101010] border border-[#C8A45D]/30 text-center space-y-6">
          <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">See Capabilities Live</span>
          <h2 className="text-3xl font-bold text-white">Experience All Revenue OS Modules in Action</h2>
          <p className="text-xs text-slate-400 max-w-lg mx-auto font-light">
            Watch our step-by-step demonstration covering the complete revenue workflow: Lead → Site Visit → Cost Sheet → Commission Ledger.
          </p>
          <button
            onClick={onOpenDemo}
            className="px-8 py-3.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 transition mx-auto flex items-center gap-2"
          >
            Watch Full Video Demo
          </button>
        </div>
      </div>
    </div>
  );
};
