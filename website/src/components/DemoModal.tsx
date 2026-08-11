import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X, Rocket, ArrowRight, ShieldCheck, Zap, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DemoModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const API_BASE = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8001/api/v1'
    : 'https://web-based-crm.onrender.com/api/v1';

  const PORTAL_DASHBOARD_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:5173/admin/dashboard'
    : 'https://web-based-crm-1.onrender.com/admin/dashboard';

  const handleLaunchInstantDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const demoEmail = `demo.user${randomSuffix}@realvion.com`;

      const res = await fetch(`${API_BASE}/saas/register-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: 'Demo Agency Lead',
          email: demoEmail,
          phone: `98765${randomSuffix}`,
          password: 'DemoUser@123',
          company_name: 'Realvion Instant Demo Agency',
          company_type: 'Channel Partner',
          gst_number: '27AAAAA0000A1Z5',
          city: 'Mumbai',
          state: 'Maharashtra',
          plan_code: 'professional',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to initialize instant demo.');

      // Single Sign-on to Portal
      localStorage.setItem('brokeros_access_token', data.access_token);
      localStorage.setItem('brokeros_refresh_token', data.refresh_token);
      localStorage.setItem('brokeros_is_demo', 'true');
      localStorage.setItem('brokeros_user', JSON.stringify(data.user));

      onClose();
      window.location.href = PORTAL_DASHBOARD_URL;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative z-10 w-full max-w-lg rounded-3xl bg-[#0e0e0e] border border-[#C8A45D]/30 p-6 sm:p-8 text-white space-y-6 shadow-2xl shadow-[#C8A45D]/10"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5 text-[#C8A45D] font-bold text-base">
            <Sparkles className="h-5 w-5" /> Launch REALVION Workspace
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#C8A45D]/10 border border-[#C8A45D]/20 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Zap className="h-4 w-4 text-[#C8A45D]" /> Instant Self-Onboarding
            </div>
            <p>
              Choose how you want to get started with REALVION:
            </p>
          </div>

          <div className="space-y-3">
            {/* Button 1: Instant Launch into Pre-populated Demo Workspace */}
            <button
              onClick={handleLaunchInstantDemo}
              disabled={loading}
              className="w-full py-4 rounded-2xl font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 transition shadow-lg shadow-[#C8A45D]/25 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Provisioning Demo Workspace...
                </>
              ) : (
                <>
                  <Rocket className="h-5 w-5" /> Launch Instant Demo Workspace <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Button 2: Full Multi-Step Registration Wizard */}
            <button
              onClick={() => {
                onClose();
                navigate('/register');
              }}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition text-xs flex items-center justify-center gap-2"
            >
              <ShieldCheck className="h-4 w-4 text-[#C8A45D]" /> Create New Agency Account & Activate Plan
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>⚡ Instant Setup (0 Seconds)</span>
          <span>💳 Razorpay Webhook Powered</span>
        </div>
      </motion.div>
    </div>
  );
};
