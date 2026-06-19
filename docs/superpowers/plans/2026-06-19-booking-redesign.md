# Booking Lapangan HAM Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild every user-facing page in the Next.js codebase to match the original PHP app's layout, features, and flow — with a premium "Stadium at Night" visual identity, separated auth URLs (`/auth/customer`, `/auth/admin`), and English/Indonesian language switching.

**Architecture:** Server components for data fetching (Supabase), client components for interactivity (forms, calendar, language toggle). Design system via CSS custom properties in `globals.css`. i18n via React context + localStorage. Admin uses sidebar layout, customer uses top navbar layout.

**Tech Stack:** Next.js 16, React 19, Supabase (auth + DB + storage), TailwindCSS v4, Flatpickr, lucide-react icons, Geist + Inter fonts

## Global Constraints

- All text labels must use the i18n `t()` function — no hardcoded UI strings
- Default language: English. Supported: `en`, `id`
- Design tokens defined in `src/app/globals.css` — all components reference CSS variables
- Button press: `transform: scale(0.97)` on `:active`, 160ms `cubic-bezier(0.23, 1, 0.32, 1)`
- `@media (prefers-reduced-motion: reduce)` — disable transform animations
- All interactive elements must have unique `id` attributes
- Existing server actions (`src/actions/`) stay unchanged except for i18n error messages
- Existing tests (`*.test.ts`) must continue passing
- `npm run build` must succeed after every task

---

### Task 1: Design System + Global Styles

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `next.config.ts` (add Unsplash wildcard for images)

**Interfaces:**
- Produces: CSS custom properties (`--bg-body`, `--bg-card`, `--accent-blue`, etc.), animation tokens, global reset styles. All subsequent tasks consume these.

- [ ] **Step 1: Rewrite `globals.css` with design system tokens**

```css
@import "tailwindcss";

:root {
  /* Surfaces */
  --bg-body: #0B1120;
  --bg-card: #111827;
  --bg-sidebar: #0F172A;
  --bg-input: #1E293B;
  --bg-hero-gradient: linear-gradient(135deg, #1E40AF 0%, #4338CA 50%, #3730A3 100%);

  /* Accents */
  --accent-blue: #3B82F6;
  --accent-blue-hover: #2563EB;
  --accent-emerald: #10B981;
  --accent-amber: #F59E0B;
  --accent-red: #EF4444;
  --accent-cyan: #06B6D4;
  --accent-purple: #8B5CF6;

  /* Text */
  --text-primary: #F9FAFB;
  --text-secondary: #9CA3AF;
  --text-muted: #6B7280;

  /* Borders */
  --border-subtle: #1E293B;
  --border-focus: #3B82F6;

  /* Animation */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
}

@theme inline {
  --color-background: var(--bg-body);
  --color-foreground: var(--text-primary);
  --font-sans: var(--font-inter);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--bg-body);
  color: var(--text-primary);
  font-family: var(--font-inter), 'Inter', system-ui, sans-serif;
}

/* Button press feedback — Emil principle */
button, [role="button"], a.btn {
  transition: transform var(--duration-fast) var(--ease-out);
}
button:active, [role="button"]:active, a.btn:active {
  transform: scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  button:active, [role="button"]:active, a.btn:active {
    transform: none;
  }
}

/* Stagger animation for cards */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.stagger-item {
  opacity: 0;
  animation: fadeInUp 300ms var(--ease-out) forwards;
}
.stagger-item:nth-child(1) { animation-delay: 0ms; }
.stagger-item:nth-child(2) { animation-delay: 50ms; }
.stagger-item:nth-child(3) { animation-delay: 100ms; }
.stagger-item:nth-child(4) { animation-delay: 150ms; }
.stagger-item:nth-child(5) { animation-delay: 200ms; }

@media (prefers-reduced-motion: reduce) {
  .stagger-item { animation: none; opacity: 1; }
}

/* Flatpickr theme overrides */
.flatpickr-calendar {
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-card);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.4);
  font-family: var(--font-inter), 'Inter', system-ui, sans-serif;
  color: var(--text-primary);
}
.flatpickr-day.selected,
.flatpickr-day.startRange,
.flatpickr-day.endRange,
.flatpickr-day.selected:hover {
  border-color: var(--accent-blue);
  background: var(--accent-blue);
  color: white;
}

/* Focus ring */
input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}
```

- [ ] **Step 2: Update `layout.tsx` to use Inter font**

Replace Geist Sans with Inter as the primary display font. Keep Geist Mono for monospace.

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "flatpickr/dist/flatpickr.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HAM Stadium Booking",
  description: "Book sports fields at HAM Stadium with online DP and payment flow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Update `next.config.ts` to allow all Unsplash images**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 4: Verify build passes**

