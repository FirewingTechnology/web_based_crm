import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

export const WebsiteFooter: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-[#040404] border-t border-white/[0.08] text-xs text-slate-400 pt-16 pb-12 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        <div className="space-y-4">
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <img
              src="/logo.png"
              alt="REALVION"
              className="h-16 w-auto object-contain"
              style={{ maxWidth: '200px' }}
            />
          </div>
          <p className="text-slate-400 text-xs font-light leading-relaxed">
            The official Real Estate Sales Operating System for Channel Partners, Brokerage Firms, and Sales Agencies.
          </p>
          <div className="pt-2 text-[11px] text-slate-500 space-y-1">
            <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#C8A45D]" /> 1st Floor, Navale Icon, Narhe Gaon, Katraj, Pune, Maharashtra</p>
            <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-[#C8A45D]" /> +91 95299 88152 / +91 89996 24212</p>
            <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-[#C8A45D]" /> firewingtechnologiesindia@gmail.com</p>
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-wider">Product & Solutions</h4>
          <ul className="space-y-2.5">
            <li><button onClick={() => navigate('/solutions')} className="hover:text-white transition">Channel Partner CRM</button></li>
            <li><button onClick={() => navigate('/solutions')} className="hover:text-white transition">Lead Management Engine</button></li>
            <li><button onClick={() => navigate('/solutions')} className="hover:text-white transition">Voice & Audio Alarms</button></li>
            <li><button onClick={() => navigate('/solutions')} className="hover:text-white transition">Builders & Projects Catalog</button></li>
            <li><button onClick={() => navigate('/solutions')} className="hover:text-white transition">Broker Commission Overrides</button></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-wider">Company & Industry</h4>
          <ul className="space-y-2.5">
            <li><button onClick={() => navigate('/about')} className="hover:text-white transition">About REALVION</button></li>
            <li><button onClick={() => navigate('/industries')} className="hover:text-white transition">For Channel Partners</button></li>
            <li><button onClick={() => navigate('/industries')} className="hover:text-white transition">For Brokerage Firms</button></li>
            <li><button onClick={() => navigate('/industries')} className="hover:text-white transition">For Real Estate Developers</button></li>
            <li><button onClick={() => navigate('/pricing')} className="hover:text-white transition">Pricing Plans</button></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-wider">Resources & Contact</h4>
          <ul className="space-y-2.5">
            <li><button onClick={() => navigate('/blog')} className="hover:text-white transition">Industry Insights & Blog</button></li>
            <li><button onClick={() => navigate('/faq')} className="hover:text-white transition">Frequently Asked Questions</button></li>
            <li><button onClick={() => navigate('/contact')} className="hover:text-white transition">Contact Sales Team</button></li>
            <li><a href="https://web-based-crm-1.onrender.com/login" target="_blank" rel="noreferrer" className="hover:text-[#C8A45D] transition">Authorized System Login</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
        <p>© 2026 REALVION Official. All rights reserved. Real Estate Sales Operating System.</p>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/faq')} className="hover:text-slate-300">Privacy Policy</button>
          <button onClick={() => navigate('/faq')} className="hover:text-slate-300">Terms of Service</button>
          <button onClick={() => navigate('/faq')} className="hover:text-slate-300">Security Specs</button>
        </div>
      </div>
    </footer>
  );
};
