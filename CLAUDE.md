# CLAUDE.md — Lapangan HAM Project Guidelines

This file provides context and guidance for developers and AI agents working on the Lapangan HAM booking application.

## Project Overview
A web-based field booking application (Aplikasi Booking Lapangan HAM) built with Next.js 16, Supabase, React 19, TypeScript, and TailwindCSS. It features a public-facing customer portal (booking slots, uploading payment proofs, payment history) and an administrative dashboard (verifying bookings, managing field availability/pricing, updating images).

## Technology Stack
- **Framework:** Next.js 16 (App Router)
- **Database / Auth / Storage:** Supabase (PostgreSQL, Supabase Auth, Storage buckets)
- **Frontend:** React 19, TailwindCSS, Lucide Icons, Flatpickr (datetime selector)

## Commands
- **Local Dev Server:** `npm run dev`
- **Lint Check:** `npm run lint`
- **Unit & Integration Tests:** `npm test`
- **Build Compilation:** `npm run build`

## Test Credentials
- **Admin**:
  - Email: `admin@bookinglapangan.com`
  - Password: `admin123`
- **Customer**:
  - Email: `customer@bookinglapangan.com`
  - Password: `customer123`

## Coding Guidelines & Conventions
- **Clean Code:** Use clear variable naming in English or descriptive Indonesian where appropriate.
- **Database Operations:** Use Supabase client or server actions (`src/actions/`) for query execution.
- **Security:** Ensure authentication and role-based protection (middleware) are properly enforced for admin and customer routes.

## Agentic Skills (Superpowers)
This repository contains a local copy of the **`obra/superpowers`** agentic skills framework under [`.agents/skills/`](file:///Users/royanrosyad/Projects/filq-proj/.agents/skills/).

When performing development tasks (creating features, refactoring, fixing bugs):
1. **Search for relevant skills** in the `.agents/skills/` directory (such as `brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`, `systematic-debugging`).
2. **Invoke and follow the processes** documented in those skills. Specifically:
   - Run brainstorming before coding.
   - Create and follow implementation plans.
   - Use TDD (Test-Driven Development) principles where applicable.
   - Follow systematic debugging procedures to trace issues.

Always spawn subagent when doing exploration