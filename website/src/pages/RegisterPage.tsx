import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Building2, CheckCircle2, ShieldCheck, ArrowRight, Sparkles, AlertCircle, Clock, Zap } from 'lucide-react';

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
    { code: 'starter', name: 'Starter', price: 1999, seats: 5 },
    { code: 'professional', name: 'Professional', price: 4999, seats: 15, popular: true },
    { code: 'enterprise', name: 'Enterprise', price: 14999, seats: 50 },
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
            Plan & Instant Launch
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Form Container */}
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-8 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xl backdrop-blur-xl"
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
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <ShieldCheck className="h-5 w-5 text-[#C8A45D]" /> Step 2: Select Plan & Launch 1-Hour Trial
            </h3>

            <div className="p-4 rounded-2xl bg-[#C8A45D]/10 border border-[#C8A45D]/30 text-xs text-slate-300 flex items-center gap-3">
              <Clock className="h-6 w-6 text-[#C8A45D] shrink-0" />
              <div>
                <span className="font-bold text-white text-sm">⏱️ 1-Hour Free Trial Guarantee</span>
                <p className="text-slate-400 mt-0.5">Your account will be valid for 1 hour from registration time. After 1 hour, upgrade to a paid plan to keep full access.</p>
              </div>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((p) => (
                <div
                  key={p.code}
                  onClick={() => setFormData({ ...formData, selectedPlan: p.code })}
                  className={`p-5 rounded-2xl border cursor-pointer transition relative ${
                    formData.selectedPlan === p.code
                      ? 'bg-[#C8A45D]/10 border-[#C8A45D] shadow-lg shadow-[#C8A45D]/15'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {p.popular && (
                    <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C8A45D] text-black uppercase">
                      Most Popular
                    </span>
                  )}
                  <h4 className="font-bold text-white text-base">{p.name}</h4>
                  <div className="text-2xl font-extrabold text-[#C8A45D] mt-2">
                    ₹{p.price.toLocaleString()} <span className="text-xs font-normal text-slate-400">/mo</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> {p.seats} User Seats Included
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-3 rounded-xl border border-white/10 text-xs font-medium text-slate-300 hover:bg-white/5 transition"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleCompleteRegistration}
                disabled={loading}
                className="py-4 px-8 rounded-xl font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 transition shadow-lg shadow-[#C8A45D]/25 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  'Launching Workspace...'
                ) : (
                  <>
                    <Zap className="h-5 w-5" /> Launch 1-Hour Free Trial Workspace <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
