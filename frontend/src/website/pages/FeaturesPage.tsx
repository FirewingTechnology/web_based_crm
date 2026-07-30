import React from 'react';
import { UserCheck, Volume2, Building, Target, Award, BarChart3, ShieldCheck, Zap, Layers, Lock, Flame, Check } from 'lucide-react';

export const FeaturesPage: React.FC<{ onOpenDemo: () => void }> = ({ onOpenDemo }) => {
  const featureList = [
    { title: "7-Stage Lead Pipeline", desc: "Visual lead stages: New, Contacted, Qualified, Site Visit, Negotiation, Booked, Lost." },
    { title: "Voice & Audio Reminders", desc: "Native Web Audio harmonic chimes and text-to-speech voice announcements." },
    { title: "RERA Registration Tracking", desc: "Track RERA compliance IDs and official builder registration numbers." },
    { title: "Inline Builder Creation", desc: "Register new developers on-the-fly directly inside project creation forms." },
    { title: "Single Broker Support", desc: "Manage independent single brokers and large brokerage firm accounts." },
    { title: "Auto-Target Provisioning", desc: "Newly created sales executives are automatically assigned monthly revenue targets." },
    { title: "Real-Time Lead Drawer", desc: "0ms local state updates with background synchronization for notes & status history." },
    { title: "Role-Scoped Reminders", desc: "Sales executives see only their tasks; Admins see self-scheduled alerts." },
    { title: "Unit Price Normalization", desc: "Prices in Lakhs (INR) auto-calculated into sales target achievements." }
  ];

  return (
    <div className="bg-[#050505] text-slate-100 min-h-screen pt-32 pb-24 px-6 lg:px-12 selection:bg-[#C8A45D] selection:text-black">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">Platform Capabilities</span>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
            Engineered Features Overview
          </h1>
          <p className="text-base text-slate-400 font-light max-w-xl mx-auto">
            Explore every technical capability designed for maximum sales productivity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featureList.map((f, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-[#101010] border border-white/[0.08] hover:border-[#C8A45D]/40 transition space-y-3 text-left">
              <div className="h-8 w-8 rounded-xl bg-[#C8A45D]/10 text-[#C8A45D] flex items-center justify-center font-bold text-xs font-mono">
                0{idx + 1}
              </div>
              <h3 className="text-base font-bold text-white">{f.title}</h3>
              <p className="text-xs text-slate-400 font-light leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
