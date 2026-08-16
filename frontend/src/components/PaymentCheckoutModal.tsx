import React, { useState } from 'react';
import { X, ShieldCheck, Zap, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'professional' | 'enterprise'>('professional');
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const planPricing = {
    starter: { name: 'Starter CP Plan', price: 999 },
    professional: { name: 'Professional Agency Plan', price: 4999 },
    enterprise: { name: 'Enterprise Plan', price: 14999 },
  };

  const planObj = planPricing[selectedPlan];
  const basePrice = Math.round(planObj.price * (1 - appliedDiscount));
  const razorpayFee = Math.round(basePrice * 0.02); // 2% Razorpay Transaction Fee
  const total = basePrice + razorpayFee;

  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'REALVION20') {
      setAppliedDiscount(0.2); // 20% Discount
      setError(null);
    } else {
      setError('Invalid coupon code. Try REALVION20');
    }
  };

  const getApiBase = () => {
    return import.meta.env.VITE_API_URL || (
      typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:8001/api/v1'
        : 'https://web-based-crm.onrender.com/api/v1'
    );
  };

  const verifyAndActivate = async (orderId: string, paymentId: string, signature: string) => {
    const API_BASE = getApiBase();
    const token = localStorage.getItem('realvion_access_token') || localStorage.getItem('brokeros_access_token') || '';

    try {
      const verifyRes = await fetch(`${API_BASE}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.detail || 'Payment verification failed.');

      localStorage.removeItem('realvion_is_demo');
      localStorage.removeItem('brokeros_is_demo');
      setPaymentSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    setLoading(true);
    setError(null);

    const API_BASE = getApiBase();
    const userObj = JSON.parse(localStorage.getItem('realvion_user') || localStorage.getItem('brokeros_user') || '{}');

    try {
      // Step 1: Create Order
      const res = await fetch(`${API_BASE}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_code: selectedPlan,
          coupon_code: couponCode,
        }),
      });

      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.detail || 'Failed to create payment order.');

      // Step 2: Launch Official Razorpay Interactive Checkout Flow or Instant Test Mode
      const keyId = orderData.key_id;
      const isTestOrder = !keyId || keyId === 'rzp_test_placeholder' || keyId.startsWith('rzp_test_mock') || (orderData.order_id && orderData.order_id.startsWith('order_realvion_'));

      if (isTestOrder) {
        // Instant test-mode activation for local dev / testing without invalid Razorpay Key ID failure
        const mockPayId = `pay_mock_${Date.now()}`;
        const mockSig = `sig_mock_${Date.now()}`;
        await verifyAndActivate(orderData.order_id, mockPayId, mockSig);
        return;
      }

      const options = {
        key: keyId,
        amount: Math.round(total * 100),
        currency: 'INR',
        name: 'REALVION Platform',
        description: `${planObj.name} Enterprise Subscription`,
        image: '/logo.png',
        order_id: orderData.order_id,
        prefill: {
          name: user?.name || userObj.name || '',
          email: user?.email || userObj.email || '',
          contact: user?.phone || userObj.phone || '',
        },
        theme: { color: '#C8A45D' },
        handler: async function (response: any) {
          if (!response.razorpay_payment_id || !response.razorpay_signature) {
            setError('Payment completed but verification data missing.');
            setLoading(false);
            return;
          }
          await verifyAndActivate(
            response.razorpay_order_id || orderData.order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      if (typeof window !== 'undefined' && window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          setError(`Payment failed: ${response.error?.description || 'Transaction declined'}`);
          setLoading(false);
        });
        rzp.open();
      } else {
        throw new Error('Razorpay SDK not loaded. Please refresh the page.');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl p-6 md:p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-2xl space-y-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {paymentSuccess ? (
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold text-white">Payment Successful!</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your <strong>{planObj.name}</strong> subscription is now active for 1 full year. Your enterprise workspace access has been unlocked.
            </p>
            <button
              onClick={() => {
                onClose();
                window.location.reload();
              }}
              className="px-6 py-3 rounded-xl font-bold text-black bg-[#C8A45D] hover:brightness-110 shadow-lg shadow-[#C8A45D]/20"
            >
              Continue to Enterprise Workspace
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="p-2.5 rounded-xl bg-[#C8A45D]/10 text-[#C8A45D] border border-[#C8A45D]/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Activate Full Enterprise Workspace</h3>
                <p className="text-xs text-slate-400">Unlock 1-Year unlimited access to leads, team seats, & sales automation.</p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            {/* Plan Selector */}
            <div className="grid grid-cols-3 gap-3">
              {(['starter', 'professional', 'enterprise'] as const).map((code) => (
                <button
                  key={code}
                  onClick={() => setSelectedPlan(code)}
                  className={`p-3 rounded-xl border text-left transition ${
                    selectedPlan === code
                      ? 'bg-[#C8A45D]/10 border-[#C8A45D] text-white'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold capitalize">{code}</div>
                  <div className="text-sm font-extrabold text-[#C8A45D] mt-1">
                    ₹{planPricing[code].price.toLocaleString()}
                  </div>
                </button>
              ))}
            </div>

            {/* Coupon Code Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Coupon Code (e.g. REALVION20)"
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white uppercase focus:outline-none focus:border-[#C8A45D]"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 border border-slate-700 hover:bg-slate-700"
              >
                Apply
              </button>
            </div>

            {/* Invoice Breakdown */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>{planObj.name}:</span>
                <span className="font-semibold text-white">₹{basePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Razorpay Fee (2%):</span>
                <span className="font-semibold text-white">₹{razorpayFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-bold text-[#C8A45D]">
                <span>Total Amount Payable:</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handlePayNow}
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 shadow-lg shadow-[#C8A45D]/25 transition flex items-center justify-center gap-2"
            >
              <Lock className="h-4 w-4" />
              {loading ? 'Processing Payment...' : `Pay ₹${total.toLocaleString()} via Razorpay`}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
