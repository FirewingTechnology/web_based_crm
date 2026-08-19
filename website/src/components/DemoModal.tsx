import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  Rocket,
  ArrowRight,
  ShieldCheck,
  Zap,
  Loader2,
  Play,
  Film,
  Lock,
  User,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  Unlock,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VideoPlayer } from './VideoPlayer';
import { isUserRegistered, setRegisteredUser, getRegisteredUser, RegisteredUser } from '../utils/auth';

export const DemoModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [registered, setRegistered] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<RegisteredUser | null>(null);
  const [activeTab, setActiveTab] = useState<'video' | 'instant'>('video');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Quick Registration Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    companyType: 'Channel Partner',
  });

  useEffect(() => {
    if (isOpen) {
      const isReg = isUserRegistered();
      setRegistered(isReg);
      if (isReg) {
        setUserInfo(getRegisteredUser());
      }
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleAuthChange = () => {
      const isReg = isUserRegistered();
      setRegistered(isReg);
      if (isReg) setUserInfo(getRegisteredUser());
    };
    window.addEventListener('brokeros_auth_changed', handleAuthChange);
    return () => window.removeEventListener('brokeros_auth_changed', handleAuthChange);
  }, []);

  if (!isOpen) return null;

  const API_BASE = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8001/api/v1'
    : 'https://web-based-crm.onrender.com/api/v1';

  const PORTAL_DASHBOARD_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:5173/admin/dashboard'
    : 'https://web-based-crm-1.onrender.com/admin/dashboard';

  const handleQuickRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailTrim = formData.email.trim();
    const phoneDigits = formData.phone.replace(/\D/g, '');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.fullName.trim() || !emailTrim || !formData.phone.trim() || !formData.companyName.trim()) {
      setError('Please fill in all required fields to unlock the demo.');
      return;
    }

    if (!emailRegex.test(emailTrim)) {
      setError('Please enter a valid work email address.');
      return;
    }

    if (phoneDigits.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);

    try {
      // 1. Try to register with SaaS backend
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const res = await fetch(`${API_BASE}/saas/register-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.fullName.trim(),
          email: emailTrim,
          phone: formData.phone.trim(),
          password: 'DemoUser@123',
          company_name: formData.companyName.trim(),
          company_type: formData.companyType,
          city: 'Mumbai',
          state: 'Maharashtra',
          plan_code: 'professional',
        }),
      });

      const data = await res.json();

      // If already registered or email exists, or successful response:
      if (!res.ok) {
        // If error says account already exists, we can still unlock the demo for the returning user!
        if (data.detail && data.detail.toLowerCase().includes('already')) {
          setRegisteredUser({
            fullName: formData.fullName.trim(),
            email: emailTrim,
            phone: formData.phone.trim(),
            companyName: formData.companyName.trim(),
            companyType: formData.companyType,
            registeredAt: new Date().toISOString()
          });
          setRegistered(true);
          setSuccessMessage('Welcome back! Demo access has been unlocked.');
          setLoading(false);
          return;
        }
        throw new Error(data.detail || 'Registration failed. Please check your details.');
      }

      // Successful registration: save tokens and user
      setRegisteredUser(
        {
          fullName: formData.fullName.trim(),
          email: emailTrim,
          phone: formData.phone.trim(),
          companyName: formData.companyName.trim(),
          companyType: formData.companyType,
          registeredAt: new Date().toISOString()
        },
        data.access_token,
        data.refresh_token
      );

      setRegistered(true);
      setSuccessMessage('Registration successful! Demo video & interactive sandbox are now unlocked.');
      setLoading(false);

    } catch (err: any) {
      // Fallback: If network fails in demo mode, still store local demo registration so user is not blocked
      if (err.message && err.message.includes('Failed to fetch')) {
        setRegisteredUser({
          fullName: formData.fullName.trim(),
          email: emailTrim,
          phone: formData.phone.trim(),
          companyName: formData.companyName.trim(),
          companyType: formData.companyType,
          registeredAt: new Date().toISOString()
        });
        setRegistered(true);
        setSuccessMessage('Demo access unlocked!');
        setLoading(false);
      } else {
        setError(err.message || 'An error occurred during registration.');
        setLoading(false);
      }
    }
  };

  const handleLaunchInstantDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = getRegisteredUser();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const demoEmail = user?.email || `demo.user${randomSuffix}@realvion.com`;

      const res = await fetch(`${API_BASE}/saas/register-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: user?.fullName || 'Demo Agency Lead',
          email: demoEmail,
          phone: user?.phone || `98765${randomSuffix}`,
          password: 'DemoUser@123',
          company_name: user?.companyName || 'Realvion Instant Demo Agency',
          company_type: user?.companyType || 'Channel Partner',
          city: 'Mumbai',
          state: 'Maharashtra',
          plan_code: 'professional',
        }),
      });

      const data = await res.json();
      if (!res.ok && !data.access_token) {
        // Direct to portal if token already exists in localStorage
        if (localStorage.getItem('brokeros_access_token')) {
          onClose();
          window.location.href = PORTAL_DASHBOARD_URL;
          return;
        }
      }

      if (data.access_token) {
        localStorage.setItem('brokeros_access_token', data.access_token);
        localStorage.setItem('brokeros_refresh_token', data.refresh_token);
        localStorage.setItem('brokeros_is_demo', 'true');
        localStorage.setItem('brokeros_user', JSON.stringify(data.user || user));
      }

      onClose();
      window.location.href = PORTAL_DASHBOARD_URL;
    } catch (err: any) {
      // If token already present, redirect directly
      if (localStorage.getItem('brokeros_access_token')) {
        onClose();
        window.location.href = PORTAL_DASHBOARD_URL;
        return;
      }
      setError(err.message || 'Failed to initialize workspace.');
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
            <div className="h-10 w-10 rounded-xl bg-[#C8A45D]/10 border border-[#C8A45D]/30 flex items-center justify-center text-[#C8A45D]">
              {registered ? <Film className="h-5 w-5" /> : <Lock className="h-5 w-5 text-[#C8A45D]" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {registered ? 'REALVION Product Experience' : 'Register to Unlock Demo'}
                </h2>
                {registered ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Unlocked
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-[#C8A45D]/15 border border-[#C8A45D]/30 text-[#C8A45D] text-[10px] font-bold flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Registration Required
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-light">
                {registered
                  ? `Access granted for ${userInfo?.fullName || userInfo?.companyName || 'Registered User'}`
                  : 'Register free to access the live video walkthrough and interactive sandbox.'}
              </p>
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

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ─── SCENARIO A: NOT REGISTERED (REGISTRATION GATE) ─── */}
        {!registered ? (
          <div className="space-y-6 py-2">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#17140f] via-[#1a1710] to-[#121212] border border-[#C8A45D]/30 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Sparkles className="h-4 w-4 text-[#C8A45D]" /> Exclusive Demo Access
              </div>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                The REALVION demo video and hands-on CRM test environment are visible only to registered real estate agencies, brokers, and channel partners. Please provide your work details below to immediately unlock access.
              </p>
            </div>

            <form onSubmit={handleQuickRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-[#C8A45D]" /> Full Name <span className="text-[#C8A45D]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Sharma"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-[#151515] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C8A45D] transition"
                  />
                </div>

                {/* Work Email */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-[#C8A45D]" /> Work Email <span className="text-[#C8A45D]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rajesh@sharmarealty.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#151515] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C8A45D] transition"
                  />
                </div>

                {/* Mobile Phone */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-[#C8A45D]" /> Mobile Number (+91) <span className="text-[#C8A45D]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9820123456"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#151515] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C8A45D] transition"
                  />
                </div>

                {/* Company Name */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-[#C8A45D]" /> Agency / Brokerage Name <span className="text-[#C8A45D]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sharma Realty LLP"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full bg-[#151515] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C8A45D] transition"
                  />
                </div>
              </div>

              {/* Company Type */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-300">
                  Business Structure
                </label>
                <select
                  value={formData.companyType}
                  onChange={(e) => setFormData({ ...formData, companyType: e.target.value })}
                  className="w-full bg-[#151515] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C8A45D] transition"
                >
                  <option value="Channel Partner">Channel Partner (CP)</option>
                  <option value="Real Estate Agency">Real Estate Agency / Firm</option>
                  <option value="Brokerage Firm">Large Brokerage House</option>
                  <option value="Individual Broker">Independent Real Estate Consultant</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 shadow-lg shadow-[#C8A45D]/25 transition flex items-center justify-center gap-2 text-sm mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Registering & Unlocking Demo...
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4" /> Register & Unlock Demo Access <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#C8A45D]" /> 100% Free • No Credit Card Required
              </div>
              <button
                onClick={() => {
                  onClose();
                  navigate('/register');
                }}
                className="text-[#C8A45D] hover:underline font-medium"
              >
                Or Open Full Multi-Step Registration Wizard →
              </button>
            </div>
          </div>
        ) : (
          /* ─── SCENARIO B: REGISTERED USER (FULL DEMO UNLOCKED) ─── */
          <div className="space-y-6">
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
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Registered User Access
              </span>
              <span>🎥 High Quality Demo Recording Included</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
