# 🏢 REALVION – Master Real Estate CRM & Website Documentation

> **Version**: 2.0.0  
> **Architecture**: Decoupled Monorepo Ecosystem (FastAPI Backend + React Vite Portal + React Vite Marketing Website + Flutter Multi-Platform App)  
> **Deployment**: Render Blueprint (`render.yaml`) & Multi-Platform Desktop/Mobile Ready  

---

## 📖 Executive Summary

**REALVION** is an enterprise-grade, high-performance Real Estate Channel Partner (CP) SaaS, Public Marketing Platform, and Brokerage Management System. Built specifically for real estate developers, agencies, channel partners, and sales teams, it unifies lead pipelines, property bookings, broker commission payouts, sales targets, dynamic public web inquiries, and real-time client follow-ups.

---

## 🛠️ Technology Stack & Platform Components

### 1. **Public Marketing Website (`web_based_crm/website`)**
* **Framework**: React 18 with TypeScript & Vite
* **Styling**: Tailwind CSS Tokens, Custom Dark Aesthetic
* **UI Components**: Framer Motion (Page & Modal Animations), Lucide React (Icons)
* **Routes & Pages**:
  * `/` – **HomePage**: Platform highlights, hero section, social proof, pricing previews
  * `/solutions` – **SolutionsPage**: Tailored real estate agency & developer solutions
  * `/features` – **FeaturesPage**: Dynamic feature catalog & technology deep-dives
  * `/pricing` – **PricingPage**: Interactive SaaS pricing matrix & plan comparison
  * `/industries` – **IndustriesPage**: Residential, commercial, and land developer use cases
  * `/about` – **AboutPage**: Corporate story, vision, and technology stack
  * `/blog` – **BlogPage**: Real estate sales strategies & market insights
  * `/faq` – **FaqPage**: System capabilities, security, and onboarding FAQ
  * `/contact` – **ContactPage**: Contact form, sales inquiries, and support routing
  * `DemoModal` – **Interactive Demo Request**: Global pop-up request modal

### 2. **Web CRM Application Portal (`web_based_crm/frontend`)**
* **Framework**: React 18 with TypeScript & Vite
* **Styling**: Custom Glassmorphism CSS Design System (`index.css`), Dark Theme Palette
* **UI Components**: TanStack Table v8 (Data Grids, Pagination & Filtering), Framer Motion (Drawers & Modals), Lucide React
* **Audio & Speech APIs**:
  * **Web Audio API**: Dual-harmonic sine-wave chime sound synthesizer ($C_5 \rightarrow E_5 \rightarrow G_5 \rightarrow C_6$).
  * **Web Speech API**: Native text-to-speech voice synthesizer for spoken reminder alerts.
* **HTTP Client**: Axios with JWT Request/Response Interceptors, Auto-Refresh Tokens, and Hostname-based Production API Fallback (`https://web-based-crm.onrender.com/api/v1`).


### 3. **Backend API Architecture (`web_based_crm/backend`)**
* **Framework**: Python 3.11 + FastAPI (Asynchronous ASGI Web Framework)
* **ORM & Database**: SQLAlchemy 2.0 ORM with SQLite (Local) & PostgreSQL Support
* **Security & Auth**: OAuth2 Password Bearer Tokens, PyJWT Token Encoding, Passlib (Bcrypt Password Hashing)
* **Validation**: Pydantic v2 Schemas & Data Normalization
* **Server**: Uvicorn ASGI Server & Gunicorn Production Process Manager

### 4. **Flutter Multi-Platform Client (`BOS`)**
* **Framework**: Flutter 3 & Dart 3
* **State Management**: `flutter_riverpod` 2.6.1 with annotation generators
* **Routing**: `go_router` 17.3.0 with `StatefulShellRoute` responsive navigation (`AppShell.dart`)
* **Mock Engine**: Deterministic seeded mock data engine (`MockDataGenerator`) with AI lead scoring (0–100%) and luxury property portfolios.

---

## 🔐 Security & Role-Based Access Control (RBAC)

Public self-registration is disabled for maximum enterprise security. Accounts are provisioned exclusively by system administrators.

| Role | Access Scope & Permissions | Portal URL |
| :--- | :--- | :--- |
| **Super Admin** (`Admin`) | Full system control: Manage Sales Team, Create Sales Executives & Share Credentials, Configure Projects/Builders, Track All Commissions, Assign Revenue Targets. | `/admin/dashboard` |
| **Manager** (`Manager`) | Team oversight, inventory catalogs, lead pipeline analytics, and followup tracking. | `/admin/dashboard` |
| **Sales Executive** (`Sales Executive`) | Persona-scoped access: Manage Assigned Buyer Leads, Log Client Interaction Notes, Schedule Personal Follow-ups, Track Monthly Targets & Bookings. | `/sales/dashboard` |
| **Broker Partner** (`Broker`) | View Channel Partner projects catalog, track closed deals, and view commission payout status. | `/sales/dashboard` |

---

## 🌟 Key Functional Modules

### 1. 🔔 Real-Time Voice & Audio Chime Reminder System
* **Automated Alarm Trigger**: Checks pending tasks every 8 seconds. When a scheduled follow-up time arrives, triggers a floating glassmorphic alert popup modal (`z-[9999]`).
* **Audio Chime & Spoken Alert**: Synthesizes a 4-note sound chime followed by a voice announcement (*"Reminder Alert! You have a scheduled [Call / Site Visit] with [Lead Name]"*).
* **Role-Scoped Reminders**: Sales Executives receive alerts **only** for their assigned tasks; Admins receive alerts **only** for self-scheduled tasks.
* **Actions**: 1-tap **Call Lead** (`tel:...`), **Snooze 15 Min**, and **Mark Completed**.