Run: `npm run build`
Expected: Build completes without errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx next.config.ts
git commit -m "feat: replace design system with Stadium at Night tokens"
```

---

### Task 2: i18n System

**Files:**
- Create: `src/lib/i18n/translations/en.ts`
- Create: `src/lib/i18n/translations/id.ts`
- Create: `src/lib/i18n/context.tsx`
- Create: `src/lib/i18n/index.ts`
- Create: `src/components/LanguageToggle.tsx`

**Interfaces:**
- Produces:
  - `I18nProvider` component (wraps app subtree)
  - `useTranslation()` hook returning `{ t: (key: string) => string, locale: 'en' | 'id', setLocale: (locale: 'en' | 'id') => void }`
  - `LanguageToggle` component (renders EN/ID switch)
  - Translation dictionaries keyed by dot-notation strings

- [ ] **Step 1: Create English translation dictionary**

Create `src/lib/i18n/translations/en.ts`:

```ts
const en: Record<string, string> = {
  // Common
  'common.appName': 'Booking Lapangan',
  'common.adminPanel': 'Admin Panel',
  'common.back': 'Back',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.filter': 'Filter',
  'common.search': 'Search',
  'common.logout': 'Logout',
  'common.loading': 'Loading...',
  'common.allStatus': 'All Status',
  'common.showEntries': 'Show',
  'common.entries': 'entries',
  'common.previous': 'Previous',
  'common.next': 'Next',
  'common.of': 'of',
  'common.showing': 'Showing',
  'common.to': 'to',
  'common.copy': 'Copy',
  'common.copied': 'Copied!',

  // Auth
  'auth.login': 'Login',
  'auth.register': 'Register',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.confirmPassword': 'Confirm Password',
  'auth.fullName': 'Full Name',
  'auth.phone': 'Phone / WhatsApp',
  'auth.enterEmail': 'Enter your email',
  'auth.enterPassword': 'Enter your password',
  'auth.signInTitle': 'Sign in to your account',
  'auth.signInSubtitle': 'After signing in, you will be redirected to the appropriate dashboard.',
  'auth.registerTitle': 'Create your account',
  'auth.registerSubtitle': 'Register to start booking fields at HAM Stadium.',
  'auth.noAccount': "Don't have an account?",
  'auth.registerNow': 'Register Now',
  'auth.hasAccount': 'Already have an account?',
  'auth.loginNow': 'Login',
  'auth.loginRequired': 'Please sign in or register first to make a booking.',
  'auth.adminSignIn': 'Sign in with admin credentials',
  'auth.registerButton': 'Register',

  // Customer Nav
  'nav.dashboard': 'Dashboard',
  'nav.booking': 'Booking',
  'nav.history': 'History',
  'nav.profile': 'Profile',
  'nav.fieldDetails': 'Field Details',
  'nav.contactUs': 'Contact Us',

  // Customer Dashboard
  'dashboard.greeting.morning': 'GOOD MORNING',
  'dashboard.greeting.afternoon': 'GOOD AFTERNOON',
  'dashboard.greeting.evening': 'GOOD EVENING',
  'dashboard.greeting.emoji': '👋',
  'dashboard.readyToPlay': 'Ready to play today? Book your favorite field now.',
  'dashboard.today': 'TODAY',
  'dashboard.bookNow': 'Book Now',
  'dashboard.myProfile': 'My Profile',
  'dashboard.fieldInfo': 'Field Info',
  'dashboard.totalBooking': 'TOTAL BOOKING',
  'dashboard.waiting': 'WAITING',
  'dashboard.confirmed': 'CONFIRMED',
  'dashboard.cancelled': 'CANCELLED',
  'dashboard.newBooking': 'New Booking',
  'dashboard.history': 'History',
  'dashboard.myProfileAction': 'My Profile',
  'dashboard.contactUs': 'Contact Us',
  'dashboard.bookingActivity': 'Booking Activity',
  'dashboard.viewAll': 'View All →',
  'dashboard.fieldSchedule': 'Field Schedule',
  'dashboard.bookingCalendar': 'Booking Calendar',
  'dashboard.pending': 'Pending',
  'dashboard.dpPaid': 'DP',
  'dashboard.confirmedDot': 'Confirmed',
  'dashboard.month': 'month',
  'dashboard.week': 'week',
  'dashboard.totalSpending': 'TOTAL SPENDING',
  'dashboard.fromBookings': 'From {count} successful bookings',
  'dashboard.viewHistory': 'View History →',
  'dashboard.noBookings': 'No bookings yet. Start by selecting a field slot.',

  // Status
  'status.pending': 'Pending Verification',
  'status.dp_paid': 'DP Approved',
  'status.payment_2_pending': 'Payment Pending',
  'status.paid': 'Paid',
  'status.confirmed': 'Confirmed',
  'status.cancelled': 'Cancelled',

  // Booking Form
  'booking.formTitle': 'BOOKING FORM',
  'booking.heading': 'Book Your Field',
  'booking.headingAccent': 'Now',
  'booking.subtitle': 'Fill in booking details, make the DP transfer, and upload payment proof.',
  'booking.breadcrumbHome': 'Home',
  'booking.breadcrumbDashboard': 'Dashboard',
  'booking.breadcrumbBooking': 'Booking',
  'booking.step1Title': 'Date & Time',
  'booking.step1Subtitle': 'Choose your schedule',
  'booking.step': 'Step',
  'booking.field': 'Field',
  'booking.noActiveFields': 'No active fields available',
  'booking.bookingDate': 'Booking Date',
  'booking.minToday': 'Minimum today',
  'booking.pickDate': 'Pick a date...',
  'booking.bookedSchedules': 'Booked / Unavailable Schedules:',
  'booking.startTime': 'Start Time',
  'booking.endTime': 'End Time',
  'booking.step2Title': 'Payment',
  'booking.step2Subtitle': 'Transfer DP and upload proof',
  'booking.bankInfo': 'Bank BLU BCA',
  'booking.accountHolder': 'a.n. Filqa',
  'booking.uploadGuideTitle': 'Upload Guide',
  'booking.uploadGuide': 'Transfer DP first, then upload screenshot/photo of transfer proof. Format: JPG, PNG, or PDF (max 5MB).',
  'booking.paymentProof': 'Payment Proof / Screenshot',
  'booking.dragDrop': 'Click or drag file here',
  'booking.dragDropSubtext': 'Screenshot / photo of transfer proof',
  'booking.fileFormats': 'JPG, PNG, PDF • Max 5MB',
  'booking.confirmButton': 'Confirm & Book Now',
  'booking.submitting': 'Submitting booking...',
  'booking.fieldAvailable': 'Field Available & Active',
  'booking.pricePerSlot': 'PRICE TABLE PER SLOT',
  'booking.slot': 'Slot',
  'booking.monThu': 'Mon-Thu',
  'booking.friday': 'Friday',
  'booking.satSun': 'Sat/Sun',
  'booking.na': 'N/A',
  'booking.totalPrice': 'Total Price',
  'booking.dpAmount': 'DP Amount (30%)',
  'booking.dpRequired': 'DP must be sent now',
  'booking.remaining': 'Remaining Balance',

  // History
  'history.title': 'Booking History',
  'history.completePayment': 'Complete Payment',
  'history.waitingVerification': 'Waiting for verification',
  'history.completed': 'Completed',
  'history.noHistory': 'No booking history found.',

  // Payment
  'payment.title': 'Complete Payment',
  'payment.bookingSummary': 'Booking Summary',
  'payment.remainingBalance': 'Remaining Balance',
  'payment.submitProof': 'Submit Payment Proof',
  'payment.submitting': 'Submitting...',

  // Admin Dashboard
  'admin.controlRoom': 'ADMIN CONTROL ROOM',
  'admin.dashboardTitle': 'Dashboard',
  'admin.administrator': 'Administrator',
  'admin.fields': 'Fields',
  'admin.totalBookingCount': 'Total Booking',
  'admin.pendingVerification': 'Pending Verification',
  'admin.dpPaid': 'DP Paid',
  'admin.confirmedPaid': 'Confirmed / Paid',
  'admin.dpRevenue': 'DP REVENUE',
  'admin.todayRevenue': "TODAY'S REVENUE",
  'admin.last7Days': 'Last 7 Days Trend',
  'admin.last6Months': 'Last 6 Months Trend',
  'admin.thisMonthRevenue': "THIS MONTH'S REVENUE",
  'admin.date': 'DATE',
  'admin.revenue': 'REVENUE',
  'admin.monthCol': 'MONTH',

  // Admin Bookings
  'admin.bookingList': 'Booking List',
  'admin.customer': 'Customer',
  'admin.fieldCol': 'Field',
  'admin.dateCol': 'Date',
  'admin.time': 'Time',
  'admin.price': 'Price',
  'admin.dp': 'DP',
  'admin.paymentProof': 'Payment Proof',
  'admin.statusCol': 'Status',
  'admin.bookingDate': 'Booking Date',
  'admin.actions': 'Actions',
  'admin.viewProof': 'View Proof',
  'admin.approveDP': 'Approve DP',
  'admin.confirmPaid': 'Confirm Paid',
  'admin.cancelBooking': 'Cancel',
  'admin.verifyPayments': 'Verify Payments',

  // Admin Fields
  'admin.manageFields': 'Manage Fields',
  'admin.addField': '+ Add Field',
  'admin.fieldName': 'Field Name',
  'admin.priceSlotMin': 'Price/Slot Min',
  'admin.statusField': 'Status',
  'admin.createdDate': 'Created Date',
  'admin.active': 'Active',
  'admin.inactive': 'Inactive',
  'admin.addFieldTitle': 'Add New Field',
  'admin.editFieldTitle': 'Edit Field',
  'admin.fieldNameLabel': 'Field Name',
  'admin.basePriceLabel': 'Base Price (Rp)',
  'admin.addressLabel': 'Address',
  'admin.statusLabel': 'Status',

  // Landing Page
  'landing.heroTitle': 'Stadion H. Abdul Malik',
  'landing.heroDescription': 'International-standard modern football field. Premium synthetic turf, 2000 lux LED lighting, and complete facilities for the best playing experience.',
  'landing.bookNow': 'Book Now',
  'landing.activelyOperating': 'Actively Operating',
  'landing.fifaGrass': 'FIFA Standard Grass',
  'landing.ledLight': '2000 Lux LED Light',
  'landing.seatsReady': 'Ready Seats Capacity',
  'landing.onlineBooking': '24/7 Booking Online',
};

