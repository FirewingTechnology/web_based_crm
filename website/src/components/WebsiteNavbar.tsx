import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, ArrowRight, Menu, X, Sparkles } from 'lucide-react';

export const WebsiteNavbar: React.FC<{ onOpenDemo: () => void }> = ({ onOpenDemo }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Solutions', path: '/solutions' },
    { name: 'Features', path: '/features' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Industries', path: '/industries' },
    { name: 'Blog', path: '/blog' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Contact', path: '/contact' },
  ];

  const PORTAL_LOGIN_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5173/login'
    : 'https://web-based-crm-1.onrender.com/login';

  return (
    <nav className="fixed top-0 inset-x-0 z-40 h-24 border-b border-white/[0.08] bg-[#050505]/90 backdrop-blur-xl px-6 lg:px-12 flex items-center justify-between">
      <div className="flex items-center cursor-pointer py-1" onClick={() => navigate('/')}>
        <img
          src="/logo.png"
          alt="REALVION"
          className="h-20 sm:h-22 w-auto object-contain transition-transform hover:scale-105"
          style={{ maxWidth: '420px', maxHeight: '76px' }}
        />
      </div>


      <div className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-300">
        {navLinks.map((link) => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className={`transition hover:text-white ${location.pathname === link.path ? 'text-[#C8A45D] font-bold' : ''
              }`}
          >
            {link.name}
          </button>
        ))}
      </div>

      <div className="hidden lg:flex items-center gap-3">
        <a
          href={PORTAL_LOGIN_URL}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition flex items-center gap-1.5 border border-white/10"
        >
          <Lock className="h-3.5 w-3.5 text-[#C8A45D]" /> Portal Login
        </a>

        <button
          onClick={onOpenDemo}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition flex items-center gap-1.5 border border-white/10"
        >
          Watch Demo
        </button>

        <button
          onClick={() => navigate('/register')}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 shadow-lg shadow-[#C8A45D]/25 transition flex items-center gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" /> Start Free <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden text-slate-300 hover:text-white"
      >
        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {mobileMenuOpen && (
        <div className="absolute top-20 inset-x-0 bg-[#0a0a0a] border-b border-white/10 p-6 space-y-4 lg:hidden text-sm">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => {
                navigate(link.path);
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-slate-300 hover:text-[#C8A45D]"
            >
              {link.name}
            </button>
          ))}
          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            <a
              href={PORTAL_LOGIN_URL}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 rounded-xl border border-white/10 text-xs font-semibold text-slate-200 text-center"
            >
              Portal Login
            </a>

            <button
              onClick={() => {
                navigate('/register');
                setMobileMenuOpen(false);
              }}
              className="w-full py-3 rounded-xl text-xs font-bold text-black bg-[#C8A45D]"
            >
              Start Free
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
