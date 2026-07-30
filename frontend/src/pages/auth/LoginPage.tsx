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
  const [isLoading, setIsLoading] = useState(false);

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
      if (user.role === 'Admin' || user.role === 'Manager') {
        navigate('/admin/dashboard');
      } else {
        navigate('/sales/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animated Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-modal max-w-md w-full rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 border border-slate-800"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-blue-500/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">BrokerOS CRM</h1>
          <p className="text-xs text-slate-400 mt-1">Authorized Portal Access & Authentication</p>
        </div>

        {/* Portal Login Type Selector */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800 mb-6 text-xs">
          <button
            type="button"
            onClick={() => handleTabSwitch('admin')}
            className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
              loginType === 'admin'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="h-4 w-4" /> Admin Login
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('sales')}
            className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
              loginType === 'sales'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="h-4 w-4" /> Sales Login
          </button>
        </div>

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
        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
            <LockKeyhole className="h-3 w-3 text-slate-400 shrink-0" />
            Public self-registration is disabled. Accounts are provisioned exclusively by System Admin.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
