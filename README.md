# 🚀 ProjectFlow Edu

<div align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0--Beta-blue?style=for-the-badge&logo=rocket" alt="Version" />
  <img src="https://img.shields.io/badge/UI/UX-Minimalist--SaaS-slate?style=for-the-badge&logo=figma" alt="Design" />
  <img src="https://img.shields.io/badge/Frontend-React--Vite-61DAFB?style=for-the-badge&logo=react" alt="Frontend" />
  <img src="https://img.shields.io/badge/Backend-Node.js--Express-339933?style=for-the-badge&logo=node.js" alt="Backend" />
  <img src="https://img.shields.io/badge/Database-MySQL-4479A1?style=for-the-badge&logo=mysql" alt="Database" />
</div>

<br />

<div align="center">
  <h3>The Intelligent Operating System for Academic Innovation</h3>
  <p>ProjectFlow Edu is an AI-powered, Jira-inspired lifecycle management platform designed specifically for the unique workflows of schools, colleges, and innovation cells.</p>
</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Why ProjectFlow Edu?](#-why-projectflow-edu)
- [System Architecture](#-system-architecture)
- [Key Portals](#-key-portals)
- [Core Features](#-core-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Development Workflow](#-development-workflow)
- [AI & Real-time Integration](#-ai--real-time-integration)
- [Security](#-security)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🌟 Overview

**ProjectFlow Edu** is more than just a project tracker. It is a comprehensive ecosystem that bridges the gap between academic projects and startup incubation. By integrating **SDLC tracking**, **AI-driven task generation**, and **hierarchical approval workflows**, it empowers students and institutions to turn academic milestones into real-world innovation.

### 🎯 Mission
To streamline the chaotic process of academic project management and provide data-driven insights into student performance and innovation potential.

---

## ⚡ Why ProjectFlow Edu?

Professional tools like **Jira** or **Asana** are built for corporate engineering teams. They fail in academia because:
- **Hierarchical Gaps**: They lack built-in HOD → Mentor → Student approval flows.
- **Academic Context**: They don't understand specific academic projects (Mini, Major, Final Year).
- **Innovation Transition**: They aren't built to transition a college project into a startup incubation pipeline.

**ProjectFlow Edu** solves this by speaking the language of academia.

---

## 🏗 System Architecture

### High-Level Design
```text
      ┌──────────────────────────┐
      │      React Frontend      │ (Vite + Tailwind v4 + Shadcn)
      └────────────┬─────────────┘
                   │
         (REST API / WebSockets)
                   │
      ┌────────────▼─────────────┐
      │    Express.js Backend    │ (Node.js + JWT Auth)
      └────────────┬─────────────┘
                   │
     ┌─────────────┴─────────────┬─────────────┐
     │           MySQL           │    Redis    │ (Caching / BullMQ)
     └─────────────┬─────────────┴─────────────┘
                   │
     ┌─────────────┴─────────────┐
     │    AI & Third-Party APIs  │ (Gemini / OpenAI / Razorpay)
     └───────────────────────────┘
```

---

## 🏛 Key Portals

ProjectFlow Edu provides tailored experiences for four distinct user roles:

| Portal | Primary Focus |
| :--- | :--- |
| **Student** | Project execution, Kanban management, documentation, and feedback loops. |
| **Mentor** | Evaluation, milestone tracking, and providing actionable feedback. |
| **HOD** | Departmental oversight, project approvals, and high-level analytics. |
| **CDC** | Innovation cell management, startups, hackathons, and industry collaboration. |

---

## 🛠 Core Features

- **SDLC Engine**: Track projects across 8 specialized stages from Requirement Analysis to Deployment.
- **AI Task Pilot**: Automatically generate detailed SDLC task breakdowns based on project abstracts.
- **Agile Workflow**: High-contrast Kanban boards optimized for team collaboration.
- **Innovation Hub**: Dedicated CDC tools for managing hackathons and startup incubation.
- **Real-time Sync**: Live notifications and project activity streams via Socket.io.
- **Analytics Dashboards**: Visual performance metrics using Recharts.

---

## 💻 Tech Stack

### Frontend
- **Framework**: React.js 18 (Vite)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui + Lucide Icons
- **State/Routing**: React Router DOM + Context API
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (Relational Data) + Redis (Queue/Cache)
- **Real-time**: Socket.io
- **Job Processing**: BullMQ
- **AI**: Google Gemini API / OpenAI API

---

## 🚀 Getting Started

### 1. Repository Setup
```bash
git clone https://github.com/Piyush200516/ProjectFlow.git
cd ProjectFlow
```

### 2. Environment Configuration
Check the `.env.example` files in both `frontend` and `backend` directories and create your own `.env` files.

### 3. Database Initialization
Import the schema into your MySQL instance:
```bash
mysql -u root -p < database/projectflow_edu_schema.sql
```

### 4. Installation & Start
**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 🛡 Security

ProjectFlow Edu prioritizes data integrity and user security:
- **JWT Authentication**: Secure, stateless session management.
- **Granular RBAC**: Role-Based Access Control enforced at the middleware level.
- **Safety Headers**: Implementation of Helmet and CORS security protocols.
- **Rate Limiting**: Protection against brute-force and DDoS attempts.

---

## 🗺 Roadmap

- [ ] **Payments**: Razorpay integration for innovation cell funding.
- [ ] **Cloud Storage**: AWS S3 integration for large project artifacts.
- [ ] **AI-Docs**: Automated documentation generation for final year projects.
- [ ] **Mobile Port**: Dedicated React Native companion app for mentors.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
  <p>Developed with ❤️ by <b>Piyush Mishra</b></p>
  <p>
    <a href="https://github.com/Piyush200516"><b>GitHub</b></a> •
    <a href="https://linkedin.com/in/piyushmishra21052003"><b>LinkedIn</b></a>
  </p>
  <p><i>Empowering the next generation of innovators.</i></p>
</div>
