# Struktur Project - Aplikasi Booking Lapangan HAM

## Struktur Folder & File

```
Lapangan HAM/
│
├── admin/                          # Halaman Admin
│   ├── index.php                   # Dashboard Admin Statistik
│   ├── fields/                     # CRUD Lapangan
│   │   ├── index.php               # List Semua Lapangan (termasuk kelola gambar)
│   │   ├── create.php              # Form Tambah Lapangan
│   │   ├── edit.php                # Form Edit Lapangan
│   │   └── delete.php              # Proses Hapus Lapangan
│   └── bookings/                   # Daftar Booking & Verifikasi Pembayaran
│       └── index.php               # List Semua Booking dengan filter (Verifikasi DP & Pelunasan)
│
├── auth/                           # Autentikasi User & Admin
│   ├── login.php                   # Halaman Login
│   ├── register.php                # Halaman Register (Validasi Email/Nomor Telepon)
│   ├── logout.php                  # Proses Logout
│   ├── process_login.php           # Logika Login
│   └── process_register.php        # Logika Registrasi
│
├── customer/                       # Halaman Profil/Pesanan Pelanggan
│   ├── index.php                   # Dashboard Statistik Customer
│   ├── fields/                     # Browsing Lapangan & Info Harga
│   │   └── index.php               
│   ├── booking/                    # Sistem Pre-order Lapangan Olahraga
│   │   ├── create.php              # Form Pemilihan Slot Jadwal, Kalkulasi Realtime Harga & Form Upload DP
│   │   └── update_payment.php      # Form Lanjutan Pelunasan DP (Upload Bukti Transfer 2)
│   └── history.php                 # Riwayat Booking Pelanggan
│
├── config/                         # Konfigurasi Backbone
│   ├── database.php                # Konfigurasi Koneksi PDO Database
│   └── constants.php               # Konstanta Direktori, Web_URL & App Name
│
├── includes/                       # Skrip Fungsi, Emailer, Template Navbar/Footer
│   ├── functions.php               # Kumpulan Helper & Sistem Format Harga/Tanggal
│   ├── mail_functions.php          # Skrip SMTP untuk Notifikasi Pembayaran via Email
│   ├── middleware.php              # Sistem Proteksi Keamanan Role-Based (Admin vs Customer)
│   ├── upload_functions.php        # Fungsi Pengecekan Foto Bukti Bayar / Image Slider
│   ├── admin/                      # Template Layout Dashboard Admin
│   │   ├── header.php
│   │   └── footer.php
│   └── customer/                   # Template Layout Web Aplikasi Publik/Pelanggan
│       ├── header.php
│       └── footer.php
│
├── database/                       # Berkas Skema MySQL (+ Migration Updates)
│   ├── schema.sql                  # Setup database dasar
│   ├── migration_add_payment_proof.sql
│   ├── migration_add_payment_proof_2.sql
│   ├── migration_add_phone.sql
│   └── migration_add_address.sql
│
├── uploads/                        # Ruang Simpan Aset Unggahan (CHMOD 777)
│   ├── payment_proofs/             # Foto resi transfer dari Customer
│   └── fields/                     # Foto Lapangan untuk Slider & List Item
│
├── setup/                          # Skrip Utility Tambahan
│   └── generate_password.php
│
├── assets/                         # Aset Statis Publik (Fonts, CSS Custom, SVG, Banner image)
│
├── index.php                       # Entry Router - Berada di Root
├── about.php                       # Halaman Landing Publik - Bebas Diakses (Visualisasi Slider)
├── .htaccess                       # Server Configurator
├── README.md                       # Dokumentasi Utama
├── INSTALLATION.md                 # Panduan Instalasi ke Localhost
├── UPDATES.md                      # Changelog Fitur Teranyar
└── STRUCTURE.md                    # File ini
```

## Arsitektur Alur Sistem A-Z

Sebagian alur interaksi terpenting bisa dilihat sbb:

