import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, CheckCircle2 } from 'lucide-react';

export const DemoModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative z-10 w-full max-w-md rounded-3xl bg-[#0e0e0e] border border-white/10 p-6 sm:p-8 text-white space-y-6 shadow-2xl"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-[#C8A45D] font-bold text-sm">
              <Sparkles className="h-5 w-5" /> Request Live BrokerOS Demo
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Demo Request Confirmed!</h3>
              <p className="text-xs text-slate-400">Our senior real estate product specialist will contact you within 15 minutes.</p>
              <button onClick={onClose} className="w-full py-3 rounded-xl mt-4 bg-[#C8A45D] text-black font-bold">
                Done
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Your Name *</label>
                <input required placeholder="e.g. Vikram Malhotra" className="w-full rounded-xl px-3.5 py-2.5 bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#C8A45D]" />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Firm / Company Name *</label>
                <input required placeholder="e.g. Apex Realty Channel Partners" className="w-full rounded-xl px-3.5 py-2.5 bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#C8A45D]" />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Phone Number *</label>
                <input required placeholder="+91 98765 43210" className="w-full rounded-xl px-3.5 py-2.5 bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#C8A45D]" />
              </div>

              <button type="submit" className="w-full py-3.5 rounded-xl font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 transition shadow-lg shadow-[#C8A45D]/20">
                Schedule Personal Demo
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
