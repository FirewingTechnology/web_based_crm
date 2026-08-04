import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Building2, CheckCircle2, ShieldCheck, ArrowRight, Sparkles, AlertCircle, CreditCard } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    otpCode: '',

    // Step 2
    companyName: '',
    companyType: 'Agency',
    gstNumber: '',
    website: '',
    address: '',
    city: '',
    state: '',
    employees: '1-10',

    // Step 3
    selectedPlan: 'professional', // starter, professional, enterprise
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const API_BASE = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8001/api/v1'
    : 'https://web-based-crm.onrender.com/api/v1';


  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName || !formData.email || !formData.phone || !formData.password) {
      setError('Please fill in all required personal details.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/saas/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send verification code.');

      setOtpSent(true);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otpCode) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/saas/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp_code: formData.otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Invalid verification code.');

      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const handleProceedToPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName) {
      setError('Company / Brokerage Name is required.');
      return;
    }
    setError(null);
    setStep(3);
  };

  const handleCompleteRegistration = async (isPaymentModalRequested: boolean = false) => {
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
          gst_number: formData.gstNumber,
          website: formData.website,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          employees: formData.employees,
          selected_plan_code: formData.selectedPlan,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed.');

      // Save Auth details to localStorage for seamless single sign-on
      localStorage.setItem('brokeros_access_token', data.access_token);
      localStorage.setItem('brokeros_refresh_token', data.refresh_token);
      localStorage.setItem('brokeros_is_demo', 'true');
      localStorage.setItem('brokeros_user', JSON.stringify(data.user));

      if (isPaymentModalRequested) {
        localStorage.setItem('open_payment_modal', 'true');
      }

      // Redirect to Web CRM Portal
      window.location.href = 'http://localhost:5173/admin/dashboard';
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const plans = [
    { code: 'starter', name: 'Starter', price: 1999, fee: 499 },
    { code: 'professional', name: 'Professional', price: 4999, fee: 499, popular: true },
    { code: 'enterprise', name: 'Enterprise', price: 14999, fee: 999 },
  ];

  const currentPlanObj = plans.find((p) => p.code === formData.selectedPlan) || plans[1];
  const subtotal = currentPlanObj.price;
  const platformFee = currentPlanObj.fee;
  const gst = Math.round((subtotal + platformFee) * 0.18);
  const total = subtotal + platformFee + gst;

  return (
    <div className="pt-28 pb-20 px-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#C8A45D]/10 text-[#C8A45D] border border-[#C8A45D]/20 uppercase tracking-widest inline-flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5" /> REALVION Self-Onboarding
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-4">
          Start Your Free Enterprise Trial
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Setup takes less than 2 minutes. Instant demo workspace with preloaded leads included.
        </p>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <div className={`flex items-center gap-2 text-xs font-bold ${step >= 1 ? 'text-[#C8A45D]' : 'text-slate-500'}`}>
            <span className="w-6 h-6 rounded-full bg-[#C8A45D]/20 border border-[#C8A45D] flex items-center justify-center">1</span>
            Personal Details
          </div>
          <div className="w-12 h-[1px] bg-slate-800" />
          <div className={`flex items-center gap-2 text-xs font-bold ${step >= 2 ? 'text-[#C8A45D]' : 'text-slate-500'}`}>
            <span className="w-6 h-6 rounded-full bg-[#C8A45D]/20 border border-[#C8A45D] flex items-center justify-center">2</span>
            Company & OTP
          </div>
          <div className="w-12 h-[1px] bg-slate-800" />
          <div className={`flex items-center gap-2 text-xs font-bold ${step >= 3 ? 'text-[#C8A45D]' : 'text-slate-500'}`}>
            <span className="w-6 h-6 rounded-full bg-[#C8A45D]/20 border border-[#C8A45D] flex items-center justify-center">3</span>
            Plan & Launch
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
        {/* STEP 1: Personal Details */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <User className="h-5 w-5 text-[#C8A45D]" /> Step 1: Personal Details
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

              <div className="md:col-span-2">
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
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 shadow-lg shadow-[#C8A45D]/25 transition flex items-center justify-center gap-2 mt-4"
            >
              {loading ? 'Sending Verification Code...' : 'Send Verification OTP'} <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* STEP 2: Company Details & OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleProceedToPlan} className="space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <Building2 className="h-5 w-5 text-[#C8A45D]" /> Step 2: Company Details & Email Verification
            </h3>

            {/* OTP Section */}
            <div className="p-4 rounded-xl bg-[#1e293b]/60 border border-slate-700/80 mb-4">
              <label className="block text-xs font-semibold text-[#C8A45D] mb-1">
                Enter 6-Digit Email OTP (Sent to {formData.email})
              </label>
              <div className="flex gap-3 mt-2">
                <input
                  type="text"
                  name="otpCode"
                  maxLength={6}
                  value={formData.otpCode}
                  onChange={handleChange}
                  placeholder="123456"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-center text-lg font-bold tracking-widest text-white focus:outline-none focus:border-[#C8A45D]"
                />
                <button
                  type="button"
                  onClick={handleVerifyOTP}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-[#C8A45D] hover:brightness-110"
                >
                  Verify Code
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Company Type *</label>
                <select
                  name="companyType"
                  value={formData.companyType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#C8A45D]"
                >
                  <option value="Broker">Independent Broker</option>
                  <option value="Channel Partner">Channel Partner (CP)</option>
                  <option value="Agency">Real Estate Agency</option>
                  <option value="Builder">Real Estate Builder</option>
                  <option value="Developer">Property Developer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">GST Number (Optional)</label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  placeholder="27AAAAA0000A1Z5"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#C8A45D]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Mumbai"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#C8A45D]"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3.5 rounded-xl font-semibold text-slate-300 border border-white/10 hover:bg-white/5"
              >
                Back
              </button>
              <button
                type="submit"
                className="w-2/3 py-3.5 rounded-xl font-bold text-black bg-[#C8A45D] hover:brightness-110 flex items-center justify-center gap-2"
              >
                Continue to Plan Selection <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Plan Selection & Instant Launch */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <ShieldCheck className="h-5 w-5 text-[#C8A45D]" /> Step 3: Choose Plan & Launch Demo Workspace
            </h3>

            {/* Plan Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((p) => (
                <div
                  key={p.code}
                  onClick={() => setFormData({ ...formData, selectedPlan: p.code })}
                  className={`p-4 rounded-xl cursor-pointer border transition relative ${
                    formData.selectedPlan === p.code
                      ? 'bg-[#C8A45D]/10 border-[#C8A45D]'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {p.popular && (
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C8A45D] text-black">
                      POPULAR
                    </span>
                  )}
                  <h4 className="font-bold text-white text-sm">{p.name}</h4>
                  <div className="text-xl font-extrabold text-[#C8A45D] mt-2">
                    ₹{p.price.toLocaleString()} <span className="text-xs font-normal text-slate-400">/mo</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Summary Breakdown */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Selected Plan ({currentPlanObj.name}):</span>
                <span className="font-semibold text-white">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Setup Fee:</span>
                <span className="font-semibold text-white">₹{platformFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%):</span>
                <span className="font-semibold text-white">₹{gst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-bold text-[#C8A45D]">
                <span>Total Payment:</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                type="button"
                onClick={() => handleCompleteRegistration(false)}
                disabled={loading}
                className="flex-1 py-4 rounded-xl font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 shadow-lg shadow-[#C8A45D]/25 transition flex items-center justify-center gap-2"
              >
                {loading ? 'Setting Up Workspace...' : '🚀 Launch Free Demo Workspace'}
              </button>

              <button
                type="button"
                onClick={() => handleCompleteRegistration(true)}
                disabled={loading}
                className="flex-1 py-4 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition flex items-center justify-center gap-2"
              >
                <CreditCard className="h-4 w-4 text-[#C8A45D]" /> Pay Now & Unlock Full License
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
