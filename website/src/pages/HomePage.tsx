import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Building,
  UserCheck,
  Volume2,
  Phone,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Shield,
  Users,
  Lock,
  Unlock,
  Layers,
  Compass,
  FileText,
  DollarSign,
  Car,
  MessageSquare,
  Sliders,
  BarChart3,
  Clock,
  Workflow,
  Check,
  Award,
  ChevronRight
} from 'lucide-react';
import { VideoPlayer } from '../components/VideoPlayer';
import { isUserRegistered } from '../utils/auth';

export const HomePage: React.FC<{ onOpenDemo: () => void }> = ({ onOpenDemo }) => {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeJourneyStep, setActiveJourneyStep] = useState<number>(0);
  const [activeEngineTab, setActiveEngineTab] = useState<number>(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [registered, setRegistered] = useState<boolean>(isUserRegistered());

  useEffect(() => {
    const checkAuth = () => setRegistered(isUserRegistered());
    window.addEventListener('brokeros_auth_changed', checkAuth);
    window.addEventListener('storage', checkAuth);
    return () => {
      window.removeEventListener('brokeros_auth_changed', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth - 0.5) * 20;
    const y = (clientY / window.innerHeight - 0.5) * 20;
    setMousePos({ x, y });
  };

  // 1. Revenue Journey Nodes
  const revenueJourneyNodes = [
    { id: 0, label: "LEAD INTAKE", icon: Layers, desc: "Inquiries arrive via connected webhooks (Meta, Housing, 99acres) or CSV import with instant E.164 phone normalization." },
    { id: 1, label: "LEAD HEALTH", icon: UserCheck, desc: "Algorithmic 0–100 health scoring evaluates response speed, days in stage, and deal size (flagging ₹1 Cr+ opportunities)." },
    { id: 2, label: "SMART ASSIGNMENT", icon: Compass, desc: "Configurable routing rules match budget, project location, and executive workload using round-robin and capacity logic." },
    { id: 3, label: "FOLLOW-UP & SLA", icon: Clock, desc: "Native Web Audio harmonic chimes and Web Speech TTS voice announcements enforce the first-response SLA." },
    { id: 4, label: "PROPERTY MATCH", icon: Building, desc: "Bi-directional matching engine ranks live builder inventory by buyer budget, configuration (BHK), and location." },
    { id: 5, label: "SITE VISIT OS", icon: Car, desc: "VIP chauffeur dispatch, driver contact details, 4-digit arrival verification OTP, and post-visit buyer sentiment rating." },
    { id: 6, label: "NEGOTIATION", icon: Sliders, desc: "AI Copilot objection playbooks and configurable Indian cost sheets factoring in floor rise, PLC, and 5% GST." },
    { id: 7, label: "BOOKING & KYC", icon: FileText, desc: "1-Click quick booking creation, token confirmation, and centralized buyer KYC vault (PAN, Aadhaar, BBA)." },
    { id: 8, label: "COMMISSION OS", icon: DollarSign, desc: "Multi-tier broker commission calculation, builder invoicing milestones, and aging receivables tracking." },
    { id: 9, label: "REVENUE INTEL", icon: BarChart3, desc: "Management command center surfacing 7-stage funnel drop-offs, lead source attribution, and team targets in Lakhs." }
  ];

  // 2. Fragmented vs Connected Comparison
  const fragmentedItems = [
    "Meta, 99acres & Housing leads stranded in separate portal logins",
    "Customer follow-ups scribbled on paper or forgotten in WhatsApp chats",
    "Sales executives cherry-picking leads without workload balance",
    "Site visits coordinated via chaotic phone calls without chauffeur tracking",
    "Pricing calculated manually on napkins with floor rise & tax errors",
    "Buyer KYC documents scattered across personal executive phones",
    "Channel Partner commissions tracked on unverified spreadsheets",
    "Leadership blind to actual revenue leakage and conversion bottlenecks"
  ];

  const connectedItems = [
    "Universal lead ingestion engine normalizes all portals into one live pipeline",
    "Web Audio harmonic chimes and Web Speech TTS verbalize scheduled appointments",
    "Configurable rule-based routing sends high-budget leads to top closers automatically",
    "Dedicated Site Visit OS with chauffeur dispatch, 4-digit OTP, and sentiment rating",
    "Configurable Indian Cost Sheet OS with PLC, floor rise, parking, and GST waiver rules",
    "Centralized Buyer Document Vault tracking PAN, Aadhaar, and RERA agreements",
    "Automated Commission Command Center tracking builder invoicing and payout aging",
    "Real-time revenue command center with funnel drop-offs and team scorecards in Lakhs"
  ];

  // 3. Not Just a CRM Comparison
  const crmComparison = [
    {
      category: "Lead Intake & Data",
      traditional: "Manual data entry or static CSV uploads requiring ongoing maintenance",
      realvion: "Universal Ingestion Engine normalizing Meta, 99acres, Housing, and Webhooks into structured profiles"
    },
    {
      category: "Follow-up Execution",
      traditional: "Passive date fields that notify only when the user remembers to open the screen",
      realvion: "Dual-harmonic Web Audio chime + Web Speech TTS spoken alerts with SLA breach escalation"
    },
    {
      category: "Property Matching",
      traditional: "Simple text note fields with no awareness of property inventory or availability",
      realvion: "Bi-directional matching ranking live developer units against buyer budget, BHK, and location"
    },
    {
      category: "Site Visit Operations",
      traditional: "Generic calendar appointments disconnected from transport or verified arrival",
      realvion: "Site Visit OS with chauffeur coordination, 4-digit client pickup OTP, and Hot/Warm/Cold feedback"
    },
    {
      category: "Pricing & Transactions",
      traditional: "Relies on external Excel sheets or paper quotation printouts",
      realvion: "Configurable Cost Sheet OS calculating base rate, floor rise, PLC, parking, GST, and 1-click token booking"
    },
    {
      category: "Broker & CP Payouts",
      traditional: "Not supported; requires separate accounting software or manual ledgers",
      realvion: "Co-broking deal splits, builder invoice tracking, and milestone aging commission ledger"
    },
    {
      category: "Revenue Intelligence",
      traditional: "Basic bar charts showing counts of leads in arbitrary stages",
      realvion: "Full funnel revenue visibility surfacing stage drop-offs, channel attribution, and revenue leakage"
    }
  ];

  // 4. "What Happens When a New Lead Arrives?" Steps
  const leadArrivalSteps = [
    {
      number: "01",
      tag: "INGESTION",
      title: "Portal Lead Ingestion",
      desc: "An inquiry is generated on Housing.com, 99acres, or Meta Lead Ads. REALVION ingests the payload within seconds via connected webhook adapters."
    },
    {
      number: "02",
      tag: "NORMALIZATION",
      title: "Data Normalization & Deduplication",
      desc: "Phone numbers are normalized to E.164 (+91). The engine verifies if the buyer already exists, updating their historical record instead of creating duplicates."
    },
    {
      number: "03",
      tag: "INTELLIGENCE",
      title: "Requirement & Budget Extraction",
      desc: "Buyer preferences (e.g., 2 BHK, ₹85 Lakhs budget, expressway location) are extracted and evaluated by the Lead Health Engine (0–100)."
    },
    {
      number: "04",
      tag: "ROUTING",
      title: "Intelligent Smart Assignment",
      desc: "Configurable routing rules evaluate project specialization, current executive workload, and availability to instantly assign the lead to the best closer."
    },
    {
      number: "05",
      tag: "ACTION",
      title: "Voice Alert & SLA Timer Trigger",
      desc: "The assigned executive receives a harmonic audio chime alert and verbal task notification. A 15-minute first-response SLA timer begins."
    },
    {
      number: "06",
      tag: "INVENTORY",
      title: "Automated Property Matchmaking",
      desc: "REALVION matches buyer criteria against live builder inventory, recommending ideal unit configurations directly in the executive cockpit."
    },
    {
      number: "07",
      tag: "VISIT OS",
      title: "Site Visit Dispatch & 4-Digit OTP",
      desc: "A VIP property tour is scheduled. Driver details and a secure 4-digit pickup verification OTP are auto-generated for permission-based arrival verification."
    },
    {
      number: "08",
      tag: "FEEDBACK",
      title: "Post-Visit Sentiment Capture",
      desc: "Immediately post-visit, the executive logs buyer sentiment (Hot / Warm / Cold), unit preference, and specific buyer objections."
    },
    {
      number: "09",
      tag: "COST SHEET",
      title: "RERA Cost Sheet & 1-Click Booking",
      desc: "The cost sheet engine calculates base cost, floor rise, parking, and 5% GST. The buyer approves and the deal is locked via 1-click booking."
    },
    {
      number: "10",
      tag: "COMMISSION",
      title: "Commission Realization & Revenue OS",
      desc: "The deal automatically triggers builder invoicing and broker commission tracking. Management sees the revenue reflected in real time."
    }
  ];

  // 5. The 12 Architecture Business Engines
  const architectureEngines = [
    {
      id: 0,
      title: "Lead Intelligence",
      tagline: "Universal Ingestion, Normalization & Scoring",
      icon: Layers,
      features: [
        "Universal Lead Ingestion (Available with connected Meta, Housing, 99acres webhooks)",
        "E.164 Phone Normalization & Lead Deduplication Logic",
        "Source Identification, Campaign Attribution & UTM Capture",
        "Algorithmic Lead Health Scoring (0–100) with Decay Audits",
        "Dynamic Lead Priority Engine (Urgent, High Value, Stalled)",
        "First-Response SLA Tracking & Automatic Manager Escalations"
      ]
    },
    {
      id: 1,
      title: "Sales Automation",
      tagline: "Intelligent Routing & Operational Workflows",
      icon: Workflow,
      features: [
        "Smart Assignment Engine (Round-robin & Capacity-based)",
        "Project-Specific & Locality-Based Routing Rules",
        "Budget-Tiered Senior Closer Escalations (Deals > ₹1 Cr)",
        "Role-Based Notifications & Actionable Triggers",
        "Automated Follow-Up Scheduling & Agenda Sync",
        "No-Response Monitoring & Manager Alerts"
      ]
    },
    {
      id: 2,
      title: "Property Intelligence",
      tagline: "Live Inventory & Indian Cost Sheet OS",
      icon: Building,
      features: [
        "Bi-Directional Inventory Matchmaking (Buyer ↔ Projects)",
        "Filter by BHK, Budget, Location & Possession Status",
        "Configurable Cost Sheet: Base Rate & Super Built-up Area",
        "Floor Rise Premium & Preferred Location Charges (PLC)",
        "Car Parking, Club Membership & Infrastructure Charges",
        "Standard Tax Treatments (5% GST vs 0% Ready-to-Move Waiver)"
      ]
    },
    {
      id: 3,
      title: "AI Sales Intelligence",
      tagline: "Contextual RAG Copilot & Next Best Action",
      icon: Sparkles,
      features: [
        "RAG Copilot powered by OpenAI GPT-4o-mini",
        "Zero-Downtime Deterministic Local RAG Fallback",
        "Real Estate Objection-Handling Playbooks (Price, Vastu, Possession)",
        "Contextual Next Best Action & Stage Advisor",
        "Natural Language Requirement & Budget Extraction",
        "Live Human Support Escalation & Multi-User Ticketing"
      ]
    },
    {
      id: 4,
      title: "Site Visit OS",
      tagline: "Chauffeur Dispatch, OTP & Sentiment Tracking",
      icon: Car,
      features: [
        "VIP Site Tour Scheduling & Executive Linking",
        "Chauffeur Coordination (Driver Name, Phone, Vehicle Number)",
        "4-Digit Security OTP for Client Pickup & Arrival Verification",
        "Post-Visit Sentiment Auditing (Hot, Warm, Cold)",
        "Vastu, Price & Floor Objection Capture",
        "Automated Next-Day Follow-Up Task Generation"
      ]
    },
    {
      id: 5,
      title: "Communication & Calls",
      tagline: "WhatsApp Workflows & Telephony Intelligence",
      icon: MessageSquare,
      features: [
        "1-Click WhatsApp Messaging with Dynamic Variable Substitution",
        "Pre-Configured Real Estate WhatsApp Templates",
        "VoIP & Telephony Call Logger (Inbound/Outbound)",
        "Call Duration, Outcomes (Interested, Call Back, Not Reachable)",
        "Call Recording Integration (where supported by telephony & consent)",
        "AI Call Summaries & Follow-Up Recommendations"
      ]
    },
    {
      id: 6,
      title: "Transaction & KYC",
      tagline: "Negotiations, Bookings & Compliance Vault",
      icon: FileText,
      features: [
        "7-Stage Deal Workflow from Inquiry to Booking",
        "1-Click Quick Booking Creation from Accepted Cost Sheets",
        "Token Payment & Milestone Installment Tracking",
        "Buyer KYC Vault (PAN, Aadhaar, Cheque, BBA)",
        "Document Verification Workflow (Verified / Rejected with Reasons)",
        "RERA Audit Trail & Deal Archive"
      ]
    },
    {
      id: 7,
      title: "Broker & Co-Broking OS",
      tagline: "Channel Partner Network & Deal Collaboration",
      icon: Users,
      features: [
        "Channel Partner Agency & Independent Broker Directory",
        "RERA Registration & Broker Tier Management",
        "Co-Broking Deal Collaboration & Inventory Sharing",
        "Custom Deal Splits (50-50, 60-40, Override Shares)",
        "Joint Site Visit Coordination & External CP Links",
        "Authorized Co-Broking Deal Contracts"
      ]
    },
    {
      id: 8,
      title: "Commission Management",
      tagline: "Receivables, Builder Invoicing & Aging",
      icon: DollarSign,
      features: [
        "Automatic Commission Calculation on Agreement Value",
        "Internal Sales Executive Incentive Allocations",
        "Channel Partner Broker Payout Ledger",
        "Builder Invoicing & Payment Milestone Tracking",
        "Milestone Payouts (Initiated ➔ Invoiced ➔ Paid)",
        "Commission Aging Ledger (0-30, 31-60, 61-90, 90+ Days)"
      ]
    },
    {
      id: 9,
      title: "Revenue Intelligence",
      tagline: "Funnel Drop-Off, CPA & Sales Velocity",
      icon: BarChart3,
      features: [
        "Full Funnel Drop-Off Analytics Across All 7 Stages",
        "Lead Source Revenue Attribution & Conversion Metrics",
        "Sales Velocity & Average Days in Stage Metrics",
        "Monthly Sales Targets (in INR Lakhs) & Team Leaderboards",
        "Executive Scorecards & Individual Closing Ratios",
        "Early Revenue Leakage Warning System"
      ]
    },
    {
      id: 10,
      title: "Automation Hub",
      tagline: "No-Code Trigger-Condition-Action Workflows",
      icon: Sliders,
      features: [
        "Visual Rule Builder (No Coding Required)",
        "Triggers: Lead Ingested, Status Changed, Visit Completed",
        "Conditions: Budget Thresholds, Source Portals, Locations",
        "Actions: Reassign Lead, Set Urgent, Schedule Task, Alert",
        "One-Click Rule Activation & Pause Controls",
        "Complete Workflow Audit Execution Logs"
      ]
    },
    {
      id: 11,
      title: "Multi-Tenant SaaS",
      tagline: "Enterprise Isolation, RBAC & Razorpay Billing",
      icon: Shield,
      features: [
        "Strict Multi-Tenant Database & Workspace Isolation",
        "Role-Based Access Control (SuperAdmin, Admin, Manager, Sales, CP)",
        "Instant 1-Hour Sandbox Workspace with Seeded Data",
        "Razorpay Payment Gateway with UPI, Cards & NetBanking",
        "Promotional Coupon Engine (e.g. REALVION20)",
        "Downloadable GST Tax Invoices for 100% Input Credit"
      ]
    }
  ];

  // 6. Lead Health & Priority Board Mock Data
  const priorityBoardData = [
    { type: "URGENT ACTION", count: 3, label: "Overdue Follow-ups", color: "text-rose-400 bg-rose-500/10 border-rose-500/30", action: "Immediate Call Needed" },
    { type: "HIGH VALUE", count: 8, label: "Deals Over ₹1 Crore", color: "text-amber-400 bg-amber-500/10 border-amber-500/30", action: "Active Negotiation" },
    { type: "TODAY'S VISITS", count: 5, label: "Site Tours Scheduled", color: "text-blue-400 bg-blue-500/10 border-blue-500/30", action: "Chauffeur Dispatched" },
    { type: "SLA WARNING", count: 4, label: "Untouched Inbound Leads", color: "text-purple-400 bg-purple-500/10 border-purple-500/30", action: "15-Min Response SLA" }
  ];

  // 7. Role-Based Capabilities
  const roleCards = [
    {
      role: "Platform Owner / Super Admin",
      audience: "SaaS Platform Owners",
      desc: "Complete platform governance: global MRR/ARR analytics, tenant provisioning, seat/lead quota expansions, and multi-tenant health.",
      badge: "PLATFORM OVERSIGHT"
    },
    {
      role: "Agency Owner / Tenant Admin",
      audience: "Brokerage & Firm Founders",
      desc: "Full business control: real-time sales revenue command center, team assignments, inventory management, builder invoicing, and commission realization.",
      badge: "BUSINESS CONTROL"
    },
    {
      role: "Sales Manager / Team Lead",
      audience: "Operational Sales Leaders",
      desc: "Team velocity and pipeline monitoring: daily priority board, SLA breach escalations, site visit chauffeur tracking, and monthly target pacing.",
      badge: "TEAM PACING"
    },
    {
      role: "Sales Executive / Closer",
      audience: "High-Velocity Sales Reps",
      desc: "Daily action cockpit: prioritized callback agendas, harmonic audio alarms, AI objection playbooks, live inventory matching, and 1-click cost sheets.",
      badge: "CLOSER COCKPIT"
    },
    {
      role: "Channel Partner / Broker",
      audience: "External Network Partners",
      desc: "Collaborative portal: accessible developer property catalog, client registration, co-broking deal splits, and transparent commission payout tracking.",
      badge: "PARTNER PORTAL"
    }
  ];

  // 8. Frequently Asked Questions
  const faqs = [
    {
      q: "What makes REALVION a Revenue Operating System rather than a generic CRM?",
      a: "Generic CRMs are passive digital address books that record past notes. REALVION is an active real-estate operating system designed specifically around Indian property sales: from universal portal lead ingestion, automated routing, and lead health scoring (0–100) to VIP site visit chauffeur logistics with 4-digit OTPs, configurable Indian cost sheets, and broker commission aging ledgers."
    },
    {
      q: "Which real estate lead sources does REALVION connect with?",
      a: "REALVION includes webhook integration adapters for Meta Lead Ads (Facebook & Instagram), Housing.com, 99acres, MagicBricks, Google Ads / Zapier Webhooks, WhatsApp, and bulk CSV spreadsheet imports with visual column mapping."
    },
    {
      q: "How does the Site Visit OS with 4-digit OTP verification work?",
      a: "When a site visit is scheduled, REALVION records the pickup location, time, chauffeur name, driver phone number, and vehicle details. The platform generates an automated 4-digit OTP that verifies client pickup and on-site arrival before capturing post-visit sentiment (Hot/Warm/Cold) and buyer objections."
    },
    {
      q: "How does the Indian Cost Sheet and RERA Calculation Engine work?",
      a: "REALVION's pricing engine provides configurable calculations for base rate × super built-up area, floor rise premiums, preferred location charges (PLC), covered car parking, club membership, and standard tax treatments—including 5% GST on under-construction units and 0% GST treatment on Ready-to-Move properties with Occupancy Certificates (OC)."
    },
    {
      q: "How does the AI Copilot assist real estate sales teams?",
      a: "Powered by OpenAI GPT-4o-mini with a zero-downtime deterministic local fallback, the AI Copilot retrieves live CRM facts and proprietary real estate objection-handling playbooks. It extracts buyer requirements from natural language, drafts personalized WhatsApp messages, and allows executives to escalate complex questions to a live human support desk."
    },
    {
      q: "How does multi-tenant security and payment activation work?",
      a: "REALVION enforces strict database-level tenant isolation, role-based access control (RBAC), and full audit logging. Subscriptions are activated instantly via an integrated PCI-DSS compliant Razorpay gateway supporting UPI, Credit/Debit cards, and NetBanking with downloadable GST tax invoices."
    },
    {
      q: "Can we test REALVION before subscribing?",
      a: "Yes. Prospective real estate agencies can register free of charge to instantly auto-provision an isolated 1-hour sandbox workspace pre-loaded with sample properties, active buyer leads, and interactive audio reminder alarms."
    }
  ];

  return (
    <div className="bg-[#050505] text-slate-100 min-h-screen selection:bg-[#C8A45D] selection:text-black" onMouseMove={handleMouseMove}>
      
      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION
          ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-20 px-6 lg:px-12 max-w-7xl mx-auto overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-10 right-1/4 w-[500px] h-[500px] bg-[#C8A45D]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-blue-600/[0.08] rounded-full blur-[130px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6 text-left">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C8A45D]/30 bg-[#C8A45D]/10 text-[#C8A45D] text-xs font-semibold tracking-wide">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              <span>THE REAL ESTATE REVENUE OPERATING SYSTEM</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08]">
              Turn Every Real Estate Lead Into a{' '}
              <span className="bg-gradient-to-r from-white via-slate-100 to-[#C8A45D] bg-clip-text text-transparent">
                Managed Revenue Opportunity.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-light">
              Connect lead generation, intelligent assignment, follow-ups, property matching, site visits, bookings, commissions, and revenue intelligence in one powerful platform.
            </p>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] max-w-xl text-xs sm:text-sm text-slate-300 font-medium flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-[#C8A45D] animate-ping shrink-0" />
              <span>Every Lead. Every Follow-up. Every Site Visit. Every Booking. One Intelligent System.</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-3">
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-4 rounded-2xl text-sm font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 shadow-xl shadow-[#C8A45D]/25 transition transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                Book a Demo <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('revenue-journey');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-4 rounded-2xl text-sm font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#C8A45D]/40 transition flex items-center gap-2"
              >
                See How REALVION Works
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/[0.08] text-xs">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">12 Engines</p>
                <p className="text-slate-400 mt-0.5">End-to-End Sales OS</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-[#C8A45D]">100% Indian</p>
                <p className="text-slate-400 mt-0.5">Lakhs, Crores & GST</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">Site Visit OS</p>
                <p className="text-slate-400 mt-0.5">Chauffeur & OTP Verified</p>
              </div>
            </div>
          </div>

          {/* Hero Abstract Product Dashboard Visual - Illustrative Workspace Simulation */}
          <div className="lg:col-span-5 relative">
            <motion.div
              style={{
                transform: `perspective(1000px) rotateY(${mousePos.x * 0.4}deg) rotateX(${-mousePos.y * 0.4}deg)`
              }}
              transition={{ type: 'spring', stiffness: 90, damping: 20 }}
              className="relative p-6 rounded-3xl bg-[#0c0c0c]/90 border border-[#C8A45D]/30 shadow-2xl shadow-black space-y-4 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-semibold text-slate-300 ml-2">Revenue Command Center</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C8A45D]/15 text-[#C8A45D] border border-[#C8A45D]/30">
                  EXAMPLE WORKSPACE (ILLUSTRATIVE)
                </span>
              </div>

              {/* KPI Header Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-[#101010] to-[#14120c] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Monthly Revenue Closed</span>
                  <Flame className="h-5 w-5 text-[#C8A45D]" />
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-white">₹3.85 Cr</p>
                  <span className="text-xs text-emerald-400 font-semibold">(85% Target Pacing)</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-[#C8A45D] w-[78%]" />
                </div>
              </div>

              {/* Lead Health & Priority Strip */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold">
                    94
                  </div>
                  <div>
                    <p className="font-semibold text-white">Lead Health: Excellent</p>
                    <p className="text-[10px] text-slate-400">Vikram Malhotra • ₹1.85 Cr (3 BHK)</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  Ready for Booking
                </span>
              </div>

              {/* Site Visit OS Strip */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                    <Car className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">VIP Site Visit Dispatched</p>
                    <p className="text-[10px] text-slate-400">Driver: Santosh • Cab: MH 12 AB 9081</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-[#C8A45D] text-xs">OTP: 6842</span>
                  <p className="text-[9px] text-slate-400">Pickup 11:30 AM</p>
                </div>
              </div>

              {/* Commission Ledger Strip */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-[#101010] border border-[#C8A45D]/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-[#C8A45D]" />
                  <span className="font-medium text-slate-200">CP Commission Invoiced</span>
                </div>
                <span className="font-bold text-[#C8A45D]">₹3,70,000 (Milestone 1)</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────
          2. ABOVE-THE-FOLD INTERACTIVE REVENUE JOURNEY
          ───────────────────────────────────────────────────────────── */}
      <section id="revenue-journey" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/[0.08] relative">
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">Connected Revenue Journey</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            The Complete Real Estate Sales Journey
          </h2>
          <p className="text-sm text-slate-400 font-light">
            Click any milestone below to see how REALVION connects every operational step from first customer inquiry to final revenue realization.
          </p>
        </div>

        {/* Milestone Node Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 mb-8">
          {revenueJourneyNodes.map((node) => {
            const Icon = node.icon;
            const isActive = activeJourneyStep === node.id;
            return (
              <button
                key={node.id}
                onClick={() => setActiveJourneyStep(node.id)}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between h-24 ${
                  isActive
                    ? 'bg-[#C8A45D]/15 border-[#C8A45D] text-white shadow-lg shadow-[#C8A45D]/10'
                    : 'bg-[#0d0d0d] border-white/[0.08] text-slate-400 hover:border-white/20 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-[#C8A45D]' : 'text-slate-500'}`} />
                  <span className="text-[10px] font-mono text-slate-500">0{node.id + 1}</span>
                </div>
                <span className="text-[10px] font-bold leading-tight uppercase tracking-wider">{node.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Journey Detail Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0d0d0d] border border-[#C8A45D]/40 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-wider">
                Step 0{activeJourneyStep + 1} of 10
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs font-semibold text-white">
                {revenueJourneyNodes[activeJourneyStep].label}
              </span>
            </div>
            <p className="text-base text-slate-200 leading-relaxed font-light">
              {revenueJourneyNodes[activeJourneyStep].desc}
            </p>
          </div>

          <button
            onClick={() => navigate('/register')}
            className="shrink-0 px-6 py-3 rounded-xl text-xs font-bold text-black bg-[#C8A45D] hover:brightness-110 transition flex items-center gap-2"
          >
            See in Live Demo <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────
          3. CORE COMMERCIAL MESSAGE: FRAGMENTED VS CONNECTED
          ───────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/[0.08] relative">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">The Core Problem</span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            "Your leads are everywhere.<br />
            <span className="text-[#C8A45D]">Your revenue shouldn't be."</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 font-light leading-relaxed">
            In most real estate businesses, lead intake, customer calls, transport, pricing, and commissions operate in disconnected silos. REALVION unifies the entire sales operation into one intelligent system.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Fragmented Column */}
          <div className="p-8 rounded-3xl bg-[#0c0a0a] border border-rose-500/30 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-rose-500/20">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-rose-400 uppercase">Current Reality</span>
                <h3 className="text-xl font-bold text-white mt-0.5">Fragmented Sales Operation</h3>
              </div>
              <XCircle className="h-6 w-6 text-rose-500 shrink-0" />
            </div>

            <ul className="space-y-3.5">
              {fragmentedItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-400 font-light">
                  <div className="h-5 w-5 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    ✕
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Connected Column */}
          <div className="p-8 rounded-3xl bg-[#0a0f0d] border border-emerald-500/30 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-emerald-500/20 relative z-10">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase">With REALVION</span>
                <h3 className="text-xl font-bold text-white mt-0.5">Connected Revenue Operation</h3>
              </div>
              <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
            </div>

            <ul className="space-y-3.5 relative z-10">
              {connectedItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300 font-light">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    ✓
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────
          4. POSITION AGAINST TRADITIONAL CRM ("NOT JUST A CRM")
          ───────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/[0.08] relative">
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">Platform Paradigm</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Not Just a CRM.
          </h2>
          <p className="text-base text-slate-300 font-light">
            Most CRMs record what happened. <br className="hidden sm:inline" />
            <span className="text-[#C8A45D] font-medium">REALVION helps your team understand what should happen next.</span>
          </p>
        </div>

        <div className="rounded-3xl bg-[#0a0a0a] border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="py-4 px-6 font-semibold text-slate-400 w-1/4">Workflow Dimension</th>
                  <th className="py-4 px-6 font-medium text-slate-500 w-3/8">Traditional CRM</th>
                  <th className="py-4 px-6 font-bold text-[#C8A45D] w-3/8">REALVION Revenue OS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {crmComparison.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition">
                    <td className="py-4 px-6 font-semibold text-white">{row.category}</td>
                    <td className="py-4 px-6 text-slate-400 font-light leading-relaxed">{row.traditional}</td>
                    <td className="py-4 px-6 text-slate-200 font-normal leading-relaxed bg-[#C8A45D]/[0.02]">
                      <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-[#C8A45D] shrink-0 mt-0.5" />
                        <span>{row.realvion}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────
          5. "WHAT HAPPENS WHEN A NEW LEAD ARRIVES?"
          ───────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/[0.08] relative">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">Automation in Action</span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            What Happens When a New Lead Arrives?
          </h2>
          <p className="text-sm sm:text-base text-slate-400 font-light">
            From the instant a buyer submits an inquiry via connected portal webhooks to deal closure and commission settlement: follow the automated lifecycle step-by-step.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {leadArrivalSteps.map((step, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#0c0c0c] border border-white/[0.08] hover:border-[#C8A45D]/40 transition space-y-3 flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#C8A45D] px-2 py-0.5 rounded bg-[#C8A45D]/10 border border-[#C8A45D]/20">
                    {step.number}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {step.tag}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#C8A45D] transition">
                  {step.title}
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-light leading-relaxed pt-2 border-t border-white/5">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────
          6. THE 12 ARCHITECTURE BUSINESS ENGINES
          ───────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/[0.08] relative">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">Platform Architecture</span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            One Platform. Every Revenue Workflow.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 font-light">
            Instead of stitching together a CRM, call loggers, spreadsheets, and accounting tools, REALVION organizes your entire sales operation into 12 purpose-built engines.
          </p>
        </div>

        {/* Engine Tabs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-8">
          {architectureEngines.map((engine) => {
            const Icon = engine.icon;
            const isSelected = activeEngineTab === engine.id;
            return (
              <button
                key={engine.id}
                onClick={() => setActiveEngineTab(engine.id)}
                className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-[#C8A45D]/15 border-[#C8A45D] text-white shadow-lg shadow-[#C8A45D]/10'
                    : 'bg-[#0d0d0d] border-white/[0.08] text-slate-400 hover:border-white/20 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-[#C8A45D]' : 'text-slate-500'}`} />
                <span className="text-xs font-bold truncate">{engine.title}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Engine Feature Display */}
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0c0c0c] border border-[#C8A45D]/30 shadow-2xl relative overflow-hidden">
          <div className="max-w-4xl space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">
                ENGINE 0{activeEngineTab + 1} SPECIFICATION
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                {architectureEngines[activeEngineTab].title}
              </h3>
              <p className="text-sm text-slate-400 font-light">
                {architectureEngines[activeEngineTab].tagline}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
              {architectureEngines[activeEngineTab].features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <CheckCircle2 className="h-4 w-4 text-[#C8A45D] shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-slate-300 font-normal">{feat}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button
                onClick={() => navigate('/features')}
                className="px-6 py-3 rounded-xl text-xs font-bold text-black bg-[#C8A45D] hover:brightness-110 transition flex items-center gap-2"
              >
                Explore Complete Engine Specs <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={onOpenDemo}
                className="px-6 py-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition"
              >
                Watch Engine Demo
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────
          7. LEAD HEALTH & TODAY'S PRIORITY BOARD
          ───────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/[0.08] relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6 text-left">
            <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">Pipeline Health & Focus</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Know Which Leads Need Attention Right Now.
            </h2>
            <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
              Sales reps shouldn't wonder who to call each morning. REALVION continuously calculates an algorithmic health score (0–100) based on deal size, days stagnant in stage, and response velocity—curating high-impact daily priorities automatically to help managers identify which opportunities need attention.
            </p>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[#0e0e0e] border border-white/[0.08] flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#C8A45D] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Dynamic Health Scoring (0–100)</h4>
                  <p className="text-xs text-slate-400 font-light">Evaluates response latency, pending commitments, and flags leads at risk of dropping off.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0e0e0e] border border-white/[0.08] flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#C8A45D] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">High-Value Deal Flagging (₹1 Cr+)</h4>
                  <p className="text-xs text-slate-400 font-light">Prioritizes high-ticket buyer inquiries to ensure executive bandwidth is allocated where revenue is largest.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Priority Board Visual - Clearly labeled illustrative view */}
          <div className="lg:col-span-6">
            <div className="p-6 rounded-3xl bg-[#0c0c0c] border border-white/10 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-white">Today's Priority Board</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">ILLUSTRATIVE VIEW</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {priorityBoardData.map((item, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl border ${item.color} space-y-1 text-left`}>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black text-white">{item.count}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider">{item.type}</span>
                    </div>
                    <p className="text-xs font-bold text-white">{item.label}</p>
                    <p className="text-[10px] opacity-80">{item.action}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-400 font-light text-left">
                💡 <span className="text-slate-200 font-medium">Automatic Revenue Safeguard:</span> When a high-value lead exceeds 48 hours without contact, REALVION auto-escalates the deal to the sales manager.
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────
          8. REVENUE LEAKAGE BREAKDOWN
          ───────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/[0.08] relative">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Revenue Leakage Detection</span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Revenue Is Often Lost Between Activities.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 font-light">
            Real estate agencies rarely fail due to lack of leads. They lose revenue in the invisible gaps between inquiry, visit, quotation, and collection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-[#0e0c0c] border border-rose-500/20 space-y-3 text-left">
            <span className="text-rose-400 font-mono text-xs font-bold">LEAK 01</span>
            <h3 className="text-base font-bold text-white">Lead Received ➔ No Timely Follow-up</h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Inquiries cool down within hours. REALVION triggers instant SLA timers and Web Audio chimes so executives connect before interest wanes.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0e0c0c] border border-rose-500/20 space-y-3 text-left">
            <span className="text-rose-400 font-mono text-xs font-bold">LEAK 02</span>
            <h3 className="text-base font-bold text-white">Site Visit Done ➔ No Follow-up Action</h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Clients tour the property, but reps fail to capture objections. Site Visit OS enforces immediate post-visit feedback and next-day agendas.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0e0c0c] border border-rose-500/20 space-y-3 text-left">
            <span className="text-rose-400 font-mono text-xs font-bold">LEAK 03</span>
            <h3 className="text-base font-bold text-white">Booking Locked ➔ Commission Unclaimed</h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Agencies forget to invoice builders on milestone completion. The Commission Command Center tracks builder invoicing and aging receivables.
            </p>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────
          9. SITE VISIT OS SPOTLIGHT
          ───────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/[0.08] relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6 text-left">
            <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">Ground Operations Suite</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              From Lead to Site Visit — Without the Operational Chaos.
            </h2>
            <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
              In real estate, deals close on the project site. REALVION connects client transport, chauffeur dispatch, 4-digit arrival OTP verification, and instant buyer sentiment rating into one seamless workflow.
            </p>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                <span className="font-bold text-[#C8A45D]">4-Digit OTP Check-in</span>
                <p className="text-slate-400 font-light">Permission-based arrival verification ensuring on-site presence before advancing the deal.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                <span className="font-bold text-[#C8A45D]">Chauffeur Logistics</span>
                <p className="text-slate-400 font-light">Coordinates driver names, phone contacts, and vehicle numbers automatically.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="p-6 rounded-3xl bg-[#0c0c0c] border border-white/10 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
                <span className="font-bold text-white">VIP Site Visit Execution</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold text-[10px] border border-emerald-500/30">
                  CONFIRMED
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#121212] border border-white/10 space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Sunil Deshmukh</p>
                    <p className="text-xs text-slate-400">Kohinoor Grandeur • 3 BHK Luxury</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold text-[#C8A45D]">OTP: 4192</p>
                    <p className="text-[10px] text-slate-500">Pick-up verified</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 grid grid-cols-3 gap-2 text-[11px] text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[9px]">DRIVER</span>
                    <span>Ramesh K.</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">VEHICLE</span>
                    <span>MH 14 DX 3310</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">SENTIMENT</span>
                    <span className="text-amber-400 font-bold">Hot Buyer</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────
          10. AI SALES INTELLIGENCE INSIDE THE WORKFLOW
          ───────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/[0.08] relative">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">Contextual Sales Copilot</span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            AI That Works Inside Your Sales Workflow.
          </h2>
          <p className="text-base text-slate-300 font-light">
            AI should not create more dashboards. <br className="hidden sm:inline" />
            <span className="text-[#C8A45D] font-medium">It should help your team execute better next actions.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-[#0c0c0c] border border-white/[0.08] space-y-3 text-left">
            <div className="h-10 w-10 rounded-xl bg-[#C8A45D]/10 text-[#C8A45D] flex items-center justify-center font-bold">
              <Compass className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Next Best Action</h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Analyzes current deal stage, objections, and missing blockers to suggest whether to send a floor plan via WhatsApp or make an urgent closing call.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0c0c0c] border border-white/[0.08] space-y-3 text-left">
            <div className="h-10 w-10 rounded-xl bg-[#C8A45D]/10 text-[#C8A45D] flex items-center justify-center font-bold">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Real Estate Objection Playbooks</h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Provides battle-tested talking points for common buyer hesitations: price comparisons, delayed possession concerns, and Vastu alignment.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0c0c0c] border border-white/[0.08] space-y-3 text-left">
            <div className="h-10 w-10 rounded-xl bg-[#C8A45D]/10 text-[#C8A45D] flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Human Support Desk Escalation</h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              When AI answers reach their boundary, reps tap one button to open an active support thread with team leads or Super Admins in real time.
            </p>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────
          11. ONE LEAD — COMPLETE JOURNEY (ILLUSTRATIVE DEMO STORY)
          ───────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/[0.08] relative">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#0c0c0c] via-[#121212] to-[#0d0d0d] border border-[#C8A45D]/30 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-wider">
                ILLUSTRATIVE DEMONSTRATION WORKFLOW (DEMO SCENARIO)
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                The Journey of Rahul Patil (₹85L 2 BHK Inquiry)
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 font-mono">
              Demo Scenario
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">1. INGESTION</span>
              <p className="font-bold text-white">Housing.com Inquiry</p>
              <p className="text-slate-400 font-light">Lead received via webhook, phone standardized to +91 98230 XXXXX.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">2. ASSIGNMENT</span>
              <p className="font-bold text-white">Routed to Amit (Closer)</p>
              <p className="text-slate-400 font-light">Matched by Pune West location and ₹85L budget bracket.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">3. SITE VISIT</span>
              <p className="font-bold text-white">OTP 5521 Verified</p>
              <p className="text-slate-400 font-light">Chauffeur pick-up confirmed; buyer marked 'Hot Intent'.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">4. BOOKING & REVENUE</span>
              <p className="font-bold text-white">Token ₹1 Lakh Received</p>
              <p className="text-slate-400 font-light">Cost sheet generated; ₹1.70L CP commission ledger opened.</p>
            </div>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────
          12. ROLE-BASED TAILORED EXPERIENCES
          ───────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/[0.08] relative">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">Designed for Every Persona</span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Built for Your Entire Sales Organization.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 font-light">
            Every user sees exactly what drives their day, enforced by strict Role-Based Access Control (RBAC).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {roleCards.map((r, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-[#0c0c0c] border border-white/[0.08] space-y-3 text-left flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-[#C8A45D] tracking-wider uppercase bg-[#C8A45D]/10 px-2 py-0.5 rounded border border-[#C8A45D]/20">
                  {r.badge}
                </span>
                <h3 className="text-sm font-bold text-white pt-1">{r.role}</h3>
              </div>
              <p className="text-xs text-slate-400 font-light leading-relaxed">
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────
          13. DEDICATED DEMO VIDEO WALKTHROUGH
          ───────────────────────────────────────────────────────────── */}
      <section id="demo-video" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/[0.08] space-y-10 relative">
        <div className="text-center space-y-4 relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C8A45D]/30 bg-[#C8A45D]/10 text-[#C8A45D] text-xs font-semibold">
            {registered ? (
              <>
                <Sparkles className="h-3.5 w-3.5" /> Full Product Walkthrough (Unlocked)
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5" /> Demo Available for Registered Users
              </>
            )}
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            See REALVION in Action
          </h2>
          <p className="text-sm sm:text-base text-slate-400 font-light leading-relaxed">
            {registered
              ? 'Watch the complete video recording of lead workflows, audio follow-up alarms, developer catalogs, and executive performance analytics.'
              : 'Register your real estate agency to unlock the complete high-definition walkthrough and hands-on 1-hour interactive sandbox.'}
          </p>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          {registered ? (
            <div className="p-2 sm:p-4 rounded-3xl bg-gradient-to-b from-white/10 to-white/[0.02] border border-[#C8A45D]/30 shadow-2xl shadow-black">
              <VideoPlayer
                src="/demo-video.mp4"
                title="REALVION Official Product Demonstration & Walkthrough"
                showChapters={true}
              />
            </div>
          ) : (
            <div className="relative rounded-3xl bg-[#0e0e0e] border border-[#C8A45D]/30 overflow-hidden shadow-2xl shadow-black p-8 sm:p-14 text-center">
              <div className="relative z-10 max-w-xl mx-auto space-y-6">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-[#C8A45D]/10 border border-[#C8A45D]/40 text-[#C8A45D] shadow-lg shadow-[#C8A45D]/10">
                  <Lock className="h-8 w-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Unlock Live Demo & Interactive Sandbox
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
                    Register your agency free of charge to immediately access the complete video walkthrough and live test workspace.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={onOpenDemo}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 shadow-xl shadow-[#C8A45D]/25 transition flex items-center justify-center gap-2"
                  >
                    <Unlock className="h-4 w-4" /> Register & Unlock Demo Now
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="w-full sm:w-auto px-6 py-4 rounded-2xl text-sm font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center justify-center gap-2"
                  >
                    <ArrowRight className="h-4 w-4" /> Full Registration
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────
          14. AUDIENCE CREDIBILITY ("BUILT FOR...")
          ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/[0.08] relative">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">Engineered Purpose</span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Who REALVION Is Built For</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-5 rounded-2xl bg-[#0c0c0c] border border-white/[0.08] space-y-2">
            <Building className="h-6 w-6 text-[#C8A45D] mx-auto" />
            <h4 className="text-xs sm:text-sm font-bold text-white">Channel Partner Firms</h4>
            <p className="text-[11px] text-slate-400 font-light">Managing multi-executive sales floors</p>
          </div>
          <div className="p-5 rounded-2xl bg-[#0c0c0c] border border-white/[0.08] space-y-2">
            <Users className="h-6 w-6 text-[#C8A45D] mx-auto" />
            <h4 className="text-xs sm:text-sm font-bold text-white">Real Estate Developers</h4>
            <p className="text-[11px] text-slate-400 font-light">Builders tracking sales mandates</p>
          </div>
          <div className="p-5 rounded-2xl bg-[#0c0c0c] border border-white/[0.08] space-y-2">
            <Compass className="h-6 w-6 text-[#C8A45D] mx-auto" />
            <h4 className="text-xs sm:text-sm font-bold text-white">Brokerage Agencies</h4>
            <p className="text-[11px] text-slate-400 font-light">High-volume primary market sales</p>
          </div>
          <div className="p-5 rounded-2xl bg-[#0c0c0c] border border-white/[0.08] space-y-2">
            <Shield className="h-6 w-6 text-[#C8A45D] mx-auto" />
            <h4 className="text-xs sm:text-sm font-bold text-white">Independent Brokers</h4>
            <p className="text-[11px] text-slate-400 font-light">Solo CP closers scaling client relationships</p>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────
          15. ENTERPRISE FAQ
          ───────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-12 max-w-4xl mx-auto border-t border-white/[0.08] space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">Platform Answers</span>
          <h2 className="text-3xl font-black text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
              className="p-5 rounded-2xl bg-[#0a0a0a] border border-white/10 cursor-pointer space-y-2 transition"
            >
              <div className="flex items-center justify-between font-semibold text-sm text-white">
                <span>{faq.q}</span>
                <HelpCircle className="h-4 w-4 text-[#C8A45D] shrink-0" />
              </div>
              {openFaqIndex === idx && (
                <p className="text-xs text-slate-400 pt-2 border-t border-white/5 leading-relaxed font-light text-left">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────
          16. FINAL CONVERSION LOCKUP & CTA
          ───────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-12 max-w-5xl mx-auto border-t border-white/[0.08]">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-[#121212] via-[#1a170d] to-[#121212] border border-[#C8A45D]/40 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C8A45D]/15 border border-[#C8A45D]/30 text-[#C8A45D] text-xs font-bold tracking-wide uppercase">
            <Sparkles className="h-4 w-4" /> Ready to See Your Real Estate Sales Operation Differently?
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Connect Every Lead, Visit, Booking, and Rupee of Revenue.
          </h2>

          <p className="text-sm sm:text-base text-slate-300 font-light max-w-xl mx-auto leading-relaxed">
            Bring leads, sales activity, property intelligence, site visits, bookings and revenue operations into one connected system.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 rounded-2xl text-sm font-bold text-black bg-gradient-to-r from-amber-500 via-[#C8A45D] to-yellow-400 hover:brightness-110 shadow-xl shadow-[#C8A45D]/30 transition transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              BOOK A REALVION DEMO <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onOpenDemo}
              className="px-7 py-4 rounded-2xl text-sm font-semibold text-slate-100 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-[#C8A45D]/50 transition flex items-center gap-2"
            >
              SEE REALVION IN ACTION
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
