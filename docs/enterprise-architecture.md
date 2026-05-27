# ProjectFlow Enterprise Architecture

ProjectFlow is being migrated phase-by-phase into an AI-powered campus project management platform. The current production app remains available while the new enterprise architecture is introduced in parallel.

## Phase Roadmap

1. **Architecture + schema + auth**
   - Next.js App Router workspace in `next-app`
   - Prisma schema for users, roles, sessions, audit logs, projects, tasks, documents, notifications, and collaboration primitives
   - Express `/api/v2/auth` auth surface with JWT access tokens, refresh sessions, Redis-backed session cache, RBAC middleware, lockout, password reset, email verification, and audit logs

2. **Dashboards + UI system**
   - shadcn/ui primitives, Framer Motion transitions, Recharts analytics, React Query data hooks, role-aware dashboard modules

3. **Project management**
   - Project lifecycle, milestones, task assignment, React DnD Kanban, optimistic updates, status workflows

4. **Realtime collaboration**
   - Socket.IO namespaces, Redis pub/sub, project chat, comments, notifications, typing, online presence

5. **AI features**
   - Idea generator, abstract generator, problem statement improver, similarity checking, project health score, AI reviewer, mentor recommendation engine

6. **Deployment**
   - Frontend on Vercel
   - Backend on Render/Railway/AWS
   - Neon PostgreSQL
   - Upstash Redis

## Frontend Structure

```text
next-app/
  src/app/                 App Router pages and layouts
  src/components/ui/        shadcn-style primitives
  src/components/providers/ React Query and app providers
  src/hooks/                React Query feature hooks
  src/lib/                  API client and utilities
  src/stores/               Zustand auth/UI state
```

## Backend Structure

```text
backend/
  prisma/schema.prisma                Enterprise data model
  src/config/prisma.js                Prisma client singleton
  src/controllers/enterprise*.js      v2 controllers
  src/services/*Service.js            Auth, sessions, audit, domain services
  src/middleware/enterprise*.js       JWT + RBAC middleware
  src/routes/enterprise*.js           v2 route modules
```

## Auth Flow

- Access token: JWT, short lived, returned to the client and stored as an HTTP-only cookie by the API.
- Refresh token: opaque random token, hashed in PostgreSQL, rotated on refresh.
- Session cache: Redis stores active session ids for quick invalidation checks.
- Account lockout: failed login count locks the account for a configurable window.
- Audit logs: sensitive auth operations are persisted with actor, IP, user-agent, severity, and metadata.
- Email flows: password reset and verification links are generated with hashed tokens and sent through Nodemailer.

## Environment Variables

Backend:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
REDIS_HOST=...
REDIS_PORT=6379
REDIS_PASSWORD=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=ProjectFlow <...>
FRONTEND_URL=https://projectflow-edu-app.netlify.app
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_DAYS=30
AUTH_LOCKOUT_LIMIT=5
AUTH_LOCKOUT_MINUTES=15
```

Next.js:

```env
NEXT_PUBLIC_API_URL=https://your-backend.example.com/api/v2
```
