# CLAUDE.md — Lapangan HAM Project Guidelines

This file provides context and guidance for developers and AI agents working on the Lapangan HAM booking application.

## Project Overview
A web-based field booking application (Aplikasi Booking Lapangan HAM) built with native PHP and MySQL. It features a public-facing customer portal (booking slots, uploading payment proofs, payment history) and an administrative dashboard (verifying bookings, managing field availability/pricing, updating images).

For full details on the repository layout, see [STRUCTURE.md](file:///Users/royanrosyad/Projects/filq-proj/STRUCTURE.md).

## Technology Stack
- **Backend:** Native PHP (7.4+)
- **Database:** MySQL / MariaDB (using PDO connection)
- **Frontend:** HTML5, Vanilla CSS, Bootstrap 5.3.x (via CDN), Flatpickr (datetime selector), SweetAlert 2 (alerts), DataTables (interactive tables)

## Commands
Because this is a native PHP project, the primary build and validation commands are:
- **Lint Check (All PHP files):** `find . -name "*.php" -not -path "*/vendor/*" | xargs -n 1 php -l`
- **Database Connection Check:** `php -f test.php`
- **Booking State Update Check:** `php -f test_booking.php`
- **Local Dev Server:** `php -S localhost:8000`

## Coding Guidelines & Conventions
- **Clean Code:** Use clear variable naming in English or descriptive Indonesian where appropriate.
- **Database Operations:** Always use PDO prepared statements to query the database. Do not embed variables directly in SQL strings.
- **Security:** Ensure authentication and role-based protection (middleware) are properly enforced for admin and customer routes.
- **Paths:** Use configuration-defined constants like `APP_URL` and database definitions located in the `config/` directory.

## Agentic Skills (Superpowers)
This repository contains a local copy of the **`obra/superpowers`** agentic skills framework under [`.claude/skills/`](file:///Users/royanrosyad/Projects/filq-proj/.claude/skills/).

When performing development tasks (creating features, refactoring, fixing bugs):
1. **Search for relevant skills** in the `.claude/skills/` directory (such as `brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`, `systematic-debugging`).
2. **Invoke and follow the processes** documented in those skills. Specifically:
   - Run brainstorming before coding.
   - Create and follow implementation plans.
   - Use TDD (Test-Driven Development) principles where applicable.
   - Follow systematic debugging procedures to trace issues.

Always spawn subagent when doing exploration