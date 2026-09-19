# HireGo AI — Production Backup & Disaster Recovery Runbook

## 1. Disaster Recovery Objectives (SLAs)

| Objective | Target SLA | Strategy |
| :--- | :--- | :--- |
| **Recovery Point Objective (RPO)** | **< 5 minutes** | Supabase Continuous WAL Archiving & Point-In-Time-Recovery (PITR) |
| **Recovery Time Objective (RTO)** | **< 15 minutes** | Hot Standby Database Failover + Automated Container Re-provisioning |
| **Media RPO** | **< 1 minute** | Cloudflare R2 / AWS S3 Cross-Region Bucket Replication |

---

## 2. Backup Architecture & Cadence

### 2.1 Continuous Point-in-Time-Recovery (PITR)
- **Engine**: PostgreSQL Write-Ahead Logging (WAL-G / Supabase Managed Archiving)
- **Retention**: 30 rolling days
- **Coverage**: Full cluster transaction log stream enabling recovery to any millisecond within the retention window.

### 2.2 Scheduled Logical Dumps (Secondary Layer)
- **Frequency**: Daily at 02:00 UTC via automated Cloud Function / Cron Worker.
- **Destination**: Dedicated isolated Cold Storage GCS / AWS S3 Bucket with Immutable Object Locks (WORM compliant).
- **Execution Script**:
  ```bash
  pg_dump -Fc \
    --no-owner \
    --no-privileges \
    --exclude-table-data='AuditLog' \
    -d "$DIRECT_URL" \
    -f "hirego_backup_$(date +%Y%m%d_%H%M%S).dump"
  ```

### 2.3 Storage (R2 / S3) Disaster Recovery
- Candidate resumes, generated video resumes, and verification documents are stored with Object Versioning enabled.
- Lifecycle rules:
  - Active resumes: Multi-region storage class
  - Inactive/Archived resumes (> 365 days): Glacier / Cold Tier
  - Soft-delete retention: 30 days before permanent purging

---

## 3. Disaster Recovery Execution Procedures

### 3.1 Point-In-Time Restoration Procedure
1. Navigate to Supabase Infrastructure Console -> Database -> Backups.
2. Select target recovery timestamp (e.g., 2 minutes prior to identified data corruption event).
3. Provision temporary validation instance from target point-in-time:
   ```bash
   npx prisma migrate status --schema=prisma/schema.prisma
   ```
4. Verify data integrity against key business constraints (Company, Subscription, CandidateProfile, Application).
5. Promote restored database instance to primary by updating `DATABASE_URL` and `DIRECT_URL` secrets in production management console.
6. Trigger zero-downtime redeployment of HireGo AI edge instances.

### 3.2 Cold Dump Restoration Procedure (Total Region Loss)
1. Provision fresh PostgreSQL 16+ instance with identical extensions (`uuid-ossp`, `pgcrypto`).
2. Restore logical schema and data dump:
   ```bash
   pg_restore --clean --if-exists --no-owner --no-privileges -d "$NEW_DATABASE_URL" hirego_backup_latest.dump
   ```
3. Run verification of Prisma migrations:
   ```bash
   npx prisma migrate deploy
   ```
4. Verify table counts, foreign keys, and indexes:
   ```sql
   SELECT schemaname, relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC;
   ```
5. Update DNS and environment variables.

---

## 4. Disaster Recovery Testing Cadence
- Quarterly automated restore drills into staging sandbox.
- Monthly automated checksum validation on logical dump archives.
- Annual simulated multi-region failover drill.
