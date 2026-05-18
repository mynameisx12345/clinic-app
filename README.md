# Local Clinic Application

Full-stack clinic management system with Angular frontend, Express backend, and SQLite database.

## Quick Start

### 1. Backend Setup
```bash
cd clinic-app/backend
npm install
npm run seed    # Seeds database with sample data
npm start       # Runs on http://localhost:3000
```

### 2. Frontend Setup (separate terminal)
```bash
cd clinic-app/frontend
npm install
npm start       # Runs on http://localhost:4200 (proxies API to :3000)
```

### 3. Open in Browser
Navigate to `http://localhost:4200`

## Test Accounts

| Username     | Password | Role       |
|-------------|----------|------------|
| staff1      | password | Staff      |
| doctor1     | password | Doctor     |
| pharmacist1 | password | Pharmacist |
| patient1    | password | Patient    |

## Architecture

- **Frontend**: Angular 17 (standalone components, lazy-loaded routes)
- **Backend**: Express.js with JWT authentication
- **Database**: SQLite via better-sqlite3
- **Auth**: Role-based access control (patient, staff, doctor, pharmacist)

## Features by Role

- **Patient**: Book appointments, view dashboard with status filters
- **Staff**: Manage appointments, set doctor availability, view patients & inventory
- **Doctor**: Confirm/complete appointments, write medical records with prescriptions, view patient history
- **Pharmacist**: Manage inventory, stock in/out transactions, view stock ledger reports
