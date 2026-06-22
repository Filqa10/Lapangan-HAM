# Booking Lapangan HAM — Next.js Redesign Spec

Full redesign of the Booking Lapangan HAM web app to match the feature set and flow of the original PHP native application, with a premium "Stadium at Night" visual identity and English/Indonesian language switching.

## Scope

Rewrite every user-facing page in the Next.js codebase to replicate the layout, flow, and features shown in the PHP reference screenshots (`reference-previous/`). The backend (Supabase) and server actions remain; only the presentation layer and route structure change.

---

## 1. Design System

### 1.1 Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--bg-body` | `#0B1120` | Page background |
| `--bg-card` | `#111827` | Card surfaces |
| `--bg-sidebar` | `#0F172A` | Admin sidebar |
| `--bg-input` | `#1E293B` | Form inputs |
| `--accent-blue` | `#3B82F6` | Primary actions, links, admin CTA |
| `--accent-emerald` | `#10B981` | Confirmed/active status |
| `--accent-amber` | `#F59E0B` | Pending/warning status |
| `--accent-red` | `#EF4444` | Cancelled/error status |
| `--accent-cyan` | `#06B6D4` | DP paid status |
| `--accent-purple` | `#8B5CF6` | Secondary accent (calendar DP dot) |
| `--text-primary` | `#F9FAFB` | Headings, body text |
| `--text-secondary` | `#9CA3AF` | Labels, hints |
| `--text-muted` | `#6B7280` | Disabled text |
| `--border-subtle` | `#1E293B` | Card/section borders |
| `--border-focus` | `#3B82F6` | Focus rings |

### 1.2 Typography

- **Display/Heading:** Inter, weight 700-800
- **Body:** Inter, weight 400-500
- **Mono (prices, dates, codes):** Geist Mono

Type scale:
- `--text-xs`: 0.75rem / 1rem
- `--text-sm`: 0.875rem / 1.25rem
- `--text-base`: 1rem / 1.5rem
- `--text-lg`: 1.125rem / 1.75rem
- `--text-xl`: 1.25rem / 1.75rem
- `--text-2xl`: 1.5rem / 2rem
- `--text-3xl`: 1.875rem / 2.25rem
- `--text-4xl`: 2.25rem / 2.5rem

### 1.3 Spacing & Radius

- Card border-radius: `1rem` (16px)
- Button border-radius: `0.5rem` (8px) — square-ish, not pill
- Input border-radius: `0.5rem`
- Sidebar border-radius: none (flush edges)
- Page padding: `1.5rem` mobile, `2.5rem` desktop

### 1.4 Animation Tokens (Emil-inspired)

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
```

- Buttons: `transform: scale(0.97)` on `:active`, 160ms ease-out
- Card hover: subtle `translateY(-2px)` + shadow lift, 200ms ease-out
- Stagger: 50ms delay between stat cards on page load
- Page transitions: fade-in 200ms for main content
- `@media (prefers-reduced-motion: reduce)` — disable transform animations, keep opacity

### 1.5 Signature Element

The booking calendar: a glowing grid where booked slots have color-coded dot indicators with a subtle pulse animation. The calendar background uses a faint grid pattern reminiscent of a football pitch, connecting the digital interface to the stadium experience.

---

## 2. Internationalization (i18n)

### Approach
- Cookie/localStorage preference, no URL changes
- Default language: English
- Supported: `en`, `id` (Indonesian)
- Toggle switch in navbar (both customer and admin)

### Implementation
- Translation dictionary files: `src/lib/i18n/en.ts`, `src/lib/i18n/id.ts`
- React context provider (`I18nProvider`) wrapping the app
- `useTranslation()` hook returns `t(key)` function
- Language toggle component: flag icon + "EN" / "ID" label
- Persist choice in `localStorage` key `lang`, fallback to `en`
- Static strings only — database content (field names, addresses) stays as-is

---

## 3. Route Structure

### Current → New mapping

| Page | Old Route | New Route |
|---|---|---|
| Landing page | `/about` | `/about` (unchanged) |
| Root redirect | `/` → `/about` | `/` → `/about` (unchanged) |
| Customer login | `/login` | `/auth/customer` |
| Customer register | `/register` | `/auth/customer/register` |
| Admin login | (shared with customer) | `/auth/admin` |
| Customer dashboard | `/customer` | `/customer` (unchanged) |
| Booking create | `/customer/booking/create` | `/customer/booking/create` (unchanged) |
| Booking history | `/customer/history` | `/customer/history` (unchanged) |
| Booking payment update | `/customer/booking/[id]` | `/customer/booking/[id]/payment` |
| Admin dashboard | `/admin` | `/admin` (unchanged) |
| Admin bookings | `/admin/bookings` | `/admin/bookings` (unchanged) |
| Admin fields list | `/admin/fields` | `/admin/fields` (unchanged) |
| Admin field create | — | `/admin/fields/create` |
| Admin field edit | — | `/admin/fields/[id]/edit` |

### Middleware Updates
- `/auth/customer` and `/auth/customer/register` — redirect to `/customer` if already logged in as customer, to `/admin` if admin
- `/auth/admin` — redirect to `/admin` if already logged in as admin, to `/customer` if customer
- Remove old `/login` route, add redirect from `/login` to `/auth/customer`
- Remove old `/register` route, add redirect from `/register` to `/auth/customer/register`

---

## 4. Page Designs

### 4.1 `/auth/customer` — Customer Login

**Layout:** Centered card (max-width 440px) on dark background

**Card structure:**
- Header banner: Blue gradient (`--accent-blue` to `#1D4ED8`), stadium branding icon, "Booking Lapangan" title, "Sign in to your account" subtitle
- Info alert (dismissible, light blue bg): "Please sign in or register first to make a booking."
- Form fields:
  - Email — with mail icon prefix, placeholder "Enter your email"
  - Password — with lock icon prefix, placeholder "Enter your password"
