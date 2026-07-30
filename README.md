# 🏢 BrokerOS Lite – Real Estate CRM

> Enterprise Real Estate Channel Partner (CP) SaaS & Brokerage CRM Platform.

---

## 🌟 Key Features

- 🔑 **Role-Based Access Control**: Super Admin, Manager, Sales Executive, and Broker CP portals.
- 🔔 **Voice & Audio Chime Reminder System**: Web Audio API sine-wave chime + Web Speech API spoken reminder alerts with floating alarm modal.
- 🎯 **Automated Sales Target Engine**: Dynamic deal count and revenue aggregation in Lakhs (INR). Auto-provisions targets for new Sales Executives.
- 🏢 **Projects & Developers Catalog**: Properties listing with inline developer auto-creation (`new_builder_name`).
- 📞 **Dynamic Lead Pipeline**: 7-stage status workflow with 0ms real-time Lead Drawer notes & timeline history sync.
- 🤝 **Channel Partner Broker Network**: Register brokerage firms or single independent brokers with commission overrides.
- 🌐 **Render Deployment Ready**: 1-click `render.yaml` blueprint with automatic database table initialization and startup account seeding.

---

## 🚀 Quick Start

### 1. **Backend (FastAPI + Python 3.11)**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. **Frontend (React 18 + Vite + TypeScript)**
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Initial Accounts

- **Super Admin**: `admin@brokeros.com` | `Admin@123`
- **Sales Executive**: `sales@brokeros.com` | `Sales@123`
- **Manager**: `manager@brokeros.com` | `Manager@123`

---

## 📖 Full Documentation
For complete technical documentation, database schemas, and API reference, see [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md).
