import React from 'react';
import { ShieldCheck, Lock, Eye, FileText, Database, Server, RefreshCw } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="bg-[#050505] text-slate-100 min-h-screen pt-36 pb-24 px-6 lg:px-12 selection:bg-[#C8A45D] selection:text-black">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4 border-b border-white/10 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C8A45D]/10 border border-[#C8A45D]/30 text-[#C8A45D] text-xs font-semibold">
            <ShieldCheck className="h-4 w-4" /> Official Legal Notice
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-light">
            Last Updated: August 19, 2026 • REALVION Real Estate Operating System
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Eye className="h-5 w-5 text-[#C8A45D]" /> 1. Overview & Scope
            </h2>
            <p>
              REALVION ("we", "our", or "the Platform") values the privacy of Real Estate Channel Partners, Brokerage Firms, Sales Executives, and their client leads. This Privacy Policy describes how we collect, safeguard, process, and handle organizational information and customer contact details when using our web-based CRM and SaaS applications.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-[#C8A45D]" /> 2. Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li><strong className="text-white">Account & Organization Details:</strong> Company/Agency name, RERA registration number, GST identifier, official work email addresses, and phone numbers.</li>
              <li><strong className="text-white">Lead & Client Data:</strong> Customer names, phone numbers, email addresses, property budgets in Lakhs/Crores, preferred project locations, and callback agendas entered by authorized sales personnel.</li>
              <li><strong className="text-white">Activity & Call Logs:</strong> Follow-up schedules, timestamped notes, voice reminder history, and lead stage progressions.</li>
              <li><strong className="text-white">Billing Information:</strong> Subscription tier, invoice history, and transaction references processed securely via Razorpay PCI-DSS compliant gateways.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="h-5 w-5 text-[#C8A45D]" /> 3. Data Isolation & Tenant Ownership
            </h2>
            <p>
              Every Real Estate Channel Partner workspace in REALVION is strictly multi-tenant isolated. Your leads, customer phone numbers, commissions, and revenue analytics are strictly owned by your organization. REALVION does not sell, rent, monetize, or cross-share your proprietary lead records with third-party advertisers or competing brokers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Server className="h-5 w-5 text-[#C8A45D]" /> 4. Security & Encryption
            </h2>
            <p>
              All communication between your browser and REALVION servers is encrypted using 256-bit TLS/SSL encryption. Sensitive credentials, passwords, and tokens are stored using industry-standard bcrypt and salted cryptographic hashes. Automated backups are executed daily across redundant secure data centers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-[#C8A45D]" /> 5. Data Retention & Deletion
            </h2>
            <p>
              Your CRM data is retained for the duration of your active subscription. You can export complete lead records and activity logs in CSV format at any time. Upon formal request for account termination, tenant records are permanently purged within 30 business days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#C8A45D]" /> 6. Contact & Data Protection Inquiries
            </h2>
            <p>
              For questions regarding this policy, data protection, or audit disclosures, contact our Compliance Office:
            </p>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1 text-slate-300">
              <p className="font-semibold text-white">REALVION Legal & Compliance Support</p>
              <p>Email: firewingtechnologiesindia@gmail.com</p>
              <p>Phone: +91 95299 88152 / +91 89996 24212</p>
              <p>Location: 1st Floor, Navale Icon, Narhe Gaon, Katraj, Pune, Maharashtra 411046</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
