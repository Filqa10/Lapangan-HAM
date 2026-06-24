# Routing and Navigation Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve the landing page directly at the root URL `/`, configure redirects from `/about` to `/`, and make the brand headers on the auth pages clickable links that navigate back to the root landing page.

**Architecture:** Move page components in Next.js App Router route groups, update `next.config.ts` for redirections, and wrap static brand layout elements in Next.js `Link` components.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, TailwindCSS.

## Global Constraints
- Every modified file must lint cleanly via `npm run lint`.
- The application must compile successfully via `npm run build`.

---

### Task 1: Landing Page Route Reorganization

**Files:**
- Create: `src/app/(public)/page.tsx`
- Modify: `next.config.ts`, `src/app/(public)/page.tsx`
- Delete: `src/app/page.tsx`, `src/app/(public)/about/page.tsx`

**Interfaces:**
- Consumes: The original landing page from `src/app/(public)/about/page.tsx`.
- Produces: The main landing page served at `/` and a server-level redirect from `/about` to `/`.

- [ ] **Step 1: Move landing page page.tsx**
  Run command to move the file:
  `mv src/app/(public)/about/page.tsx src/app/(public)/page.tsx`

- [ ] **Step 2: Update internal link in new landing page**
  Modify `src/app/(public)/page.tsx` line 200:
  Replace:
  ```tsx
  <Link href="/about" className="group flex items-center gap-2.5 transition-transform duration-300 ease-out hover:-translate-y-0.5">
  ```
  With:
  ```tsx
  <Link href="/" className="group flex items-center gap-2.5 transition-transform duration-300 ease-out hover:-translate-y-0.5">
  ```

- [ ] **Step 3: Delete root page.tsx to avoid conflicts**
  Run command to delete:
  `rm src/app/page.tsx`

- [ ] **Step 4: Update next.config.ts to redirect /about to /**
  Modify `next.config.ts` to add redirect rule:
  Target content:
  ```typescript
  const nextConfig: NextConfig = {
    experimental: {
      serverActions: {
        bodySizeLimit: '5mb',
      },
    },
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'images.unsplash.com',
        },
      ],
    },
  };
  ```
  Replacement content:
  ```typescript
  const nextConfig: NextConfig = {
    experimental: {
      serverActions: {
        bodySizeLimit: '5mb',
      },
    },
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'images.unsplash.com',
        },
      ],
    },
    async redirects() {
      return [
        {
          source: '/about',
          destination: '/',
          permanent: true,
        },
      ];
    },
  };
  ```

- [ ] **Step 5: Verify build status**
  Run: `npm run build`
  Expected: Success without routing errors or conflicts.

- [ ] **Step 6: Commit changes**
  ```bash
  git add next.config.ts src/app/(public)/page.tsx
  git rm src/app/page.tsx src/app/(public)/about/page.tsx
  git commit -m "feat: move landing page to root and add /about redirect"
  ```

---

### Task 2: Auth Pages Brand Header Navigation

**Files:**
- Modify: `src/app/(auth)/auth/customer/page.tsx`, `src/app/(auth)/auth/admin/page.tsx`, `src/app/(auth)/auth/customer/register/page.tsx`

**Interfaces:**
- Consumes: Static branding blocks on auth pages.
- Produces: Clickable `Link` components pointing to the root route `/`.

- [ ] **Step 1: Update customer login page brand header**
  Modify `src/app/(auth)/auth/customer/page.tsx`.
  Add import for `Link`:
  ```typescript
  import Link from 'next/link';
  ```
  Replace lines 34-41:
  ```tsx
          {/* Brand Header */}
          <div className="flex items-center gap-3 relative z-10 stagger-item">
            <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 1 L15 14 L1 14 Z" fill="#e4f222" />
            </svg>
            <span className="text-[18px] font-medium tracking-tight text-white uppercase">
              {t('auth.panel.appName')}
            </span>
          </div>
  ```
  With:
  ```tsx
          {/* Brand Header */}
          <Link href="/" className="flex items-center gap-3 relative z-10 stagger-item hover:opacity-90 transition-opacity">
            <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 1 L15 14 L1 14 Z" fill="#e4f222" />
            </svg>
            <span className="text-[18px] font-medium tracking-tight text-white uppercase">
              {t('auth.panel.appName')}
            </span>
          </Link>
  ```

- [ ] **Step 2: Update admin login page brand header**
  Modify `src/app/(auth)/auth/admin/page.tsx`.
  Add import for `Link`:
  ```typescript
  import Link from 'next/link';
  ```
  Replace lines 33-41:
  ```tsx
          {/* Brand Header */}
          <div className="flex items-center gap-3 relative z-10 stagger-item">
            <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 1 L15 14 L1 14 Z" fill="#e4f222" />
            </svg>
            <span className="text-[18px] font-medium tracking-tight text-white uppercase">
              {t('auth.panel.appName')}
            </span>
          </div>
  ```
  With:
  ```tsx
          {/* Brand Header */}
          <Link href="/" className="flex items-center gap-3 relative z-10 stagger-item hover:opacity-90 transition-opacity">
            <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 1 L15 14 L1 14 Z" fill="#e4f222" />
            </svg>
            <span className="text-[18px] font-medium tracking-tight text-white uppercase">
              {t('auth.panel.appName')}
            </span>
          </Link>
  ```

- [ ] **Step 3: Update customer register page brand header**
  Modify `src/app/(auth)/auth/customer/register/page.tsx`.
  Add import for `Link`:
  ```typescript
  import Link from 'next/link';
  ```
  Replace lines 33-41:
  ```tsx
          {/* Brand Header */}
          <div className="flex items-center gap-3 relative z-10 stagger-item">
            <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 1 L15 14 L1 14 Z" fill="#e4f222" />
            </svg>
            <span className="text-[18px] font-medium tracking-tight text-white uppercase">
              {t('auth.panel.appName')}
            </span>
          </div>
  ```
  With:
  ```tsx
          {/* Brand Header */}
          <Link href="/" className="flex items-center gap-3 relative z-10 stagger-item hover:opacity-90 transition-opacity">
            <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 1 L15 14 L1 14 Z" fill="#e4f222" />
            </svg>
            <span className="text-[18px] font-medium tracking-tight text-white uppercase">
              {t('auth.panel.appName')}
            </span>
          </Link>
  ```

- [ ] **Step 4: Commit changes**
  ```bash
  git add src/app/(auth)/auth/customer/page.tsx src/app/(auth)/auth/admin/page.tsx src/app/(auth)/auth/customer/register/page.tsx
  git commit -m "feat: make brand headers on auth pages clickable links to root"
  ```

---

### Task 3: Quality Check & Manual Verification

- [ ] **Step 1: Run linter**
  Run: `npm run lint`
  Expected: No linting errors.

- [ ] **Step 2: Compile build**
  Run: `npm run build`
  Expected: Successful compilation.

- [ ] **Step 3: Browser verification**
  Use `browser_subagent` to:
  1. Visit `http://localhost:3000/about` and verify redirect to `/`.
  2. Visit `http://localhost:3000/auth/customer` and click the brand logo/text. Verify URL changes to `/`.
  3. Visit `http://localhost:3000/auth/admin` and click the brand logo/text. Verify URL changes to `/`.
  4. Visit `http://localhost:3000/auth/customer/register` and click the brand logo/text. Verify URL changes to `/`.
