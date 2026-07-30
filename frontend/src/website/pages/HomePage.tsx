import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Building,
  UserCheck,
  Volume2,
  Target,
  Award,
  BarChart3,
  Phone,
  Flame,
  Check,
  X,
  Lock,
  Layers,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { playReminderChime, speakReminderVoice } from '../../components/reminders/ReminderManager';

export const HomePage: React.FC<{ onOpenDemo: () => void }> = ({ onOpenDemo }) => {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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

  return (
    <div className="bg-[#050505] text-slate-100 selection:bg-[#C8A45D] selection:text-black" onMouseMove={handleMouseMove}>
      {/* HERO SECTION */}
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
              BrokerOS is the official operating system built specifically for Real Estate Channel Partners, Brokerage Firms, and Agency Leaders to organize buyer leads, voice follow-ups, developers, and project inventory.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={onOpenDemo}
                className="px-8 py-4 rounded-2xl text-sm font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:shadow-xl hover:shadow-[#C8A45D]/30 transition transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                Book Personal Live Demo <ArrowRight className="h-5 w-5" />
              </button>

              <button
                onClick={() => navigate('/solutions')}
                className="px-6 py-4 rounded-2xl text-sm font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center gap-2"
              >
                Explore Solutions <ChevronRight className="h-5 w-5 text-[#C8A45D]" />
              </button>
            </div>

            {/* Quick Metrics Badge */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/[0.08] text-xs">
              <div>
                <p className="text-2xl font-bold text-white">100%</p>
                <p className="text-slate-500 mt-0.5">Real Estate CP Focused</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#C8A45D]">0</p>
                <p className="text-slate-500 mt-0.5">Missed Client Follow-ups</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">INR</p>
                <p className="text-slate-500 mt-0.5">Lakhs / Crores Pricing</p>
              </div>
            </div>
          </div>

          {/* Interactive 3D Parallax Canvas Display */}
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
                  <span className="text-xs font-semibold text-slate-400 ml-2">BrokerOS Live Cockpit</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C8A45D]/20 text-[#C8A45D] border border-[#C8A45D]/30">
                  RERA APPROVED
                </span>
              </div>

              {/* Floating Simulated Dashboard Cards */}
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

      {/* BUSINESS REALITY */}
      <section className="py-24 px-6 lg:px-12 border-t border-white/[0.08] bg-[#080808]">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">Business Reality</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Is your real estate business running on memory... or systems?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questions.map((q, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-[#101010] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#C8A45D] px-2 py-0.5 rounded bg-[#C8A45D]/10">
                    REALITY 0{idx + 1}
                  </span>
                  <AlertCircle className="h-4 w-4 text-[#C8A45D]" />
                </div>
                <h3 className="text-base font-semibold text-slate-200">{q}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS & SOLUTIONS SUMMARY */}
      <section className="py-24 px-6 lg:px-12 border-t border-white/[0.08] max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">Product Suite</span>
          <h2 className="text-3xl sm:text-5xl font-black text-white">
            Built for total control.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-8 rounded-3xl bg-[#101010] border border-white/[0.08] space-y-4">
            <UserCheck className="h-8 w-8 text-[#C8A45D]" />
            <h3 className="text-xl font-bold text-white">Lead Management</h3>
            <p className="text-xs text-slate-400 font-light">7-stage sales pipeline with lead drawer and interaction history timeline.</p>
          </div>
          <div className="p-8 rounded-3xl bg-[#101010] border border-white/[0.08] space-y-4">
            <Volume2 className="h-8 w-8 text-[#C8A45D]" />
            <h3 className="text-xl font-bold text-white">Voice & Audio Alarms</h3>
            <p className="text-xs text-slate-400 font-light">Web Audio harmonic chimes and text-to-speech voice announcements for scheduled callbacks.</p>
          </div>
          <div className="p-8 rounded-3xl bg-[#101010] border border-white/[0.08] space-y-4">
            <Building className="h-8 w-8 text-[#C8A45D]" />
            <h3 className="text-xl font-bold text-white">Builders & Inventory</h3>
            <p className="text-xs text-slate-400 font-light">Centralized developer listings, pricing tiers, PDF brochures, and RERA IDs.</p>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 px-6 lg:px-12 border-t border-white/[0.08] text-center bg-gradient-to-b from-[#050505] via-[#0c0c0c] to-[#050505]">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
            Elevate your brokerage to the next level.
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onOpenDemo}
              className="px-9 py-4 rounded-2xl text-sm font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:shadow-xl transition transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              Book Personal Live Demo <ArrowRight className="h-5 w-5" />
            </button>

            <button
              onClick={() => navigate('/login')}
              className="px-7 py-4 rounded-2xl text-sm font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center gap-2"
            >
              <Lock className="h-4 w-4 text-[#C8A45D]" /> Portal Access
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
