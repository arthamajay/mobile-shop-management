# Vamshi Store Manager

A full-stack POS and inventory management system for a mobile phone retail chain with **3 branches** (Kukatpally, KPHB, Beeramguda). Gives the shop owner real-time visibility into every sale, every rupee, and every product across all locations — and actively detects staff theft and fraud.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [First-Time Setup (Seed Admin)](#first-time-setup-seed-admin)
- [User Roles & Permissions](#user-roles--permissions)
- [Key Business Rules](#key-business-rules)
- [API Overview](#api-overview)
- [Deployment](#deployment)
- [Security Notes](#security-notes)

---

## Features

| Module | Description |
|---|---|
| **Billing** | GST invoices with IMEI tracking, PDF generation, WhatsApp notification |
| **Inventory** | Product CRUD with soft-delete, IMEI-per-unit tracking, low-stock alerts |
| **Stock Transfers** | Inter-branch transfers with stock reservation and IMEI migration |
| **Cash Reconciliation** | End-of-day cash count vs expected — detects skimming |
| **Alerts** | Real-time SSE alerts for low stock, quick cancellations, cash mismatch |
| **Analytics** | Revenue charts, branch comparison, top products, employee performance |
| **Staff Management** | Add/deactivate salespersons, change branch assignment |
| **Fraud Detection** | Quick-cancel detection, excess cancellation alerts, cash mismatch alerts |

---

## Tech Stack

### Backend
| | |
|---|---|
| Runtime | Node.js |
| Framework | Express 4 |
| Database | MongoDB Atlas via Mongoose 8 |
| Auth | JWT (7-day tokens) + bcryptjs (salt 12) |
| Security | helmet, express-rate-limit, express-validator |
| Real-time | Server-Sent Events (SSE) |
| PDF | Puppeteer (headless Chromium) |
| HTTP logging | Morgan |

### Frontend
| | |
|---|---|
| Framework | React 18 + Vite 5 |
| Routing | React Router DOM v6 |
| Styling | Tailwind CSS v3 |
| Forms | react-hook-form v7 |
| Charts | Recharts |
| HTTP client | Axios with interceptors |
| UI | @headlessui/react, lucide-react |

---

## Project Structure

```
Vamshi_new/
├── backend/
│   ├── config/db.js               # Mongoose connection
│   ├── controllers/               # Business logic
│   ├── middleware/
│   │   ├── auth.js                # JWT authentication, requireAdmin
│   │   ├── activityLogger.js      # Audit log middleware
│   │   ├── validators.js          # express-validator chains
│   │   └── errorHandler.js        # Global error handler
│   ├── models/                    # Mongoose schemas
│   ├── routes/                    # Express routers
│   ├── scripts/
│   │   └── seedAdmin.js           # One-time admin account creation
│   ├── utils/
│   │   ├── alertEngine.js         # Alert creation + SSE broadcast
│   │   ├── cashReconciliationEngine.js
│   │   ├── imeiValidator.js       # Luhn algorithm
│   │   ├── pdfGenerator.js        # Puppeteer GST invoice
│   │   ├── userCache.js           # In-memory auth cache (5-min TTL)
│   │   └── whatsappService.js     # Optional WhatsApp notifications
│   ├── uploads/pdfs/              # Generated PDF invoices
│   ├── server.js                  # App entry point
│   ├── .env                       # Secret config (never commit)
│   └── .env.example               # Template — copy to .env
└── frontend/
    ├── src/
    │   ├── api/                   # Axios API wrappers
    │   ├── components/            # Reusable UI components
    │   ├── context/               # AuthContext, AlertContext
    │   ├── pages/                 # Page-level components
    │   └── routes/                # ProtectedRoute, AdminRoute
    ├── .env                       # Frontend env (VITE_API_BASE_URL)
    └── vite.config.js
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- A MongoDB Atlas cluster (free tier works)

### 1. Clone and install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env — fill in MONGO_URI, JWT_SECRET, FRONTEND_URL

# Frontend
# Edit frontend/.env — set VITE_API_BASE_URL to your backend URL
```

### 3. Seed the admin account

```bash
SEED_ADMIN_PASSWORD=YourStrongPassword123 node backend/scripts/seedAdmin.js
```

This creates:

| Field | Value |
|---|---|
| Email | `admin@vamshistore.com` |
| Role | admin |
| Password | whatever you set in `SEED_ADMIN_PASSWORD` |

> Store the password in a password manager — it will not be displayed after creation.

### 4. Start development servers

```bash
# Terminal 1 — backend (port 5001)
cd backend && npm run dev

# Terminal 2 — frontend (port 3000)
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default `5001`) |
| `NODE_ENV` | Yes | `development` or `production` |
| `MONGO_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Min 32 chars random string (64+ recommended) |
| `FRONTEND_URL` | Yes | CORS allowed origin (e.g. `http://localhost:3000`) |
| `WHATSAPP_API_URL` | No | WhatsApp Business API endpoint |
| `WHATSAPP_API_TOKEN` | No | WhatsApp API token |
| `SEED_ADMIN_PASSWORD` | Seed only | Password used by `scripts/seedAdmin.js` |
| `SEED_ADMIN_EMAIL` | No | Override seed admin email |
| `SEED_ADMIN_NAME` | No | Override seed admin name |

Generate a strong `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Backend base URL for direct asset links (PDF downloads) |

---

## First-Time Setup (Seed Admin)

The seed script creates the initial admin account. It is **idempotent** — safe to run multiple times.

```bash
# Minimal usage
SEED_ADMIN_PASSWORD=MyStrongPass123 node backend/scripts/seedAdmin.js

# With custom email/name
SEED_ADMIN_EMAIL=owner@myshop.com \
SEED_ADMIN_NAME="Shop Owner" \
SEED_ADMIN_PASSWORD=MyStrongPass123 \
node backend/scripts/seedAdmin.js
```

Additional salesperson accounts are created from the **Staff** page in the web UI (admin only).

---

## User Roles & Permissions

### Admin (shop owner)
- Full access to all 3 branches
- Add / edit / delete products and IMEIs
- Approve or reject bill cancellations
- Approve or reject stock transfers
- Manage salesperson accounts (add, activate/deactivate, change branch)
- Access Analytics and Staff pages
- Receive real-time SSE alerts

### Salesperson (shop staff)
- Scoped to their assigned branch — cannot access other branches
- View inventory (read-only — no add/edit/delete/IMEI visibility)
- Create bills for their branch
- Request bill cancellations (admin must approve)
- Request stock transfers (admin must approve)
- Submit end-of-day cash reconciliation

---

## Key Business Rules

### IMEI Tracking
- Every Mobile product unit has a unique 15-digit IMEI number validated with the **Luhn algorithm**
- IMEI is **mandatory** when billing a Mobile product (one IMEI per unit)
- When a phone is sold, its IMEI is atomically removed from inventory and permanently attached to the bill — creating a full audit trail
- When a sale is cancelled, the IMEI is restored to inventory

### Billing Integrity
- Stock is decremented **atomically** using MongoDB `$gte` conditional updates — concurrent requests cannot oversell
- IMEI removal is **atomic** — two simultaneous sales cannot sell the same IMEI
- If any item in a multi-item bill fails, all stock decrements and IMEI removals are **rolled back**
- All financial values (price, GST, totals) are **calculated server-side** — client-submitted prices are ignored

### GST Calculation
- All products are subject to **18% GST** (CGST 9% + SGST 9%)
- PDF invoices show the GST split

### Cash Reconciliation
- Expected cash = sum of all active Cash-mode bills for the branch on that day
- Discrepancy = physical count − expected cash
- `|discrepancy| < ₹1` → matched; otherwise → mismatch alert
- Discrepancy > ₹500 triggers a HIGH severity alert

### Cancellation Workflow
1. Salesperson submits a cancellation request with a reason
2. If the bill is < 10 minutes old → HIGH severity "quick cancel" alert fires
3. If the same salesperson has > 2 requests today → "excess cancellations" alert fires
4. Admin approves → stock and IMEIs are restored exactly once
5. **Salespersons can only cancel their own bills**

### Stock Transfers
- Requesting a transfer **immediately reserves** (decrements) stock at the source branch
- On approval: stock (and IMEIs for Mobile products) is moved to the destination branch
- On rejection: reserved stock is returned to the source

---

## API Overview

All endpoints are prefixed with `/api`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Login (rate-limited: 10/15 min) |
| POST | `/auth/register` | Admin | Create a new salesperson |
| GET | `/auth/me` | Authenticated | Get current user |
| GET | `/auth/users` | Admin | List all users |
| PUT | `/auth/users/:id` | Admin | Update user (name, branch, isActive) |
| GET | `/products` | Authenticated | List products (branch-scoped for salesperson) |
| POST | `/products` | Admin | Create product |
| PUT | `/products/:id` | Admin | Update product |
| DELETE | `/products/:id` | Admin | Soft-delete product |
| POST | `/products/:id/imei` | Admin | Add IMEI to product |
| GET | `/bills` | Authenticated | List bills (paginated) |
| POST | `/bills` | Authenticated | Create bill |
| POST | `/bills/:id/cancel-request` | Authenticated | Request cancellation |
| POST | `/bills/:id/approve-cancel` | Admin | Approve cancellation |
| GET | `/transfers` | Authenticated | List transfers |
| POST | `/transfers` | Authenticated | Request transfer |
| POST | `/transfers/:id/approve` | Admin | Approve transfer |
| POST | `/transfers/:id/reject` | Admin | Reject transfer |
| GET | `/alerts` | Authenticated | Get unacknowledged alerts |
| PUT | `/alerts/:id/acknowledge` | Admin | Acknowledge alert |
| GET | `/reconciliation` | Authenticated | List reconciliations |
| POST | `/reconciliation` | Authenticated | Submit reconciliation |
| GET | `/analytics/dashboard` | Authenticated | Dashboard stats |
| GET | `/analytics/branch-comparison` | Admin | 30-day branch revenue |
| GET | `/analytics/top-products` | Admin | Top 10 products (current month) |
| GET | `/analytics/employee-performance` | Admin | Sales per employee (current month) |
| GET | `/analytics/revenue-chart` | Admin | Daily revenue chart |
| POST | `/sse/token` | Admin | Get short-lived SSE token |
| GET | `/sse/alerts?token=...` | SSE token | Real-time alert stream |
| GET | `/api/health` | Public | Health check |

---

## Deployment

### Backend

1. Set `NODE_ENV=production` in your environment
2. Set all required env vars (see [Environment Variables](#environment-variables))
3. Run the seed script once: `SEED_ADMIN_PASSWORD=... node scripts/seedAdmin.js`
4. Start: `npm start` (or use PM2: `pm2 start server.js`)

**PM2 example:**
```bash
pm2 start backend/server.js --name vamshi-backend
pm2 save
pm2 startup
```

### Frontend

```bash
cd frontend

# Set your production backend URL
echo "VITE_API_BASE_URL=https://api.yourshop.com" > .env.production

# Build
npm run build
# Output is in frontend/dist/ — serve with Nginx, Vercel, Netlify, etc.
```

### Nginx reverse proxy (example)

```nginx
server {
    listen 80;
    server_name yourshop.com;

    # Serve frontend build
    root /var/www/vamshi-frontend/dist;
    index index.html;
    try_files $uri $uri/ /index.html;

    # Proxy API calls to backend
    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE — disable buffering
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
    }

    # Serve generated PDFs directly
    location /uploads/ {
        alias /var/www/vamshi-backend/uploads/;
    }
}
```

> **Note:** For production, consider storing generated PDFs in object storage (S3, GCS) and serving them via signed URLs rather than from the server's filesystem.

---

## Security Notes

- **JWT secret** must be a long random string (≥ 64 chars) in production
- **MongoDB credentials** must never be committed — rotate the Atlas password if `.env` was ever pushed to version control
- **Rate limiting** is applied to the login endpoint (10 attempts per IP per 15 minutes)
- **Helmet** sets secure HTTP headers on all responses
- **SSE** uses short-lived (60 s) tokens to keep the primary JWT out of URLs and server logs
- **PDF files** under `/uploads/pdfs/` are currently publicly accessible by URL — consider adding authentication or moving to object storage for sensitive invoices
- **In-memory user cache** (5-min TTL) is process-local — in a multi-instance deployment, deactivation may take up to 5 minutes to propagate to all instances. Use Redis for a shared cache if running multiple processes.
- The `uploads/` directory should be excluded from version control (add to `.gitignore`)

---

## .gitignore Recommendations

Ensure your `.gitignore` includes:

```
# Environment files
backend/.env
frontend/.env
frontend/.env.production

# Generated files
backend/uploads/pdfs/

# Dependencies
node_modules/

# Build output
frontend/dist/
```
