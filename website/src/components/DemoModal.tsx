import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X, Rocket, ArrowRight, ShieldCheck, Zap, Loader2, Play, Film, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VideoPlayer } from './VideoPlayer';

export const DemoModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'video' | 'instant'>('video');
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/90 backdrop-blur-md"
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative z-10 w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0d0d0d] border border-[#C8A45D]/40 p-5 sm:p-8 text-white space-y-6 shadow-2xl shadow-[#C8A45D]/15"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#C8A45D]/10 border border-[#C8A45D]/30 flex items-center justify-center text-[#C8A45D]">
              <Film className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                REALVION Product Experience
              </h2>
              <p className="text-xs text-slate-400 font-light">Watch walkthrough recording or test live workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 max-w-md">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
              activeTab === 'video'
                ? 'bg-[#C8A45D] text-black shadow-md shadow-[#C8A45D]/30 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Play className="h-3.5 w-3.5 fill-current" /> Watch Demo Video
          </button>
          <button
            onClick={() => setActiveTab('instant')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
              activeTab === 'instant'
                ? 'bg-[#C8A45D] text-black shadow-md shadow-[#C8A45D]/30 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Rocket className="h-3.5 w-3.5" /> Interactive Sandbox
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Tab 1: Video Player */}
        {activeTab === 'video' && (
          <div className="space-y-6">
            <VideoPlayer
              src="/demo-video.mp4"
              autoPlay={true}
              title="REALVION Official CRM Platform Demo Walkthrough"
              showChapters={true}
            />

            <div className="p-4 rounded-2xl bg-[#C8A45D]/10 border border-[#C8A45D]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#C8A45D]" /> Want to test it hands-on with live data?
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Launch a pre-populated workspace with 50 test leads and voice alarms.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleLaunchInstantDemo}
                  disabled={loading}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 shadow-lg shadow-[#C8A45D]/20 transition flex items-center justify-center gap-2 text-xs"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Rocket className="h-4 w-4" /> Launch Sandbox <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Instant Workspace Launch */}
        {activeTab === 'instant' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#C8A45D]/10 border border-[#C8A45D]/20 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Zap className="h-4 w-4 text-[#C8A45D]" /> Instant Self-Onboarding
              </div>
              <p>
                Get full access to the CRM workspace preloaded with real-estate deals, client follow-ups, and developer projects:
              </p>
            </div>

            <div className="space-y-3">
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
        )}

        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>⚡ Instant Setup (0 Seconds)</span>
          <span>🎥 High Quality Demo Recording Included</span>
        </div>
      </motion.div>
    </div>
  );
};
