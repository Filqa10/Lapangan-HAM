# Design Spec: Routing and Navigation Cleanup

## Overview
This design spec addresses the URL routing structure and brand navigation links. Currently, the main landing page is hosted under `/about` and the root path `/` redirects to `/about`. Additionally, the brand headers (logo and app name) on the login and register pages are static and do not navigate back to the main landing page.

## Proposed Changes

### 1. Root Landing Page
*   **Move Route**: Move the main landing page component from `src/app/(public)/about/page.tsx` to `src/app/(public)/page.tsx`.
*   **Remove Redirect Route**: Delete `src/app/page.tsx` to avoid routing conflicts at the root level `/`.
*   **Permanent Redirect**: Add a redirects configuration in `next.config.ts` to redirect `/about` permanently to `/`.
*   **Navbar Logo Update**: Update the logo link on the landing page navbar in `src/app/(public)/page.tsx` from `/about` to `/`.

### 2. Login/Register Navigation
On the customer login, admin login, and customer registration pages, wrap the brand header (SVG logo and app name text) in a Next.js `Link` pointing to `/`.

Files to modify:
1.  `src/app/(auth)/auth/customer/page.tsx`
2.  `src/app/(auth)/auth/admin/page.tsx`
3.  `src/app/(auth)/auth/customer/register/page.tsx`

Style the brand header link with:
*   `hover:opacity-90 transition-opacity`

## Verification Plan

### Automated Tests
- Run `npm run lint` to ensure no imports or syntax errors.
- Run `npm run build` to verify Next.js static generation/compilation succeeds.

### Manual Verification
- Navigate to `http://localhost:3000/about` and verify it redirects to `http://localhost:3000/`.
- Navigate to `http://localhost:3000/auth/customer`, `http://localhost:3000/auth/admin`, and `http://localhost:3000/auth/customer/register`. Click on the "HAM Stadium" brand logo/text on the left panel, and verify it redirects to the landing page at `/`.
