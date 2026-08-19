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
  Lock
} from 'lucide-react';

export const WebsiteFooter: React.FC = () => {
  const navigate = useNavigate();

  const PORTAL_LOGIN_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5173/login'
    : 'https://web-based-crm-1.onrender.com/login';

  return (
    <footer className="relative bg-[#020202] border-t border-white/[0.08] text-slate-300 overflow-hidden select-none">
      {/* Ambient background lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[300px] bg-[#C8A45D]/[0.07] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[450px] h-[350px] bg-amber-500/[0.04] rounded-full blur-[130px] pointer-events-none" />

      {/* Pre-Footer Action Banner */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-12 border-b border-white/[0.08] relative z-10">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#0d0d0d] via-[#15130b] to-[#0d0d0d] border border-[#C8A45D]/40 shadow-2xl shadow-black flex flex-col lg:flex-row items-center justify-between gap-8 backdrop-blur-md">
          <div className="space-y-3 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C8A45D]/15 border border-[#C8A45D]/30 text-[#C8A45D] text-xs font-bold tracking-wide uppercase">
              <Sparkles className="h-4 w-4 animate-pulse" /> Next-Gen Brokerage CRM
            </div>
            <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Ready to automate your real estate agency?
            </h3>
            <p className="text-sm sm:text-base text-slate-300 font-light max-w-xl leading-relaxed">
              Get instant access with pre-seeded sample leads, voice follow-up alarms, and developer catalog.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 shrink-0">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 rounded-2xl text-sm font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 shadow-xl shadow-[#C8A45D]/30 transition transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              Start Free Account <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-7 py-4 rounded-2xl text-sm font-semibold text-slate-100 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-[#C8A45D]/50 transition flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4 text-[#C8A45D]" /> Talk to Sales
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 relative z-10">
        
        {/* Col 1: Brand Logo & Contact */}
        <div className="lg:col-span-4 space-y-6">
          <div
            className="cursor-pointer inline-block group"
            onClick={() => {
              navigate('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="relative inline-block">
              {/* Subtle logo glow backdrop */}
              <div className="absolute -inset-2 bg-gradient-to-r from-[#C8A45D]/20 to-transparent rounded-2xl blur-lg opacity-40 group-hover:opacity-80 transition duration-300" />
              <img
                src="/logo.png"
                alt="REALVION"
                className="relative h-24 sm:h-28 md:h-32 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                style={{ maxWidth: '380px', maxHeight: '110px' }}
              />
            </div>
          </div>

          <p className="text-slate-300 text-sm font-light leading-relaxed max-w-sm">
            The official Real Estate Sales Operating System engineered specifically for Channel Partners, Brokerage Firms, and Agency Leaders across India.
          </p>

          <div className="space-y-3 pt-2">
            {/* Address Pill */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-[#C8A45D]/40 hover:bg-white/[0.06] transition flex items-start gap-3">
              <MapPin className="h-4 w-4 text-[#C8A45D] shrink-0 mt-0.5" />
              <div className="text-xs text-slate-200 font-normal leading-snug">
                1st Floor, Navale Icon, Narhe Gaon, Katraj, Pune, Maharashtra 411046
              </div>
            </div>

            {/* Phone Numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <a
                href="tel:+919529988152"
                className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-[#C8A45D]/40 hover:bg-white/[0.06] transition flex items-center gap-2.5 text-xs text-slate-200 font-medium"
              >
                <Phone className="h-3.5 w-3.5 text-[#C8A45D]" />
                <span>+91 95299 88152</span>
              </a>
              <a
                href="tel:+918999624212"
                className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-[#C8A45D]/40 hover:bg-white/[0.06] transition flex items-center gap-2.5 text-xs text-slate-200 font-medium"
              >
                <Phone className="h-3.5 w-3.5 text-[#C8A45D]" />
                <span>+91 89996 24212</span>
              </a>
            </div>

            {/* Email */}
            <a
              href="mailto:firewingtechnologiesindia@gmail.com"
              className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-[#C8A45D]/40 hover:bg-white/[0.06] transition flex items-center gap-2.5 text-xs text-slate-200 font-medium break-all"
            >
              <Mail className="h-4 w-4 text-[#C8A45D] shrink-0" />
              <span>firewingtechnologiesindia@gmail.com</span>
            </a>
          </div>
        </div>

        {/* Col 2: Product & Solutions */}
        <div className="lg:col-span-3 space-y-5">
          <div className="flex items-center gap-2 pb-1 border-b border-white/[0.08]">
            <span className="h-2 w-2 rounded-full bg-[#C8A45D]" />
            <h4 className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#C8A45D] font-extrabold text-xs uppercase tracking-widest">
              Product & Solutions
            </h4>
          </div>
          <ul className="space-y-3">
            {[
              { name: 'Channel Partner CRM', path: '/solutions' },
              { name: '7-Stage Lead Pipeline', path: '/features' },
              { name: 'Voice & Sound Alarms', path: '/solutions' },
              { name: 'Builders & Projects Catalog', path: '/solutions' },
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
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="group flex items-center gap-2.5 text-slate-400 hover:text-white transition-all py-0.5 text-sm font-normal text-left"
                >
                  <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-[#C8A45D] group-hover:translate-x-1 transition-all" />
                  <span className="group-hover:text-white transition-colors">{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Company */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center gap-2 pb-1 border-b border-white/[0.08]">
            <span className="h-2 w-2 rounded-full bg-[#C8A45D]" />
            <h4 className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#C8A45D] font-extrabold text-xs uppercase tracking-widest">
              Company
            </h4>
          </div>
          <ul className="space-y-3">
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
                  onClick={() => {
                    navigate(item.path);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group flex items-center gap-2.5 text-slate-400 hover:text-white transition-all py-0.5 text-sm font-normal text-left"
                >
                  <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-[#C8A45D] group-hover:translate-x-1 transition-all" />
                  <span className="group-hover:text-white transition-colors">{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 4: Resources & Portal */}
        <div className="lg:col-span-3 space-y-5">
          <div className="flex items-center gap-2 pb-1 border-b border-white/[0.08]">
            <span className="h-2 w-2 rounded-full bg-[#C8A45D]" />
            <h4 className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#C8A45D] font-extrabold text-xs uppercase tracking-widest">
              Resources & Portal
            </h4>
          </div>
          <ul className="space-y-3">
            {[
              { name: 'Industry Insights & Blog', path: '/blog' },
              { name: 'Frequently Asked Questions', path: '/faq' },
              { name: 'Contact Sales Support', path: '/contact' },
            ].map((item, idx) => (
              <li key={idx}>
                <button
                  onClick={() => {
                    navigate(item.path);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group flex items-center gap-2.5 text-slate-400 hover:text-white transition-all py-0.5 text-sm font-normal text-left"
                >
                  <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-[#C8A45D] group-hover:translate-x-1 transition-all" />
                  <span className="group-hover:text-white transition-colors">{item.name}</span>
                </button>
              </li>
            ))}

            {/* Portal Login CTA */}
            <li className="pt-2">
              <a
                href={PORTAL_LOGIN_URL}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 hover:from-[#C8A45D]/20 hover:to-[#C8A45D]/10 border border-white/15 hover:border-[#C8A45D]/50 text-white font-semibold transition flex items-center justify-between text-xs group shadow-lg shadow-black/40"
              >
                <span className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-[#C8A45D]" /> Authorized Portal Login
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-[#C8A45D] group-hover:translate-x-0.5 transition-transform" />
              </a>
            </li>
          </ul>

          {/* Operational Status Monitor */}
          <div className="pt-2">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-400 font-medium">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span>Platform Core: Operational (100% Online)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-8 pb-12 border-t border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 relative z-10">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <p>© 2026 REALVION Official. All rights reserved.</p>
          <span className="hidden sm:inline text-slate-700">•</span>
          <span className="flex items-center gap-1.5 text-slate-300 font-normal">
            <ShieldCheck className="h-4 w-4 text-[#C8A45D]" /> Built for Indian Real Estate Channel Partners
          </span>
        </div>

        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/faq')} className="hover:text-white transition">Privacy Policy</button>
          <button onClick={() => navigate('/faq')} className="hover:text-white transition">Terms of Service</button>
          <button onClick={() => navigate('/faq')} className="hover:text-white transition">Security Specs</button>
        </div>
      </div>
    </footer>
  );
};
