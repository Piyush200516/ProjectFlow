# 🚀 ProjectFlow Edu Backend

<div align="center">
  <img src="https://img.shields.io/badge/Status-Production--Ready-emerald?style=for-the-badge&logo=rocket" alt="Status" />
  <img src="https://img.shields.io/badge/Architecture-Clean--Modular-blue?style=for-the-badge&logo=architecture" alt="Architecture" />
  <img src="https://img.shields.io/badge/Security-Advanced-indigo?style=for-the-badge&logo=shield" alt="Security" />
  <img src="https://img.shields.io/badge/AI-Gemini%20%7C%20OpenAI-blueviolet?style=for-the-badge&logo=google-gemini" alt="AI" />
</div>

<br />

<div align="center">
  <h3>The Intelligent Core of Academic Project Management</h3>
  <p>An AI-powered, Jira-inspired backend engine designed to manage the entire project lifecycle—from ideation to innovation incubation.</p>
</div>

---

## 📖 Table of Contents

- [About the Project](#-about-the-project)
- [Why ProjectFlow Edu?](#-why-projectflow-edu)
- [Core Features](#-core-features)
- [Architecture & Design](#-architecture--design)
- [Tech Stack](#-tech-stack)
- [Installation Guide](#-installation-guide)
- [API Documentation](#-api-documentation)
- [Real-time Events (Socket.io)](#-real-time-events-socketio)
- [AI Capabilities](#-ai-capabilities)
- [Security & RBAC](#-security--rbac)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🌟 About the Project

**ProjectFlow Edu Backend** is a production-grade Node.js engine built to solve the fragmentation in academic project management. Unlike generic project management tools, this system is specifically architected for the unique hierarchies and workflows of schools, universities, and incubation cells.

### 🎯 Target Users
- **Students**: Managing SDLC stages, documentation, and team collaboration.
- **Mentors**: Reviewing milestones, providing feedback, and tracking progress.
- **HODs**: Department-wide oversight, project approvals, and analytics.
- **CDC / Innovation Cells**: Managing startups, hackathons, and industry collaborations.

---

## ⚡ Why ProjectFlow Edu?

Generic tools like Jira or Asana are built for corporate engineers. **ProjectFlow Edu** bridges the gap by:
- **Integrating Academic Hierarchies**: Built-in approval workflows from HOD to Mentor.
- **AI-Driven Guidance**: Automatically breaking down project ideas into SDLC tasks.
- **Innovation Pipeline**: Seamlessly transitioning academic projects into startup incubation.

---

## 🛠 Core Features

| Module | Description |
| :--- | :--- |
| **Auth & RBAC** | Secure JWT-based authentication with granular Role-Based Access Control. |
| **Project Engine** | Support for Mini, Major, Hackathon, and Final Year projects. |
| **Kanban / SDLC** | Drag-and-drop workflow tracking across all 8 SDLC stages. |
| **Real-time Sync** | Live collaboration and notifications via Socket.io. |
| **AI Services** | Automated idea generation, task breakdown, and documentation outlines. |
| **Background Jobs** | High-performance job queuing with BullMQ and Redis. |
| **Analytics** | Aggregated data for HOD and CDC oversight. |

---

## 🏗 Architecture & Design

### High-Level Flow
```text
      ┌───────────────┐
      │  React Client │
      └───────┬───────┘
              │ (HTTP/WS)
      ┌───────▼────────────────┐
      │   Express API Gateway  │
      └───────┬────────────────┘
              │
    ┌─────────┴─────────┐
    │  Business Logic   │ ◄───►  Google Gemini / OpenAI
    └─────────┬─────────┘
              │
    ┌─────────┼─────────┬─────────┐
    │  MySQL  │  Redis  │ Socket  │
    └─────────┴─────────┴─────────┘
```

### Folder Structure
```text
src/
├── config/             # Database, Redis, and Socket configurations
├── controllers/        # Business logic for API endpoints
├── middlewares/        # Auth, Role-validation, and Error handlers
├── models/             # MySQL schema definitions and queries
├── routes/             # Express route definitions
├── services/           # External API integrations (AI, Email, SMS)
├── utils/              # Helper functions and constants
├── workers/            # BullMQ background job processors
└── app.js              # Entry point
```

---

## 💻 Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Node.js** | Runtime Environment |
| **Express.js** | Web Framework |
| **MySQL** | Primary Relational Database |
| **Redis** | Caching & Message Brokering |
| **Socket.io** | Real-time Communication |
| **BullMQ** | Distributed Background Jobs |
| **Gemini / OpenAI** | AI Logic & NLP |
| **JWT** | Secure Authentication |
| **Helmet / CORS** | Security Headers |

---

## 🚀 Installation Guide

### 1. Prerequisites
- Node.js (v18+)
- MySQL
- Redis

### 2. Setup
```bash
# Clone the repository
git clone https://github.com/Piyush200516/ProjectFlow.git

# Navigate to backend
cd backend

# Install dependencies
npm install

# Setup Environment
cp .env.example .env
```

### 3. Database Initialization
1. Create a database named `projectflow_edu`.
2. Import the schema:
   ```bash
   mysql -u root -p projectflow_edu < ../database/projectflow_edu_schema.sql
   ```

### 4. Running the Project
```bash
# Development mode
npm run dev

# Production mode
npm start
```

---

## 🔑 Environment Variables
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=projectflow_edu
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
RAZORPAY_KEY_ID=placeholder
RAZORPAY_KEY_SECRET=placeholder
```

---

## 📡 API Documentation

### 🔐 Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Authenticate and get JWT
- `GET /api/auth/me` - Get current user profile

### 📂 Projects
- `GET /api/projects` - List all projects (filtered by role)
- `POST /api/projects` - Create a new project
- `GET /api/projects/:id` - Get detailed project information

### 🤖 AI Services
- `POST /api/ai/suggest-tasks` - Generate SDLC tasks for a project
- `POST /api/ai/outline-docs` - Generate documentation skeleton

---

## 🔌 Socket.io Events

| Event Name | Type | Payload |
| :--- | :--- | :--- |
| `connection` | System | - |
| `join_project` | Emit | `{ projectId }` |
| `send_message` | Emit | `{ projectId, content }` |
| `receive_message` | Listen | `{ sender, content, timestamp }` |
| `task_updated` | Listen | `{ taskId, newStatus }` |
| `notification_received` | Listen | `{ title, message }` |

---

## 🛡 Security & RBAC

ProjectFlow Edu implements a multi-layered security architecture:
- **RBAC**: Strictly enforced roles (`student`, `mentor`, `hod`, `cdc`, `admin`).
- **Encryption**: `bcryptjs` for hashing passwords.
- **Protection**: `helmet` for HTTP headers and `express-rate-limit` to prevent DDoS.
- **Validation**: Strict input validation for all API endpoints.

---

## 🗺 Future Roadmap
- [ ] **Payments**: Razorpay integration for innovation funding.
- [ ] **Notifications**: Multi-channel (Email, SMS, Push) system.
- [ ] **Mobile App**: Dedicated Flutter/React Native application.
- [ ] **Advanced Analytics**: Deeper HOD/CDC dashboard metrics.
- [ ] **Cloud Storage**: AWS S3 integration for project artifacts.

---

## 🤝 Contribution Guide

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

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
  <p><i>Building the future of academic innovation.</i></p>
</div>
