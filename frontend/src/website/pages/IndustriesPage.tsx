import React from 'react';
import { Building, UserCheck, Award, ShieldCheck, ArrowRight } from 'lucide-react';

export const IndustriesPage: React.FC<{ onOpenDemo: () => void }> = ({ onOpenDemo }) => {
  const industries = [
    {
      icon: <Award className="h-8 w-8 text-[#C8A45D]" />,
      title: "Real Estate Channel Partners (CPs)",
      desc: "Streamline developer tie-ups, buyer mandates, site visit chauffeurs, and commission override collections."
    },
    {
      icon: <UserCheck className="h-8 w-8 text-[#C8A45D]" />,
      title: "Brokerage Firms & Agencies",
      desc: "Manage multi-executive sales teams, assign leads, track target achievements, and prevent lead theft."
    },
    {
      icon: <Building className="h-8 w-8 text-[#C8A45D]" />,
      title: "Real Estate Developers & Builders",
      desc: "Publish project catalogs, track channel partner sales performance, and manage booking approvals."
    },
    {
      icon: <ShieldCheck className="h-8 w-8 text-[#C8A45D]" />,
      title: "Independent Single Brokers",
      desc: "Simple, powerful mobile-friendly tool to manage buyer contacts, set voice reminders, and track deals."
    }
  ];

  return (
    <div className="bg-[#050505] text-slate-100 min-h-screen pt-32 pb-24 px-6 lg:px-12 selection:bg-[#C8A45D] selection:text-black">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">Industry Focus</span>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
            Tailored for Every Real Estate Segment
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {industries.map((ind, idx) => (
            <div key={idx} className="p-8 rounded-3xl bg-[#101010] border border-white/[0.08] hover:border-[#C8A45D]/40 transition space-y-4 text-left">
              <div className="h-12 w-12 rounded-2xl bg-[#C8A45D]/10 border border-[#C8A45D]/20 flex items-center justify-center">
                {ind.icon}
              </div>
              <h3 className="text-2xl font-bold text-white">{ind.title}</h3>
              <p className="text-xs text-slate-400 font-light leading-relaxed">{ind.desc}</p>
            </div>
          ))}
        </div>

        <div className="p-10 rounded-3xl bg-[#0a0a0a] border border-white/10 text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">See how BrokerOS fits your exact business model.</h2>
          <button
            onClick={onOpenDemo}
            className="px-8 py-3.5 rounded-xl text-xs font-bold text-black bg-[#C8A45D] hover:bg-yellow-400 transition mx-auto flex items-center gap-2"
          >
            Book Industry Demo <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