export default en;
```

- [ ] **Step 2: Create Indonesian translation dictionary**

Create `src/lib/i18n/translations/id.ts`:

```ts
const id: Record<string, string> = {
  // Common
  'common.appName': 'Booking Lapangan',
  'common.adminPanel': 'Admin Panel',
  'common.back': 'Kembali',
  'common.save': 'Simpan',
  'common.cancel': 'Batal',
  'common.delete': 'Hapus',
  'common.edit': 'Edit',
  'common.filter': 'Filter',
  'common.search': 'Cari',
  'common.logout': 'Keluar',
  'common.loading': 'Memuat...',
  'common.allStatus': 'Semua Status',
  'common.showEntries': 'Tampilkan',
  'common.entries': 'entri',
  'common.previous': 'Sebelumnya',
  'common.next': 'Selanjutnya',
  'common.of': 'dari',
  'common.showing': 'Menampilkan',
  'common.to': 'sampai',
  'common.copy': 'Salin',
  'common.copied': 'Tersalin!',

  // Auth
  'auth.login': 'Masuk',
  'auth.register': 'Daftar',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.confirmPassword': 'Konfirmasi Password',
  'auth.fullName': 'Nama Lengkap',
  'auth.phone': 'No. Telepon / WhatsApp',
  'auth.enterEmail': 'Masukkan email Anda',
  'auth.enterPassword': 'Masukkan password Anda',
  'auth.signInTitle': 'Masuk ke akun Anda',
  'auth.signInSubtitle': 'Setelah berhasil masuk, Anda akan diarahkan ke dashboard yang sesuai.',
  'auth.registerTitle': 'Buat akun baru',
  'auth.registerSubtitle': 'Daftar untuk mulai booking lapangan di Stadion HAM.',
  'auth.noAccount': 'Belum punya akun?',
  'auth.registerNow': 'Daftar Sekarang',
  'auth.hasAccount': 'Sudah punya akun?',
  'auth.loginNow': 'Masuk',
  'auth.loginRequired': 'Silakan login atau daftar terlebih dahulu untuk melakukan booking.',
  'auth.adminSignIn': 'Masuk dengan akun administrator',
  'auth.registerButton': 'Daftar',

  // Customer Nav
  'nav.dashboard': 'Dashboard',
  'nav.booking': 'Booking',
  'nav.history': 'Riwayat',
  'nav.profile': 'Profil',
  'nav.fieldDetails': 'Detail Lapangan',
  'nav.contactUs': 'Hubungi Kami',

  // Customer Dashboard
  'dashboard.greeting.morning': 'SELAMAT PAGI',
  'dashboard.greeting.afternoon': 'SELAMAT SIANG',
  'dashboard.greeting.evening': 'SELAMAT MALAM',
  'dashboard.greeting.emoji': '👋',
  'dashboard.readyToPlay': 'Siap bermain hari ini? Booking lapangan favoritmu sekarang.',
  'dashboard.today': 'HARI INI',
  'dashboard.bookNow': 'Booking Sekarang',
  'dashboard.myProfile': 'Profil Saya',
  'dashboard.fieldInfo': 'Info Lapangan',
  'dashboard.totalBooking': 'TOTAL BOOKING',
  'dashboard.waiting': 'MENUNGGU',
  'dashboard.confirmed': 'DIKONFIRMASI',
  'dashboard.cancelled': 'DIBATALKAN',
  'dashboard.newBooking': 'Booking Baru',
  'dashboard.history': 'Riwayat',
  'dashboard.myProfileAction': 'Profil Saya',
  'dashboard.contactUs': 'Hubungi Kami',
  'dashboard.bookingActivity': 'Aktivitas Booking',
  'dashboard.viewAll': 'Lihat Semua →',
  'dashboard.fieldSchedule': 'Jadwal Lapangan',
  'dashboard.bookingCalendar': 'Kalender Booking',
  'dashboard.pending': 'Pending',
  'dashboard.dpPaid': 'DP',
  'dashboard.confirmedDot': 'Dikonfirmasi',
  'dashboard.month': 'bulan',
  'dashboard.week': 'minggu',
  'dashboard.totalSpending': 'TOTAL PENGELUARAN',
  'dashboard.fromBookings': 'Dari {count} booking berhasil',
  'dashboard.viewHistory': 'Lihat Riwayat →',
  'dashboard.noBookings': 'Belum ada booking. Mulai dengan memilih slot lapangan.',

  // Status
  'status.pending': 'Menunggu Verifikasi',
  'status.dp_paid': 'DP Disetujui',
  'status.payment_2_pending': 'Pelunasan Menunggu',
  'status.paid': 'Lunas',
  'status.confirmed': 'Dikonfirmasi',
  'status.cancelled': 'Dibatalkan',

  // Booking Form
  'booking.formTitle': 'FORM BOOKING',
  'booking.heading': 'Booking Lapangan',
  'booking.headingAccent': 'Sekarang',
  'booking.subtitle': 'Isi detail booking, lakukan transfer DP, dan upload bukti pembayaran.',
  'booking.breadcrumbHome': 'Home',
  'booking.breadcrumbDashboard': 'Dashboard',
  'booking.breadcrumbBooking': 'Booking',
  'booking.step1Title': 'Tanggal & Waktu',
  'booking.step1Subtitle': 'Pilih jadwal main Anda',
  'booking.step': 'Langkah',
  'booking.field': 'Lapangan',
  'booking.noActiveFields': 'Belum ada lapangan aktif',
  'booking.bookingDate': 'Tanggal Booking',
  'booking.minToday': 'Minimal hari ini',
  'booking.pickDate': 'Pilih tanggal...',
  'booking.bookedSchedules': 'Jadwal Habis / Ter-booking:',
  'booking.startTime': 'Jam Mulai',
  'booking.endTime': 'Jam Selesai',
  'booking.step2Title': 'Pembayaran',
  'booking.step2Subtitle': 'Transfer DP dan upload bukti',
  'booking.bankInfo': 'Bank BLU BCA',
  'booking.accountHolder': 'a.n. Filqa',
  'booking.uploadGuideTitle': 'Panduan Upload',
  'booking.uploadGuide': 'Transfer DP terlebih dahulu, lalu upload screenshot/foto bukti transfer. Format: JPG, PNG, atau PDF (maks 5MB).',
  'booking.paymentProof': 'Bukti Transfer / Screenshot',
  'booking.dragDrop': 'Klik atau seret file ke sini',
  'booking.dragDropSubtext': 'Screenshot / foto bukti transfer',
  'booking.fileFormats': 'JPG, PNG, PDF • Maks 5MB',
  'booking.confirmButton': 'Konfirmasi & Booking Sekarang',
  'booking.submitting': 'Mengirim booking...',
  'booking.fieldAvailable': 'Lapangan Tersedia & Aktif',
  'booking.pricePerSlot': 'TABEL HARGA PER SLOT',
  'booking.slot': 'Slot',
  'booking.monThu': 'Sen-Kam',
  'booking.friday': 'Jumat',
  'booking.satSun': 'Sab/Min',
  'booking.na': 'N/A',
  'booking.totalPrice': 'Total Harga',
  'booking.dpAmount': 'Jumlah DP (30%)',
  'booking.dpRequired': 'DP wajib dikirim sekarang',
  'booking.remaining': 'Sisa Pembayaran',

  // History
  'history.title': 'Riwayat Booking',
  'history.completePayment': 'Pelunasan',
  'history.waitingVerification': 'Menunggu verifikasi',
  'history.completed': 'Selesai',
  'history.noHistory': 'Belum ada riwayat booking.',

  // Payment
  'payment.title': 'Pelunasan Pembayaran',
  'payment.bookingSummary': 'Ringkasan Booking',
  'payment.remainingBalance': 'Sisa Pembayaran',
  'payment.submitProof': 'Kirim Bukti Pembayaran',
  'payment.submitting': 'Mengirim...',

  // Admin Dashboard
  'admin.controlRoom': 'PANEL ADMIN',
  'admin.dashboardTitle': 'Dashboard',
  'admin.administrator': 'Administrator',
  'admin.fields': 'Lapangan',
  'admin.totalBookingCount': 'Total Booking',
  'admin.pendingVerification': 'Pending Verifikasi',
  'admin.dpPaid': 'DP Dibayar',
  'admin.confirmedPaid': 'Lunas / Dikonfirmasi',
  'admin.dpRevenue': 'PENDAPATAN DP',
  'admin.todayRevenue': 'PENDAPATAN HARI INI',
  'admin.last7Days': 'Tren 7 Hari Terakhir',
  'admin.last6Months': 'Tren 6 Bulan Terakhir',
  'admin.thisMonthRevenue': 'PENDAPATAN BULAN INI',
  'admin.date': 'TANGGAL',
  'admin.revenue': 'PENDAPATAN',
  'admin.monthCol': 'BULAN',

  // Admin Bookings
  'admin.bookingList': 'Daftar Booking',
  'admin.customer': 'Customer',
  'admin.fieldCol': 'Lapangan',
  'admin.dateCol': 'Tanggal',
  'admin.time': 'Waktu',
  'admin.price': 'Harga',
  'admin.dp': 'DP',
  'admin.paymentProof': 'Bukti Pembayaran',
  'admin.statusCol': 'Status',
  'admin.bookingDate': 'Tanggal Booking',
  'admin.actions': 'Aksi',
  'admin.viewProof': 'Lihat Bukti',
  'admin.approveDP': 'Setujui DP',
  'admin.confirmPaid': 'Konfirmasi Lunas',
  'admin.cancelBooking': 'Batalkan',
  'admin.verifyPayments': 'Verifikasi Pembayaran',

  // Admin Fields
  'admin.manageFields': 'Kelola Lapangan',
  'admin.addField': '+ Tambah Lapangan',
  'admin.fieldName': 'Nama Lapangan',
  'admin.priceSlotMin': 'Harga/Slot Min',
  'admin.statusField': 'Status',
  'admin.createdDate': 'Tanggal Dibuat',
  'admin.active': 'Aktif',
  'admin.inactive': 'Tidak Aktif',
  'admin.addFieldTitle': 'Tambah Lapangan Baru',
  'admin.editFieldTitle': 'Edit Lapangan',
  'admin.fieldNameLabel': 'Nama Lapangan',
  'admin.basePriceLabel': 'Harga Dasar (Rp)',
  'admin.addressLabel': 'Alamat',
  'admin.statusLabel': 'Status',

  // Landing Page
  'landing.heroTitle': 'Stadion H. Abdul Malik',
  'landing.heroDescription': 'Lapangan sepak bola modern berstandar internasional. Rumput sintetis premium, pencahayaan LED 2000 lux, dan fasilitas lengkap untuk pengalaman bermain terbaik.',
  'landing.bookNow': 'Booking Sekarang',
  'landing.activelyOperating': 'Beroperasi Aktif',
  'landing.fifaGrass': 'FIFA Standard Grass',
  'landing.ledLight': '2000 Lux LED Light',
  'landing.seatsReady': 'Ready Seats Capacity',
  'landing.onlineBooking': '24/7 Booking Online',
};

