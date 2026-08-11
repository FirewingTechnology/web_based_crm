import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Authentic SVG WhatsApp icon
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.14 4.162 4.093-1.073zm11.236-6.155c-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
  </svg>
);

export interface WhatsAppButtonProps {
  phone?: string;
  leadName?: string;
  repName?: string;
  customMessage?: string;
  variant?: 'icon' | 'button' | 'compact';
  className?: string;
}

export const normalizePhoneNumber = (phoneStr?: string): { raw: string; normalized: string; isValid: boolean } => {
  if (!phoneStr || !phoneStr.trim()) return { raw: '', normalized: '', isValid: false };
  let cleaned = phoneStr.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.replace(/^0+/, '');
  }
  // Standard 10-digit Indian mobile number -> prepend country code 91
  if (/^\d{10}$/.test(cleaned)) {
    cleaned = '91' + cleaned;
  }
  // Valid international format (11 to 15 digits including country code)
  const isValid = /^\d{11,15}$/.test(cleaned);
  return { raw: phoneStr, normalized: cleaned, isValid };
};

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phone,
  leadName,
  repName,
  customMessage,
  variant = 'icon',
  className = '',
}) => {
  const { user } = useAuth();
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Hide button if no phone is present
  if (!phone || !phone.trim()) {
    return null;
  }

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent parent row click events
    
    const { normalized, isValid } = normalizePhoneNumber(phone);
    
    if (!isValid) {
      setErrorToast('Invalid phone number format');
      setTimeout(() => setErrorToast(null), 3000);
      return;
    }

    const currentRep = repName || user?.name || 'Sales Representative';
    const currentLead = leadName || 'there';
    
    const messageText = customMessage || 
      `Hi ${currentLead}, this is ${currentRep} from REALVION regarding your property enquiry.`;

    const encodedText = encodeURIComponent(messageText);
    const waUrl = `https://wa.me/${normalized}?text=${encodedText}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  if (variant === 'icon') {
    return (
      <div className="relative inline-block">
        <button
          type="button"
          onClick={handleWhatsAppClick}
          title={`Chat on WhatsApp (${phone})`}
          className={`p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 hover:scale-105 transition shadow-sm ${className}`}
        >
          <WhatsAppIcon className="h-4 w-4" />
        </button>
        {errorToast && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-red-950 border border-red-500/40 text-red-300 text-[10px] rounded shadow-lg whitespace-nowrap z-50 flex items-center gap-1">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {errorToast}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="relative inline-block">
        <button
          type="button"
          onClick={handleWhatsAppClick}
          className={`px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition font-medium text-xs flex items-center gap-1.5 ${className}`}
        >
          <WhatsAppIcon className="h-3.5 w-3.5" />
          <span>WhatsApp</span>
        </button>
        {errorToast && (
          <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-red-950 border border-red-500/40 text-red-300 text-[10px] rounded shadow-lg whitespace-nowrap z-50 flex items-center gap-1">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {errorToast}
          </div>
        )}
      </div>
    );
  }

  // Full button variant
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleWhatsAppClick}
        className={`px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 hover:scale-[1.02] transition flex items-center justify-center gap-2 ${className}`}
      >
        <WhatsAppIcon className="h-4 w-4" />
        <span>Chat on WhatsApp</span>
      </button>
      {errorToast && (
        <div className="absolute top-full left-0 mt-1 px-3 py-1.5 bg-red-950 border border-red-500/40 text-red-300 text-xs rounded-lg shadow-lg z-50 flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {errorToast}
        </div>
      )}
    </div>
  );
};
