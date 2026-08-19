import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Building,
  UserCheck,
  Volume2,
  Phone,
  Flame,
  ChevronRight,
  AlertCircle,
  Play,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  Award,
  Shield,
  Zap,
  Users,
  Star,
  Rocket
} from 'lucide-react';
import { VideoPlayer } from '../components/VideoPlayer';

export const HomePage: React.FC<{ onOpenDemo: () => void }> = ({ onOpenDemo }) => {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth - 0.5) * 20;
    const y = (clientY / window.innerHeight - 0.5) * 20;
    setMousePos({ x, y });
  };


  const questions = [
    "How many follow-ups were missed in your sales team this week?",
    "How many hot buyer leads are waiting for a callback right now?",
    "What happens to your business if your top sales executive leaves tomorrow?",
    "Can you find any customer's conversation history within 10 seconds?",
    "If your phone is lost today... can your real estate business continue tomorrow?"
  ];

  const timelineSteps = [
    { title: "Step 1: One-Click Registration", desc: "Select your plan, verify your work email with OTP, and register your brokerage entity." },
    { title: "Step 2: Instant Demo Workspace", desc: "Your workspace is immediately provisioned with 50 pre-seeded leads, builders, and analytics." },
    { title: "Step 3: Automated Follow-Up Alarms", desc: "Synthesizes dual-harmonic audio chimes and voice alerts so no client call is ever lost." },
    { title: "Step 4: Commission & Revenue Auto-Calculation", desc: "Track channel partner commission payouts, executive targets, and booking ledgers live." }
  ];

  const comparisonFeatures = [
    { name: "Real Estate CP Specific Workflows", realvion: true, legacy: false },
    { name: "Dual-Harmonic Audio & Speech Alarms", realvion: true, legacy: false },
    { name: "Inline Builder & Developer Creation", realvion: true, legacy: false },
    { name: "Automated Self-Onboarding & Instant Demo", realvion: true, legacy: false },
    { name: "Lakhs & Crores (INR) Revenue Metrics", realvion: true, legacy: false },
    { name: "Role-Based Access Control (RBAC)", realvion: true, legacy: true },
    { name: "CSV Data Export & Detailed Audits", realvion: true, legacy: false }
  ];

  const faqs = [
    { q: "How fast can my real estate agency get started?", a: "You can register and launch your demo workspace in under 2 minutes. Instant 50 sample leads, builders, and analytics are preloaded automatically." },
    { q: "Is payment mandatory to test the system?", a: "No! You get instant access to a full Demo Workspace to test all features. Payment is only required when you activate your live workspace via Razorpay." },
    { q: "Does REALVION support multi-tenant team members?", a: "Yes. Admins can create Sales Executives, Managers, and Broker Partners with role-scoped permissions." },
    { q: "How do the voice follow-up reminders work?", a: "REALVION checks your agenda every 8 seconds and synthesizes a 4-note sound chime followed by spoken voice alerts ('Reminder Alert! You have a scheduled call with Lead Name')." }
  ];

  return (
    <div className="bg-[#050505] text-slate-100 selection:bg-[#C8A45D] selection:text-black relative" onMouseMove={handleMouseMove}>
      
      {/* Floating CTA Bar */}
      <div className="fixed bottom-6 right-6 z-40 hidden md:flex items-center gap-3 p-3 rounded-2xl bg-[#0a0a0a]/90 border border-[#C8A45D]/40 backdrop-blur-xl shadow-2xl">
        <span className="text-xs font-semibold text-slate-200 pl-2">Ready to transform your sales?</span>
        <button
          onClick={() => navigate('/register')}
          className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-[#C8A45D] hover:brightness-110 shadow-lg shadow-[#C8A45D]/25 transition flex items-center gap-1"
        >
          Get Started <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 px-6 lg:px-12 max-w-7xl mx-auto min-h-screen flex flex-col justify-center overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#C8A45D]/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C8A45D]/30 bg-[#C8A45D]/10 text-[#C8A45D] text-xs font-semibold tracking-wide">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" /> The Official Real Estate Operating System
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              You don't need another CRM. <br />
              <span className="bg-gradient-to-r from-white via-slate-200 to-[#C8A45D] bg-clip-text text-transparent">
                You need complete control over your sales.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl font-light">
              REALVION is the official Real Estate Sales Operating System built specifically for Real Estate Channel Partners, Brokerage Firms, and Agency Leaders to organize buyer leads, voice follow-ups, developers, and project inventory.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-4 rounded-2xl text-sm font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:shadow-xl hover:shadow-[#C8A45D]/30 transition transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                Start Free Trial <ArrowRight className="h-5 w-5" />
              </button>

              <button
                onClick={onOpenDemo}
                className="px-6 py-4 rounded-2xl text-sm font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center gap-2"
              >
                <Play className="h-4 w-4 text-[#C8A45D] fill-[#C8A45D]" /> Watch Live Demo
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/[0.08] text-xs">
              <div>
                <p className="text-2xl font-bold text-white">50,000+</p>
                <p className="text-slate-500 mt-0.5">Leads Managed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#C8A45D]">₹1,200 Cr+</p>
                <p className="text-slate-500 mt-0.5">GMV Processed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">99.9%</p>
                <p className="text-slate-500 mt-0.5">System Uptime</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <motion.div
              style={{
                transform: `perspective(1000px) rotateY(${mousePos.x * 0.5}deg) rotateX(${-mousePos.y * 0.5}deg)`
              }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              className="relative p-6 rounded-3xl bg-[#101010]/90 border border-white/[0.12] shadow-2xl shadow-black space-y-4 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-semibold text-slate-400 ml-2">REALVION Live Cockpit</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C8A45D]/20 text-[#C8A45D] border border-[#C8A45D]/30">
                  RERA APPROVED
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-[#0a0a0a] to-[#121212] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Monthly Target Achievement</p>
                    <p className="text-lg font-bold text-white">₹300 Lakhs <span className="text-xs text-emerald-400 font-semibold">(85% Closed)</span></p>
                  </div>
                  <Flame className="h-6 w-6 text-[#C8A45D]" />
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-[#C8A45D] w-[85%]" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Site Visit Scheduled</p>
                    <p className="text-[11px] text-slate-400">Amitabh Mehra • Godrej Woods</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#C8A45D]">10:41 AM</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/60 to-purple-950/60 border border-blue-500/40 flex items-center justify-between text-xs animate-pulse">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-blue-400" />
                  <span className="font-semibold text-slate-200">Voice Reminder Alarm Active</span>
                </div>
                <span className="text-[10px] text-blue-300 font-mono">SPEECH_SYNTH_ON</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Dedicated Demo Video Showcase Section */}
      <section id="demo-video" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto space-y-10 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#C8A45D]/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="text-center space-y-4 relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C8A45D]/30 bg-[#C8A45D]/10 text-[#C8A45D] text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> Full Product Walkthrough
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            See REALVION in Action
          </h2>
          <p className="text-sm sm:text-base text-slate-400 font-light leading-relaxed">
            Watch the complete end-to-end recording of lead workflows, audio follow-up alarms, developer catalogs, and executive performance analytics.
          </p>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="p-2 sm:p-4 rounded-3xl bg-gradient-to-b from-white/10 to-white/[0.02] border border-[#C8A45D]/30 shadow-2xl shadow-black">
            <VideoPlayer
              src="/demo-video.mp4"
              title="REALVION Official Product Demonstration & Walkthrough"
              showChapters={true}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-6 relative z-10">
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 shadow-lg shadow-[#C8A45D]/25 transition flex items-center gap-2"
          >
            Start Free 14-Day Trial <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={onOpenDemo}
            className="px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center gap-2"
          >
            <Rocket className="h-4 w-4 text-[#C8A45D]" /> Open Interactive Sandbox Modal
          </button>
        </div>
      </section>

      {/* Feature Timeline Section */}
      <section className="py-24 px-6 lg:px-12 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">How It Works</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Self-Onboarding in 4 Simple Steps</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {timelineSteps.map((step, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 space-y-3 relative">
              <span className="text-xs font-mono font-bold text-[#C8A45D] px-2.5 py-1 rounded bg-[#C8A45D]/10 border border-[#C8A45D]/20">
                0{idx + 1}
              </span>
              <h3 className="text-base font-bold text-white pt-2">{step.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-6 lg:px-12 bg-[#080808] border-t border-white/[0.08]">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">Why Choose REALVION</span>
            <h2 className="text-3xl font-bold text-white">REALVION vs Generic CRMs</h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0a0a0a]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-white font-semibold">
                <tr>
                  <th className="p-4">Feature / Capability</th>
                  <th className="p-4 text-center text-[#C8A45D]">REALVION Platform</th>
                  <th className="p-4 text-center text-slate-400">Legacy / Generic CRMs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {comparisonFeatures.map((f, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="p-4 font-medium text-white">{f.name}</td>
                    <td className="p-4 text-center">
                      {f.realvion ? <CheckCircle2 className="h-5 w-5 text-emerald-400 inline" /> : <XCircle className="h-5 w-5 text-rose-500 inline" />}
                    </td>
                    <td className="p-4 text-center">
                      {f.legacy ? <CheckCircle2 className="h-5 w-5 text-emerald-400 inline" /> : <XCircle className="h-5 w-5 text-rose-500 inline" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 lg:px-12 max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">Got Questions?</span>
          <h2 className="text-3xl font-bold text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
              className="p-5 rounded-2xl bg-[#0a0a0a] border border-white/10 cursor-pointer space-y-2 transition"
            >
              <div className="flex items-center justify-between font-semibold text-sm text-white">
                <span>{faq.q}</span>
                <HelpCircle className="h-4 w-4 text-[#C8A45D]" />
              </div>
              {openFaqIndex === idx && (
                <p className="text-xs text-slate-400 pt-2 border-t border-white/5 leading-relaxed font-light">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