export default id;
```

- [ ] **Step 3: Create i18n context and hook**

Create `src/lib/i18n/context.tsx`:

```tsx
'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import en from './translations/en';
import id from './translations/id';

export type Locale = 'en' | 'id';

const dictionaries: Record<Locale, Record<string, string>> = { en, id };

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem('lang');
  if (stored === 'en' || stored === 'id') return stored;
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getInitialLocale());
    setMounted(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem('lang', next);
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let value = dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          value = value.replaceAll(`{${k}}`, String(v));
        });
      }
      return value;
    },
    [locale],
  );

  // Prevent hydration mismatch: render English during SSR, update on mount
  const contextValue: I18nContextValue = {
    locale: mounted ? locale : 'en',
    setLocale,
    t: mounted ? t : (key, vars) => {
      let value = dictionaries.en[key] ?? key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          value = value.replaceAll(`{${k}}`, String(v));
        });
      }
      return value;
    },
  };

  return <I18nContext value={contextValue}>{children}</I18nContext>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
}
```

- [ ] **Step 4: Create barrel export**

Create `src/lib/i18n/index.ts`:

```ts
export { I18nProvider, useTranslation, type Locale } from './context';
```

- [ ] **Step 5: Create LanguageToggle component**

Create `src/components/LanguageToggle.tsx`:

```tsx
'use client';

