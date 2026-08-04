import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';
import { PaymentCheckoutModal } from './PaymentCheckoutModal';

export const DemoBanner: React.FC = () => {
  const [isDemo, setIsDemo] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const demoFlag = localStorage.getItem('brokeros_is_demo') === 'true';
    const autoOpenPayment = localStorage.getItem('open_payment_modal') === 'true';

    setIsDemo(demoFlag);
    if (autoOpenPayment) {
      setIsModalOpen(true);
      localStorage.removeItem('open_payment_modal');
    }
  }, []);

  if (!isDemo) return null;

  return (
    <>
      <div className="w-full bg-gradient-to-r from-amber-950/80 via-[#C8A45D]/20 to-amber-950/80 border-b border-[#C8A45D]/40 px-4 py-2 text-xs text-[#C8A45D] flex items-center justify-between z-30 shadow-md">
        <div className="flex items-center gap-2 font-medium">
          <ShieldAlert className="h-4 w-4 animate-bounce text-[#C8A45D]" />
          <span>
            <strong>DEMO WORKSPACE MODE:</strong> Preloaded with 50 sample leads, projects, & analytics. Activate workspace to remove limits.
          </span>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-black bg-[#C8A45D] hover:brightness-110 shadow-sm flex items-center gap-1 shrink-0"
        >
          <Sparkles className="h-3 w-3" /> Activate Workspace <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <PaymentCheckoutModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
