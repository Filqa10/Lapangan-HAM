# Aplikasi Booking Lapangan HAM

Aplikasi web booking lapangan olahraga menggunakan PHP Native, MySQL, Bootstrap 5, lengkap dengan sistem manajemen harga per-slot, sistem upload bukti pembayaran (DP dan Pelunasan), landing page responsif, serta notifikasi email otomatis.

## Fitur Utama

### 🏢 Halaman Publik (Landing Page)
- Menampilkan informasi layanan dan slider gambar promosi visual lapangan.
- Daftar lapangan olahraga serta detailnya dapat dilihat bebas tanpa login.

### 👤 Customer Area
- Register akun (dengan validasi email & nomor telepon) serta Login.
- Dashboard dengan statistik cepat mengenai riwayat booking.
- Daftar lapangan beserta sistem reservasi berdasar perhitungan slot jadwal realtime (otomatis menyesuaikan harga berdasarkan durasi jam).
- Perhitungan Uang Muka (DP) otomatis sebesar 30% dari total kalkulasi biaya.
- Sistem penyelesaian transaksi (Upload Bukti Pembayaran 2 Tahap):
  1. Upload Bukti Transfer DP (Uang Muka).
  2. Upload Bukti Transfer Pelunasan Sisa Pembayaran.
- History transaksi tercatat detail bersama status realtime.
- Notifikasi Email responsif saat terjadi verifikasi atau aksi pemesanan.

### 👑 Admin Dashboard
- Dashboard Statistik Komprehensif (Total Keseluruhan Booking, Pemasukan DP, Akun Customer, dll).
- CRUD Lapangan Olahraga (Tambah, Lihat, Update Gambar/Detail, Hapus) untuk mengatur harga slot.
- Manajemen Booking Komplit:
  - Admin dapat memverifikasi bukti DP yang diupload customer.
  - Admin dapat memverifikasi bukti pelunasan biaya.
- Transisi Status Terintegrasi (Pending → DP Paid → Payment 2 Pending → Paid / Confirmed).

## Teknologi yang Digunakan

- **Backend**: PHP Native
- **Database**: MySQL (PDO Prepared Statements)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (DOM manipulation)
- **Libraries UI**: Bootstrap 5, Bootstrap Icons, SweetAlert2.
- **Date/Time Manajemen**: Flatpickr, DataTables.
- **Mailer**: Sistem Notifikasi Email Otomatis.
- **Keamanan**: Proteksi Password Hashing (`password_hash`), XSS & SQL Injection Protection, Role-based Access Middleware.

## Arsitektur Alur Pembayaran Booking

Platform berjalan dengan alur keamanan booking bertahap, status berubah otomatis mengikuti interaksi Customer dan Admin:
1. **`pending`**: Customer men-submit jadwal, aplikasi menahan jadwal tersebut di db dan status pending. Customer **wajib mengunggah Bukti Pembayaran DP (30%)**.
2. **`dp_paid`**: Admin memeriksa kesesuaian nominal Bukti DP dan melakukan Approve. Sisa saldo pembayaran wajib dilunaskan customer.
3. **`payment_2_pending`**: Status transisi dimana DP beres dan sistem menunggu Customer mentransfer pelunasan (atau sudah transfer dan menanti verifikasi final admin).
4. **`confirmed`/`paid`**: Admin memverifikasi keabsahan dana pelunasan. Lapangan pada jam tersebut sudah sah terpesan!

## Panduan Instalasi (Setup)

### 1. Kloning atau Salin Folder Repositori
Buka terminal dan navigasi ke root lokal Anda (contoh: `htdocs` untuk XAMPP):
```bash
git clone <repository-url>
cd Lapangan HAM
```
*(Atau ganti folder dengan nama direktori yang Anda salin)*

### 2. Konfigurasi Skema Database (MySQL)
Buat database kosong melalui phpMyAdmin (disarankan beri nama: `booking_lapangan`).
Karena aplikasi terus dikembangkan lewat serangkaian update migrasi, pastikan database baru mengimport seluruh script berikut secara *berurutan* (atau import full dump terbaru jika ada):
1. `database/schema.sql` (Tabel utama bawaan awal)
2. `database/migration_add_payment_proof.sql` (Update kolom bukti bayar DP)
3. `database/migration_add_payment_proof_2.sql` (Update kolom bukti bayar Pelunasan dan Status Paid)
4. `database/migration_add_phone.sql` (Update kolom profil nomor telepon user)

### 3. Konfigurasi Variabel PHP
Masuk ke direktori `config` dan edit `database.php` untuk menyesuaikan user/pass database MySQL server Anda:
```php
<?php
// config/database.php
define('DB_HOST', 'localhost');
define('DB_USER', 'root'); // Sesuaikan admin db anda
define('DB_PASS', '');     // Sesuaikan pass db anda
define('DB_NAME', 'booking_lapangan');
```

Juga sesuaikan konstanta Base URL pada file `config/constants.php` agar asset frontend berjalan baik:
```php
define('APP_URL', 'http://localhost/Lapangan%20HAM'); 
```

### 4. Setup Izin Folder
Aplikasi ini mengakomodasi unggahan dokumen, termasuk Bukti Pembayaran dan Gambar Lapangan.
Berikan permission *Read/Write* pada 2 direktori ini agar skrip PHP bebas mengunggah:
- `uploads/payment_proofs/`
- `uploads/fields/`
Di OS Linux/Mac, lakukkan perintah bash: `chmod -R 777 uploads/`

## Akses Akun Pengguna Default

**Akun Administrator Pusat:**
- **Email**: `admin@bookinglapangan.com`
- **Password**: `admin123`

*(Mohon diubah dari interface database atau registrasikan admin baru demi keselamatan sistem bila hosting live!)*

## Troubleshooting Umum
- **Gambar atau Bukti Transaksi Gagal Diunggah?**
  Periksa setting file `php.ini` pada WebServer Anda (XAMPP). Set nilai `upload_max_filesize` dan `post_max_size` min. di kisaran 5MB - 10MB.
- **Email Notifikasi Transaksi Tidak Terkirim?**
  Bila dirun di dalam Localhost, *Mail SMTP Native PHP* default dalam mode mati. Harap konfigurasi setting fiktif seperti *mailtrap / mailhog*, atau abaikan error jika Anda sekadar tes interface.
- **Waktu Ketersediaan Jadwal / Harga Slot Saling Bentrok?**
  Mungkin konfigurasi Timezone PHP Anda bermasalah. Setting konstanta time sudah ditetapkan ke `"Asia/Jakarta"`. Harap samakan *Timezone* database dan PC server.

---
**Lisensi**: MIT License | Sistem ini Bebas digunakan.  
Didesain secara khusus untuk kelancaran bisnis olahraga penyewaan lapangan menggunakan kapabilitas PHP Native secara efisien!