### 1. Sistem Public ke Login
```
index.php → about.php (Halaman Landing Publik dengan Carousel)
  ├── auth/login.php
  └── auth/register.php
```

### 2. Dashboard Admin
```
admin/index.php (Dashboard Realtime Update)
  ├── admin/fields/index.php (Kelola Harga & Gambar Slide Setiap Lapangan)
  └── admin/bookings/index.php (Monitor Pembayaran)
      └── Verifikasi Berkas DP -> Ubah status 'pending' jadi 'dp_paid'
      └── Verifikasi Pelunasan Akhir -> Ubah status 'payment_2_pending' jadi 'confirmed'
```

### 3. Flow Customer & Booking Baru
```
about.php / customer/fields/index.php
  ├── customer/booking/create.php
  │     └─ (Sistem otomatis kalkulasi Durasi Jam X Harga Jual per slot).
  │     └─ Customer unggah Struk DP. Status => 'pending'.
  ├── customer/history.php
  │     └─ Setelah admin verifikasi DP ('dp_paid'): Muncul tombol "Pelunasan".
  │     └─ Customer klik & unggah struk kedua. Status => 'payment_2_pending'.
  └── Setelah dikonfirmasi tuntas => 'paid' / 'confirmed'.
```

## Skema Database

Skema SQL disatukan dari semua file migrasi sejak versi pertama hingga terbaru.

### 1. Tabel: `users`
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `name` (VARCHAR)
- `email` (VARCHAR, UNIQUE)
- `phone` (VARCHAR) - _Dari fitur update terbaru_
- `password` (VARCHAR) - Hashed
- `role` (ENUM: 'admin', 'customer')

### 2. Tabel: `fields`
- `id` (INT, PK)
- `name` (VARCHAR)
- `price` (DECIMAL) - _Harga Dasar Per Durasi 1-Jam_
- `image` (VARCHAR) - _(URL Gambar untuk preview landing page_
- `status` (ENUM: 'active', 'inactive')

### 3. Tabel: `bookings`
- `id` (INT, PK)
- `user_id` (INT, FK)
- `field_id` (INT, FK)
- `booking_date` (DATE)
- `start_time` & `end_time` (TIME)
- `price` (DECIMAL) - _Total Biaya Berdasarkan Auto-Kalkulasi Skrip_
- `dp_amount` (DECIMAL) - _30% Otomatis_
- `payment_proof` (VARCHAR) - _Foto Bukti Bayar 1 (DP)_
- `payment_proof_uploaded_at` (TIMESTAMP)
- `payment_proof_2` (VARCHAR) - _Foto Bukti Bayar 2 (Pelunasan)_
- `payment_proof_2_uploaded_at` (TIMESTAMP)
- `status` (ENUM: 'pending', 'dp_paid', 'payment_2_pending', 'paid', 'confirmed', 'cancelled')
- UNIQUE KEY: (field_id, booking_date, start_time, end_time)

## Sistem Validasi Waktu / Proteksi Double Booking

Salah satu pilar terkuat dari kode asli adalah blok program pada `create.php`, ia mengecek waktu yang bentrok pada db. Slot kustom hanya dizinkan di-order jika interval waktu *start* sampai *end* tidak tumpang tindih dengan order berstatus *(confirmed/paid/pending yang belum dibatalkan)* di kolom `field_id` yang sama!

## Library dan Tools

Semua Framework disajikan via CDN:
1. **Bootstrap 5.3.x**: Arsitektur Layout Utama.
2. **Flatpickr**: Date dan Time Selector elegan pengganti elemen `<input type="date">` browser generik (Di set ke Lokalisasi Bahasa Indonesia)
3. **SweetAlert 2**: Modifikasi popup JS (Alerts).
4. **DataTables**: Mengurus Paginasi dan Filter Admin List Secara Async!

---
> Struktur program di atas adalah gambaran mutlak versi berjalan paling utuh pada saat ini (Pascasistem Update Pelunasan, Harga by Slot, Mailer & Landing Page Image Slider).
