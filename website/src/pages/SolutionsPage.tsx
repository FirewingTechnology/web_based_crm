import React from 'react';
import { UserCheck, Volume2, Building, Target, Award, BarChart3, ArrowRight } from 'lucide-react';

export const SolutionsPage: React.FC<{ onOpenDemo: () => void }> = ({ onOpenDemo }) => {
  const solutions = [
    {
      icon: <UserCheck className="h-7 w-7 text-[#C8A45D]" />,
      title: "Lead Management Engine",
      desc: "7-stage visual pipeline from initial inquiry to site visit, negotiation, and deal closure with real-time lead drawer and activity timeline logs."
    },
    {
      icon: <Volume2 className="h-7 w-7 text-[#C8A45D]" />,
      title: "Voice & Audio Reminder System",
      desc: "Web Audio harmonic chimes and text-to-speech voice announcements ensuring zero missed callbacks or site appointments."
    },
    {
      icon: <Building className="h-7 w-7 text-[#C8A45D]" />,
      title: "Builders & Projects Inventory",
      desc: "Centralized property catalog with pricing tiers in Lakhs, RERA registration tracking, PDF brochures, and inline developer creation."
    },
    {
      icon: <Target className="h-7 w-7 text-[#C8A45D]" />,
      title: "Sales Target & Performance Engine",
      desc: "Automatic monthly revenue aggregation in Lakhs (INR) with auto-target initialization for newly onboarded sales executives."
    },
    {
      icon: <Award className="h-7 w-7 text-[#C8A45D]" />,
      title: "Broker Network & Commission Overrides",
      desc: "Manage Channel Partner firms and single independent brokers with custom override commission shares and payout status tracking."
    },
    {
      icon: <BarChart3 className="h-7 w-7 text-[#C8A45D]" />,
      title: "Executive Reports & Analytics",
      desc: "Real-time monthly sales reports, lead source conversion analytics, and team leaderboard stats."
    }
  ];

  return (
    <div className="bg-[#050505] text-slate-100 min-h-screen pt-32 pb-24 px-6 lg:px-12 selection:bg-[#C8A45D] selection:text-black">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">Solutions Suite</span>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
            Purpose-Built Real Estate Solutions
          </h1>
          <p className="text-base text-slate-400 font-light max-w-xl mx-auto">
            Every module in BrokerOS is engineered around real estate channel partner workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solutions.map((s, idx) => (
            <div key={idx} className="p-8 rounded-3xl bg-[#101010] border border-white/[0.08] hover:border-[#C8A45D]/40 transition space-y-4 text-left">
              <div className="h-12 w-12 rounded-2xl bg-[#C8A45D]/10 border border-[#C8A45D]/20 flex items-center justify-center">
                {s.icon}
              </div>
              <h3 className="text-xl font-bold text-white">{s.title}</h3>
              <p className="text-xs text-slate-400 font-light leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="p-10 rounded-3xl bg-[#0a0a0a] border border-white/10 text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">Ready to see these solutions in action?</h2>
          <button
            onClick={onOpenDemo}
            className="px-8 py-3.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 transition mx-auto flex items-center gap-2"
          >
            Request Live Demo <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
