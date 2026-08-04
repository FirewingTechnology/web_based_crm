import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ShieldAlert, Clock, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PaymentCheckoutModal } from './PaymentCheckoutModal';

export const DemoBanner: React.FC = () => {
  const { user } = useAuth();
  const [secondsLeft, setSecondsLeft] = useState<number>(user?.trial_seconds_remaining ?? 3600);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (user?.is_trial_expired) {
      setIsExpired(true);
      setSecondsLeft(0);
      return;
    }

    if (user?.trial_seconds_remaining !== undefined && user?.trial_seconds_remaining > 0) {
      setSecondsLeft(user.trial_seconds_remaining);
      setIsExpired(false);
    }
  }, [user]);


  useEffect(() => {
    if (secondsLeft <= 0) {
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <>
      {/* Real-time Top Trial Banner */}
      <div className={`w-full border-b px-4 py-2 text-xs flex items-center justify-between z-30 shadow-md transition-colors ${
        isExpired
          ? 'bg-red-950/90 border-red-500/40 text-red-300'
          : 'bg-gradient-to-r from-amber-950/90 via-[#C8A45D]/20 to-amber-950/90 border-[#C8A45D]/40 text-[#C8A45D]'
      }`}>
        <div className="flex items-center gap-2 font-medium">
          {isExpired ? (
            <>
              <Lock className="h-4 w-4 text-red-400 shrink-0" />
              <span className="font-bold text-white">
                🚨 1-HOUR TRIAL EXPIRED: Your workspace trial has ended. Upgrade to keep full access.
              </span>
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 animate-pulse text-[#C8A45D] shrink-0" />
              <span>
                <strong>1-HOUR FREE TRIAL:</strong> Expires in <span className="font-mono font-bold text-white text-sm bg-black/40 px-2 py-0.5 rounded border border-[#C8A45D]/30">{formatTime(secondsLeft)}</span>
              </span>
            </>
          )}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1 shrink-0 ${
            isExpired
              ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white hover:brightness-110 animate-pulse'
              : 'bg-[#C8A45D] text-black hover:brightness-110'
          }`}
        >
          <Sparkles className="h-3 w-3" /> Upgrade to Paid Version Now <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* Trial Expired Lockout Popup Modal */}
      {isExpired && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="max-w-md w-full rounded-3xl bg-[#0e0e0e] border border-red-500/40 p-6 sm:p-8 text-center space-y-5 shadow-2xl shadow-red-500/20">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
              <Lock className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white">1-Hour Free Trial Has Expired!</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your 1-hour real-time trial for <span className="text-[#C8A45D] font-bold">{user?.firm_name || 'REALVION Workspace'}</span> has reached its time limit. 
                Please upgrade to a paid version to restore access to your leads, phone, email, and sales tools.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 text-left space-y-1">
              <p className="font-bold text-white">🔒 Locked Features:</p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
                <li>Lead Management & Exporting</li>
                <li>WhatsApp & SMS Followup Triggers</li>
                <li>Broker & Sales Executive Allocation</li>
              </ul>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-4 rounded-2xl font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 transition shadow-lg shadow-[#C8A45D]/25 flex items-center justify-center gap-2 text-sm"
            >
              <Sparkles className="h-5 w-5" /> Upgrade to Paid Version Now <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <PaymentCheckoutModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
