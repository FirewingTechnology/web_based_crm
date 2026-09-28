import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Workflow,
  Building,
  Sparkles,
  Car,
  MessageSquare,
  FileText,
  Users,
  DollarSign,
  BarChart3,
  Sliders,
  Shield,
  CheckCircle2,
  ArrowRight,
  Check,
  Compass,
  Clock,
  Phone
} from 'lucide-react';

export const FeaturesPage: React.FC<{ onOpenDemo: () => void }> = ({ onOpenDemo }) => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const engines = [
    {
      id: "engine-1",
      number: "01",
      category: "intake",
      title: "Lead Intelligence Engine",
      subtitle: "Universal Ingestion, Normalization & Scoring",
      icon: Layers,
      description: "Aggregates every prospect into a single standardized pipeline. Normalizes Indian phone numbers, prevents duplicate contacts, tracks source campaigns, and computes algorithmic health scores.",
      capabilities: [
        "Universal Lead Ingestion (Meta Lead Ads, 99acres, Housing.com, MagicBricks, Zapier)",
        "E.164 Phone Normalization & Lead Deduplication Logic",
        "Source Identification, Campaign Attribution & UTM Capture",
        "Algorithmic Lead Health Scoring (0–100) with Decay Audits",
        "Dynamic Lead Priority Engine (Urgent, High Value, Stalled)",
        "First-Response SLA Timers & Automatic Manager Escalations"
      ]
    },
    {
      id: "engine-2",
      number: "02",
      category: "automation",
      title: "Sales Automation Engine",
      subtitle: "Smart Routing & Operational Workflows",
      icon: Workflow,
      description: "Directs inbound leads to the highest-converting executive based on deal size, property specialization, and current rep bandwidth. Eliminates manual allocation bottlenecks.",
      capabilities: [
        "Configurable Round-Robin & Capacity-Based Routing",
        "Project-Specific & Locality-Based Assignment Rules",
        "Budget-Tiered Senior Closer Escalations (Deals > ₹1 Cr)",
        "Automated Follow-Up Scheduling & Task Agenda Sync",
        "Role-Based Notifications (In-App, Audio Chime & Push)",
        "No-Response Monitoring with Re-Assignment Safeguards"
      ]
    },
    {
      id: "engine-3",
      number: "03",
      category: "property",
      title: "Property Intelligence & Cost Sheet OS",
      subtitle: "Inventory Matching & Indian RERA Pricing",
      icon: Building,
      description: "Bridges buyer preferences with live developer inventory. Instantly generates all-inclusive Indian real estate cost sheets factoring in floor rise, PLC, car parking, and statutory taxes.",
      capabilities: [
        "Bi-Directional Matchmaking (Buyer Requirements ↔ Live Units)",
        "Filter by Configuration (1–4 BHK), Budget, Locality & Possession",
        "Base Rate per sq.ft. $\\times$ Super Built-Up Area Calculation",
        "Floor Rise Premium & Preferred Location Charges (PLC)",
        "Covered Car Parking, Club Membership & Infrastructure Charges",
        "GST Engine (5% Standard Under-Construction vs 0% Ready-to-Move Waiver)"
      ]
    },
    {
      id: "engine-4",
      number: "04",
      category: "intelligence",
      title: "AI Sales Intelligence & Copilot",
      subtitle: "Contextual RAG Copilot & Next Best Action",
      icon: Sparkles,
      description: "Pulls live CRM records and proven objection playbooks into natural conversations. Empowers reps to answer inventory specs, counter pricing objections, or escalate to human supervisors.",
      capabilities: [
        "RAG Copilot powered by OpenAI GPT-4o-mini",
        "Zero-Downtime Deterministic Local RAG Fallback",
        "Real Estate Objection Playbooks (Price, Location, Vastu, Possession)",
        "Contextual Next Best Action & Stage Advancement Advisor",
        "Natural Language Requirement & Budget Extraction",
        "Live Human Support Escalation with Multi-User Ticketing"
      ]
    },
    {
      id: "engine-5",
      number: "05",
      category: "operations",
      title: "Site Visit OS",
      subtitle: "Chauffeur Dispatch, 4-Digit OTP & Sentiment",
      icon: Car,
      description: "The dedicated field-operations operating system. Coordinates VIP client transport, verifies on-site arrival via 4-digit security OTPs, and captures post-visit buyer sentiment immediately.",
      capabilities: [
        "VIP Site Tour Scheduling & Sales Executive Linking",
        "Chauffeur Coordination (Driver Name, Contact & Vehicle Number)",
        "4-Digit Security OTP for Client Pickup & Physical Site Arrival",
        "Immediate Post-Visit Sentiment Capture (Hot, Warm, Cold)",
        "Vastu, Pricing & Configuration Objection Tracking",
        "Automated Next-Day Follow-Up Task Generation"
      ]
    },
    {
      id: "engine-6",
      number: "06",
      category: "communication",
      title: "Communication & Call Intelligence",
      subtitle: "WhatsApp Workflows & Telephony Logging",
      icon: MessageSquare,
      description: "Unifies buyer conversations into the customer record. Dispatches standardized WhatsApp templates and logs telephony calls with outcomes, durations, and AI summaries.",
      capabilities: [
        "1-Click WhatsApp Messaging with Dynamic Variable Substitution",
        "Pre-Configured Real Estate Templates (Passes, Brochures, Cost Sheets)",
        "VoIP & Telephony Call Logger (Inbound & Outbound)",
        "Call Duration Tracking & Outcome Tagging (Interested, Call Back)",
        "Consent-Qualified Call Recording References",
        "AI Call Summaries with Extracted Next Action Items"
      ]
    },
    {
      id: "engine-7",
      number: "07",
      category: "transaction",
      title: "Transaction & KYC Vault",
      subtitle: "Negotiations, Bookings & Compliance",
      icon: FileText,
      description: "Manages the deal from negotiation to formal booking. Encapsulates token deposits, milestone schedules, and a secure KYC repository for RERA compliance.",
      capabilities: [
        "7-Stage Real Estate Deal Progression Workflow",
        "1-Click Quick Booking Creation from Accepted Cost Sheets",
        "Token Payment & Milestone Installment Schedule Tracking",
        "Buyer KYC Vault (PAN Card, Aadhaar Card, Cheque, BBA)",
        "Document Verification Workflow (Verified / Rejected with Reasons)",
        "Full RERA Audit Trail & Historical Transaction Archive"
      ]
    },
    {
      id: "engine-8",
      number: "08",
      category: "channel",
      title: "Channel Partner & Co-Broking OS",
      subtitle: "Broker Networks & Collaborative Deals",
      icon: Users,
      description: "Organizes external broker networks and co-broking relationships. Tracks RERA licenses, partner tier classifications, joint site visits, and customized deal splits.",
      capabilities: [
        "Channel Partner Agency & Independent Broker Directory",
        "RERA Registration Verification & Broker Tier Management",
        "Co-Broking Deal Collaboration & Inventory Sharing",
        "Custom Deal Splits (50-50, 60-40, Override Shares)",
        "Joint Site Visit Coordination & External CP Links",
        "Authorized Co-Broking Agreements & Payout Transparency"
      ]
    },
    {
      id: "engine-9",
      number: "09",
      category: "finance",
      title: "Commission Management Engine",
      subtitle: "Receivables, Builder Invoicing & Aging",
      icon: DollarSign,
      description: "Reconciles broker commissions and internal sales incentives. Prevents revenue leakage by tracking builder invoicing gates and aging payout brackets.",
      capabilities: [
        "Automatic Commission Calculation on Agreement Value",
        "Internal Sales Executive Incentive Allocations",
        "Channel Partner Broker Payout Ledger",
        "Builder Invoicing & Payment Milestone Tracking",
        "Milestone Payouts (Initiated ➔ Invoiced ➔ Paid)",
        "Commission Aging Ledger (0-30, 31-60, 61-90, 90+ Days)"
      ]
    },
    {
      id: "engine-10",
      number: "10",
      category: "intelligence",
      title: "Revenue Intelligence & Analytics",
      subtitle: "Funnel Drop-Off, CPA & Sales Velocity",
      icon: BarChart3,
      description: "Provides owners and directors with total revenue visibility. Identifies exactly where deals drop off, compares lead source CPA, and tracks monthly team targets in Lakhs.",
      capabilities: [
        "Full Funnel Drop-Off Analytics Across All 7 Stages",
        "Lead Source Revenue Attribution & Cost-per-Acquisition (CPA)",
        "Sales Velocity & Average Days in Stage Metrics",
        "Monthly Sales Targets (in INR Lakhs) & Team Leaderboards",
        "Executive Scorecards & Individual Closing Ratios",
        "Early Revenue Leakage Warning System"
      ]
    },
    {
      id: "engine-11",
      number: "11",
      category: "automation",
      title: "No-Code Automation Hub",
      subtitle: "Visual Trigger-Condition-Action Workflows",
      icon: Sliders,
      description: "Allows sales leadership to build custom automation rules without writing code. Reacts to lead arrivals, status changes, and site visits in real time.",
      capabilities: [
        "Visual Rule Builder (Trigger ➔ Condition ➔ Action)",
        "Event Triggers: Lead Ingested, Stage Advanced, Visit Done",
        "Logical Conditions: Budget Greater Than, Locality, Source Portal",
        "Actions: Reassign Rep, Mark Urgent, Schedule Task, Send Alert",
        "One-Click Rule Activation & Pause Controls",
        "Complete Workflow Audit Execution Logs"
      ]
    },
    {
      id: "engine-12",
      number: "12",
      category: "enterprise",
      title: "Multi-Tenant SaaS Engine",
      subtitle: "Enterprise Isolation, RBAC & Razorpay Billing",
      icon: Shield,
      description: "Engineered for security and scale. Features strict database tenant isolation, granular role-based access, instant sandbox provisioning, and Razorpay GST billing.",
      capabilities: [
        "Strict Multi-Tenant Database & Workspace Isolation",
        "Role-Based Access Control (SuperAdmin, Admin, Manager, Sales, CP)",
        "Instant 1-Hour Sandbox Workspace with Pre-Seeded Properties & Leads",
        "Razorpay Payment Gateway with UPI, Cards & NetBanking",
        "Promotional Coupon Engine (e.g. REALVION20)",
        "Downloadable GST Tax Invoices for 100% Input Tax Credit"
      ]
    }
  ];

  const filteredEngines = selectedCategory === 'all'
    ? engines
    : engines.filter(e => e.category === selectedCategory);

  return (
    <div className="bg-[#050505] text-slate-100 min-h-screen pt-36 pb-24 px-6 lg:px-12 selection:bg-[#C8A45D] selection:text-black">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C8A45D]/30 bg-[#C8A45D]/10 text-[#C8A45D] text-xs font-semibold tracking-wide">
            Real Estate Revenue Operating System
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
            12 Revenue Engines. One Platform.
          </h1>
          <p className="text-base text-slate-300 font-light leading-relaxed">
            REALVION replaces disconnected CRM add-ons with 12 specialized operational engines designed specifically for Indian real estate sales.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
          {[
            { id: 'all', label: 'All 12 Engines' },
            { id: 'intake', label: 'Lead Intake' },
            { id: 'automation', label: 'Automation' },
            { id: 'property', label: 'Property & Pricing' },
            { id: 'operations', label: 'Site Operations' },
            { id: 'communication', label: 'Communication' },
            { id: 'transaction', label: 'Transactions' },
            { id: 'channel', label: 'Channel Partners' },
            { id: 'finance', label: 'Commissions' },
            { id: 'intelligence', label: 'AI & Analytics' },
            { id: 'enterprise', label: 'SaaS Platform' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                selectedCategory === tab.id
                  ? 'bg-[#C8A45D] text-black shadow-lg shadow-[#C8A45D]/20'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Engines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEngines.map((engine) => {
            const Icon = engine.icon;
            return (
              <div
                key={engine.id}
                className="p-8 rounded-3xl bg-[#0c0c0c] border border-white/[0.08] hover:border-[#C8A45D]/40 transition space-y-5 text-left flex flex-col justify-between group shadow-xl"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-2xl bg-[#C8A45D]/10 text-[#C8A45D] border border-[#C8A45D]/20 flex items-center justify-center font-bold">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-[#C8A45D] transition">
                      ENGINE {engine.number}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-[#C8A45D] transition">
                      {engine.title}
                    </h3>
                    <p className="text-xs text-[#C8A45D] font-medium mt-0.5">
                      {engine.subtitle}
                    </p>
                  </div>

                  <p className="text-xs text-slate-400 font-light leading-relaxed">
                    {engine.description}
                  </p>

                  <div className="pt-3 border-t border-white/5 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      CORE CAPABILITIES
                    </span>
                    {engine.capabilities.slice(0, 4).map((cap, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 font-light">
                        <Check className="h-3.5 w-3.5 text-[#C8A45D] shrink-0 mt-0.5" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <button
                    onClick={() => navigate('/register')}
                    className="text-xs font-semibold text-[#C8A45D] hover:underline flex items-center gap-1.5"
                  >
                    Experience in Demo <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Demo Action Banner */}
        <div className="p-10 rounded-3xl bg-gradient-to-r from-[#101010] via-[#16140d] to-[#101010] border border-[#C8A45D]/40 text-center space-y-6 shadow-2xl">
          <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">Complete Demonstration</span>
          <h2 className="text-3xl font-bold text-white">Watch All 12 Revenue Engines in Action</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto font-light leading-relaxed">
            See how lead ingestion, voice reminders, inventory matching, VIP site visits, and commission ledgers run on one platform.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onOpenDemo}
              className="px-8 py-3.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 transition flex items-center gap-2"
            >
              Watch Video Demo
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-3.5 rounded-xl text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition"
            >
              Start 1-Hour Sandbox
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
