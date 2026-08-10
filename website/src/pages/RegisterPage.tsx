import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Building2, CheckCircle2, ShieldCheck, ArrowRight, Sparkles, AlertCircle, Clock, Zap, CreditCard, Lock, Check, ShieldAlert, LogIn, X } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    companyType: 'Real Estate Agency',
    city: 'Mumbai',
    selectedPlan: 'professional',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const API_BASE = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8001/api/v1'
    : 'https://web-based-crm.onrender.com/api/v1';

  const handleProceedToPlan = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName || !formData.email || !formData.phone || !formData.password || !formData.companyName) {
      setError('Please fill in all required account and company details.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setStep(2);
  };

  const handleCompleteRegistration = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/saas/register-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          company_name: formData.companyName,
          company_type: formData.companyType,
          city: formData.city,
          plan_code: formData.selectedPlan,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to create workspace.');

      const PORTAL_LOGIN_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? `http://localhost:5173/login?registered=true&email=${encodeURIComponent(formData.email)}`
        : `https://web-based-crm-1.onrender.com/login?registered=true&email=${encodeURIComponent(formData.email)}`;

      window.location.href = PORTAL_LOGIN_URL;

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const plans = [
    { code: 'starter', name: 'Starter CP', price: 999, seats: 3, desc: 'Solo agents & small teams' },
    { code: 'professional', name: 'Professional Agency', price: 4999, seats: 15, popular: true, desc: 'Growing brokerage firms' },
    { code: 'enterprise', name: 'Enterprise', price: 14999, seats: 50, desc: 'Large CPs & enterprise teams' },
  ];


  return (
    <div className="pt-28 pb-20 px-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-[#C8A45D]/10 text-[#C8A45D] border border-[#C8A45D]/20 uppercase tracking-widest inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> Instant Account Activation
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-4">
          Start Your 1-Hour Free Enterprise Trial
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Setup takes less than 60 seconds. Instant workspace with 50 preloaded sample leads included.
        </p>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <div className={`flex items-center gap-2 text-xs font-bold ${step >= 1 ? 'text-[#C8A45D]' : 'text-slate-500'}`}>
            <span className="w-6 h-6 rounded-full bg-[#C8A45D]/20 border border-[#C8A45D] flex items-center justify-center">1</span>
            Account & Agency Details
          </div>
          <div className="w-12 h-[1px] bg-slate-800" />
          <div className={`flex items-center gap-2 text-xs font-bold ${step >= 2 ? 'text-[#C8A45D]' : 'text-slate-500'}`}>
            <span className="w-6 h-6 rounded-full bg-[#C8A45D]/20 border border-[#C8A45D] flex items-center justify-center">2</span>
            Select Free Trial Tier (₹0 Today)
          </div>
        </div>
      </div>

      {/* Interactive Security & Notice Popup Modal */}
      <AnimatePresence>
        {error && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setError(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative z-10 w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#0d0d0d] border border-[#C8A45D]/40 shadow-2xl shadow-[#C8A45D]/15 text-center space-y-5"
            >
              <button
                onClick={() => setError(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Glowing Icon Container */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-red-500/20 to-amber-400/10 border border-[#C8A45D]/30 flex items-center justify-center mx-auto text-[#C8A45D] shadow-lg shadow-[#C8A45D]/20">
                <ShieldAlert className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C8A45D] bg-[#C8A45D]/10 px-3 py-1 rounded-full border border-[#C8A45D]/20">
                  Security & Trial Notice
                </span>
                <h3 className="text-xl font-extrabold text-white">Registration Restricted</h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto bg-black/40 p-3.5 rounded-xl border border-white/5">
                  {error}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2.5">
                {(error.toLowerCase().includes('log in') || error.toLowerCase().includes('already exists') || error.toLowerCase().includes('already been created') || error.toLowerCase().includes('claimed')) ? (
                  <a
                    href={typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                      ? `http://localhost:5173/login?email=${encodeURIComponent(formData.email)}`
                      : `https://web-based-crm-1.onrender.com/login?email=${encodeURIComponent(formData.email)}`}
                    className="w-full py-3.5 px-6 rounded-xl font-extrabold text-black bg-gradient-to-r from-amber-400 via-[#C8A45D] to-yellow-500 hover:brightness-110 transition shadow-lg shadow-[#C8A45D]/25 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                  >
                    <LogIn className="h-4 w-4" /> Log In to Existing Account <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                ) : null}

                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="w-full py-3 px-6 rounded-xl border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition"
                >
                  Modify Form Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Form Container */}
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-6 md:p-8 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xl backdrop-blur-xl"
      >
        {/* STEP 1: Account & Company Details */}
        {step === 1 && (
          <form onSubmit={handleProceedToPlan} className="space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <User className="h-5 w-5 text-[#C8A45D]" /> Step 1: Account & Agency Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh Kumar"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#C8A45D]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Work Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ramesh@agency.com"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#C8A45D]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#C8A45D]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Company / Agency Name *</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Apex Real Estate Advisory"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#C8A45D]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#C8A45D]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#C8A45D]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 mt-6 rounded-xl font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 transition flex items-center justify-center gap-2 shadow-lg shadow-[#C8A45D]/20 text-sm"
            >
              Continue to Plan Selection <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* STEP 2: Select Plan & Launch 1-Hour Free Trial */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#C8A45D]" /> Step 2: Select Plan Tier to Test
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Choose which features to test during your 1-hour trial. <span className="text-emerald-400 font-semibold">You pay ₹0 today.</span>
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shrink-0 self-start sm:self-auto">
                <Lock className="h-3.5 w-3.5" /> No Credit Card Required
              </div>
            </div>

            {/* Top Reassurance Guarantee Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-amber-950/30 border border-emerald-500/30 text-xs text-slate-300 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="px-2.5 py-0.5 rounded bg-emerald-500 text-black text-[11px] font-black uppercase tracking-wide">
                    100% FREE TRIAL
                  </span>
                  <span>1-Hour Workspace Guarantee</span>
                </div>
                <span className="text-emerald-400 font-extrabold text-xs sm:text-sm bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                  ₹0.00 DUE TODAY
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                Your free 1-hour trial starts immediately upon launch. Test all premium CRM capabilities & 50 preloaded leads without any payment or credit card.
              </p>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((p) => {
                const isSelected = formData.selectedPlan === p.code;
                return (
                  <div
                    key={p.code}
                    onClick={() => setFormData({ ...formData, selectedPlan: p.code })}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-b from-[#C8A45D]/15 to-slate-900/90 border-[#C8A45D] shadow-xl shadow-[#C8A45D]/20 ring-1 ring-[#C8A45D]'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                    }`}
                  >
                    {p.popular && (
                      <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C8A45D] text-black uppercase tracking-wider shadow">
                        Most Popular
                      </span>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-base">{p.name}</h4>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40">
                            SELECTED
                          </span>
                        )}
                      </div>

                      {/* Explicit ₹0 Trial Box */}
                      <div className="bg-black/50 p-3 rounded-xl border border-white/10 space-y-1">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Trial Cost:</span>
                          <span className="text-lg font-black text-emerald-400">₹0 TODAY</span>
                        </div>
                        <div className="flex items-baseline justify-between border-t border-white/10 pt-1 text-[11px]">
                          <span className="text-slate-400">If Upgraded Later:</span>
                          <span className="text-slate-300 font-bold">₹{p.price.toLocaleString()}/mo</span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1 text-xs text-slate-300">
                        <div className="flex items-center gap-1.5 text-white font-medium">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span>{p.seats} User Seats Included</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span>1-Hour Unrestricted Trial</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span>No Credit Card Needed</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-white/10 text-center">
                      <span
                        className={`text-xs font-bold inline-block px-3 py-1 rounded-lg w-full ${
                          isSelected
                            ? 'bg-[#C8A45D] text-black shadow-md'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isSelected ? '✓ Selected for Free Trial' : 'Select Plan Tier'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Guarantee Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5 text-slate-300">
                <CreditCard className="h-4 w-4 text-emerald-400 shrink-0" />
                <span><strong>No Credit Card:</strong> Zero upfront payment or card details required.</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5 text-slate-300">
                <Zap className="h-4 w-4 text-amber-400 shrink-0" />
                <span><strong>Instant Setup:</strong> Your workspace provisions in under 30 seconds.</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5 text-slate-300">
                <Clock className="h-4 w-4 text-blue-400 shrink-0" />
                <span><strong>No Auto-Renew:</strong> Trial ends automatically after 60 minutes.</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-white/10 text-xs font-medium text-slate-300 hover:bg-white/5 transition"
              >
                ← Back
              </button>

              <div className="w-full sm:w-auto text-right space-y-1">
                <button
                  type="button"
                  onClick={handleCompleteRegistration}
                  disabled={loading}
                  className="w-full sm:w-auto py-4 px-8 rounded-xl font-extrabold text-black bg-gradient-to-r from-emerald-400 via-amber-400 to-[#C8A45D] hover:brightness-110 transition shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
                >
                  {loading ? (
                    'Provisioning Workspace...'
                  ) : (
                    <>
                      <Zap className="h-5 w-5 fill-black" /> Launch 1-Hour Free Trial (₹0) <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-slate-400 text-center sm:text-right">
                  🔒 100% Free • No Credit Card Required Today
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

