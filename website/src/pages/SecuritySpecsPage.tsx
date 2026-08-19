import React from 'react';
import { ShieldCheck, Lock, Key, Server, Cpu, Database, CheckCircle, RefreshCw } from 'lucide-react';

export const SecuritySpecsPage: React.FC = () => {
  const securityFeatures = [
    {
      icon: <Lock className="h-6 w-6 text-[#C8A45D]" />,
      title: "256-bit TLS/SSL Transit Encryption",
      desc: "All web traffic between your browser, CRM dashboard, and backend APIs is protected by end-to-end TLS 1.3 encryption."
    },
    {
      icon: <Key className="h-6 w-6 text-[#C8A45D]" />,
      title: "JWT & Salted Cryptographic Hashing",
      desc: "User passwords and system credentials are encrypted using industry-standard bcrypt with high cost factors."
    },
    {
      icon: <Database className="h-6 w-6 text-[#C8A45D]" />,
      title: "Tenant-Isolated Multi-Tenancy",
      desc: "Strict database foreign-key tenant scoping prevents cross-organization data access across all tables."
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-[#C8A45D]" />,
      title: "Role-Based Access Control (RBAC)",
      desc: "Granular permissions ensure Sales Executives only view their assigned agenda, while Admins view organizational audits."
    },
    {
      icon: <Server className="h-6 w-6 text-[#C8A45D]" />,
      title: "Automated Daily Redundant Backups",
      desc: "Encrypted daily snapshots with point-in-time recovery to safeguard against any data loss or infrastructure outages."
    },
    {
      icon: <Cpu className="h-6 w-6 text-[#C8A45D]" />,
      title: "PCI-DSS Level 1 Payment Gateway",
      desc: "Payment processing is offloaded to Razorpay's PCI-DSS compliant infrastructure. REALVION does not store raw credit card credentials."
    }
  ];

  return (
    <div className="bg-[#050505] text-slate-100 min-h-screen pt-36 pb-24 px-6 lg:px-12 selection:bg-[#C8A45D] selection:text-black">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4 border-b border-white/10 pb-8 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C8A45D]/10 border border-[#C8A45D]/30 text-[#C8A45D] text-xs font-semibold">
            <ShieldCheck className="h-4 w-4" /> Enterprise Security Standards
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Security & Architecture Specs
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-light leading-relaxed">
            REALVION is built with institutional-grade cybersecurity to protect your valuable real estate buyer leads, broker commissions, and financial metrics.
          </p>
        </div>

        {/* Security Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityFeatures.map((f, idx) => (
            <div key={idx} className="p-6 rounded-3xl bg-[#0e0e0e] border border-white/[0.08] hover:border-[#C8A45D]/40 transition space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-[#C8A45D]/10 border border-[#C8A45D]/20 flex items-center justify-center">
                {f.icon}
              </div>
              <h3 className="text-base font-bold text-white">{f.title}</h3>
              <p className="text-xs text-slate-400 font-light leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Compliance Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#101010] via-[#14120a] to-[#101010] border border-[#C8A45D]/30 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-[#C8A45D]" /> Strict Lead Privacy Commitment
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
            Your client phone numbers, buyer budgets, and lead notes are exclusively yours. REALVION does not aggregate, scrape, or sell broker lead pipelines. Every agency workspace operates in an isolated environment with cryptographic access controls.
          </p>
        </div>
      </div>
    </div>
  );
};
