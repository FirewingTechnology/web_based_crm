import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ShieldAlert, Clock, Lock, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PaymentCheckoutModal } from './PaymentCheckoutModal';

export const DemoBanner: React.FC = () => {
  const { user, logout } = useAuth();

  const isSuperAdmin = user?.role === 'Super Admin' || (user?.role as any) === 'SUPERADMIN' || user?.email === 'superadmin@realvion.com';

  if (isSuperAdmin) {
    return null;
  }

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
    if (totalSeconds >= 86400) {
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      return `${days}d ${hours}h`;
    }
    if (totalSeconds >= 3600) {
      const hours = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      return `${hours}h ${mins}m`;
    }
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
                🚨 1-HOUR FREE TRIAL COMPLETED: Your workspace trial has ended. Your data is safely saved in the database. Upgrade to restore full access.
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
          <Sparkles className="h-3 w-3" /> Upgrade / Renew Subscription <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* Trial Expired Lockout Popup Modal */}
      {isExpired && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="max-w-md w-full rounded-3xl bg-[#0e0e0e] border border-amber-500/40 p-6 sm:p-8 text-center space-y-5 shadow-2xl shadow-amber-500/10">
            <div className="w-16 h-16 rounded-full bg-[#C8A45D]/20 border border-[#C8A45D]/40 flex items-center justify-center mx-auto text-[#C8A45D]">
              <Lock className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white">1-Hour Free Trial is Completed</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your 1-hour free trial period for <span className="text-[#C8A45D] font-bold">{user?.firm_name || 'REALVION Workspace'}</span> has completed.
              </p>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                ✅ <strong>Your data is 100% safe:</strong> All your leads, team members, bookings, and pipeline data are securely saved in our database and will never be deleted.
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-300 text-left space-y-1.5">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#C8A45D]" /> Upgrade now to unlock:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                <li>Unrestricted Lead Management & Exporting</li>
                <li>WhatsApp & SMS Followup Automation</li>
                <li>Full Sales Executive & Broker Team Access</li>
                <li>Continuous Cloud Sync & 24/7 Priority Support</li>
              </ul>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-4 rounded-2xl font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 transition shadow-lg shadow-[#C8A45D]/25 flex items-center justify-center gap-2 text-sm"
              >
                <Sparkles className="h-5 w-5" /> Upgrade / Activate Subscription Now <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={logout}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 transition flex items-center justify-center gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out / Switch Account
              </button>
            </div>
          </div>
        </div>
      )}

      <PaymentCheckoutModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