import { useTranslation } from '@/lib/i18n';

export function LanguageToggle() {
  const { locale, setLocale } = useTranslation();

  return (
    <button
      type="button"
      id="language-toggle"
      onClick={() => setLocale(locale === 'en' ? 'id' : 'en')}
      className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-input)] px-3 py-1.5 text-xs font-bold tracking-wider text-[var(--text-secondary)] uppercase transition hover:border-[var(--accent-blue)] hover:text-[var(--text-primary)]"
      aria-label={`Switch language to ${locale === 'en' ? 'Indonesian' : 'English'}`}
    >
      <span className="text-sm">🌐</span>
      {locale === 'en' ? 'EN' : 'ID'}
    </button>
  );
}
```

- [ ] **Step 6: Verify build passes**

Run: `npm run build`
Expected: Build completes without errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/i18n/ src/components/LanguageToggle.tsx
git commit -m "feat: add i18n system with EN/ID translations and language toggle"
```

---

### Task 3: Shared Layout Components

**Files:**
- Create: `src/components/CustomerNavbar.tsx`
- Create: `src/components/AdminSidebar.tsx`
- Create: `src/components/StatusBadge.tsx`
- Create: `src/components/StatCard.tsx`
- Create: `src/app/customer/layout.tsx`
- Create: `src/app/admin/layout.tsx`
- Modify: `src/app/layout.tsx` (wrap with I18nProvider)

**Interfaces:**
- Consumes: `useTranslation()`, `LanguageToggle`, CSS variables from Task 1
- Produces:
  - `CustomerNavbar` — top nav with logo, links, language toggle, user dropdown
  - `AdminSidebar` — left sidebar with logo, nav items, logout
  - `StatusBadge` — `({ status: string }) => JSX.Element`
  - `StatCard` — `({ icon: ReactNode, value: string | number, label: string, colorClass: string }) => JSX.Element`
  - Customer layout wrapping all `/customer` pages
  - Admin layout wrapping all `/admin` pages

- [ ] **Step 1: Wrap root layout with I18nProvider**

In `src/app/layout.tsx`, import and wrap children with `I18nProvider`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "flatpickr/dist/flatpickr.css";
import "./globals.css";

import { I18nProvider } from "@/lib/i18n";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HAM Stadium Booking",
  description: "Book sports fields at HAM Stadium with online DP and payment flow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create StatusBadge component**

Create `src/components/StatusBadge.tsx`:

```tsx
'use client';

import { useTranslation } from '@/lib/i18n';

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  dp_paid: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  payment_2_pending: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const style = statusStyles[status] ?? 'bg-gray-500/15 text-gray-400 border-gray-500/30';
  const label = t(`status.${status}`) || status;

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${style}`}>
      {label}
    </span>
  );
}
```

- [ ] **Step 3: Create StatCard component**

Create `src/components/StatCard.tsx`:

```tsx
import type { ReactNode } from 'react';

type StatCardProps = {
  icon: ReactNode;
  value: string | number;
  label: string;
  colorClass?: string;
};

export function StatCard({ icon, value, label, colorClass = 'bg-[var(--bg-card)]' }: StatCardProps) {
  return (
    <article className={`stagger-item rounded-2xl border border-[var(--border-subtle)] p-5 ${colorClass}`}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
        {icon}
      </div>
      <p className="text-3xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-1 text-xs font-bold tracking-wider text-[var(--text-secondary)] uppercase">{label}</p>
    </article>
  );
}
```

- [ ] **Step 4: Create CustomerNavbar component**

Create `src/components/CustomerNavbar.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Calendar, History, Home, LogOut, Menu, User, X } from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { LanguageToggle } from './LanguageToggle';

