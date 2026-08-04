import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X, Rocket, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DemoModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLaunchInstantDemo = async () => {
    onClose();
    navigate('/register');
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

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#C8A45D]/10 border border-[#C8A45D]/20 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Zap className="h-4 w-4 text-[#C8A45D]" /> Instant Self-Onboarding
            </div>
            <p>
              Experience REALVION with pre-configured sample leads, developer catalogs, follow-ups, and sales executive target engines. No manual waiting required!
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                onClose();
                navigate('/register');
              }}
              className="w-full py-4 rounded-2xl font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 transition shadow-lg shadow-[#C8A45D]/25 flex items-center justify-center gap-2 text-sm"
            >
              <Rocket className="h-5 w-5" /> Launch Free Demo Workspace <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                onClose();
                navigate('/register');
              }}
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