- "Login" button — full-width, `--accent-blue`, white text, `scale(0.97)` on press
- Divider line
- Footer: "Don't have an account? [Register Now]" → `/auth/customer/register`

**Reference match:** `login-customer.png`

### 4.2 `/auth/customer/register` — Customer Register

**Layout:** Same centered card

**Card structure:**
- Header banner: same blue gradient, "Booking Lapangan" title, "Create your account" subtitle
- Form fields:
  - Nama Lengkap (Full Name)
  - Email
  - No. Telepon/WhatsApp (phone validation: starts with 08 or +62)
  - Password (min 6 chars)
  - Confirm Password
- "Register" button — full-width blue
- Footer: "Already have an account? [Login]" → `/auth/customer`

### 4.3 `/auth/admin` — Admin Login

**Layout:** Same centered card but with "Admin Panel" branding

**Card structure:**
- Header: Darker gradient variant, shield/admin icon, "Booking Lapangan" title, "Admin Panel" subtitle, "Sign in with admin credentials" text
- Form: Email + Password only
- "Login" button
- No register link

### 4.4 `/customer` — Customer Dashboard

**Layout:** Top navigation bar + main content area (no sidebar)

**Navbar:** "Booking Lapangan" logo, nav links (Dashboard, Booking, History), language toggle (EN/ID), user avatar/name dropdown (Profile, Logout)