type CustomerNavbarProps = {
  userName?: string;
};

const navLinks = [
  { href: '/customer', labelKey: 'nav.dashboard', icon: Home },
  { href: '/customer/booking/create', labelKey: 'nav.booking', icon: Calendar },
  { href: '/customer/history', labelKey: 'nav.history', icon: History },
];

export function CustomerNavbar({ userName }: CustomerNavbarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-body)]/95 backdrop-blur-md" id="customer-navbar">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/customer" className="flex items-center gap-2 text-lg font-extrabold text-[var(--text-primary)]">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-blue)] text-white text-sm">⚽</span>
          {t('common.appName')}
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/customer' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]'
                    : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
                }`}
              >
                <link.icon size={16} />
                {t(link.labelKey)}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <LanguageToggle />
          <div className="hidden items-center gap-2 md:flex">
            <Link href="/customer" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <User size={16} />
              <span className="max-w-[120px] truncate">{userName ?? 'Customer'}</span>
            </Link>
            <form action="/api/auth/signout" method="post">
              <button type="submit" className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-red-500/10 hover:text-red-400" title={t('common.logout')}>
                <LogOut size={16} />
              </button>
            </form>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="rounded-lg p-2 text-[var(--text-secondary)] md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-body)] px-4 py-3 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <link.icon size={18} />
              {t(link.labelKey)}
            </Link>
          ))}
          <hr className="my-2 border-[var(--border-subtle)]" />
          <form action="/api/auth/signout" method="post">
            <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10">
              <LogOut size={18} />
              {t('common.logout')}
            </button>
          </form>
        </div>
      )}
    </nav>
  );
}
```

- [ ] **Step 5: Create AdminSidebar component**

Create `src/components/AdminSidebar.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Home, LogOut, MapPin } from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { LanguageToggle } from './LanguageToggle';

const adminLinks = [
  { href: '/admin', labelKey: 'admin.dashboardTitle', icon: Home, exact: true },
  { href: '/admin/fields', labelKey: 'nav.fieldDetails', icon: MapPin },
  { href: '/admin/bookings', labelKey: 'nav.booking', icon: Calendar },
];

export function AdminSidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-sidebar)]" id="admin-sidebar">
      <div className="flex flex-col gap-1 p-6">
        <Link href="/admin" className="text-xl font-extrabold text-[var(--text-primary)]">
          {t('common.appName')}
        </Link>
        <span className="text-xs font-semibold text-[var(--text-muted)]">{t('common.adminPanel')}</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {adminLinks.map((link) => {
          const isActive = link.exact
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(link.href + '/');
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'border-l-2 border-[var(--accent-blue)] bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]'
                  : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
              }`}
            >
              <link.icon size={18} />
              {t(link.labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-[var(--border-subtle)] p-4">
        <div className="mb-3">
          <LanguageToggle />
        </div>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={18} />
            {t('common.logout')}
          </button>
        </form>
      </div>
    </aside>
  );
}
```

- [ ] **Step 6: Create customer layout**

Create `src/app/customer/layout.tsx`:

```tsx
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { CustomerNavbar } from '@/components/CustomerNavbar';

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/customer');

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-[var(--bg-body)]">
      <CustomerNavbar userName={profile?.name ?? user.email ?? undefined} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 7: Create admin layout**

Create `src/app/admin/layout.tsx`:

```tsx
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/admin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') redirect('/customer');

  return (
    <div className="min-h-screen bg-[var(--bg-body)]">
      <AdminSidebar />
      <div className="pl-64">
        <header className="flex h-16 items-center justify-end border-b border-[var(--border-subtle)] px-6">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-blue)]/20 text-[var(--accent-blue)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
            </span>
            {profile?.name ?? 'Administrator'}
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Create sign-out API route**

Create `src/app/api/auth/signout/route.ts`:

```ts
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/auth/customer');
}
```

- [ ] **Step 9: Verify build passes**

Run: `npm run build`
Expected: Build completes. Some pages may error at runtime because they still have the old green theme — that's OK, we'll fix those in subsequent tasks.

- [ ] **Step 10: Commit**

```bash
git add src/components/ src/app/customer/layout.tsx src/app/admin/layout.tsx src/app/api/ src/app/layout.tsx
git commit -m "feat: add shared layout components — navbar, sidebar, stat card, status badge"
```

---

### Task 4: Auth Routes + Middleware Update

**Files:**
- Create: `src/app/(auth)/auth/customer/page.tsx`
- Create: `src/app/(auth)/auth/customer/CustomerLoginForm.tsx`
- Create: `src/app/(auth)/auth/customer/register/page.tsx`
- Create: `src/app/(auth)/auth/customer/register/CustomerRegisterForm.tsx`
- Create: `src/app/(auth)/auth/admin/page.tsx`
- Create: `src/app/(auth)/auth/admin/AdminLoginForm.tsx`
- Delete: `src/app/(auth)/login/` (old login route)
- Delete: `src/app/(auth)/register/` (old register route)
- Modify: `src/lib/supabase/middleware.ts` (handle new auth routes)
- Modify: `src/proxy.ts` (unchanged, but verify it still works)

**Interfaces:**
- Consumes: `loginAction`, `registerAction` from `src/actions/auth.ts`, `useTranslation()`, CSS variables
- Produces: Three login/register pages at `/auth/customer`, `/auth/customer/register`, `/auth/admin`

- [ ] **Step 1: Create customer login page**

Create `src/app/(auth)/auth/customer/page.tsx`:

The page should have a centered card with:
- Blue gradient header banner with "Booking Lapangan" title
- Info alert about needing to login
- Email + Password form fields with icon prefixes (lucide Mail, Lock icons)
- Login button (full-width, blue)
- Link to register page
- Uses `loginAction` from auth actions
- All labels use `t()` from i18n

- [ ] **Step 2: Create CustomerLoginForm client component**

Create `src/app/(auth)/auth/customer/CustomerLoginForm.tsx` — a `'use client'` component with `useActionState(loginAction, ...)`.

- [ ] **Step 3: Create customer register page + form**

Create `src/app/(auth)/auth/customer/register/page.tsx` and `CustomerRegisterForm.tsx`:
- Same card layout as login
- Fields: Name, Email, Phone, Password, Confirm Password
- Uses `registerAction` from auth actions
- Link back to login

- [ ] **Step 4: Create admin login page + form**

Create `src/app/(auth)/auth/admin/page.tsx` and `AdminLoginForm.tsx`:
- Same card structure but with "Admin Panel" branding
- Shield icon instead of calendar
- Only Email + Password (no register link)
- Uses `loginAction` from auth actions

- [ ] **Step 5: Update middleware to handle new auth routes**

Modify `src/lib/supabase/middleware.ts`:
- Add `/auth/customer` and `/auth/admin` to recognized routes
- Redirect authenticated customers from `/auth/customer` → `/customer`
- Redirect authenticated admins from `/auth/admin` → `/admin`
- Redirect `/login` → `/auth/customer` (backward compat)
- Redirect `/register` → `/auth/customer/register`

- [ ] **Step 6: Delete old login/register routes**

Remove `src/app/(auth)/login/` and `src/app/(auth)/register/` directories.

- [ ] **Step 7: Verify build passes and test auth flow**

Run: `npm run build`
Run: `npm run test`
Expected: Build succeeds, existing tests pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: separate auth routes — /auth/customer and /auth/admin"
```

