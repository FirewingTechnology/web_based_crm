import React, { useState } from 'react';
import { Mail, Phone, MapPin, Sparkles, Send, CheckCircle2 } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="bg-[#050505] text-slate-100 min-h-screen pt-32 pb-24 px-6 lg:px-12 selection:bg-[#C8A45D] selection:text-black">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">Get In Touch</span>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
            Connect With Our Real Estate Product Team
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 text-left">
          <div className="lg:col-span-5 space-y-8">
            <div className="p-8 rounded-3xl bg-[#101010] border border-white/[0.08] space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#C8A45D]" /> Headquarters & Operations
              </h3>

              <div className="space-y-4 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#C8A45D] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">BrokerOS Technologies Pvt. Ltd.</p>
                    <p className="text-slate-400 font-light">DLF Cyber City, Tower 10B, 8th Floor, Sector 24, Gurugram, Haryana 122002, India</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-[#C8A45D] shrink-0" />
                  <div>
                    <p className="font-bold text-white">Sales & VIP Demos</p>
                    <p className="text-slate-400 font-light">+91 98100 00000 / +91 98765 43210</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-[#C8A45D] shrink-0" />
                  <div>
                    <p className="font-bold text-white">Official Email</p>
                    <p className="text-slate-400 font-light">contact@brokeros.com / sales@brokeros.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 p-8 rounded-3xl bg-[#101010] border border-white/[0.08]">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                <h3 className="text-xl font-bold text-white">Message Sent Successfully!</h3>
                <p className="text-xs text-slate-400 font-light">Our senior product executive will get back to you within 30 minutes.</p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
                className="space-y-4 text-xs"
              >
                <h3 className="text-lg font-bold text-white mb-2">Send Us a Direct Inquiry</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Your Full Name *</label>
                    <input required placeholder="Rajiv Mehra" className="w-full rounded-xl px-3.5 py-2.5 bg-slate-900 border border-slate-800 text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Phone Number *</label>
                    <input required placeholder="+91 98100 00000" className="w-full rounded-xl px-3.5 py-2.5 bg-slate-900 border border-slate-800 text-white" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Firm / Brokerage Name *</label>
                  <input required placeholder="Apex Channel Partners" className="w-full rounded-xl px-3.5 py-2.5 bg-slate-900 border border-slate-800 text-white" />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Message / Requirement *</label>
                  <textarea required rows={4} placeholder="Describe your sales team size and current workflow..." className="w-full rounded-xl px-3.5 py-2.5 bg-slate-900 border border-slate-800 text-white" />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 transition flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" /> Send Direct Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
