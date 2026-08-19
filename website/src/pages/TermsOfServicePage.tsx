import React from 'react';
import { FileCheck, Shield, CheckCircle2, AlertTriangle, Scale, CreditCard } from 'lucide-react';

export const TermsOfServicePage: React.FC = () => {
  return (
    <div className="bg-[#050505] text-slate-100 min-h-screen pt-36 pb-24 px-6 lg:px-12 selection:bg-[#C8A45D] selection:text-black">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4 border-b border-white/10 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C8A45D]/10 border border-[#C8A45D]/30 text-[#C8A45D] text-xs font-semibold">
            <FileCheck className="h-4 w-4" /> Terms of Agreement
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-light">
            Effective Date: August 19, 2026 • REALVION Platform Agreement
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Scale className="h-5 w-5 text-[#C8A45D]" /> 1. Acceptance of Terms
            </h2>
            <p>
              By accessing, registering an agency account, or utilizing the REALVION real estate sales operating system, you agree to be bound by these Terms of Service. If you are registering on behalf of a Channel Partner agency, firm, or brokerage entity, you represent that you possess the authority to bind such entity.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#C8A45D]" /> 2. SaaS Subscriptions & User Licenses
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li><strong className="text-white">Account Responsibility:</strong> Account administrators are responsible for managing assigned executive logins and maintaining credential confidentiality.</li>
              <li><strong className="text-white">Role-Based Scope:</strong> Access to leads, builder inventories, and revenue statistics is strictly governed by the roles (Agency Admin, Sales Executive, Broker Partner) provisioned by the agency owner.</li>
              <li><strong className="text-white">Fair Usage:</strong> The platform is designed specifically for legitimate real estate brokerage, lead follow-ups, and sales target tracking.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#C8A45D]" /> 3. Billing, Renewals & Cancellation
            </h2>
            <p>
              REALVION SaaS subscriptions are billed on a monthly or annual cycle. Payments are securely processed via Razorpay. Subscriptions automatically renew unless cancelled by the agency administrator prior to the billing cycle end date. Refunds for partial billing periods are subject to our commercial refund schedule.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#C8A45D]" /> 4. Service Level & Uptime
            </h2>
            <p>
              We strive to deliver 99.9% uptime across all production CRM microservices, text-to-speech reminder engines, and API endpoints. Scheduled maintenance windows with prior notification are conducted outside peak real estate sales hours.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#C8A45D]" /> 5. Limitation of Liability & RERA Compliance
            </h2>
            <p>
              REALVION serves as a software sales management operating system. Channel partners are solely responsible for ensuring the accuracy of property details, builder RERA compliance registrations, and client communications inputted into their workspace.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-[#C8A45D]" /> 6. Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any legal disputes arising under these terms shall be subject to the exclusive jurisdiction of the competent courts in Pune, Maharashtra.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
