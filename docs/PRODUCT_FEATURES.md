# 🏢 REALVION – Complete Product Features & Architecture Manual

> **Product**: REALVION – Enterprise Real Estate Operating System & Multi-Tenant SaaS Platform  
> **Version**: 2.5.0  
> **Date**: September 2026  
> **Audience**: Platform Owners, Product Managers, Developers, and Sales Leadership  

---

## 📑 Table of Contents

1. [Executive Summary & Core Value Proposition](#1-executive-summary--core-value-proposition)
2. [Multi-Tenant SaaS Engine & Tenant Governance](#2-multi-tenant-saas-engine--tenant-governance)
3. [Universal Lead Ingestion & Attribution Engine](#3-universal-lead-ingestion--attribution-engine)
4. [Dynamic Lead Pipeline, Health & Priority Scoring](#4-dynamic-lead-pipeline-health--priority-scoring)
5. [AI CRM Copilot & Live Human Support Escalation](#5-ai-crm-copilot--live-human-support-escalation)
6. [VIP Site Visit Operating System (Site Visit OS)](#6-vip-site-visit-operating-system-site-visit-os)
7. [Inventory Matching & Real Estate Cost Sheet OS](#7-inventory-matching--real-estate-cost-sheet-os)
8. [Buyer KYC & Document Verification Vault](#8-buyer-kyc--document-verification-vault)
9. [Omnichannel Communications: WhatsApp & VoIP Telephony](#9-omnichannel-communications-whatsapp--voip-telephony)
10. [Web Audio Harmonic Chimes & Spoken TTS Reminders](#10-web-audio-harmonic-chimes--spoken-tts-reminders)
11. [Channel Partner Broker Network & Co-Broking OS](#11-channel-partner-broker-network--co-broking-os)
12. [Multi-Stage Commission Lifecycle & Revenue OS](#12-multi-stage-commission-lifecycle--revenue-os)
13. [No-Code Automation Hub & Visual Workflow Rules](#13-no-code-automation-hub--visual-workflow-rules)
14. [Revenue Funnel Analytics, Team Targets & Scorecards](#14-revenue-funnel-analytics-team-targets--scorecards)
15. [Public Marketing Website & Instant Sandbox Demo Engine](#15-public-marketing-website--instant-sandbox-demo-engine)
16. [Role-Based Access Control (RBAC) & Security Boundaries](#16-role-based-access-control-rbac--security-boundaries)
17. [Full Technical Stack & Repository Directory Map](#17-full-technical-stack--repository-directory-map)
18. [Comprehensive End-to-End Automated QA Testing Suite](#18-comprehensive-end-to-end-automated-qa-testing-suite)

---

## 1. Executive Summary & Core Value Proposition

**REALVION** is a comprehensive, multi-tenant real estate operating system engineered specifically for property developers, agency owners, sales executives, and channel partners (brokers). 

Unlike generic CRMs, REALVION is tailored around the real-world real estate transaction lifecycle:
* **Pre-sales**: Instant multi-channel ingestion, automated response SLAs, bi-directional inventory matching, and AI-assisted objection handling.
* **On-Ground Operations**: Chauffeur logistics, 4-digit pickup OTP verification, and voice chime reminders.
* **Transaction Closing**: Dynamic cost sheets with floor rise and PLC charges, payment milestone tracking, KYC document vaults, and 1-click token bookings.
* **Post-Sales & Payouts**: Multi-tier broker commissions, co-broking deal splits, and SaaS tenant subscription billing.

---

## 2. Multi-Tenant SaaS Engine & Tenant Governance

### Isolated Workspaces & Organization Containers
* Every tenant operates within an isolated `Organization` and `Workspace` boundary.
* Built-in multi-tenancy enforcement at the database query level ensures that leads, deals, documents, and customer data never leak between agencies.

### Tiered Subscription Plans & Quotas
* **Starter**: ₹999/mo – 5 user seats, 1,000 active leads.
* **Professional**: ₹4,999/mo – 15 user seats, 5,000 active leads.
* **Enterprise**: ₹14,999/mo – 50 user seats, 25,000 active leads, custom branding, and priority SLA.

### Razorpay Payment Integration & Lifecycle
* **Order Generation & Verification**: Native Razorpay order creation (`/api/v1/payments/create-order`) with HMAC-SHA256 signature verification upon checkout completion.
* **Discount Coupons**: In-checkout coupon validation engine (e.g., `REALVION20` for 20% instant discount).
* **Asynchronous Webhooks**: Handles payment capture, failure retries, subscription status transitions, and audit logs.
* **License Key Auto-Provisioning**: Issues tamper-evident license tokens with seat and date constraints upon payment.

### Super Admin Platform Control Center (`/admin/saas`)
* **Global Executive Metrics**: Real-time aggregation of Monthly Recurring Revenue (MRR), Annual Recurring Revenue (ARR), Month-over-Month (MoM) growth rates, and tenant churn.
* **Tenant Lifecycle Management**: One-click offline tenant creation, seat/lead quota expansions, and subscription validity extensions.
* **Platform Security & Audits**: Anti-abuse detection for disposable emails and duplicate phone registrations.

---

## 3. Universal Lead Ingestion & Attribution Engine

### Multi-Channel Ingestion Adapters
REALVION includes universal payload parsers for all prominent Indian and global property portals:
1. **Meta Lead Ads (Facebook & Instagram)**: Native webhook parser extracting adset, campaign, full name, phone number, and budget range.
2. **Housing.com**: Integration adapter for Housing.com buyer inquiries with locality and configuration mapping.
3. **99acres**: XML/JSON webhook parsing for verified property seeker inquiries.
4. **MagicBricks**: Automated parser for buyer lead posts.
5. **Google Ads & Zapier**: Generic REST webhook endpoint (`/api/v1/ingest` and `/ingest`) for third-party automation tools.
6. **Bulk CSV Import**: Client-side CSV parser with visual column mapping to standardize existing spreadsheets into active CRM leads.

### Normalization, Deduplication & Smart Assignment
* **E.164 Phone Normalization**: Automatically strips punctuation, cleans leading zeroes, and formats Indian mobile numbers to standard `+91XXXXXXXXXX`.
* **Lead Deduplication**: Matches inbound inquiries against existing phone numbers, appending fresh campaign tags and notes rather than creating duplicate customer profiles.
* **Automated Lead Routing**:
  * Round-robin distribution across active team members.
  * Capacity-based routing based on current open lead volume.
  * Instant auto-generation of welcome tasks and audio chime notifications.

---

## 4. Dynamic Lead Pipeline, Health & Priority Scoring

### 7-Stage Deal Workflow
Standardized real estate deal stages with complete transition audit histories:
$$\text{New} \longrightarrow \text{Contacted} \longrightarrow \text{Qualified} \longrightarrow \text{Site Visit Scheduled} \longrightarrow \text{Negotiation} \longrightarrow \text{Booked} \longrightarrow \text{Lost}$$

### Real-Time Lead Health Engine (Score: 0–100)
* Computes an algorithmic health score based on:
  * **Deal Value / High-Value Flag**: Highlights prospects with budgets $\ge$ ₹1 Crore (100 Lakhs).
  * **Stage Velocity**: Flags leads lingering too long in early stages.
  * **Interaction Recency**: Alerts when days since the last call or note exceed healthy limits.
  * **Pending Tasks**: Deducts score points if follow-up commitments are overdue.

### Stage Advisor & Next Best Action
* Contextual sales coaching engine that generates:
  * **Talking Points**: Tailored conversation starters based on the client's preferred configuration (e.g., 3 BHK) and locality.
  * **Channel Recommendation**: Suggests whether to Call (for urgent or high-value leads) or WhatsApp (for first-touch qualification).
  * **Stage Readiness Check**: Identifies missing blockers (e.g., missing phone number, incomplete KYC) before advancing to the next stage.

### Today's Priority Board
* Daily mission-control widget ranking:
  1. Overdue follow-ups requiring immediate mitigation.
  2. High-priority appointments scheduled for today.
  3. High-value prospects in active negotiation.
  4. Stagnant untouched inbound leads.

---

## 5. AI CRM Copilot & Live Human Support Escalation

### RAG-Powered Real Estate Copilot (`/api/v1/copilot/query`)
* **Entity Extraction**: Recognizes budgets (e.g., "1.5 Cr", "85 Lakhs"), apartment configurations ("2 BHK", "Villa"), property names, and stages from natural language queries.
* **Context Grounding**: Pulls relevant live CRM records (matching projects, lead history, open follow-ups) into the context window.
* **Domain Playbooks**: Augments queries with proven objection-handling strategies for common buyer hesitations (e.g., "Price is too high", "Possession is delayed", "Looking for better location").
* **OpenAI Integration with Local Deterministic Fallback**: Powered by OpenAI GPT-4o-mini; if an API key is absent or offline, a local rule-based RAG engine supplies factually accurate answers from CRM records with zero downtime.
* **Action Deep-Links**: Automatically returns clickable UI action links directly into the user's interface.

### Integrated Human Support Escalation
* When the AI Copilot cannot resolve complex queries, sales agents can tap "Request Human Agent".
* Multi-user support ticketing system with open, assigned, and resolved states.
* Real-time conversation thread connecting sales executives with Tenant Admins or Super Admins.

---

## 6. VIP Site Visit Operating System (Site Visit OS)

### Logistics & Chauffeur Coordination
* Centralized dashboard to schedule property walkthroughs with pickup and drop-off coordination.
* Records driver names, contact numbers, cab registration details, and scheduled pickup timestamps.

### 4-Digit OTP Client Verification
* Generates an automated 4-digit security code for client pickup and on-site arrival verification.
* Validates that the prospect physically arrived at the project site before triggering sales progression.

### Post-Visit Feedback & Intent Capture
* Collects immediate buyer ratings (`Hot`, `Warm`, `Cold`).
* Records specific unit preferences, buyer objections (e.g., vastu alignment, pricing, payment schedule), and auto-schedules next-day follow-up agendas.

---

## 7. Inventory Matching & Real Estate Cost Sheet OS

### Bi-Directional Inventory Matching Engine
* **Lead ➔ Projects**: Computes match percentages based on budget overlap, unit configuration (e.g., 2 BHK vs. 3 BHK), location proximity, and construction stage (Ready to Move vs. Under Construction).
* **Project ➔ Buyers**: Inverts the search to locate all qualified buyers in the database who fit a newly released inventory block or price reduction.

### Dynamic Real Estate Cost Sheet Calculator
* Computes accurate purchase estimates according to Indian real estate billing norms:
  * **Base Cost**: Super built-up area $\times$ Base rate per sq.ft.
  * **Floor Rise Premium**: Additional rate per sq.ft. for higher floors.
  * **Preferred Location Charges (PLC)**: Park facing, corner unit, or clubhouse view premiums.
  * **Statutory & Utility Charges**: Dedicated car parking, club membership, water/electricity infrastructure.
  * **GST Engine**: Applies standard 5% GST for under-construction units; automatically waives GST (0%) for Ready-to-Move properties with Occupancy Certificates (OC).
  * **Payment Milestones**: Generates milestone schedules (Booking token, Agreement, Foundation, Slab completion, Handover).
* **1-Click Quick Booking**: Converts an accepted cost sheet directly into a confirmed property booking record.

---

## 8. Buyer KYC & Document Verification Vault

### Secure Real Estate Document Storage
* Central repository linked to each buyer lead and booking record.
* Categorized document types: PAN Card, Aadhaar Card, Address Proof, Passport Photos, Allotment Letter, Builder-Buyer Agreement (BBA), and Payment Cheque Copies.

### Admin Verification Workflow
* Statuses: `Pending Verification`, `Verified`, `Rejected`.
* Admins can approve documents or reject them with mandatory audit notes detailing why a resubmission is required.

---

## 9. Omnichannel Communications: WhatsApp & VoIP Telephony

### WhatsApp Workflow Engine
* One-click WhatsApp message dispatch with automatic variable interpolation (`{lead_name}`, `{project_name}`, `{rep_name}`, `{due_date}`).
* Pre-configured templates:
  * **Lead Qualification & Discovery**
  * **Site Visit Confirmation with Google Maps Location Pin**
  * **Post-Visit Experience & Digital Brochure**
  * **Token / Installment Payment Reminders**
  * **Cold Lead Database Reactivation**
* Automatically creates an activity log entry and updates lead health metrics upon sending.

### VoIP Telephony & Call Logger
* Tracks call direction (`Inbound`, `Outbound`), status (`Connected`, `Missed`, `Voicemail`), and outcome (`Interested`, `Call Back`, `Not Reachable`).
* Stores call durations, call recording audio URLs, and AI call summaries.
* Automatically resets first-response SLA timers upon successful connection.

---

## 10. Web Audio Harmonic Chimes & Spoken TTS Reminders

### In-Browser Dual-Harmonic Chime Synthesizer
* Native Web Audio API audio engine that generates a 4-note musical chime ($C_5 \rightarrow E_5 \rightarrow G_5 \rightarrow C_6$) without relying on external MP3 audio assets.
* Active background polling every 8 seconds checks for due or overdue follow-up tasks.

### Text-to-Speech Spoken Voice Alerts
* Utilizes the browser's native Web Speech API synthesis engine to verbally state task details:
  > *"Reminder Alert! You have a scheduled Call with Rajesh Kumar for Sky High Towers."*
* Floating alarm modal provides 1-tap quick actions: **Call Now** (`tel:...`), **Snooze 15 Minutes**, or **Mark Completed**.

---

## 11. Channel Partner Broker Network & Co-Broking OS

### Brokerage Firm & Agent Registry
* Maintain records of partner channel partner agencies, independent brokers, and RERA registration numbers.
* Categorize brokers into performance tiers (Gold, Silver, Platinum) with custom default commission percentages.

### Co-Broking Deal Collaboration
* Supports external broker collaboration where an agency shares inventory with an outside broker.
* Tracks deal split percentages, joint site visits, and co-broking authorization terms.

---

## 12. Multi-Stage Commission Lifecycle & Revenue OS

### Commission Calculation Engine
* Calculates commissions on property agreement values.
* Handles internal sales executive bonuses alongside external channel partner payouts.

### Multi-Stage Milestone Payout Tracking
* Tracks commission statuses across standard industry payment gates:
  $$\text{Initiated} \longrightarrow \text{Builder Invoiced} \longrightarrow \text{Partially Paid} \longrightarrow \text{Fully Paid}$$
* Prevents revenue leakage by reconciling builder payment releases against internal sales payouts.

---

## 13. No-Code Automation Hub & Visual Workflow Rules

### Visual Automation Rule Builder
* Enables non-technical managers to construct automated IF-THIS-THEN-THAT business logic.

### Supported Triggers & Actions
* **Triggers**:
  * Lead Ingested / Created
  * Lead Stage Changed
  * Site Visit Completed
  * Booking Confirmed
* **Conditions**:
  * Budget thresholds ($\ge$, $\le$)
  * Source matches (e.g., source equals Meta Ads)
  * Preferred configuration matches
* **Automated Actions**:
  * Reassign lead to specialized senior closer
  * Automatically set priority to Urgent
  * Schedule reminder tasks
  * Dispatch internal app notifications

---

## 14. Revenue Funnel Analytics, Team Targets & Scorecards

### Full Revenue Funnel Analytics
* Real-time funnel tracking showing:
  * Total Inquiries $\longrightarrow$ Qualified Prospects $\longrightarrow$ Site Visits Scheduled $\longrightarrow$ Site Visits Completed $\longrightarrow$ Booked Units.
  * Stage-by-stage drop-off percentages and conversion velocities.
  * Channel attribution metrics comparing Cost Per Acquisition (CPA) across Meta Ads, 99acres, Housing.com, and Referrals.

### Sales Targets & Executive Scorecards
* Assigns monthly revenue targets (in INR Lakhs) and unit volume quotas per executive.
* Team-wide leaderboard celebrating top performers.
* Individual executive scorecards displaying closing ratios, average response times, and monthly payout progress.

---

## 15. Public Marketing Website & Instant Sandbox Demo Engine

### Modern Public Marketing Suite (`/website`)
* Built with React 18, Vite, and Tailwind CSS using a sleek dark and gold aesthetic (`#090D16` / `#C8A45D`).
* Comprehensive pages: **Home**, **Solutions**, **Features**, **Pricing**, **Industries**, **About**, **Blog**, **FAQ**, **Contact**, **Terms of Service**, and **Security Specs**.

### 1-Hour Instant Demo Onboarding Wizard
1. **Step 1**: Agency name, user name, corporate email, and phone number.
2. **Step 2**: 6-digit OTP email verification code dispatched via the background email service.
3. **Step 3**: Instant creation of an isolated sandbox tenant loaded with sample properties, active leads, and follow-ups.
4. **Trial Expiration Guard**: An automated 60-minute countdown banner allows the user to explore the full CRM before seamlessly upgrading to a paid subscription via Razorpay.

---

## 16. Role-Based Access Control (RBAC) & Security Boundaries

| Role | Access URL | Permissions & Capabilities |
| :--- | :--- | :--- |
| **Super Admin** | `/admin/saas` | Global platform owner. Manages global MRR/ARR, tenant provisioning, seat quotas, and system health. |
| **Tenant Admin** | `/admin/dashboard` | Agency owner. Full tenant access: team users, projects, lead assignments, commission approvals, automation rules, billing. |
| **Manager** | `/admin/dashboard` | Sales team lead. Oversees lead pipelines, site visit schedules, broker records, and performance reports. |
| **Sales Executive** | `/sales/dashboard` | Individual salesperson. Scoped access: view assigned leads, schedule follow-ups, conduct site visits, calculate cost sheets, view personal commissions. |
| **Broker Partner** | `/sales/dashboard` | External channel partner. View published project inventory, register buyer leads, and track commission payout statuses. |

---

## 17. Full Technical Stack & Repository Directory Map

### Technology Stack
* **Backend API**: Python 3.11, FastAPI (ASGI), SQLAlchemy 2.0 ORM, Alembic migrations, Pydantic v2 schemas, Sentry error monitoring, Passlib Bcrypt, PyJWT.
* **CRM Portal Frontend**: React 18, Vite, TypeScript, TanStack Table v8, Framer Motion, Lucide React, Web Audio API, Web Speech API, Axios with dynamic origin interceptors.
* **Public Website**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion.
* **QA Test Suite**: Playwright TypeScript, Chromium/WebKit/Firefox headless runners.

### Backend API Routers (25 Modules)
* `/api/v1/auth` – Authentication, login, JWT refresh tokens
* `/api/v1/users` – User management and team roles
* `/api/v1/builders` – Property builders & developer profiles
* `/api/v1/projects` – Real estate projects, floor plans, specifications
* `/api/v1/leads` – 7-stage lead pipeline, health scores, note drawers
* `/api/v1/site_visits` – VIP site visit scheduling, chauffeur logistics, 4-digit OTP
* `/api/v1/followups` – Task reminders, agendas, snooze actions
* `/api/v1/bookings` – Unit deal bookings, payment tokens, status updates
* `/api/v1/commissions` – Multi-stage commission lifecycle & payouts
* `/api/v1/documents` – Buyer KYC document vault and verification
* `/api/v1/brokers` – Channel partner brokers and co-broking collaboration
* `/api/v1/sales` – Monthly sales targets, quotas, and leaderboards
* `/api/v1/reports` – Executive analytics, conversion rates, funnel metrics
* `/api/v1/notifications` – Real-time in-app alerts and task reminders
* `/api/v1/activity_logs` – Enterprise audit trail and user action history
* `/api/v1/settings` – Tenant branding, company info, and pipeline settings
* `/api/v1/saas` – Public SaaS registration, OTP validation, 1-hour demo setup
* `/api/v1/payments` – Razorpay orders, coupon discounts, signature verification, webhooks
* `/api/v1/saas_admin` – SuperAdmin tenant control, ARR/MRR metrics, quota tools
* `/api/v1/whatsapp` – WhatsApp template dispatch and communication logs
* `/api/v1/calls` – VoIP telephony call logger, outcomes, recording URLs
* `/api/v1/automation` – Visual automation hub rules and trigger evaluation
* `/api/v1/copilot` – AI Real Estate RAG Copilot and support ticket escalation
* `/api/v1/ingest` & `/ingest` – Universal multi-channel lead ingestion webhooks
* `/api/v1/lead_sources` – Lead source integration configuration and attribution

---

## 18. Comprehensive End-to-End Automated QA Testing Suite

Located in `qa-tests/tests/`, the 12 Playwright test specifications provide automated regression testing:
1. `01-marketing-website.spec.ts` – Landing page navigation, pricing plans, contact forms.
2. `02-registration-flow.spec.ts` – 3-step onboarding wizard, email OTP verification, anti-abuse guards.
3. `03-demo-and-payment.spec.ts` – 1-hour sandbox countdown banner and Razorpay checkout triggers.
4. `04-security-and-session.spec.ts` – JWT expiration, unauthenticated redirects, role guards.
5. `05-full-ui-verification.spec.ts` – Glassmorphic dark styling, gold accents, layout bounds.
6. `06-full-tenant-isolation.spec.ts` – Validates that tenant data never leaks across organizations.
7. `07-final-two-gaps.spec.ts` – Edge-case UI modal behaviors and deep state transitions.
8. `08-autonomous-dom-crawl.spec.ts` – Autonomous crawler verifying zero unhandled console errors across all admin routes.
9. `09-table-viewports-and-sales-crawl.spec.ts` – Responsive viewports (mobile, tablet, desktop) for TanStack tables.
10. `10-nav-state-and-table-interactions.spec.ts` – Search filters, pagination controls, sorting states.
11. `11-local-dom-crawl-bug-analysis.spec.ts` – Deep DOM traversal and runtime health checks.
12. `12-whatsapp-click-to-chat.spec.ts` – Verifies WhatsApp link construction and dynamic phone formatting.

---
*REALVION – Enterprise Real Estate Operating System & Multi-Tenant SaaS Platform*
