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
1. Verify TypeScript type safety:
   ```bash
   npx tsc --noEmit
   ```
2. Build Next.js production bundle:
   ```bash
   npm run build
   ```
3. Start production server:
   ```bash
   npm run start
   ```

---

## 5. Security Checklist
- [x] HTTP-Only secure cookies for auth tokens
- [x] Rate limiting active on all public API routes
- [x] Input sanitization via Zod schema validation
- [x] RBAC Edge Middleware protecting `/admin` and `/employer` routes
- [x] File upload MIME-type and 100MB size caps enforced
