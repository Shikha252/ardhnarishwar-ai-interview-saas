# Ardhnarishwar AI-Powered Interview SaaS Platform

An enterprise-grade, multi-tenant AI Interview SaaS platform built for **Ardhnarishwar Company** (Super Admin) and multiple isolated client companies (*Apex Global FinTech*, *NovaTech Cloud Systems*).

---

## Key Features

- **100% In-House AI Evaluation Engine**: Zero external third-party API dependencies (No OpenAI, Gemini, Grok, or Claude). Utilizes lexical-semantic TF-IDF vectorization, rule-based stemming, domain-specific rubric matching, verbal filler detection, and STAR behavioral framework heuristics.
- **Multi-Tenant SaaS Architecture**: Super Admin cross-tenant operations with company management, quota meters, and subscription plans; isolated Company Admin workspaces with job management, candidate rosters, and recruiter review workflows.
- **Candidate Interview Portal**: Anxiety-reducing candidate experience with hardware device check (camera and real-time mic visualizer), text-to-speech audio question reading, live speech-to-text dictation, and WebM video recording.
- **Synchronized Video Player**: Video playback with clickable question chapter stamps, synchronized transcripts, and live rubric metric breakdowns.
- **Enterprise Security**: Strict tenant-scoped database queries, JWT token authentication, bcrypt password hashing, and tamper-evident audit logging.

---

## Directory & File Structure

```
ardhnarishwar-ai-interview-saas/
├── backend/
│   ├── ai-engine/
│   │   ├── semantic-vector.js        # Tokenization, stemming, TF-IDF vectorizer & cosine similarity
│   │   ├── rubric-matcher.js         # Technical competency & skill ontology matching
│   │   ├── communication-analyzer.js # Fluency, filler word counter, STAR behavioral detection
│   │   ├── evaluator.js              # Master 9-metric composite evaluator (0-100 score + recommendation)
│   │   ├── dataset-manager.js        # Super Admin dataset manager & model retraining engine
│   │   └── datasets-store.json       # Persistent training benchmarks and rubric weights
│   ├── db/
│   │   ├── database.js               # Multi-tenant relational store with tenantId scoping
│   │   ├── seed.js                   # Seed data for Super Admin, companies, jobs & candidates
│   │   └── saas-store.json           # Seeded persistent database file
│   ├── middleware/
│   │   └── auth.js                   # JWT authentication, role guards & tenant isolation
│   ├── uploads/recordings/           # Video and audio recording storage directory
│   ├── server.js                     # Express REST API server
│   ├── test-ai-engine.js             # Internal AI engine validation test script
│   └── verify-e2e.js                 # Complete end-to-end multi-tenant test script
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── RadarChart.jsx         # Interactive Canvas 8-metric radar chart
│   │   │   ├── EvaluationScorecard.jsx# 9-metric scorecard with rubric drilldown & decision buttons
│   │   │   ├── InterviewPlayerModal.jsx# Video player with synchronized question chapter jumps
│   │   │   └── ReportModal.jsx        # Printable executive evaluation assessment report
│   │   ├── views/
│   │   │   ├── SuperAdminDashboard.jsx# Ardhnarishwar console (tenants, AI studio, questions, logs)
│   │   │   ├── CompanyDashboard.jsx   # Isolated company portal (jobs, candidates, magic invites)
│   │   │   └── CandidateInterviewRoom.jsx # Hardware check, speech dictation, video interview
│   │   ├── App.jsx                   # Universal top navigation bar & role switcher
│   │   └── index.css                 # Dark glassmorphism design system & typography
│   ├── vite.config.js                # Vite config with backend proxy
│   └── package.json                  # Frontend dependencies
├── package.json                      # Root convenience scripts
└── README.md                         # This documentation
```

---

## Quick Start & Execution

### 1. Start Both Services

**Terminal 1 (Backend REST API - Port 5000):**
```bash
cd backend
node server.js
```

**Terminal 2 (Frontend React App - Port 5173):**
```bash
cd frontend
npm run dev
```

### 2. Access the Application

- **Web Application URL**: [http://localhost:5173/](http://localhost:5173/)
- **Backend API URL**: [http://localhost:5000/api](http://localhost:5000/api)

---

## Pre-Configured Test Credentials

| Role | Email | Password | Scope |
|---|---|---|---|
| **Super Admin** | `admin@ardhnarishwar.ai` | `Password123!` | Global Platform Owner |
| **Company Admin (Apex)** | `admin@apexfintech.com` | `Password123!` | Apex Global FinTech |
| **Company Admin (Nova)** | `admin@novatech.io` | `Password123!` | NovaTech Cloud Systems |

> You can also use the role switcher tabs in the top navigation bar to switch between views instantly!

---

## Running Automated Verification Tests

- **Test Internal AI Engine**:
  ```bash
  npm run test:ai
  ```
- **Test Complete End-to-End Workflows**:
  ```bash
  npm run test:e2e
  ```
- **Build Production Bundle**:
  ```bash
  npm run build
  ```
