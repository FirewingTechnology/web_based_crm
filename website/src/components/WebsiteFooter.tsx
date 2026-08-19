import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Zap,
  Globe
} from 'lucide-react';

export const WebsiteFooter: React.FC = () => {
  const navigate = useNavigate();

  const PORTAL_LOGIN_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5173/login'
    : 'https://web-based-crm-1.onrender.com/login';

  return (
    <footer className="relative bg-[#030303] border-t border-white/[0.08] text-xs text-slate-400 overflow-hidden select-none">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[250px] bg-[#C8A45D]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-20 right-0 w-[400px] h-[300px] bg-amber-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Pre-Footer Newsletter / Instant Action Banner */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-14 pb-12 border-b border-white/[0.06] relative z-10">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#0d0d0d] via-[#14120a] to-[#0d0d0d] border border-[#C8A45D]/30 shadow-2xl shadow-black/80 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C8A45D]/10 border border-[#C8A45D]/20 text-[#C8A45D] text-[11px] font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> Next-Gen Brokerage CRM
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Ready to automate your real estate agency?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 font-light max-w-xl">
              Get full instant access with pre-seeded sample leads, voice follow-up alarms, and developer catalog.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-3.5 rounded-2xl text-xs font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 shadow-lg shadow-[#C8A45D]/25 transition transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              Start Free Account <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-6 py-3.5 rounded-2xl text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4 text-[#C8A45D]" /> Talk to Sales
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Links Grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 relative z-10">
        {/* Col 1: Brand & Contact Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="cursor-pointer inline-block" onClick={() => navigate('/')}>
            <img
              src="/logo.png"
              alt="REALVION"
              className="h-16 sm:h-20 w-auto object-contain transition-transform hover:scale-105"
              style={{ maxWidth: '280px', maxHeight: '72px' }}
            />
          </div>

          <p className="text-slate-400 text-xs font-light leading-relaxed max-w-sm">
            The official Real Estate Sales Operating System engineered specifically for Channel Partners, Brokerage Firms, and Agency Leaders across India.
          </p>

          <div className="space-y-2.5 pt-1">
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-[#C8A45D]/30 transition flex items-start gap-3">
              <MapPin className="h-4 w-4 text-[#C8A45D] shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-300 font-light leading-snug">
                1st Floor, Navale Icon, Narhe Gaon, Katraj, Pune, Maharashtra 411046
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href="tel:+919529988152"
                className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-[#C8A45D]/30 hover:bg-white/[0.04] transition flex items-center gap-2.5 text-[11px] text-slate-300"
              >
                <Phone className="h-3.5 w-3.5 text-[#C8A45D]" />
                <span>+91 95299 88152</span>
              </a>
              <a
                href="tel:+918999624212"
                className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-[#C8A45D]/30 hover:bg-white/[0.04] transition flex items-center gap-2.5 text-[11px] text-slate-300"
              >
                <Phone className="h-3.5 w-3.5 text-[#C8A45D]" />
                <span>+91 89996 24212</span>
              </a>
            </div>

            <a
              href="mailto:firewingtechnologiesindia@gmail.com"
              className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-[#C8A45D]/30 hover:bg-white/[0.04] transition flex items-center gap-2.5 text-[11px] text-slate-300 break-all"
            >
              <Mail className="h-3.5 w-3.5 text-[#C8A45D] shrink-0" />
              <span>firewingtechnologiesindia@gmail.com</span>
            </a>
          </div>
        </div>

        {/* Col 2: Product & Solutions */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#C8A45D]" />
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Product & Solutions</h4>
          </div>
          <ul className="space-y-2.5">
            {[
              { name: 'Channel Partner CRM', path: '/solutions' },
              { name: '7-Stage Lead Pipeline', path: '/features' },
              { name: 'Voice & Sound Alarms', path: '/solutions' },
              { name: 'Builders & Project Inventory', path: '/solutions' },
              { name: 'Broker Commission Overrides', path: '/solutions' },
              { name: 'Live Video Walkthrough', path: '/#demo-video' },
            ].map((item, idx) => (
              <li key={idx}>
                <button
                  onClick={() => {
                    if (item.path.startsWith('/#')) {
                      navigate('/');
                      setTimeout(() => {
                        const el = document.getElementById('demo-video');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    } else {
                      navigate(item.path);
                    }
                  }}
                  className="group flex items-center gap-2 text-slate-400 hover:text-[#C8A45D] transition-colors py-0.5 text-xs font-light text-left"
                >
                  <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-[#C8A45D] group-hover:translate-x-0.5 transition-all" />
                  <span>{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Company & Industries */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#C8A45D]" />
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Company</h4>
          </div>
          <ul className="space-y-2.5">
            {[
              { name: 'About REALVION', path: '/about' },
              { name: 'For Channel Partners', path: '/industries' },
              { name: 'For Brokerage Firms', path: '/industries' },
              { name: 'For Developers', path: '/industries' },
              { name: 'Pricing & Plans', path: '/pricing' },
              { name: 'System Security', path: '/faq' },
            ].map((item, idx) => (
              <li key={idx}>
                <button
                  onClick={() => navigate(item.path)}
                  className="group flex items-center gap-2 text-slate-400 hover:text-[#C8A45D] transition-colors py-0.5 text-xs font-light text-left"
                >
                  <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-[#C8A45D] group-hover:translate-x-0.5 transition-all" />
                  <span>{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 4: Resources & System Access */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#C8A45D]" />
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Resources & Portal</h4>
          </div>
          <ul className="space-y-2.5">
            {[
              { name: 'Industry Insights & Blog', path: '/blog' },
              { name: 'Frequently Asked Questions', path: '/faq' },
              { name: 'Contact Sales Support', path: '/contact' },
            ].map((item, idx) => (
              <li key={idx}>
                <button
                  onClick={() => navigate(item.path)}
                  className="group flex items-center gap-2 text-slate-400 hover:text-[#C8A45D] transition-colors py-0.5 text-xs font-light text-left"
                >
                  <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-[#C8A45D] group-hover:translate-x-0.5 transition-all" />
                  <span>{item.name}</span>
                </button>
              </li>
            ))}
            <li className="pt-2">
              <a
                href={PORTAL_LOGIN_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#C8A45D]/40 text-slate-200 hover:text-[#C8A45D] transition text-xs font-semibold"
              >
                <span>Authorized Portal Login</span>
                <ExternalLink className="h-3 w-3 text-[#C8A45D]" />
              </a>
            </li>
          </ul>

          <div className="pt-3">
            <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-2.5 text-[11px] text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Platform Core: Operational (100% Online)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-8 pb-12 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 relative z-10">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <p>© 2026 REALVION Official. All rights reserved.</p>
          <span className="hidden sm:inline text-slate-700">•</span>
          <span className="flex items-center gap-1 text-slate-400 font-light">
            <ShieldCheck className="h-3.5 w-3.5 text-[#C8A45D]" /> Built for Indian Real Estate Channel Partners
          </span>
        </div>

        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/faq')} className="hover:text-slate-300 transition">Privacy Policy</button>
          <button onClick={() => navigate('/faq')} className="hover:text-slate-300 transition">Terms of Service</button>
          <button onClick={() => navigate('/faq')} className="hover:text-slate-300 transition">Security Specs</button>
        </div>
      </div>
    </footer>
  );
};