---

### Task 5: Customer Dashboard

**Files:**
- Rewrite: `src/app/customer/page.tsx`
- Create: `src/components/BookingCalendar.tsx`

**Interfaces:**
- Consumes: `StatCard`, `StatusBadge`, `useTranslation()`, Supabase data
- Produces: Customer dashboard matching PHP reference screenshots

- [ ] **Step 1: Create BookingCalendar client component**

Create `src/components/BookingCalendar.tsx`:
- Monthly/weekly grid calendar
- Navigation: ‹ › today buttons, month/year title, month/week toggle
- Day cells with colored dots (amber=pending, purple=DP, green=confirmed)
- Today highlighted
- Header: MIN SEN SEL RAB KAM JUM SAB (or EN equivalent)
- Props: `bookings: { booking_date: string; status: string }[]`

- [ ] **Step 2: Rewrite customer dashboard page**

Rewrite `src/app/customer/page.tsx` to match the PHP reference (`home-customers.png`, `home-customer(2).png`, `home-customer(3).png`):

The page (server component) should:
1. Fetch user profile, recent bookings, booking stats, and total spending from Supabase
2. Render: hero gradient card with greeting + CTA buttons
3. 4 stat cards (Total Booking, Waiting, Confirmed, Cancelled)
4. 4 quick action cards (New Booking, History, My Profile, Contact Us)
5. Two-column: Booking Activity list + BookingCalendar
6. Total Spending card

