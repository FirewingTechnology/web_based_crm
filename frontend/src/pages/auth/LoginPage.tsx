import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, LockKeyhole } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState<'admin' | 'sales'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === 'true') {
      const regEmail = params.get('email');
      if (regEmail) setEmail(regEmail);
      setSuccessMsg('🎉 Account created successfully! Please log in with your password to start your 1-Hour Free Trial.');
    }
  }, []);

  const handleTabSwitch = (type: 'admin' | 'sales') => {
    setLoginType(type);
    setError(null);
  };


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const user = await login(email, password);
      const isSuperAdmin = user.role === 'Super Admin' || (user.role as any) === 'SUPERADMIN' || user.email === 'superadmin@realvion.com';
      if (isSuperAdmin) {
        navigate('/admin/saas');
      } else if (user.role === 'Sales Executive') {
        navigate('/sales/dashboard');
      } else {
        navigate('/admin/dashboard');
      }


    } catch (err: any) {
      if (err.response?.status >= 500) {
        setError('Server error during authentication (500). Please try again or contact administrator.');
      } else if (typeof err.response?.data?.detail === 'string') {
        setError(err.response.data.detail);
      } else {
        setError('Invalid email or password credentials');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden selection:bg-[#C8A45D] selection:text-black">
      {/* Background Animated Gold Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C8A45D]/08 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/06 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C8A45D]/05 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-modal max-w-md w-full rounded-3xl p-7 sm:p-9 shadow-2xl relative z-10 border border-[#C8A45D]/15"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img
              src="/logo.png"
              alt="REALVION"
              className="w-full h-auto object-contain transition-transform hover:scale-105"
              style={{ maxHeight: '220px' }}
            />

          </div>
          <p className="text-xs text-slate-400">Authorized Portal Access & Authentication</p>
        </div>

        {/* Portal Login Type Selector */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6 text-xs">
          <button
            type="button"
            onClick={() => handleTabSwitch('admin')}
            className={`py-2.5 px-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${loginType === 'admin'
                ? 'bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 text-black shadow-md shadow-[#C8A45D]/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
          >
            <ShieldCheck className="h-4 w-4" /> Admin Login
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('sales')}
            className={`py-2.5 px-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${loginType === 'sales'
                ? 'bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 text-black shadow-md shadow-[#C8A45D]/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
          >
            <UserCheck className="h-4 w-4" /> Sales Login
          </button>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center font-medium">
            {successMsg}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-medium">
            {error}
          </div>
        )}


        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Registered Email Address"
            type="email"
            placeholder={loginType === 'admin' ? 'admin@company.com' : 'executive@company.com'}
            icon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            icon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            icon={<ArrowRight className="h-4 w-4" />}
          >
            Sign In to {loginType === 'admin' ? 'Admin' : 'Sales Executive'} Portal
          </Button>
        </form>

        {/* Provisioning Notice */}
        <div className="mt-6 pt-4 border-t border-white/[0.06] text-center">
          <p className="text-[10px] text-slate-600 flex items-center justify-center gap-1">
            <LockKeyhole className="h-3 w-3 text-slate-500 shrink-0" />
            Public self-registration is disabled. Accounts are provisioned exclusively by System Admin.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
