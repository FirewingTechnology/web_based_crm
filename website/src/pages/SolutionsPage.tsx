import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Compass,
  Award,
  Shield,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Phone,
  BarChart3,
  Car
} from 'lucide-react';

export const SolutionsPage: React.FC<{ onOpenDemo: () => void }> = ({ onOpenDemo }) => {
  const navigate = useNavigate();

  const personaSolutions = [
    {
      title: "For Channel Partner Brokerage Firms",
      subtitle: "Managing Multi-Executive Real Estate Sales Floors",
      icon: Users,
      description: "Eliminate manual lead assignments, spreadsheet cherry-picking, and lost client follow-ups. Give every rep an automated callback agenda with voice alarms while management monitors target pacing in Lakhs.",
      benefits: [
        "Universal Lead Ingestion from 99acres, Housing, and Meta Ads",
        "Configurable Round-Robin & Capacity-Based Rep Assignment",
        "Daily Priority Board & Response SLA Breach Alerts",
        "Centralized Developer Project Catalog & Brochure Repository",
        "Broker Commission Milestone Tracking with 18% GST & 5% TDS"
      ]
    },
    {
      title: "For Real Estate Developers & Builders",
      subtitle: "Direct Sales Mandates & Inventory Movement",
      icon: Building2,
      description: "Connect marketing inquiries directly with available unit inventory. Ensure no high-intent buyer goes untouched, coordinate VIP site tours, and calculate verified RERA cost sheets on the fly.",
      benefits: [
        "Bi-Directional Inventory Matching (Units ↔ Buyer Budgets)",
        "Indian Cost Sheet OS with Floor Rise, PLC, and 5% GST Waiver Rules",
        "VIP Site Visit OS with Driver Assignment & 4-Digit Pickup OTP",
        "Centralized Buyer Document Vault for RERA KYC Compliance",
        "Direct Channel Partner Lead Registration & Co-Broking Controls"
      ]
    },
    {
      title: "For Sales Managers & Team Leaders",
      subtitle: "Operational Pipeline Oversight & Escalations",
      icon: Compass,
      description: "Stop spending Monday mornings demanding spreadsheet updates. REALVION gives managers real-time visibility into active site visits, stagnant negotiations, and individual executive closing ratios.",
      benefits: [
        "Live Pipeline Velocity Metrics (Average Days Spent per Stage)",
        "Automated Manager Escalation for Stagnant Deals > 48 Hours",
        "Team Sales Target Engine Aggregating Monthly Revenue in Lakhs",
        "Real-Time Chauffeur Dispatch & Visitor Arrival Verification",
        "Call Logger with Durations, Outcomes, and AI-Generated Summaries"
      ]
    },
    {
      title: "For High-Velocity Sales Executives",
      subtitle: "Closer Cockpits Built for Speed & Conversion",
      icon: Award,
      description: "Designed so top closers spend time talking to buyers instead of filling out CRM forms. Native harmonic chimes keep follow-ups on time, while the AI Copilot supplies instant objection-handling pitches.",
      benefits: [
        "Web Audio Harmonic Chimes + Web Speech TTS Spoken Reminders",
        "AI Copilot RAG Assistant for Instant Vastu & Price Objections",
        "1-Click Pre-Configured WhatsApp Templates with Variable Fill",
        "1-Click Quick Booking Creation Directly from Cost Sheets",
        "Individual Monthly Target Pacing & Commission Ledger Visibility"
      ]
    },
    {
      title: "For Independent Brokers & Solo Closers",
      subtitle: "Professional Infrastructure for Independent CP Closers",
      icon: Shield,
      description: "Run your solo real estate practice like an enterprise agency. Access developer catalogs, verify buyer KYC documents, and collaborate with outside partners through formal co-broking contracts.",
      benefits: [
        "Full Real Estate Pipeline on Desktop, Tablet, and Mobile Viewports",
        "Co-Broking Deal Collaboration & Pre-Agreed Commission Splits",
        "Professional Cost Sheet Quotations with Construction Milestones",
        "Client Activity Timeline Logs with Secure Historical Notes",
        "Instant Razorpay Online Account Activation with GST Invoices"
      ]
    }
  ];

  return (
    <div className="bg-[#050505] text-slate-100 min-h-screen pt-36 pb-24 px-6 lg:px-12 selection:bg-[#C8A45D] selection:text-black relative overflow-hidden">
      {/* Background Architectural Skyline */}
      <div className="absolute top-0 left-0 right-0 h-[480px] pointer-events-none select-none z-0 overflow-hidden">
        <img
          src="/images/hero-bg.jpg"
          alt="Architectural skyline background"
          className="w-full h-full object-cover object-top opacity-15 filter contrast-125 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/70 via-[#050505]/90 to-[#050505]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C8A45D]/30 bg-[#C8A45D]/10 text-[#C8A45D] text-xs font-semibold tracking-wide">
            THE REAL ESTATE REVENUE OPERATING SYSTEM
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
            Tailored for Every Real Estate Sales Model.
          </h1>
          <p className="text-base text-slate-300 font-light leading-relaxed">
            Whether you run a 50-executive brokerage floor, represent a Tier-1 developer sales mandate, or close luxury villas as an independent partner, REALVION adapts to your workflow.
          </p>
        </div>

        {/* Solutions Cards */}
        <div className="space-y-8">
          {personaSolutions.map((sol, idx) => {
            const Icon = sol.icon;
            return (
              <div
                key={idx}
                className="p-8 sm:p-12 rounded-3xl bg-[#0c0c0c] border border-white/[0.08] hover:border-[#C8A45D]/30 transition grid grid-cols-1 lg:grid-cols-12 gap-8 items-start shadow-xl"
              >
                <div className="lg:col-span-5 space-y-4 text-left">
                  <div className="h-12 w-12 rounded-2xl bg-[#C8A45D]/10 text-[#C8A45D] border border-[#C8A45D]/20 flex items-center justify-center font-bold">
                    <Icon className="h-6 w-6" />
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-[#C8A45D] uppercase tracking-wider block">
                      SOLUTION 0{idx + 1}
                    </span>
                    <h3 className="text-2xl font-bold text-white mt-1">
                      {sol.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {sol.subtitle}
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
                    {sol.description}
                  </p>

                  <div className="pt-2">
                    <button
                      onClick={() => navigate('/register')}
                      className="px-6 py-3 rounded-xl text-xs font-bold text-black bg-[#C8A45D] hover:brightness-110 transition flex items-center gap-2"
                    >
                      Explore Solution in Demo <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-7 p-6 rounded-2xl bg-[#121212] border border-white/5 space-y-3 text-left">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block pb-2 border-b border-white/5">
                    KEY OPERATIONAL ADVANTAGES
                  </span>

                  <div className="space-y-3">
                    {sol.benefits.map((b, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-200 font-light">
                        <CheckCircle2 className="h-4 w-4 text-[#C8A45D] shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Demo Action Banner */}
        <div className="p-10 rounded-3xl bg-gradient-to-r from-[#101010] via-[#16140d] to-[#101010] border border-[#C8A45D]/40 text-center space-y-6 shadow-2xl">
          <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">Connect Your Team</span>
          <h2 className="text-3xl font-bold text-white">Experience REALVION for Your Agency</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto font-light leading-relaxed">
            See how the platform runs for your specific sales structure with an interactive 1-hour sandbox loaded with sample data.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-3.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 transition flex items-center gap-2"
            >
              Start 1-Hour Free Sandbox <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onOpenDemo}
              className="px-6 py-3.5 rounded-xl text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition"
            >
              Watch Video Walkthrough
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
