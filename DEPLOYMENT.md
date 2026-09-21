# HireGo AI — Enterprise Production Deployment Guide

## 1. Prerequisites
- **Node.js**: v20.x or higher
- **Database**: PostgreSQL 15+ cluster or Supabase Managed Postgres
- **Object Storage**: AWS S3 or Cloudflare R2 bucket for video resume hosting
- **Domain**: Production SSL/TLS certificate configured

---

## 2. Environment Setup
1. Copy `.env.example` to `.env.production`:
   ```bash
   cp .env.example .env.production
   ```
2. Update all secret keys (`DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY`, `S3_ACCESS_KEY_ID`).

---

## 3. Database Migration
Run Prisma migration to provision production database tables:
```bash
npx prisma migrate deploy
```

---

## 4. Production Build & Verification
1. Run the same validation gates used by CI:
   ```bash
   npx prisma validate
   npx tsc --noEmit
   npm run lint
   npm test
   npm run test:audit
   npm audit --omit=dev --audit-level=high
   ```
2. Build Next.js production bundle:
   ```bash
   npm run build
   ```
3. Deploy the standalone output through the tracked `Dockerfile`, or let
   Vercel run the Next.js output directly. The Docker image starts
   `server.js` and includes `public` plus `.next/static`.
4. Before directing traffic, run the post-deployment checks in
   `DEPLOYMENT_CHECKLIST.md`. A successful build is not a deployment sign-off.

---

## 5. Security Checklist
- [x] HTTP-Only secure cookies for auth tokens
- [x] Distributed rate limiting on sensitive public and authenticated API routes
- [x] Bounded schema validation on sensitive mutation and webhook routes
- [x] RBAC Edge Middleware protecting `/admin` and `/employer` routes
- [x] File upload signature/MIME validation and 50 MB global size cap enforced
- [ ] Production malware scanner, private storage, and quarantine recovery verified