### 2. 🎯 Sales Team Target & Performance Engine
* **Target Normalization**: Dynamically computes deal count and revenue totals in Lakhs (INR).
* **Automatic Target Provisioning**: When Admin creates a new Sales Executive, the system automatically initializes a target record (`SalesTarget`) for the current month (`YYYY-MM`).
* **Automatic Team Synchronization**: Ensures 100% of registered Sales Executives display in the Sales Team Performance grid.

### 3. 🏢 Projects & Developer Catalog (With On-the-Fly Creation)
* **Inline Developer Creation**: When registering a project, Admins can pick an existing builder OR select `➕ Add New Builder / Developer` to register a new builder inline (`new_builder_name`).
* **Property Specifications**: Min/Max Price (in Lakhs), RERA Registration ID, Construction Status (`Under Construction`, `Ready to Move`, `New Launch`, `Sold Out`), Brochure PDF Links, and Amenities.

### 4. 📞 Dynamic Lead Pipeline & Real-Time Lead Drawer
* **7-Stage Pipeline**: `New` $\rightarrow$ `Contacted` $\rightarrow$ `Qualified` $\rightarrow$ `Site Visit Scheduled` $\rightarrow$ `Negotiation` $\rightarrow$ `Booked` $\rightarrow$ `Lost`.
* **Real-Time Lead Drawer**: Instant local UI updates and live activity log note synchronization across active sessions.

---

## 🗄️ Database Architecture & Data Models

```
┌────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     User       │1     *│      Lead       │1     *│    Followup     │
├────────────────┤───────┼─────────────────┤───────┼─────────────────┤
│ id (PK)        │       │ id (PK)         │       │ id (PK)         │
│ name, email    │       │ name, phone     │       │ title, type     │
│ role           │       │ status, budget  │       │ scheduled_at    │
└────────────────┘       └─────────────────┘       └─────────────────┘
        │1                        │1                        │
        │                         │                         │
        │*                        │*                        │
┌────────────────┐       ┌─────────────────┐                │
│  SalesTarget   │       │     Booking     │                │
├────────────────┤       ├─────────────────┤                │
│ month_year     │       │ total_deal_val  │                │
│ target_amount  │       │ unit_number     │                │
└────────────────┘       └─────────────────┘                │
```

---

## 📡 API Endpoint Reference (14 Modular Services)

| Method | Endpoint | Description | Role Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Authenticate user & issue JWT Access/Refresh tokens | Public |
| `GET` | `/api/v1/auth/me` | Retrieve current authenticated user profile | Authenticated |
| `GET` | `/api/v1/users` | List system users (filtered by role) | Admin / Manager |
| `POST` | `/api/v1/users` | Register new user / Sales Executive & issue credentials | Admin |
| `GET` | `/api/v1/builders` | List real estate builders / developers | Authenticated |
| `POST` | `/api/v1/builders` | Create new builder profile | Admin / Manager |
| `GET` | `/api/v1/projects` | List property projects | Authenticated |
| `POST` | `/api/v1/projects` | Create property project (with optional inline builder) | Admin / Manager |
| `GET` | `/api/v1/leads` | List buyer leads (scoped by user role) | Authenticated |
| `POST` | `/api/v1/leads` | Create new buyer lead | Authenticated |
| `GET` | `/api/v1/followups` | Retrieve pending/completed follow-up agenda | Authenticated |
| `POST` | `/api/v1/followups` | Schedule new follow-up task | Authenticated |
| `GET` | `/api/v1/brokers` | List external channel partner brokers | Admin / Manager |
| `POST` | `/api/v1/brokers` | Register broker firm or single broker partner | Admin / Manager |
| `GET` | `/api/v1/sales/targets` | Get sales targets & dynamic revenue achievements | Authenticated |
| `POST` | `/api/v1/sales/targets` | Assign/update monthly revenue target | Admin / Manager |
| `GET` | `/api/v1/bookings` | List deal bookings | Authenticated |
| `POST` | `/api/v1/bookings` | Record new property booking | Authenticated |
| `GET` | `/api/v1/commissions` | List commission override calculations | Admin / Manager |
| `GET` | `/api/v1/reports/dashboard-stats` | Aggregated executive dashboard KPI metrics | Authenticated |

---

## 💻 Local Development & Setup

### 1. **Backend Setup**:
```powershell
cd web_based_crm/backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload --port 8001
```

### 2. **Web CRM Portal Setup**:
```powershell
cd web_based_crm/frontend
npm install
npm run dev -- --port 5173
```

### 3. **Public Website Setup**:
```powershell
cd web_based_crm/website
npm install
npm run dev -- --port 5174
```

---

## 🔑 Default Initial Credentials

* **Super Admin**: `admin@brokeros.com` *(or `admin@realvion.com`)* | Password: `Admin@123`
* **Sales Executive**: `sales@brokeros.com` *(or `sales@realvion.com`)* | Password: `Sales@123`
* **Manager**: `manager@brokeros.com` *(or `manager@realvion.com`)* | Password: `Manager@123`

---
*REALVION – Master Real Estate Operating System & Marketing Platform*
