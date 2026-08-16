# 🏢 REALVION – Enterprise Real Estate Operating System & SaaS Platform

> Multi-Tenant SaaS Platform for Real Estate Developers, Agencies, Channel Partners (CP), and Sales Teams.

---

## 🌟 Key Features

- 🔑 **Multi-Tenant SaaS Architecture**: Isolated organizations, custom workspaces, subscription tiers (Starter, Professional, Enterprise), and seat/lead quotas.
- ⚡ **1-Hour Sandbox Demo Engine**: Instant workspace auto-provisioning with pre-seeded demo leads, properties, and expiration timers.
- 💳 **Razorpay Payment Integration**: Integrated payment checkout, coupon support (`REALVION20`), HMAC signature validation, and webhooks.
- 👑 **Super Admin Owner Control**: Dedicated platform owner dashboard (`/admin/saas`) for global MRR, ARR, MoM growth metrics, and tenant management.
- 🔔 **Voice & Audio Chime Reminder System**: Web Audio API dual-harmonic sine-wave chime + Web Speech API spoken reminder alerts with floating alarm modal.
- 🎯 **Automated Sales Target Engine**: Dynamic deal count and revenue aggregation in Lakhs (INR). Auto-provisions targets for new Sales Executives.
- 🏢 **Projects & Developers Catalog**: Property listings with inline developer auto-creation (`new_builder_name`).
- 📞 **Dynamic Lead Pipeline**: 7-stage status workflow with live activity log notes drawer.
- 🤝 **Channel Partner Broker Network**: Register brokerage firms or single independent brokers with commission overrides.
- 🧪 **Automated QA & E2E Test Suite**: 12 Playwright test specifications covering DOM crawling, security boundaries, tenant isolation, and payment flows.
- 🌐 **Render Deployment Ready**: 1-click `render.yaml` blueprint with automatic database migrations and startup account seeding.

---

## 🚀 Quick Start

### 1. **Backend (FastAPI + Python 3.11)**
```bash
cd backend
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload --port 8001
```

### 2. **Web CRM Application Portal (React 18 + Vite)**
```bash
cd frontend
npm install
npm run dev -- --port 5173
```

### 3. **Public Marketing Website (React 18 + Vite)**
```bash
cd website
npm install
npm run dev -- --port 5174
```

### 4. **QA Automation Suite (Playwright E2E)**
```bash
cd qa-tests
npm install
npx playwright test
```

---

## 🔑 Initial Accounts

- **Super Admin / Platform Owner**: `admin@realvion.com` | `Admin@123`
- **Tenant Admin**: `admin@brokeros.com` | `Admin@123`
- **Sales Executive**: `sales@realvion.com` | `Sales@123`
- **Manager**: `manager@realvion.com` | `Manager@123`

---

## 📖 Full Technical Documentation
For full architecture overview, database schemas, 17 API endpoints reference, and QA testing structure, see [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md).
