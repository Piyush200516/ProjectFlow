# ProjectFlow Enterprise Deployment Guide

This guide covers the target production deployment for the enterprise migration.

## Frontend: Vercel

1. Create a Vercel project pointing to `next-app`.
2. Set build command:

```bash
npm run build
```

3. Set output framework to Next.js.
4. Add environment variables:

```env
NEXT_PUBLIC_API_URL=https://project-flow-ed3n.vercel.app/api
```

## Backend: Render, Railway, or AWS

1. Deploy the `backend` folder as a Node.js service.
2. Install command:

```bash
npm install
npm run prisma:generate
```

3. Start command:

```bash
npm run prisma:migrate
npm start
```

4. Required environment variables:

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=...
FRONTEND_URL=https://project-flow-blush.vercel.app
REDIS_HOST=...
REDIS_PORT=6379
REDIS_PASSWORD=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=ProjectFlow <...>
```

## Database: Neon PostgreSQL

Run migrations from CI/CD or the backend deploy step:

```bash
cd backend
npm run prisma:migrate
```

Use pooled connection strings for runtime and direct connection strings for migrations if Neon provides both.

## Redis: Upstash Redis

Use Redis for:

- Refresh session cache
- Account lockout throttling extensions
- Socket.IO pub/sub adapter in Phase 4
- Dashboard/query cache in Phase 2 and Phase 7

## Production Notes

- Keep `/api/auth/*` for the current application until all clients migrate.
- Use `/api/v2/auth/*` for the enterprise auth flow.
- Do not enable AI provider calls until rate limits and audit logging are configured.
- Store file uploads in S3 or Cloudinary, never on ephemeral backend disk.