**Hero card:** Blue-to-indigo gradient (matching PHP's blue-purple gradient)
- Left: Greeting time-of-day ("GOOD AFTERNOON, 👋"), user name bold, "Ready to play today? Book your favorite field now." + CTA buttons: "Book Now" (white bg), "My Profile" (outline), "Field Info" (outline)
- Right: "TODAY" label + formatted date + calendar icon

**4 Stat Cards** (grid, staggered entry animation 50ms):
- Total Booking — blue icon badge
- Waiting — amber icon badge
- Confirmed — emerald icon badge
- Cancelled — red icon badge

**4 Quick Action Cards** (grid):
- New Booking (calendar+ icon)
- History (clock icon)
- My Profile (user icon)
- Contact Us (phone icon)

**Two-column section:**
- Left column: **Booking Activity** — "View All →" link, list of recent bookings as cards (status icon, field name, date/time, price, status badge: PAID/CONFIRMED/PENDING)
- Right column: **Field Schedule** — Booking Calendar
  - "Booking Calendar" title with legend: Pending (amber dot), DP (purple dot), Confirmed (green dot)
  - Month/week navigation: ‹ › today buttons + month/year title + month/week toggle
  - Calendar grid: MIN SEN SEL RAB KAM JUM SAB headers, date cells with color dots for booked dates
  - Today highlighted with amber background

**Total Spending Card** (dark bg, full-width under left column):
- "TOTAL SPENDING" label, formatted Rp amount, "From X successful bookings", "View History →"

**Reference match:** `home-customers.png`, `home-customer(2).png`, `home-customer(3).png`

### 4.5 `/customer/booking/create` — Booking Form

**Layout:** Dark gradient hero header + two-column body

**Hero header (dark blue-black gradient):**
- "BOOKING FORM" eyebrow badge
- "Book Your Field Now" title (with "Now" in green/blue accent)
- "Fill in booking details, make the DP transfer, and upload payment proof." subtitle
- Breadcrumb: 🏠 Home / Dashboard / Booking

**Two-column layout:**

**Left column (main form) — Step wizard:**

Step 1: "Date & Time" — "Choose your schedule" — "Step 1 / 2"
- Field selector dropdown (if multiple active fields)
- Tanggal Booking date picker (Flatpickr, min date = today)
- "Booked/Unavailable Schedules:" — mini weekly calendar showing existing bookings
- Start Time & End Time selectors (2-hour slot increments: 06:00, 08:00, 10:00, etc.)
- Real-time price calculation display: shows Total Harga and DP Amount (30%, min Rp 500,000)

Step 2: "Payment" (shown after time selection)
- Bank info card (dark bg): "Bank BLU BCA", account number with "Copy" button, a.n. holder name
- Upload guide alert (info blue): "Transfer DP first, then upload screenshot. Format: JPG, PNG, PDF (max 5MB)."
- "Payment Proof / Screenshot" — drag & drop upload zone with upload icon

**Right column (sidebar):**
- Field info card: field image (from Supabase storage or default), field name, address with pin icon, facility tags (LED, Shower, Parking), "Field Available & Active" badge
- Price table per slot: columns Slot | Mon-Thu | Friday | Sat/Sun — matching PHP's tabel harga per slot exactly

**Submit button:** "Confirm & Book Now" — full-width blue, bottom of form

**Reference match:** `booking-page-customer.png`, `booking-page-customers(2).png`

### 4.6 `/customer/history` — Booking History

**Layout:** Customer navbar + main content

- "Booking History" page title
- List/table of all user bookings
- Each row: Field name, date, time range, total price, DP amount, status badge
- Action buttons per row based on status:
  - `dp_paid` → "Complete Payment" button (uploads bukti pelunasan)
  - `pending` → "Waiting for verification" label
  - `confirmed` / `paid` → "Completed" label
  - `cancelled` → "Cancelled" label
- Pagination

### 4.7 `/customer/booking/[id]/payment` — Payment Update

**Layout:** Customer navbar + centered form

- "Complete Payment" title
- Booking summary card: field name, date, time, total price, DP paid, remaining balance
- Bank info card (same as booking create)
- Upload zone for bukti pelunasan
- "Submit Payment Proof" button

### 4.8 `/admin` — Admin Dashboard

**Layout:** Left sidebar + main content area

**Sidebar (dark, `--bg-sidebar`):**
- Logo: "Booking Lapangan" + "Admin Panel" subtitle
- Nav items with icons:
  - Dashboard (home icon) — active state: blue left border + blue text
  - Field Details (pin icon)
  - Booking (calendar icon)
  - Logout (logout icon)

**Main header:** "Administrator" user badge (top right)

**5 Stat Cards row** (color-coded backgrounds matching PHP):
1. Lapangan — white/light card, count + grid icon
2. Total Booking — blue card (`--accent-blue`), count + checkmark icon
3. Pending Verifikasi — amber/yellow card, count
4. DP Dibayar — cyan card (`--accent-cyan`), count
5. Lunas / Dikonfirmasi — emerald/green card, count

**Revenue display:** "DP REVENUE" — formatted amount (top right of stat row)

**Second row (3 items):**
- Left: "TODAY'S REVENUE" card (dark bg) — Rp amount + today's date
- Center: "Last 7 Days Trend" table — Date | Revenue columns
- Right: "Last 6 Months Trend" table — Month | Revenue columns

**Third row:**
- "THIS MONTH'S REVENUE" card (dark bg) — Rp amount + month/year

**Reference match:** `homepage dashboard-admin.png`

### 4.9 `/admin/bookings` — Admin Booking List

**Layout:** Admin sidebar + main content

**Page header:** "Booking List" title + "← Back" button

**Filter bar:** Status dropdown (All Status, Pending, DP Paid, Payment 2 Pending, Confirmed, Cancelled) + "Filter" button

**DataTable:**
- Show entries selector (10/25/50) + search input
- Sortable columns: ID, Customer (name + email), Field, Date, Time, Price, DP, Payment Proof, Status, Booking Date
- "View Proof" link → opens payment proof image in modal/lightbox
- Status badges with colors
- Action buttons per row based on status:
  - `pending` → "Approve DP" button (green)
  - `payment_2_pending` → "Confirm Paid" button (green)
- Pagination: Previous | 1 | Next

**Reference match:** `booking dashboard-admin.png`

### 4.10 `/admin/fields` — Admin Field Management

**Layout:** Admin sidebar + main content

**Page header:** "← Back" button, "Manage Fields" title, "+ Add Field" button (blue)

**DataTable:**
- Show entries + search
- Columns: ID, Field Name, Price/Slot Min, Status, Created Date, Actions
- Status badge: "Active" (green) / "Inactive" (red)
- Action buttons: "Edit" (blue), "Delete" (red)
- Pagination

**Reference match:** `dashboard-admin-daftar-lapanagan.png`

### 4.11 `/admin/fields/create` — Add Field

**Layout:** Admin sidebar + centered form

- "Add New Field" title
- Form: Field Name, Base Price, Address, Status (Active/Inactive toggle), Field Image upload
- "Save" button

### 4.12 `/admin/fields/[id]/edit` — Edit Field

**Layout:** Same as create, pre-filled with existing data

### 4.13 `/about` — Landing Page

Redesign the public landing page to match `homepage-default.png`:

**Navbar:** "Booking Lapangan" logo + hamburger menu (mobile), language toggle

**Hero section:**
- Left: Address badge (location pin icon + full address), "Stadion H. Abdul Malik" large title, description paragraph, "Book Now" CTA button (blue)
- Right: Aerial field image with "Actively Operating" badge overlay + address caption
- Stats row: FIFA Standard Grass | 2000 Lux LED Light | Ready Seats Capacity | 24/7 Booking Online

**Gallery section:** Horizontal scroll of field photos with captions

**Price info section:** Cards with pricing notes

---

## 5. Shared Components

| Component | Usage |
|---|---|
| `CustomerNavbar` | Top nav for all `/customer` pages |
| `AdminSidebar` | Left sidebar for all `/admin` pages |
| `StatCard` | Stats display with icon, count, label |
| `StatusBadge` | Color-coded booking status badge |
| `DataTable` | Sortable, filterable, paginated table |
| `BookingCalendar` | Monthly/weekly calendar with booking indicators |
| `UploadZone` | Drag-and-drop file upload with preview |
| `LanguageToggle` | EN/ID switch button |
| `PriceTable` | Slot pricing table (matches PHP's Tabel Harga Per Slot) |
| `BankInfoCard` | Bank transfer details with copy button |
| `FieldInfoCard` | Field details sidebar card |
| `Modal` | Generic modal/lightbox for viewing images |

---

## 6. Data Flow (Unchanged)

The Supabase backend schema, server actions (`src/actions/`), and pricing logic (`src/config/pricing.ts`) remain unchanged. The redesign only affects the presentation layer:

- `src/actions/auth.ts` — login, register, logout
- `src/actions/bookings.ts` — create booking, update payment, verify DP, confirm paid
- `src/actions/fields.ts` — CRUD fields
- `src/config/pricing.ts` — slot pricing calculation
- `src/lib/supabase/middleware.ts` — route protection

Only the middleware needs updates to handle the new `/auth/customer` and `/auth/admin` routes.

---

## 7. Verification Plan

### Automated
- `npm run build` — type-check + compile
- Existing vitest tests should continue passing

### Manual
- Visual comparison against each of the 10 reference screenshots
- Test auth flow: customer login → dashboard → booking → history → payment
- Test admin flow: admin login → dashboard → bookings (verify DP, confirm) → fields (add, edit, delete)
- Test i18n toggle: switch EN → ID, verify labels change, reload page → preference persists
- Test responsive: mobile viewport for customer pages
- Test middleware: unauthenticated access redirect, role-based redirect
