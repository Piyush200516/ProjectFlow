<div align="center">
  <img src="https://img.shields.io/badge/ProjectFlow-Edu-blue?style=for-the-badge&logo=rocket" alt="ProjectFlow Logo" />
  <h1 align="center">ProjectFlow Edu</h1>
  <p align="center">
    <strong>AI-Powered Jira-Inspired Academic Project Lifecycle Management SaaS Platform</strong>
  </p>
  
  <p align="center">
    <a href="#license">
      <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License" />
    </a>
    <a href="#status">
      <img src="https://img.shields.io/badge/Status-Active-success.svg?style=flat-square" alt="Status" />
    </a>
    <a href="#tech-stack">
      <img src="https://img.shields.io/badge/React-18-61DAFB.svg?style=flat-square&logo=react" alt="React" />
    </a>
    <a href="#tech-stack">
      <img src="https://img.shields.io/badge/Node.js-18+-339933.svg?style=flat-square&logo=node.js" alt="Node" />
    </a>
    <a href="#tech-stack">
      <img src="https://img.shields.io/badge/AI-Gemini_Powered-8A2BE2.svg?style=flat-square&logo=google-gemini" alt="AI Powered" />
    </a>
  </p>
</div>

<br />

## 📖 Table of Contents

- [Project Overview](#-project-overview)
- [The Problem](#-the-problem)
- [Why ProjectFlow Edu? (vs. Jira/Trello)](#-why-projectflow-edu-vs-jiratrello)
- [Core Features](#-core-features)
  - [Role-Based Portals](#role-based-portals)
  - [SDLC Kanban Workflow](#sdlc-kanban-workflow)
  - [AI & Real-Time Sync](#ai--real-time-sync)
- [System Architecture](#-system-architecture)
- [Role-Based Architecture](#-role-based-architecture)
- [Tech Stack](#-tech-stack)
- [Deep Dive: Features](#-deep-dive-features)
  - [Frontend](#frontend-features)
  - [Backend](#backend-features)
  - [Database & Security](#database--security)
- [Folder Structure](#-folder-structure)
- [Getting Started](#-getting-started)
- [Deployment Guide](#-deployment-guide)
- [Screenshots](#-screenshots)
- [Roadmap](#-roadmap)
- [Contribution](#-contribution)
- [License & Author](#-license--author)

---

## 🌟 Project Overview

**ProjectFlow Edu** is the intelligent operating system for academic innovation. Built with a modern, minimalist SaaS architecture, it bridges the massive gap between academic assignments and startup incubation. 

Unlike generic issue trackers, ProjectFlow Edu strictly models the hierarchical academic workflow—integrating Students, Mentors, Head of Departments (HOD), and Career Development Cells (CDC)—while leveraging generative AI to automate documentation, task breakdowns, and performance analytics.

---

## ⚠️ The Problem

Academic projects (Mini, Major, Final Year, Hackathons) fail because institutions lack visibility.
1. **Students** struggle with structured Software Development Life Cycles (SDLC) and documentation.
2. **Mentors** are overwhelmed tracking multiple teams across scattered Google Sheets and WhatsApp groups.
3. **HODs** lack department-wide analytics on innovation quality and project velocity.
4. **CDCs** miss opportunities to incubate exceptional college projects into real-world startups.

---

## 💡 Why ProjectFlow Edu? (vs. Jira/Trello)

Why not just use Jira, Trello, or Asana? Because **corporate tools do not speak the language of academia.**

| Feature | Corporate Tools (Jira) | ProjectFlow Edu |
| :--- | :--- | :--- |
| **Hierarchical Approvals** | Peer-to-Peer PR reviews | Strict Student ➝ Mentor ➝ HOD flow |
| **Workflow Types** | Sprints, Epics, Bugs | Mini Projects, Final Year, Hackathons, Incubation |
| **Evaluation Metrics** | Story points burned | Academic rubrics, attendance, documentation scores |
| **AI Integration** | Code review & task summary | Generates full SDLC phases from project abstracts |
| **Incubation Pipeline** | N/A | Direct pipeline from classroom to CDC Startup Hub |

---

## 🔥 Core Features

### Role-Based Portals
Four entirely isolated, secure portals tailored to specific academic personas:

#### 🎓 Student Portal
- **SDLC Engine:** Track projects across 8 specialized academic stages.
- **AI Task Pilot:** Instantly break down abstracts into actionable Kanban tasks.
- **Artifact Hub:** Upload and manage architectural diagrams and documentation.
- **Feedback Loops:** Request and track mentor reviews in real-time.

#### 👨‍🏫 Mentor Portal
- **Evaluation Dashboard:** High-contrast grids tracking assigned team pipelines.
- **Submission Velocity:** Monitor student code pushes and artifact uploads.
- **Review Queue:** Approve or reject milestones with actionable feedback.

#### 🏛️ HOD Portal
- **Department Oversight:** Bird's-eye view of all projects across semesters.
- **Analytics Engine:** Recharts-powered graphs showing success rates and tech-stack trends.
- **Global Approvals:** Final sign-off on Major/Final Year Projects.

#### 🚀 CDC Portal (Career & Innovation)
- **Startup Incubation:** Elevate high-performing student projects into startup pipelines.
- **Hackathon Manager:** Organize, fund, and track institutional hackathons.
- **Industry Collaboration:** Connect student IP with industry sponsors.

---

### SDLC Kanban Workflow
A specialized drag-and-drop Kanban board (`@dnd-kit`) that strictly enforces the Software Development Life Cycle. Tasks move through:
`Requirement Analysis` ➝ `System Design` ➝ `Implementation` ➝ `Testing` ➝ `Deployment` ➝ `Evaluation`

---

## 🏗️ System Architecture

### High-Level Topology
```text
      ┌──────────────────────────┐
      │     React Frontend       │ (Vite, Tailwind v4, Shadcn UI)
      └────────────┬─────────────┘
                   │
         (REST API / WebSockets)
                   │
      ┌────────────▼─────────────┐
      │   Express API Gateway    │ (Node.js, JWT, Rate Limiting)
      └────────────┬─────────────┘
                   │
     ┌─────────────┴─────────────┬─────────────┐
     │          MySQL            │    Redis    │ (Caching, BullMQ)
     └─────────────┬─────────────┴─────────────┘
                   │
     ┌─────────────┴─────────────┐
     │   AI & External APIs      │ (Google Gemini, OpenAI, Razorpay)
     └───────────────────────────┘
```

---

## 🔐 Role-Based Architecture & Authentication Flow

ProjectFlow Edu utilizes a strictly typed, isolated authentication architecture.
1. **Isolated Entry Points:** `auth/student/login`, `auth/mentor/login`, etc.
2. **Context Guard:** React Context API verifies JWTs in `localStorage`.
3. **Route Protection:** Higher-Order Components (HOC) bounce unauthorized cross-portal access to a global `403 Access Denied` fallback.

```text
Student Login ───> Valid? ───> /student/* (Blocked from /mentor, /hod)
Mentor Login  ───> Valid? ───> /mentor/*  (Blocked from /student, /hod)
```

---

## 💻 Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend Core** | React.js (v18), Vite, React Router v7 |
| **Styling & UI** | Tailwind CSS v4, shadcn/ui, Lucide React, Framer Motion |
| **Data Visualization**| Recharts |
| **Backend Core** | Node.js, Express.js |
| **Database** | MySQL (Relational), Redis (Caching & Message Brokering) |
| **Real-time & Jobs** | Socket.io, BullMQ |
| **AI Integration** | Google Gemini API, OpenAI API |
| **Security** | JWT, bcryptjs, Helmet, CORS, Express Rate Limit |

---

## 📂 Full Folder Structure

```text
ProjectFlow/
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI (Cards, Modals, Forms)
│   │   ├── context/      # AuthContext, ThemeContext
│   │   ├── layouts/      # DashboardLayout, Sidebar, Topbar
│   │   ├── pages/        # Role-isolated views (auth/, student/, mentor/, etc.)
│   │   ├── routes/       # AppRoutes and ProtectedRoute HOC
│   │   ├── utils/        # Axios interceptors, formatting helpers
│   │   └── App.jsx       # Root router
│   ├── .env.example
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/       # DB, Redis, Socket configs
│   │   ├── controllers/  # Business logic
│   │   ├── middlewares/  # JWT Auth, Role validation
│   │   ├── models/       # MySQL Schemas
│   │   ├── routes/       # API Definitions
│   │   ├── services/     # AI Prompts, Email triggers
│   │   └── server.js     # Entry point
│   ├── .env.example
│   └── package.json
│
└── database/
    └── schema.sql        # Core relational architecture
```

---

## 🧠 Deep Dive: Advanced Features

### 🌐 Frontend Features
- **Minimalist SaaS UI:** White backgrounds, soft borders, high-contrast text.
- **Optimistic UI Updates:** Drag-and-drop state updates instantly before server confirmation.
- **Form Validation:** End-to-end `react-hook-form` and `zod` schemas.

### ⚙️ Backend Features & API Overview
- **Modular Monolith:** Clean separation of concerns.
- **RESTful Endpoints:** Grouped by `/api/auth`, `/api/projects`, `/api/tasks`, `/api/analytics`.
- **Background Processing:** BullMQ handles heavy PDF generation and AI prompt resolving asynchronously without blocking the main event loop.

### 🛡️ Security Features
- **XSS Protection:** Strict sanitization, zero `dangerouslySetInnerHTML`.
- **Stateless Auth:** JWT-based architecture with short-lived tokens and refresh mechanisms.
- **Environment Isolation:** Secrets are strictly guarded behind `dotenv`.

### 🤖 AI Features
- **Automated Task Breakdown:** AI parses abstract text and outputs JSON-formatted SDLC tasks.
- **Sentiment Analysis:** AI reviews mentor feedback to ensure constructive tone.

### ⚡ Socket.io Realtime Features
- Live Kanban board synchronization across team members.
- Instant push notifications for HOD approvals or Mentor reviews.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js v18+
- MySQL Server v8+
- Redis Server (Running on port 6379)

### 2. Installation Guide

**Clone the repository:**
```bash
git clone https://github.com/Piyush200516/ProjectFlow.git
cd ProjectFlow
```

**Environment Setup:**
Copy `.env.example` to `.env` in both frontend and backend directories and populate your secrets (MySQL credentials, JWT secret, Gemini API key).

**Database Setup:**
```bash
mysql -u root -p < database/schema.sql
```

**Install Dependencies:**
```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Running Locally
You will need two terminal windows.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## ☁️ Deployment Guide

1. **Frontend:** Deploy optimized Vite build (`npm run build`) to Vercel, Netlify, or AWS Amplify.
2. **Backend:** Deploy Express monolith to Railway, Render, or a Hostinger VPS using PM2.
3. **Database:** Provision a managed MySQL instance (e.g., AWS RDS, PlanetScale) and a managed Redis instance (Upstash).

---

## 📸 Screenshots

> *UI Screenshots will be added here once the MVP styling is finalized.*
> - [ ] Add unified Login Dashboard image
> - [ ] Add Student Kanban Board image
> - [ ] Add Mentor Analytics image

---

## 🗺️ Future Roadmap

- [ ] **Payments API:** Razorpay integration for funding hackathons and startups.
- [ ] **Cloud Storage:** Direct AWS S3 integration for robust artifact management.
- [ ] **Mobile App:** React Native companion app for on-the-go mentor approvals.
- [ ] **Plagiarism Checker:** Automated abstract scanning against existing institutional databases.

---

## 🤝 Contribution

We welcome contributions to ProjectFlow Edu! 
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`.
3. Commit your changes: `git commit -m 'feat: Add amazing feature'`.
4. Push to the branch: `git push origin feature/amazing-feature`.
5. Open a Pull Request.

Please adhere to the coding standards and ESLint configurations provided.

---

## 📜 License & Author

**ProjectFlow Edu** is distributed under the **MIT License**. See `LICENSE` for more information.

<br />

<div align="center">
  <p>Architected and Developed with ❤️ by <b>Piyush Mishra</b></p>
  <p>
    <a href="https://github.com/Piyush200516">
      <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
    </a>
    <a href="https://linkedin.com/in/piyushmishra21052003">
      <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
    </a>
  </p>
  <p><i>Empowering the next generation of academic innovators.</i></p>
</div>