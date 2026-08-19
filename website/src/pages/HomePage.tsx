import React, { useState, useEffect } from 'react';
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
  Rocket,
  Lock,
  Unlock
} from 'lucide-react';
import { VideoPlayer } from '../components/VideoPlayer';
import { isUserRegistered } from '../utils/auth';

export const HomePage: React.FC<{ onOpenDemo: () => void }> = ({ onOpenDemo }) => {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [registered, setRegistered] = useState<boolean>(isUserRegistered());

  useEffect(() => {
    const checkAuth = () => setRegistered(isUserRegistered());
    window.addEventListener('brokeros_auth_changed', checkAuth);
    window.addEventListener('storage', checkAuth);
    return () => {
      window.removeEventListener('brokeros_auth_changed', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

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
    { name: "Native Lakhs/Crores Revenue Calculators", realvion: true, legacy: false },
    { name: "Multi-Tier Role Scoping (Exec vs Admin)", realvion: true, legacy: true },
    { name: "Zero Cloud Bloat (Sub-second load times)", realvion: true, legacy: false },
  ];

  const faqs = [
    {
      q: "Why is REALVION different from Salesforce, Zoho, or LeadSquared?",
      a: "General CRMs are built for generic software companies. REALVION is tailored exclusively for Real Estate Channel Partners in India—with built-in Lakhs/Crores revenue logic, RERA registration numbers, site visit scheduling, and audio voice alarms for follow-ups."
    },
    {
      q: "How does the Voice Follow-Up Alarm work?",
      a: "When a lead follow-up deadline is reached, REALVION uses HTML5 Web Audio synthesis and Text-to-Speech to read out the client's name and project aloud to your sales executive so no high-value buyer is forgotten."
    },
    {
      q: "How does the demo access work?",
      a: "The complete platform demo video and interactive sandbox are available to all registered users. Simply register your agency free of charge to immediately unlock the full walkthrough recording and hands-on test workspace."
    },
    {
      q: "Can I manage my builders and project inventory in REALVION?",
      a: "Yes! REALVION allows you to catalog builders (Godrej, DLF, Lodha, Prestige, etc.) and create projects on-the-fly directly inside lead drawers."
    }
  ];

  return (
    <div className="bg-[#050505] text-slate-100 min-h-screen selection:bg-[#C8A45D] selection:text-black" onMouseMove={handleMouseMove}>
      {/* Hero Section */}
      <section className="relative pt-36 pb-20 px-6 lg:px-12 max-w-7xl mx-auto overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C8A45D]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

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
                Start 1-Hour Free Trial <ArrowRight className="h-5 w-5" />
              </button>

              <button
                onClick={onOpenDemo}
                className="px-6 py-4 rounded-2xl text-sm font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center gap-2"
              >
                {registered ? (
                  <>
                    <Play className="h-4 w-4 text-[#C8A45D] fill-[#C8A45D]" /> Watch Live Demo
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-[#C8A45D]" /> Register to Watch Demo
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/[0.08] text-xs">
              <div>
                <p className="text-2xl font-bold text-white">7-Stage</p>
                <p className="text-slate-400 mt-0.5">Pipeline CRM</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#C8A45D]">Real-Time</p>
                <p className="text-slate-400 mt-0.5">Voice Reminders</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">INR Native</p>
                <p className="text-slate-400 mt-0.5">Lakhs & Crores</p>
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
            {registered ? (
              <>
                <Sparkles className="h-3.5 w-3.5" /> Full Product Walkthrough (Unlocked)
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5" /> Registration Required for Demo
              </>
            )}
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            See REALVION in Action
          </h2>
          <p className="text-sm sm:text-base text-slate-400 font-light leading-relaxed">
            {registered
              ? 'Watch the complete end-to-end recording of lead workflows, audio follow-up alarms, developer catalogs, and executive performance analytics.'
              : 'Register your real estate agency or channel partner profile to unlock the high-definition product walkthrough and interactive sandbox.'}
          </p>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          {registered ? (
            <div className="p-2 sm:p-4 rounded-3xl bg-gradient-to-b from-white/10 to-white/[0.02] border border-[#C8A45D]/30 shadow-2xl shadow-black">
              <VideoPlayer
                src="/demo-video.mp4"
                title="REALVION Official Product Demonstration & Walkthrough"
                showChapters={true}
              />
            </div>
          ) : (
            <div className="relative rounded-3xl bg-[#0e0e0e] border border-[#C8A45D]/30 overflow-hidden shadow-2xl shadow-black p-8 sm:p-14 text-center">
              {/* Blurred background aesthetic elements */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#C8A45D]/5 via-black/80 to-black backdrop-blur-md" />
              <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#C8A45D]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-xl mx-auto space-y-6">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-[#C8A45D]/10 border border-[#C8A45D]/40 text-[#C8A45D] shadow-lg shadow-[#C8A45D]/10">
                  <Lock className="h-8 w-8" />
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold tracking-widest text-[#C8A45D] uppercase">
                    Demo Gated for Registered Users
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Register to Unlock Live Demo & Sandbox
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
                    The full product video walkthrough, interactive lead pipeline demo, and audio reminder simulation are exclusively available to registered partners.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={onOpenDemo}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 shadow-xl shadow-[#C8A45D]/25 transition flex items-center justify-center gap-2"
                  >
                    <Unlock className="h-4 w-4" /> Register & Unlock Demo Now
                  </button>

                  <button
                    onClick={() => navigate('/register')}
                    className="w-full sm:w-auto px-6 py-4 rounded-2xl text-sm font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center justify-center gap-2"
                  >
                    <ArrowRight className="h-4 w-4" /> Full Registration Wizard
                  </button>
                </div>

                <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#C8A45D]" /> 0-Second Instant Unlock
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#C8A45D]" /> 1080p Full Demo Walkthrough
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#C8A45D]" /> Pre-seeded 50 Lead Sandbox
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-6 relative z-10">
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 shadow-lg shadow-[#C8A45D]/25 transition flex items-center gap-2"
          >
            Start 1-Hour Free Trial <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={onOpenDemo}
            className="px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center gap-2"
          >
            <Rocket className="h-4 w-4 text-[#C8A45D]" /> {registered ? 'Open Interactive Sandbox' : 'Register to Open Demo'}
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

      {/* Reality Check Interactive Diagnostic */}
      <section className="py-24 px-6 lg:px-12 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-semibold">
            <AlertCircle className="h-3.5 w-3.5" /> 5-Point Business Diagnostic
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            The 5 Questions Every Agency Owner Must Answer
          </h2>
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#0e0e0e] border border-white/[0.08] hover:border-[#C8A45D]/50 transition flex items-start gap-4"
            >
              <span className="text-rose-500 font-black text-sm font-mono mt-0.5">Q{idx + 1}.</span>
              <div className="space-y-1 text-left flex-1">
                <p className="text-sm font-semibold text-white">{q}</p>
                <p className="text-xs text-slate-400 font-light">
                  If you answered "I don't know" or "No", your agency loses up to ₹15 Lakhs every single month in unclosed deals.
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-600 shrink-0 mt-1" />
            </div>
          ))}
        </div>
      </section>

      {/* Feature Comparison Matrix */}
      <section className="py-24 px-6 lg:px-12 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">Unfair Advantage</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            REALVION vs. Generic Legacy CRMs
          </h2>
        </div>

        <div className="p-6 rounded-3xl bg-[#0a0a0a] border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="pb-4 font-semibold">Platform Feature</th>
                  <th className="pb-4 font-bold text-[#C8A45D] text-center">REALVION OS</th>
                  <th className="pb-4 font-semibold text-center text-slate-500">Generic Legacy CRMs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {comparisonFeatures.map((f, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    <td className="py-4 text-white font-medium">{f.name}</td>
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
