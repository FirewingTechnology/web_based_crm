import React from 'react';
import { Check, ArrowRight } from 'lucide-react';

export const PricingPage: React.FC<{ onOpenDemo: () => void }> = ({ onOpenDemo }) => {
  const plans = [
    {
      name: "Starter CP",
      price: "₹2,499",
      period: "/ month",
      desc: "Perfect for independent single brokers & small agencies.",
      features: [
        "Up to 3 Sales Executives",
        "Lead Pipeline Engine",
        "Voice & Audio Reminders",
        "Projects & Builders Catalog",
        "Standard Email Support"
      ],
      popular: false
    },
    {
      name: "Professional Agency",
      price: "₹6,999",
      period: "/ month",
      desc: "For growing channel partner firms and brokerage teams.",
      features: [
        "Up to 15 Sales Executives",
        "Lead Drawer & Notes History",
        "Automatic Monthly Target Engine",
        "Broker Network Commission Shares",
        "Inline Developer Auto-Creation",
        "Priority 24/7 Support"
      ],
      popular: true
    },
    {
      name: "Enterprise Builder",
      price: "Custom",
      period: "Pricing",
      desc: "For large real estate developers and pan-India CPs.",
      features: [
        "Unlimited Sales Executives",
        "Dedicated Account Manager",
        "Custom API Integrations",
        "Custom SLA & Uptime Guarantee",
        "On-Premise / Isolated Cloud Deploy"
      ],
      popular: false
    }
  ];

  return (
    <div className="bg-[#050505] text-slate-100 min-h-screen pt-32 pb-24 px-6 lg:px-12 selection:bg-[#C8A45D] selection:text-black">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">Transparent Pricing</span>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
            Predictable Plans for Growing Brokerages
          </h1>
          <p className="text-base text-slate-400 font-light max-w-xl mx-auto">
            No hidden setup fees. Scale your sales team with complete confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {plans.map((p, idx) => (
            <div
              key={idx}
              className={`p-8 rounded-3xl bg-[#101010] border relative flex flex-col justify-between space-y-6 ${
                p.popular ? 'border-[#C8A45D] shadow-2xl shadow-[#C8A45D]/10' : 'border-white/[0.08]'
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#C8A45D] text-black text-[10px] font-bold uppercase tracking-wider">
                  MOST POPULAR FOR CPs
                </span>
              )}

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">{p.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">{p.price}</span>
                  <span className="text-xs text-slate-400 font-light">{p.period}</span>
                </div>
                <p className="text-xs text-slate-400 font-light">{p.desc}</p>

                <div className="pt-4 border-t border-white/[0.08] space-y-2.5 text-xs">
                  {p.features.map((feat, fidx) => (
                    <div key={fidx} className="flex items-center gap-2 text-slate-300">
                      <Check className="h-4 w-4 text-[#C8A45D] shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={onOpenDemo}
                className={`w-full py-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  p.popular
                    ? 'bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 text-black hover:brightness-110'
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                }`}
              >
                Choose Plan & Book Demo <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
