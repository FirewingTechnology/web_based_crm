import React from 'react';
import { ShieldCheck, Target, Award, ArrowRight } from 'lucide-react';

export const AboutPage: React.FC<{ onOpenDemo: () => void }> = ({ onOpenDemo }) => {
  return (
    <div className="bg-[#050505] text-slate-100 min-h-screen pt-32 pb-24 px-6 lg:px-12 selection:bg-[#C8A45D] selection:text-black">
      <div className="max-w-5xl mx-auto space-y-16">
        <div className="space-y-4">
          <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">Our Story & Mission</span>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
            Built by Real Estate Veterans. <br />
            <span className="text-[#C8A45D]">Engineered for Control.</span>
          </h1>
          <p className="text-base text-slate-400 font-light leading-relaxed max-w-2xl">
            BrokerOS was born from a simple realization: Indian Real Estate Channel Partners were losing millions in commissions every year not because of bad leads, but because of fragmented tools and missed follow-ups.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-8 rounded-3xl bg-[#101010] border border-white/[0.08] space-y-3">
            <ShieldCheck className="h-8 w-8 text-[#C8A45D]" />
            <h3 className="text-lg font-bold text-white">Our Mission</h3>
            <p className="text-xs text-slate-400 font-light">To equip every Real Estate Channel Partner and Agency Leader with institutional-grade sales control software.</p>
          </div>
          <div className="p-8 rounded-3xl bg-[#101010] border border-white/[0.08] space-y-3">
            <Target className="h-8 w-8 text-[#C8A45D]" />
            <h3 className="text-lg font-bold text-white">Our Vision</h3>
            <p className="text-xs text-slate-400 font-light">Zero missed callbacks, 100% transparent commission payouts, and effortless deal closures across India's real estate ecosystem.</p>
          </div>
          <div className="p-8 rounded-3xl bg-[#101010] border border-white/[0.08] space-y-3">
            <Award className="h-8 w-8 text-[#C8A45D]" />
            <h3 className="text-lg font-bold text-white">Our Values</h3>
            <p className="text-xs text-slate-400 font-light">Uncompromised security, zero corporate jargon, local market intelligence, and continuous technical excellence.</p>
          </div>
        </div>

        <div className="p-10 rounded-3xl bg-gradient-to-r from-[#101010] via-[#141414] to-[#0a0a0a] border border-white/10 space-y-6">
          <h2 className="text-2xl font-bold text-white">Why BrokerOS was Built</h2>
          <p className="text-xs text-slate-300 font-light leading-relaxed">
            Unlike Western SaaS products like Salesforce or HubSpot, real estate channel partners in India operate under unique dynamics: RERA registrations, Lakhs and Crores pricing tiers, tiered commission overrides with builder developers, and intensive phone callback routines. BrokerOS is tailored specifically to solve these exact workflows.
          </p>

          <button
            onClick={onOpenDemo}
            className="px-6 py-3 rounded-xl text-xs font-bold text-black bg-[#C8A45D] hover:bg-yellow-400 transition flex items-center gap-2"
          >
            Book a Personal Walkthrough <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
