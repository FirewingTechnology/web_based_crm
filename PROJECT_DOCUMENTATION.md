# 🏢 BrokerOS Lite – Real Estate CRM Documentation

> **Version**: 1.0.0  
> **Architecture**: Decoupled Monorepo (FastAPI Backend + React Vite TypeScript Frontend)  
> **Deployment**: Render Blueprint (`render.yaml`) Ready  

---

## 📖 Executive Summary

**BrokerOS Lite** is an enterprise-grade, high-performance Real Estate Channel Partner (CP) SaaS and Brokerage Management Platform. Built specifically for real estate developers, agencies, and sales teams, it streamlines lead pipelines, property bookings, broker commission payouts, sales targets, and real-time client follow-ups.

---

## 🛠️ Technology Stack

### 1. **Frontend Architecture**
* **Framework**: React 18 with TypeScript & Vite
* **Styling**: Custom Glassmorphism CSS Design System (`index.css`), TailwindCSS Tokens
* **UI Components**: Framer Motion (Modal & Drawer Animations), Lucide React (Icons), TanStack Table v8 (Data Grids & Pagination)
* **Audio & Speech APIs**:
  * **Web Audio API**: Real-time dual-harmonic sine-wave chime sound synthesizer ($C_5 \rightarrow E_5 \rightarrow G_5 \rightarrow C_6$).
  * **Web Speech API**: Native text-to-speech voice synthesizer for spoken reminder alerts.
* **HTTP Client**: Axios with JWT Request/Response Interceptors, Auto-Refresh Tokens, and Hostname-based Production API Fallback (`https://web-based-crm.onrender.com/api/v1`).

### 2. **Backend Architecture**
* **Framework**: Python 3.11 + FastAPI (Asynchronous ASGI Web Framework)
* **ORM & Database**: SQLAlchemy 2.0 ORM with SQLite (Local) & PostgreSQL Support
* **Security & Auth**: OAuth2 Password Bearer Tokens, PyJWT Token Encoding, Passlib (Bcrypt Password Hashing)
* **Validation**: Pydantic v2 Schemas & Data Normalization
* **Server**: Uvicorn ASGI Server & Gunicorn Production Process Manager

---

## 🔐 Security & Role-Based Access Control (RBAC)

Public self-registration is disabled for maximum enterprise security. Accounts are provisioned exclusively by the Administrator.

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
* **Real-Time Lead Drawer**: 0ms local UI updates and 4-second background polling to sync activity notes and status timeline history live across sessions.

### 5. 🤝 External Broker Network (Single Brokers & Firms)
* **Single Broker Registration**: Support for individual independent brokers (*Ramesh Kumar (Independent Broker)*) as well as brokerage agencies/firms.
* **Commission Shares**: Custom override commission percentages per builder/broker.

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

### Table Definitions:
1. **`users`**: System user credentials, hashed passwords, roles (`Admin`, `Manager`, `Sales Executive`, `Broker`).
2. **`builders`**: Real estate developers, contact details, standard commission rates.
3. **`projects`**: Property inventory listings linked to `builders.id`.
4. **`leads`**: Buyer leads, assigned sales executive (`assigned_to_id`), status, budget, location preferences.
5. **`lead_notes`**: Activity notes linked to `leads.id` and `users.id`.
6. **`lead_status_history`**: Audit trail of status transitions.
7. **`followups`**: Scheduled tasks (`Call`, `WhatsApp`, `Site Visit`) linked to `leads.id` and `users.id`.
8. **`broker_profiles`**: Channel partner profiles and performance scores.
9. **`sales_targets`**: Monthly target benchmarks and dynamic deal closures.
10. **`bookings`**: Confirmed deal bookings linked to `leads.id`, `projects.id`, and `users.id`.
11. **`commissions`**: Earned broker and executive payouts.

---

## 📡 API Endpoint Reference (16 Core Services)

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

## 🚀 Deployment Guide (Render 1-Click Blueprint)

### Environment Variables Matrix

#### Backend Environment Variables:
* `API_V1_STR`: `/api/v1`
* `PROJECT_NAME`: `BrokerOS Lite Real Estate CRM`
* `SECRET_KEY`: `your_random_jwt_secret_key`

#### Frontend Environment Variables:
* `VITE_API_URL`: `https://web-based-crm.onrender.com/api/v1`

---

## 💻 Local Development Setup

### 1. **Backend Setup**:
```bash
cd backend
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. **Frontend Setup**:
```bash
cd frontend
npm install
npm run dev -- --port 5173
```

---

## 🔑 Default Initial Credentials

* **Super Admin**: `admin@brokeros.com` | Password: `Admin@123`
* **Sales Executive**: `sales@brokeros.com` | Password: `Sales@123`
* **Manager**: `manager@brokeros.com` | Password: `Manager@123`

---
*BrokerOS Lite CRM – Enterprise Real Estate Channel Partner Solution*
