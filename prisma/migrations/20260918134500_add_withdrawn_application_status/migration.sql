-- Phase 3 candidate withdrawal is a durable terminal application state.
-- PostgreSQL enums require an explicit migration in addition to the Prisma schema update.
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'WITHDRAWN';