All text uses `t()` keys (but note: server component can't use hooks — so pass translation keys as data, or make the interactive parts client components that consume i18n context).

**Key architecture decision:** Since the dashboard has a mix of server data and client interactivity (calendar, i18n), structure as:
- Server component fetches all data
- Pass data to a `CustomerDashboardClient` client component that handles rendering with i18n

- [ ] **Step 3: Verify build and visual check**

Run: `npm run build`
Then: `npm run dev` → navigate to `/customer` → visually compare with reference screenshots.

- [ ] **Step 4: Commit**

```bash
git add src/app/customer/page.tsx src/components/BookingCalendar.tsx
git commit -m "feat: redesign customer dashboard with stats, calendar, and activity feed"
```

---

### Task 6: Customer Booking Form

**Files:**
- Rewrite: `src/app/customer/booking/create/page.tsx`
- Rewrite: `src/app/customer/booking/create/BookingCreateForm.tsx`
- Create: `src/components/PriceTable.tsx`
- Create: `src/components/BankInfoCard.tsx`
- Create: `src/components/UploadZone.tsx`
- Create: `src/components/FieldInfoCard.tsx`

**Interfaces:**
- Consumes: `createBookingAction`, `BOOKING_PRICE_SLOTS`, `calculateBookingPrice`, `useTranslation()`, CSS variables
- Produces: Booking form matching PHP reference (`booking-page-customer.png`, `booking-page-customers(2).png`)

- [ ] **Step 1: Create shared components**

Create these components:
- `PriceTable` — slot pricing table with Mon-Thu/Friday/Sat-Sun columns, uses `BOOKING_PRICE_SLOTS`
- `BankInfoCard` — dark card with bank name, account number, copy button
- `UploadZone` — drag-and-drop file upload with icon, text, format info
- `FieldInfoCard` — field image, name, address, facility tags, availability badge, price table

- [ ] **Step 2: Rewrite booking create page**

Rewrite `src/app/customer/booking/create/page.tsx`:
- Dark gradient hero header with "BOOKING FORM" badge, heading, subtitle, breadcrumb
- Pass fields data to the client form

- [ ] **Step 3: Rewrite BookingCreateForm**

Rewrite `src/app/customer/booking/create/BookingCreateForm.tsx`:
- Two-column layout: main form (left) + sidebar (right)
- Step 1: Field selector, date picker, schedule mini-calendar, start/end time, real-time price
- Step 2: BankInfoCard, upload guide, UploadZone
- Sidebar: FieldInfoCard with PriceTable
- Submit button at bottom

- [ ] **Step 4: Verify build and visual check**

Run: `npm run build`
Then: `npm run dev` → navigate to `/customer/booking/create` → compare with reference.

- [ ] **Step 5: Commit**

```bash
git add src/app/customer/booking/create/ src/components/PriceTable.tsx src/components/BankInfoCard.tsx src/components/UploadZone.tsx src/components/FieldInfoCard.tsx
git commit -m "feat: redesign booking form with 2-step wizard and sidebar info"
```

---

### Task 7: Customer History + Payment Pages

**Files:**
- Rewrite: `src/app/customer/history/page.tsx`
- Rewrite: `src/app/customer/booking/[id]/pelunasan/page.tsx`
- Rewrite: `src/app/customer/booking/[id]/pelunasan/PelunasanForm.tsx`

**Interfaces:**
- Consumes: `StatusBadge`, `BankInfoCard`, `UploadZone`, `useTranslation()`, Supabase data, `submitPelunasanAction`
- Produces: History list page + payment completion form

- [ ] **Step 1: Rewrite history page**

Rewrite `src/app/customer/history/page.tsx`:
- Table/card list of all user bookings
- Each row: field name, date, time, price, DP, status badge
- "Complete Payment" button for `dp_paid` status rows → links to `/customer/booking/[id]/pelunasan`
- All labels via i18n

- [ ] **Step 2: Rewrite pelunasan page + form**

Rewrite payment form pages:
- Booking summary card (field, date, time, total, DP paid, remaining)
- BankInfoCard
- UploadZone
- Submit button

- [ ] **Step 3: Verify build**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/app/customer/history/ src/app/customer/booking/
git commit -m "feat: redesign customer history and payment pages"
```

---

### Task 8: Admin Dashboard

**Files:**
- Rewrite: `src/app/admin/page.tsx`

**Interfaces:**
- Consumes: `StatCard`, `useTranslation()`, Supabase data, admin layout
- Produces: Admin dashboard matching `homepage dashboard-admin.png`

- [ ] **Step 1: Rewrite admin dashboard**

Rewrite `src/app/admin/page.tsx`:

Since admin layout already handles auth + sidebar, this page only renders the main content:
- 5 color-coded stat cards (Fields, Total Booking, Pending, DP Paid, Confirmed)
- Revenue display card
- Today's Revenue card (dark bg)
- Last 7 Days Trend table
- Last 6 Months Trend table
- This Month's Revenue card

Key: Use the same data fetching logic (already in the current page) but with the new design system.

Make the page a server component for data, but wrap the display in a client component for i18n.

- [ ] **Step 2: Verify build and visual check**

Run: `npm run build`
Then: compare with `homepage dashboard-admin.png`.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat: redesign admin dashboard with color-coded stats and revenue trends"
```

---

### Task 9: Admin Bookings + Fields Pages

**Files:**
- Rewrite: `src/app/admin/bookings/page.tsx`
- Rewrite: `src/app/admin/bookings/BookingActionForm.tsx`
- Rewrite: `src/app/admin/fields/page.tsx`
- Create: `src/app/admin/fields/create/page.tsx`
- Create: `src/app/admin/fields/[id]/edit/page.tsx`
- Create: `src/components/DataTable.tsx`

**Interfaces:**
- Consumes: `StatusBadge`, `useTranslation()`, admin actions (`approveDPFormAction`, `approveFinalPaymentFormAction`, `cancelBookingFormAction`, `createFieldAction`, `updateFieldAction`, `deleteFieldAction`), Supabase data
- Produces: Admin booking list, admin fields management, field create/edit forms

- [ ] **Step 1: Create DataTable component**

Create `src/components/DataTable.tsx`:
- Client component with: entries-per-page selector, search input, sortable column headers, pagination
- Generic: takes column definitions and data array as props
- Renders the DataTable-like UI matching PHP reference

- [ ] **Step 2: Rewrite admin bookings page**

Rewrite `src/app/admin/bookings/page.tsx`:
- Status filter dropdown + Filter button
- DataTable with columns: ID, Customer (name + email), Field, Date, Time, Price, DP, Payment Proof ("View Proof" link), Status badge, Booking Date
- Action buttons per row: Approve DP, Confirm Paid, Cancel
- Uses existing server actions via forms

- [ ] **Step 3: Rewrite admin fields page**

Rewrite `src/app/admin/fields/page.tsx`:
- "+ Add Field" button → `/admin/fields/create`
- DataTable: ID, Field Name, Price/Slot Min, Status badge, Created Date, Actions (Edit/Delete)
- Edit links to `/admin/fields/[id]/edit`
- Delete uses `deleteFieldAction`

- [ ] **Step 4: Create admin field create page**

Create `src/app/admin/fields/create/page.tsx`:
- Form: name, price, address, status toggle
- Uses `createFieldAction`
- Redirect to `/admin/fields` on success

- [ ] **Step 5: Create admin field edit page**

Create `src/app/admin/fields/[id]/edit/page.tsx`:
- Same as create but pre-filled with existing field data
- Uses `updateFieldAction`

- [ ] **Step 6: Verify build**

Run: `npm run build`
Run: `npm run test`

- [ ] **Step 7: Commit**

```bash
git add src/app/admin/ src/components/DataTable.tsx
git commit -m "feat: redesign admin bookings and fields pages with DataTable"
```

---

### Task 10: Landing Page + Final Polish

**Files:**
- Rewrite: `src/app/(public)/about/page.tsx`
- Verify: `src/app/page.tsx` (root redirect)
- Verify: all tests pass, build succeeds

**Interfaces:**
- Consumes: `useTranslation()`, `LanguageToggle`, CSS variables
- Produces: Landing page matching `homepage-default.png`

- [ ] **Step 1: Rewrite landing page**

Rewrite `src/app/(public)/about/page.tsx`:
- Navbar with logo + language toggle
- Hero section:
  - Left: Address badge, "Stadion H. Abdul Malik" large heading, description, "Book Now" CTA button
  - Right: Aerial field photo with "Actively Operating" badge overlay, address caption
- Stats row: FIFA Standard Grass | 2000 Lux LED Light | Ready Seats | 24/7 Booking Online
- Gallery section with field photos
- Price info cards

- [ ] **Step 2: Final build verification**

Run: `npm run build`
Run: `npm run test`
Expected: Both pass with zero errors.

- [ ] **Step 3: Visual verification against all 10 reference screenshots**

Start `npm run dev` and visually compare each page:
1. `homepage-default.png` → `/about`
2. `login-customer.png` → `/auth/customer`
3. `home-customers.png` → `/customer`
4. `home-customer(2).png` → `/customer` (scroll down)
5. `home-customer(3).png` → `/customer` (scroll down more)
6. `booking-page-customer.png` → `/customer/booking/create`
7. `booking-page-customers(2).png` → `/customer/booking/create` (scroll down)
8. `homepage dashboard-admin.png` → `/admin`
9. `booking dashboard-admin.png` → `/admin/bookings`
10. `dashboard-admin-daftar-lapanagan.png` → `/admin/fields`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: redesign landing page and final polish"
```
