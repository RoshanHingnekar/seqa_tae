# QAEstimator Pro – Software Testing Resource Estimator

> Enterprise QA Person-Hours & Resource Estimation Platform for Quality Engineering Teams.

Built with **React + TypeScript + Vite + Tailwind CSS + Recharts**, backed by **Node.js + Express + Prisma ORM** (relational database with SQLite/PostgreSQL support), JWT authentication, and formal PDF/Excel report export.

---

## 🚀 Key Features

1. **Precision Estimation Engine**:
   - Computes QA Person-Hours based on Lines of Code (LOC), Test Case Count, and Target Coverage (%).
   - Transparent formula:
     $$\text{LOC Effort} = \left(\frac{\text{LOC}}{1000}\right) \times \text{LOC\_RATE}$$
     $$\text{Test Case Effort} = \text{TestCases} \times \text{TEST\_CASE\_RATE}$$
     $$\text{Coverage Multiplier} = 1 + \left(\frac{\text{Coverage} - 70}{100}\right)$$
     $$\text{QA Person Hours} = (\text{LOC Effort} + \text{Test Case Effort}) \times \text{Coverage} \times \text{Complexity} \times \text{Environment}$$
   - Pre-calibrated demo project: **12,500 LOC + 420 Test Cases + 85% Coverage $\to$ ~152 person-hours** (~19 working days).

2. **12 Comprehensive Pages**:
   - **Login & Sign Up**: Split-screen design with blue branding, test metrics, and 1-Click Instant Demo Login.
   - **Dashboard**: 4 KPI cards, Estimation Trend line/area chart, Effort Breakdown donut chart, Quick Estimator panel, Parameter Table, Project Complexity detector, Historical Estimates, and Estimation Guide.
   - **Estimation Calculator**: Full interactive enterprise calculator with real-time dynamic calculation.
   - **Projects**: Portfolio management with Grid/Table view, filters, search, duplication, and CRUD.
   - **Project Details**: Complete breakdown, QA team sizing recommendation, test suites, and notes.
   - **Test Management**: Status cards (Total, Passed, Failed, Blocked, Not Run, Automation Coverage), filterable test case table, status switcher, and CSV import/export.
   - **Reports**: Report templates (Estimation, QA, Coverage, Team), live preview, **Download PDF**, **Download Excel**, and Print.
   - **Team Management**: Team member roster, roles, capacity gauges, availability, and utilization chart.
   - **History**: Full audit trail of past estimations with "Load into Estimator" shortcut.
   - **Settings**: Configurable estimation constants (LOC rate, test rate, baseline coverage, multipliers, working hours).
   - **Profile**: Account management, designation, organization, and password updates.

3. **Enterprise Blue + White Design System**:
   - Modern Tailwind CSS styling (#2563EB primary blue, dark navy typography, clean white cards, soft shadows).
   - Desktop-first responsive layout with mobile drawer navigation.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React icons, Recharts, jsPDF, jspdf-autotable, SheetJS (xlsx)
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, JWT, BcryptJS, Zod
- **Database**: SQLite (`server/prisma/dev.db`) / PostgreSQL compatible via Prisma

---

## ⚡ Quick Start

### 1. Prerequisites
- Node.js 18+ (tested on Node v24)
- npm

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/RoshanHingnekar/seqa_tae.git
cd seqa_tae

# Install root, backend, and frontend dependencies
npm run install:all
```

### 3. Database Setup & Seeding
```bash
# Push Prisma schema and seed demo project (152 hrs) + test cases + team
npm run db:push
npm run db:seed
```

### 4. Running Locally
In two terminals (or concurrently):
```bash
# Terminal 1: Backend API (port 5000)
npm run dev:server

# Terminal 2: Frontend Client (port 5173)
npm run dev:client
```
Open **`http://localhost:5173`** in your browser.

### 5. Demo Credentials
- **Email**: `ramesh@qaestimator.io`
- **Password**: `password123`
- Or simply click **"1-Click Login"** on the login page!
