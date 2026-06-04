# Panduan Instalasi - Aplikasi Booking Lapangan HAM

## Persyaratan Sistem

- PHP 7.4 atau lebih tinggi
- MySQL 5.7 atau lebih tinggi (atau MariaDB 10.2+)
- Web Server (Apache/Nginx/XAMPP) atau PHP Built-in Server
- Ekstensi PHP: PDO, PDO_MySQL

## Langkah Instalasi

### 1. Kloning atau Download Repositori

```bash
# Jika menggunakan git, buka terminal di folder root server lokal Anda (ex: htdocs):
git clone <repository-url>
cd Lapangan HAM

# Atau Anda bisa mengunduh dan mengekstrak file ZIP ke dalam folder server lokal Anda.
```

### 2. Setup Database

#### Opsi A: Menggunakan Command Line

```bash
# Login ke MySQL
mysql -u root -p

# Buat database baru:
CREATE DATABASE booking_lapangan;
USE booking_lapangan;

# Import file SQL secara berurutan:
mysql -u root -p booking_lapangan < database/schema.sql
mysql -u root -p booking_lapangan < database/migration_add_payment_proof.sql
mysql -u root -p booking_lapangan < database/migration_add_payment_proof_2.sql
mysql -u root -p booking_lapangan < database/migration_add_phone.sql
```

#### Opsi B: Menggunakan phpMyAdmin

1. Buka phpMyAdmin di browser (biasanya `http://localhost/phpmyadmin`)
2. Klik "New" untuk membuat database bernama `booking_lapangan`
3. Pilih database `booking_lapangan`
4. Klik tab "Import"
5. Import file-file berikut secara **berurutan**:
   - `database/schema.sql`
   - `database/migration_add_payment_proof.sql`
   - `database/migration_add_payment_proof_2.sql`
   - `database/migration_add_phone.sql`

### 3. Konfigurasi Database & Base URL

Edit file `config/database.php`:

```php
define('DB_HOST', 'localhost');    // Host database
define('DB_USER', 'root');         // Username database
define('DB_PASS', '');             // Password database (kosongkan jika tidak ada)
define('DB_NAME', 'booking_lapangan'); // Nama database
```

Penting: **Sesuaikan Base URL di config/constants.php**.
```php
define('APP_URL', 'http://localhost/Lapangan%20HAM');
```

*(Ubah `Lapangan%20HAM` jika nama folder situs Anda berbeda)*

### 4. Set Permission Folder Mengunggah

Aplikasi membutuhkan izin untuk menyimpan gambar lapangan dan foto bukti pembayaran dari pelanggan (DP & Pelunasan).

**Pastikan folder berikut memiliki hak baca/tulis (`chmod 777` di Linux/Mac):**
- `uploads/payment_proofs/`
- `uploads/fields/`

Jika menggunakan XAMPP Windows, biasanya hak akses otomatis terbuka.

### 5. Test Instalasi

1. Buka browser dan akses URL sistem Anda: `http://localhost/Lapangan%20HAM`
2. Pastikan landing page (Halaman Beranda Publik) dapat terbuka dengan baik tanpa error.
3. Coba login sebagai admin:
   - Email: `admin@bookinglapangan.com`
   - Password: `admin123`

## Verifikasi Instalasi

Setelah instalasi berhasil, pastikan indikator berikut normal:

1. ✅ Database terhubung tanpa ada *Notice* atau *Fatal Error*.
2. ✅ Halaman utama (`about.php` yang dituju secara otomatis melalui `index.php`) dapat diakses.
3. ✅ Login admin berhasil masuk ke area Dashboard.
4. ✅ File bukti struk pembayaran tidak gagal diunggah saat pemesanan selesai di level customer.

---

Jika menemui kesulitan atau Error: "404 Not Found", patikan letak base-folder yang memuat aplikasi terdaftar dalam lingkup Apache Root (`htdocs` / `www`) Anda serta *konstanta APP_URL* serasi terhadap nama direktori Anda tersebut.
