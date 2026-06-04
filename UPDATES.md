# Changelog & Updates Aplikasi Lapangan HAM

Dokumen ini mencatat seluruh rangkaian pembaruan fitur berskala mayor yang ditambahkan ke versi awal rilis (V.1). Proses _update_ terkini berfokus pada pengalaman visual pelanggan (Customer Experience), integrasi kalkulasi otomatis, dan skema kewajiban pembayaran bertahap.

---

## 🚀 Versi 2.0 (Update Skala Besar Terkini)

### 1. Sistem Sync Slot Pricing (Kalkulasi Harga berdasar Waktu)
**Perubahan**: Kalkulasi harga yang sebelumnya bersifat "pukul rata", kini berubah dinamis.
- *Customer* menentukan jam `Mulai` & jam `Selesai` secara real-time.
- Skrip JS / PHP akan mengkalikan durasi dengan Harga Lapangan per-Jam.
- Nominal **Total**, serta nilai otomatis **DP 30%**, kini ditampilkan jelas & diperbarui otomatis (*Auto Update*) langsung pada interface *checkout* seiring input pengguna.

### 2. Update Manajemen Pembayaran 2-Tahap (DP & Pelunasan)
**File Terkait**: `customer/booking/update_payment.php`, `admin/bookings/index.php`, MySQL `migration_add_payment_proof_2.sql`.
- Setelah merilis fitur Upload Bukti DP 1, kami memasang **Sistem Upload Tahap 2 (Pelunasan H-1 / Lanjutan Pembayaran)**.
- **Form Interaktif**: Terdapat section khusus yang hanya muncul saat DP diverifikasi admin. Di sinilah Customer harus mengunggah struk _Transfer Ke-2_ untuk menutupi sisa saldo (`Nominal Sisa = Total Biaya - DP`).
- *Status State Admin* telah termodifikasi khusus agar mendukung transisi lengkap dari ujung-ke-ujung:  
  `pending` > `dp_paid` > `payment_2_pending` > `paid/confirmed`.

### 3. Image Slider Dinamis & UX Beranda Website Publik
**Perubahan**: Renovasi tata letak bagi _Public View_ di luar Sistem Reservasi.
- **Halaman `about.php` (Landing Page)**: Akses ke Base URL (misal: `http://localhost/Lapangan HAM`) kini diarahkan ke `about.php` bukan sekadar form login kosong.
- **Image Carousel**: Terdapat _Slider Gambar_ otomatis di baris atas untuk menunjukkan foto visual berbagai lapangan olahraga.
- Seluruh detail nama lapangan dan deskripsinya bisa diakses pengunjung bebas dari halaman ini tanpa registrasi.

### 4. Sistem Email Notifikasi Otomatis (Mailer)
**File Terkait**: `includes/mail_functions.php`
- Untuk memprofesionalkan layanan, sistem kini memiliki `mail_functions` responsif.
- Pengguna (Customer) akan mendapat e-mail pemberitahuan otomatis *setelah* admin menerima & meloloskan bukti transfer (baik DP maupun Pelunasan Final).
- Fitur ini memanfaatkan Fungsi Native PHP Server untuk integrasi tanpa Framework Composer.  
  _(Note: Atur konfigurasi SMTP Local/Mailtrap jika sistem berjalan pada server XAMPP Lokal_).

### 5. Penguatan Akses & Registrasi Pengguna
- **Validasi No Telepon**: Pembaruan Form Registrasi yang diwajibkan menyertakan field `Phone/Nomor WA` (Via update `migration_add_phone.sql`) agar admin lebih mudah menghubungi penyewa yang terlambat datang.
- Penutupan kelemahan akses pada tombol _Logout_ yang usang, dan optimalisasi Redirect *Middleware* agar _Guest_ diarahkan mulus ke Landing Page alih-alih menampilkan *Blank Error*.

---

## Konklusi Flow Booking yang Baru (Status & Logika Update)

1. **User Memilih Jam**: Skrip menghitung total durasi $X * Harga (Sync Pricing).
2. **User Checkout (Wajib DP)**: User merampungkan pemesanan + Mengunggah foto resi DP. (Status = `pending`).
3. **Admin Verify DP**: Admin klik setuju di Dasbor (Bukti DP 1 valid). (Status = `dp_paid`). Email Notifikasi #1 masuk ke Inbox User.
4. **User Pelunasan**: User login > History > Klik Bayar Sisa > Upload Resi ke-2. (Status = `payment_2_pending`).
5. **Admin Verify Pelunasan**: Admin klik konfirmasi pelunasan tuntas. (Status = `paid`/`confirmed`). Email Notifikasi #2 final masuk ke Inbox User.
6. **Main**: User bebas bertanding!
