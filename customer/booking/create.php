<?php
require_once __DIR__ . '/../../includes/middleware.php';
requireCustomer();

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/upload_functions.php';
require_once __DIR__ . '/../../includes/mail_functions.php';

// Kalau tidak ada field_id, ambil lapangan pertama yang aktif
$fieldId = (int) ($_GET['field_id'] ?? 0);

// Ambil semua lapangan aktif untuk dropdown
try {
    $allFieldsStmt = $pdo->query("SELECT * FROM fields WHERE status = 'active' ORDER BY name ASC");
    $allFields = $allFieldsStmt->fetchAll();
} catch (PDOException $e) { $allFields = []; }

// Kalau field_id tidak jelas, pakai yang pertama
if (!$fieldId && !empty($allFields)) {
    $fieldId = $allFields[0]['id'];
}

// Ambil data lapangan yang dipilih
try {
    $stmt = $pdo->prepare("SELECT * FROM fields WHERE id = ? AND status = 'active'");
    $stmt->execute([$fieldId]);
    $field = $stmt->fetch();
    if (!$field && !empty($allFields)) {
        $field = $allFields[0];
        $fieldId = $field['id'];
    }
    if (!$field) {
        setFlashMessage('danger', 'Lapangan tidak ditemukan atau tidak aktif.');
        redirect(APP_URL . '/customer/fields/index.php');
    }
} catch (PDOException $e) {
    setFlashMessage('danger', 'Terjadi kesalahan.');
    redirect(APP_URL . '/customer/fields/index.php');
}

$error = null;
$successMsg = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fieldId    = (int) ($_POST['field_id'] ?? $fieldId);
    $bookingDate = $_POST['booking_date'] ?? '';
    $startTime   = $_POST['start_time'] ?? '';
    $endTime     = $_POST['end_time'] ?? '';

    // Re-fetch field setelah POST
    try {
        $s2 = $pdo->prepare("SELECT * FROM fields WHERE id = ? AND status='active'");
        $s2->execute([$fieldId]);
        $field = $s2->fetch() ?: $field;
    } catch (PDOException $e) {}

    if (empty($bookingDate) || empty($startTime) || empty($endTime)) {
        $error = 'Semua field harus diisi.';
    } elseif (!isset($_FILES['payment_proof']) || $_FILES['payment_proof']['error'] === UPLOAD_ERR_NO_FILE) {
        $error = 'Bukti pembayaran DP wajib diupload.';
    } else {
        // Kalkulasi harga berbasis slot (menggunakan fungsi global dari functions.php)
        $slotResult = calculateBookingSlotPrice($startTime, $endTime, $bookingDate);
        if (!$slotResult) {
            $error = 'Waktu yang dipilih tidak tersedia atau di luar jam operasional yang diizinkan.';
        } else {
            $price = $slotResult['total'];
            $dpAmount = calculateDP($price);
        }
        if (!$error && !isTimeSlotAvailable($fieldId, $bookingDate, $startTime, $endTime)) {
            $error = 'Waktu yang dipilih sudah dibooking. Silakan pilih waktu lain.';
        }

        if (!$error) {
            $paymentProof = uploadPaymentProof($_FILES['payment_proof']);
            if (!$paymentProof) {
                $error = 'Gagal upload bukti pembayaran. Pastikan file adalah gambar (JPG/PNG) atau PDF (maks 5MB).';
            } else {
                try {
                    $userId = $_SESSION['user_id'];
                    $stmt = $pdo->prepare("
                        INSERT INTO bookings (user_id, field_id, booking_date, start_time, end_time, price, dp_amount, payment_proof, payment_proof_uploaded_at, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'pending')
                    ");
                    $stmt->execute([$userId, $fieldId, $bookingDate, $startTime, $endTime, $price, $dpAmount, $paymentProof]);
                    $bookingId = $pdo->lastInsertId();

                    $user = ['name' => $_SESSION['user_name'], 'email' => $_SESSION['user_email']];
                    $newBooking = ['id' => $bookingId, 'booking_date' => $bookingDate, 'start_time' => $startTime, 'end_time' => $endTime];
                    sendPaymentReceivedEmail($user, $newBooking, $field['name'], 'DP');

                    setFlashMessage('success', 'Booking berhasil! Bukti DP sudah diterima. Menunggu verifikasi admin.');
                    redirect(APP_URL . '/customer/profile.php');
                } catch (PDOException $e) {
                    deletePaymentProof($paymentProof);
                    $error = ($e->getCode() == 23000)
                        ? 'Waktu yang dipilih sudah dibooking. Silakan pilih waktu lain.'
                        : 'Terjadi kesalahan. Silakan coba lagi.';
                }
            }
        }
    }
}

// Field images helper
function getBookingFieldImg($name) {
    $n = strtolower($name);
    if (strpos($n,'futsal')!==false) return 'https://images.unsplash.com/photo-1520927430985-4e7e36b8c6a4?w=800&h=400&fit=crop&q=85';
    if (strpos($n,'voli')!==false)   return 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&h=400&fit=crop&q=85';
    if (strpos($n,'bad')!==false)    return 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&h=400&fit=crop&q=85';
    return IMG_DEFAULT_FIELD;
}
function getFieldTypeLabel($name) {
    $n = strtolower($name);
    if (strpos($n,'futsal')!==false) return ['⚽','Futsal'];
    if (strpos($n,'voli')!==false)   return ['🏐','Voli'];
    if (strpos($n,'bad')!==false)    return ['🏸','Badminton'];
    return ['🏟️','Sport'];
}

$pageTitle = "Booking Lapangan";
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Lapangan — <?php echo APP_NAME; ?></title>
    <meta name="description" content="Form booking lapangan <?php echo APP_NAME; ?>. Pilih lapangan, waktu, dan upload bukti DP.">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    <style>
        :root {
            --blue:#007AFF; --blue-d:#0051D5; --blue-l:#EFF5FF;
            --green:#34C759; --orange:#FF9500; --red:#FF3B30; --indigo:#5856D6;
            --g1:#111; --g2:#444; --g3:#888; --g4:#ddd; --g5:#f5f5f7; --w:#fff;
        }
        *, *::before, *::after { box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, sans-serif;
            background: var(--g5);
            color: var(--g1);
            -webkit-font-smoothing: antialiased;
            min-height: 100vh;
        }

        /* ── PAGE HEADER ── */
        .page-hero {
            background: linear-gradient(135deg, #020918 0%, #0a1628 55%, #0d1f3c 100%);
            padding: 100px 0 60px;
            position: relative;
            overflow: hidden;
        }
        .page-hero::before {
            content: '';
            position: absolute;
            width: 500px; height: 500px;
            background: rgba(0,122,255,.15);
            border-radius: 50%;
            top: -150px; left: -100px;
            filter: blur(80px);
            pointer-events: none;
        }
        .page-hero::after {
            content: '';
            position: absolute;
            width: 350px; height: 350px;
            background: rgba(88,86,214,.12);
            border-radius: 50%;
            bottom: -80px; right: -80px;
            filter: blur(70px);
            pointer-events: none;
        }
        .page-hero-tag {
            display: inline-flex; align-items: center; gap: 7px;
            background: rgba(0,122,255,.18);
            border: 1px solid rgba(0,122,255,.35);
            color: #6EB7FF;
            padding: 5px 14px; border-radius: 20px;
            font-size: 11.5px; font-weight: 700; text-transform: uppercase;
            letter-spacing: .9px; margin-bottom: 1rem;
        }
        .page-hero h1 {
            font-size: clamp(1.7rem, 4vw, 2.6rem);
            font-weight: 900; color: white;
            letter-spacing: -1px; line-height: 1.15;
            margin-bottom: .5rem;
        }
        .page-hero p { color: rgba(255,255,255,.6); font-size: .95rem; margin: 0; }
        .breadcrumb-custom { display: flex; align-items: center; gap: 8px; margin-top: 1.25rem; }
        .breadcrumb-custom a { color: rgba(255,255,255,.5); font-size: 13px; text-decoration: none; transition: color .2s; }
        .breadcrumb-custom a:hover { color: white; }
        .breadcrumb-custom span { color: rgba(255,255,255,.3); font-size: 13px; }
        .breadcrumb-custom .current { color: rgba(255,255,255,.85); font-size: 13px; font-weight: 600; }

        /* ── MAIN LAYOUT ── */
        .booking-layout {
            display: grid;
            grid-template-columns: 1fr 380px;
            gap: 1.75rem;
            max-width: 1100px;
            margin: -36px auto 0;
            padding: 0 1.25rem 4rem;
            position: relative;
            z-index: 10;
        }
        @media (max-width: 900px) {
            .booking-layout { grid-template-columns: 1fr; }
        }

        /* ── CARD ── */
        .bcard {
            background: white;
            border-radius: 20px;
            border: 1.5px solid #eee;
            overflow: hidden;
            box-shadow: 0 2px 16px rgba(0,0,0,.06);
        }
        .bcard-header {
            padding: 1.5rem 1.75rem;
            border-bottom: 1.5px solid #f0f0f0;
            display: flex; align-items: center; gap: 12px;
        }
        .bcard-header-icon {
            width: 40px; height: 40px; border-radius: 12px;
            background: var(--blue-l);
            display: flex; align-items: center; justify-content: center;
            font-size: 1.1rem; color: var(--blue); flex-shrink: 0;
        }
        .bcard-header h5 {
            font-size: 1rem; font-weight: 700; margin: 0; color: var(--g1);
        }
        .bcard-header p { font-size: 12px; color: var(--g3); margin: 2px 0 0; }
        .bcard-body { padding: 1.75rem; }

        /* ── STEP INDICATOR ── */
        .steps-indicator {
            display: flex; align-items: center;
            margin-bottom: 2rem;
        }
        .si-item {
            display: flex; align-items: center; gap: 10px; flex: 1;
        }
        .si-num {
            width: 34px; height: 34px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 13px; font-weight: 800; flex-shrink: 0;
            transition: all .3s;
        }
        .si-num.active { background: var(--blue); color: white; box-shadow: 0 4px 12px rgba(0,122,255,.3); }
        .si-num.done   { background: var(--green); color: white; }
        .si-num.idle   { background: #eee; color: var(--g3); }
        .si-label { font-size: 12px; font-weight: 600; color: var(--g2); }
        .si-label.active { color: var(--blue); }
        .si-line { height: 2px; flex: 1; background: #eee; margin: 0 10px; border-radius: 2px; }
        .si-line.done { background: var(--green); }

        /* ── LAPANGAN SELECTOR ── */
        .field-selector { display: grid; gap: .75rem; }
        .field-option {
            display: flex; align-items: center; gap: 14px;
            padding: 1rem 1.25rem;
            border: 1.5px solid var(--g4);
            border-radius: 14px; cursor: pointer;
            transition: all .2s; position: relative;
            background: white; text-decoration: none;
        }
        .field-option:hover { border-color: var(--blue); background: var(--blue-l); }
        .field-option.selected { border-color: var(--blue); background: var(--blue-l); }
        .field-option input[type="radio"] { position: absolute; opacity: 0; }
        .field-thumb {
            width: 56px; height: 56px; border-radius: 12px;
            object-fit: cover; flex-shrink: 0;
        }
        .field-opt-name { font-size: .9rem; font-weight: 700; color: var(--g1); margin-bottom: 2px; }
        .field-opt-price { font-size: .8rem; color: var(--blue); font-weight: 700; }
        .field-opt-badge {
            display: inline-flex; align-items: center; gap: 4px;
            background: #EFF5FF; color: var(--blue);
            padding: 2px 8px; border-radius: 10px;
            font-size: 10.5px; font-weight: 700; text-transform: uppercase;
        }
        .fo-check {
            margin-left: auto; width: 22px; height: 22px;
            border-radius: 50%; background: var(--blue);
            display: none; align-items: center; justify-content: center;
            color: white; font-size: 12px; flex-shrink: 0;
        }
        .field-option.selected .fo-check { display: flex; }

        /* ── FORM CONTROLS ── */
        .form-group { margin-bottom: 1.25rem; }
        .form-label-custom {
            font-size: 13px; font-weight: 700; color: var(--g1);
            display: flex; align-items: center; gap: 6px;
            margin-bottom: .5rem;
        }
        .form-label-custom .req { color: var(--red); }
        .form-label-custom .hint { font-weight: 400; color: var(--g3); font-size: 12px; margin-left: auto; }
        .input-custom {
            width: 100%; padding: 11px 14px;
            border: 1.5px solid var(--g4);
            border-radius: 12px;
            font-size: 14px; font-weight: 500; color: var(--g1);
            font-family: 'Inter', sans-serif;
            outline: none; transition: border-color .2s, box-shadow .2s;
            background: white;
        }
        .input-custom:focus {
            border-color: var(--blue);
            box-shadow: 0 0 0 3px rgba(0,122,255,.1);
        }
        .input-group-custom { display: flex; gap: .75rem; }
        .input-group-custom > * { flex: 1; }
        .input-icon-wrap { position: relative; }
        .input-icon-wrap .ii {
            position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
            color: var(--g3); font-size: 15px; pointer-events: none;
        }
        .input-icon-wrap .input-custom { padding-left: 36px; }

        /* ── UPLOAD ZONE ── */
        .upload-zone {
            border: 2px dashed var(--g4);
            border-radius: 14px; padding: 2rem 1.5rem;
            text-align: center; cursor: pointer;
            transition: all .25s; background: #fafafa;
            position: relative;
        }
        .upload-zone:hover, .upload-zone.drag-over {
            border-color: var(--blue); background: var(--blue-l);
        }
        .upload-zone input[type="file"] {
            position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%;
        }
        .upload-icon {
            width: 54px; height: 54px; background: #EFF5FF;
            border-radius: 16px; margin: 0 auto .75rem;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.5rem; color: var(--blue);
        }
        .upload-zone h6 { font-size: .875rem; font-weight: 700; margin-bottom: .25rem; }
        .upload-zone p { font-size: 12px; color: var(--g3); margin: 0; }
        .upload-zone .upload-hint { font-size: 11px; color: var(--g3); margin-top: .5rem; }
        .upload-preview {
            margin-top: 1rem; display: none;
            border: 1.5px solid var(--g4); border-radius: 12px; overflow: hidden;
        }
        .upload-preview img { width: 100%; max-height: 180px; object-fit: cover; display: block; }
        .upload-preview .pdf-preview {
            display: flex; align-items: center; gap: 12px;
            padding: 1rem; background: #f8f9fa;
        }
        .upload-preview .pdf-icon {
            width: 42px; height: 42px; background: #FFF0EF;
            border-radius: 10px; display: flex; align-items: center;
            justify-content: center; font-size: 1.3rem; color: var(--red);
        }
        .upload-preview .pdf-name { font-size: 13px; font-weight: 600; }
        .upload-preview .pdf-size { font-size: 12px; color: var(--g3); }

        /* ── INFO BANK CARD ── */
        .bank-card {
            background: linear-gradient(135deg, #0d1f3c, #1a3563);
            border-radius: 16px; padding: 1.25rem 1.5rem;
            margin-bottom: 1.25rem; color: white;
        }
        .bank-card .bc-label { font-size: 11px; color: rgba(255,255,255,.6); font-weight: 600; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
        .bank-card .bc-bank { font-size: .95rem; font-weight: 800; margin-bottom: .75rem; }
        .bank-card .bc-row { display: flex; align-items: center; justify-content: space-between; }
        .bank-card .bc-num { font-size: 1.1rem; font-weight: 800; letter-spacing: 1.5px; }
        .bank-card .bc-holder { font-size: 13px; color: rgba(255,255,255,.7); }
        .copy-btn {
            background: rgba(255,255,255,.12); border: none; color: white;
            padding: 5px 12px; border-radius: 8px; font-size: 12px;
            font-weight: 600; cursor: pointer; transition: all .2s; display: flex; align-items: center; gap: 5px;
        }
        .copy-btn:hover { background: rgba(255,255,255,.22); }

        /* ── PRICE SUMMARY ── */
        .price-summary {
            background: var(--g5); border-radius: 14px; padding: 1.25rem;
        }
        .ps-row {
            display: flex; justify-content: space-between; align-items: center;
            padding: 7px 0; font-size: 13.5px; color: var(--g2);
        }
        .ps-row:not(:last-child) { border-bottom: 1px solid #eee; }
        .ps-row.total { font-weight: 800; font-size: 15px; color: var(--g1); }
        .ps-row.dp { color: var(--blue); font-weight: 700; }
        .ps-val { font-weight: 700; }

        /* ── ALERT BOX ── */
        .alert-custom {
            display: flex; gap: 12px; padding: 1rem 1.25rem;
            border-radius: 14px; margin-bottom: 1.25rem;
            border: 1.5px solid transparent;
        }
        .alert-danger-custom { background: #FFF0EF; border-color: #FFD0CD; }
        .alert-info-custom   { background: #EFF5FF; border-color: #C8DCFF; }
        .alert-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }
        .alert-danger-custom .alert-icon { color: var(--red); }
        .alert-info-custom .alert-icon { color: var(--blue); }
        .alert-text { font-size: 13.5px; line-height: 1.6; }
        .alert-text strong { display: block; font-size: 13px; font-weight: 800; margin-bottom: 4px; }
        .alert-text li { margin-bottom: 3px; }

        /* ── SIDEBAR FIELD PREVIEW ── */
        .field-preview-img {
            width: 100%; height: 200px; object-fit: cover;
            border-radius: 14px; display: block; margin-bottom: 1rem;
        }
        .field-preview-name { font-size: 1.1rem; font-weight: 800; margin-bottom: .25rem; }
        .field-preview-sub { font-size: 12px; color: var(--g3); margin-bottom: 1rem; display: flex; align-items: center; gap: 5px; }
        .feat-pill {
            display: inline-flex; align-items: center; gap: 4px;
            background: var(--g5); color: var(--g2); padding: 4px 10px;
            border-radius: 8px; font-size: 11.5px; font-weight: 500; margin: 3px 3px 3px 0;
        }

        /* ── SUBMIT BTN ── */
        .btn-submit {
            width: 100%; padding: 14px;
            background: linear-gradient(135deg, var(--blue), var(--blue-d));
            color: white; border: none; border-radius: 14px;
            font-size: 15px; font-weight: 700; font-family: 'Inter', sans-serif;
            cursor: pointer; transition: all .25s;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            box-shadow: 0 6px 20px rgba(0,122,255,.3);
        }
        .btn-submit:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,122,255,.4); }
        .btn-submit:active { transform: translateY(0); }
        .btn-submit:disabled { opacity: .65; cursor: not-allowed; transform: none; }
        .btn-back {
            width: 100%; padding: 13px;
            background: white; color: var(--g2);
            border: 1.5px solid var(--g4); border-radius: 14px;
            font-size: 14px; font-weight: 600; font-family: 'Inter', sans-serif;
            cursor: pointer; transition: all .2s; text-decoration: none;
            display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-back:hover { border-color: var(--g2); color: var(--g1); }

        /* ── SPINNER ── */
        .spinner { display: none; width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,.3); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── STATUS BADGE ── */
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); animation: pulse 1.5s ease infinite; display: inline-block; margin-right: 5px; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }

        /* ── RESPONSIVE ── */
        @media (max-width: 600px) {
            .bcard-body { padding: 1.25rem; }
            .input-group-custom { flex-direction: column; }
            .page-hero { padding: 90px 0 50px; }
        }
    </style>
</head>
<body>
<?php include __DIR__ . '/../../includes/customer/header.php'; ?>

<!-- PAGE HERO -->
<div class="page-hero">
    <div class="container position-relative" style="z-index:2;">
        <div class="page-hero-tag"><i class="bi bi-calendar-plus-fill"></i> Form Booking</div>
        <h1>Booking Lapangan<br><span style="color:#6EB7FF;">Sekarang</span></h1>
        <p>Isi detail booking, lakukan transfer DP, dan upload bukti pembayaran.</p>
        <div class="breadcrumb-custom">
            <a href="<?php echo APP_URL; ?>/customer/home.php"><i class="bi bi-house-fill"></i> Home</a>
            <span>/</span>
            <a href="<?php echo APP_URL; ?>/customer/index.php">Dashboard</a>
            <span>/</span>
            <span class="current">Booking</span>
        </div>
    </div>
</div>

<!-- BOOKING LAYOUT -->
<div class="booking-layout">

    <!-- ── KOLOM KIRI: FORM ── -->
    <div>

        <?php if ($error): ?>
        <div class="alert-custom alert-danger-custom mb-3">
            <i class="bi bi-exclamation-circle-fill alert-icon"></i>
            <div class="alert-text">
                <strong>Terjadi Kesalahan</strong>
                <?php echo htmlspecialchars($error); ?>
            </div>
        </div>
        <?php endif; ?>

        <form method="POST" id="bookingForm" enctype="multipart/form-data" novalidate>
            <input type="hidden" name="field_id" id="hidden_field_id" value="<?php echo $fieldId; ?>">

            <!-- STEP 1: Pilih Lapangan -->
            <!-- STEP 2: Pilih Tanggal & Waktu -->
            <div class="bcard mb-4">
                <div class="bcard-header">
                    <div class="bcard-header-icon" style="background:#E8FAF0;color:var(--green);"><i class="bi bi-calendar3"></i></div>
                    <div>
                        <h5>Tanggal & Waktu</h5>
                        <p>Pilih jadwal main Anda</p>
                    </div>
                    <span style="margin-left:auto;font-size:12px;color:var(--g3);font-weight:600;">Langkah 1 / 2</span>
                </div>
                <div class="bcard-body">
                    <div class="form-group">
                        <label class="form-label-custom">
                            <i class="bi bi-calendar-event" style="color:var(--blue);"></i> Tanggal Booking
                            <span class="req">*</span>
                            <span class="hint">Minimal hari ini</span>
                        </label>
                        <div class="input-icon-wrap">
                            <i class="bi bi-calendar3 ii"></i>
                            <input type="text" class="input-custom"
                                   id="booking_date" name="booking_date"
                                   placeholder="Pilih tanggal..."
                                   value="<?php echo htmlspecialchars($_POST['booking_date'] ?? ''); ?>"
                                   required readonly>
                        </div>
                    </div>

                    <!-- Tampilan Jadwal yang Sudah Dibooking (Calendar) -->
                    <div style="font-size:13px; font-weight:700; color:var(--g1); margin-bottom:8px;">
                        <i class="bi bi-calendar-check" style="color:var(--indigo);"></i> Jadwal Habis / Ter-booking:
                    </div>
                    <div id="calendar" style="background: white; padding: 10px; border-radius: 12px; border: 1.5px solid var(--g4); margin-bottom: 1.25rem; font-size: 0.85rem;"></div>

                    <div class="input-group-custom">
                        <div class="form-group">
                            <label class="form-label-custom">
                                <i class="bi bi-clock" style="color:var(--green);"></i> Waktu Mulai <span class="req">*</span>
                            </label>
                            <div class="input-icon-wrap">
                                <i class="bi bi-clock ii"></i>
                                <input type="time" class="input-custom"
                                       id="start_time" name="start_time"
                                       value="<?php echo htmlspecialchars($_POST['start_time'] ?? '08:00'); ?>"
                                       required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label-custom">
                                <i class="bi bi-clock-fill" style="color:var(--orange);"></i> Waktu Selesai <span class="req">*</span>
                            </label>
                            <div class="input-icon-wrap">
                                <i class="bi bi-clock-fill ii"></i>
                                <input type="time" class="input-custom"
                                       id="end_time" name="end_time"
                                       value="<?php echo htmlspecialchars($_POST['end_time'] ?? '09:00'); ?>"
                                       required>
                            </div>
                        </div>
                    </div>

                    <!-- Kalkulasi harga live (slot-based) -->
                    <div class="price-summary" id="priceSummary">
                        <div class="ps-row">
                            <span>Tipe Hari</span>
                            <span class="ps-val" id="dayTypeLabel">—</span>
                        </div>
                        <div id="slotBreakdownRows"></div>
                        <div class="ps-row">
                            <span>Durasi</span>
                            <span class="ps-val" id="duration">—</span>
                        </div>
                        <div class="ps-row total">
                            <span>Total Harga</span>
                            <span id="totalPrice">—</span>
                        </div>
                        <div class="ps-row dp">
                            <span id="dpRowLabel">DP</span>
                            <span id="dpAmount">—</span>
                        </div>
                        <div id="naWarning" style="display:none;background:#FFF0EF;border:1.5px solid #FFD0CD;border-radius:10px;padding:8px 12px;font-size:12px;color:var(--red);font-weight:600;"></div>
                    </div>
                </div>
            </div>

            <!-- STEP 3: Upload Bukti DP -->
            <div class="bcard mb-4">
                <div class="bcard-header">
                    <div class="bcard-header-icon" style="background:#FFF6EC;color:var(--orange);"><i class="bi bi-cloud-upload-fill"></i></div>
                    <div>
                        <h5>Bukti Pembayaran DP</h5>
                        <p>Upload bukti keminiman transfer DP <small>(minimal <?php echo formatCurrency(MIN_DP_AMOUNT); ?>)</small></p>
                    </div>
                    <span style="margin-left:auto;font-size:12px;color:var(--g3);font-weight:600;">Langkah 2 / 2</span>
                </div>
                <div class="bcard-body">
                    <!-- Bank info card -->
                    <div class="bank-card">
                        <div class="bc-label">Transfer DP ke</div>
                        <div class="bc-bank"><i class="bi bi-bank2 me-1"></i><?php echo BANK_NAME; ?></div>
                        <div class="bc-row">
                            <div>
                                <div class="bc-num"><?php echo BANK_NUMBER; ?></div>
                                <div class="bc-holder">a.n. <?php echo BANK_HOLDER; ?></div>
                            </div>
                            <button type="button" class="copy-btn" onclick="copyToClipboard('<?php echo BANK_NUMBER; ?>', this)">
                                <i class="bi bi-copy"></i> Salin
                            </button>
                        </div>
                    </div>

                    <div class="alert-custom alert-info-custom">
                        <i class="bi bi-info-circle-fill alert-icon"></i>
                        <div class="alert-text">
                            <strong>Panduan Upload</strong>
                            <span>Transfer DP terlebih dahulu, lalu upload screenshot/foto bukti transfer. Format: JPG, PNG, atau PDF (maks 5MB).</span>
                        </div>
                    </div>

                    <label class="form-label-custom mb-2">
                        <i class="bi bi-file-earmark-image" style="color:var(--orange);"></i>
                        Bukti Transfer / Screenshot <span class="req">*</span>
                    </label>
                    <div class="upload-zone" id="uploadZone">
                        <input type="file" name="payment_proof" id="payment_proof"
                               accept="image/jpeg,image/jpg,image/png,image/gif,application/pdf" required>
                        <div id="uploadPlaceholder">
                            <div class="upload-icon"><i class="bi bi-cloud-arrow-up-fill"></i></div>
                            <h6>Klik atau seret file ke sini</h6>
                            <p>Screenshot / foto bukti transfer</p>
                            <div class="upload-hint">JPG, PNG, PDF • Maks 5MB</div>
                        </div>
                    </div>
                    <div class="upload-preview" id="uploadPreview"></div>
                </div>
            </div>

            <!-- TOMBOL SUBMIT -->
            <div style="display:flex;flex-direction:column;gap:.75rem;">
                <button type="submit" class="btn-submit" id="submitBtn">
                    <i class="bi bi-check-circle-fill" id="submitIcon"></i>
                    <span id="submitText">Konfirmasi & Booking Sekarang</span>
                    <div class="spinner" id="submitSpinner"></div>
                </button>
                <a href="<?php echo APP_URL; ?>/customer/index.php" class="btn-back">
                    <i class="bi bi-arrow-left"></i> Batal, Kembali ke Dashboard
                </a>
            </div>
        </form>
    </div>

    <!-- ── KOLOM KANAN: SIDEBAR ── -->
    <div>
        <!-- Field Preview Card -->
        <div class="bcard mb-4" style="position:sticky;top:90px;">
            <div class="bcard-body">
                <img id="sideFieldImg"
                     src="<?php echo getBookingFieldImg($field['name']); ?>"
                     onerror="this.src='https://picsum.photos/seed/fld/400/200'"
                     alt="<?php echo htmlspecialchars($field['name']); ?>"
                     class="field-preview-img">

                <div class="field-preview-name" id="sideFieldName"><?php echo htmlspecialchars($field['name']); ?></div>
                <div class="field-preview-sub">
                    <i class="bi bi-geo-alt-fill" style="color:var(--red);"></i>
                    <?php echo APP_ADDRESS; ?>
                </div>

                <div class="mb-3">
                    <span class="feat-pill"><i class="bi bi-lightbulb-fill" style="color:var(--orange);"></i> LED</span>
                    <span class="feat-pill"><i class="bi bi-droplet-fill" style="color:var(--blue);"></i> Shower</span>
                    <span class="feat-pill"><i class="bi bi-p-circle-fill" style="color:var(--green);"></i> Parkir</span>

                </div>


                <div style="background:#E8FAF0;border:1.5px solid #c6f0d4;border-radius:12px;padding:10px 14px;display:flex;align-items:center;gap:8px;font-size:13px;">
                    <span class="status-dot"></span>
                    <span style="font-weight:600;color:#1a7c36;">Lapangan Tersedia & Aktif</span>
                </div>
            </div>

            <!-- Tabel Harga per Slot -->
            <div style="padding:0 1.25rem 1.5rem;">
                <div style="font-size:12px;font-weight:700;color:var(--g3);text-transform:uppercase;letter-spacing:.4px;margin-bottom:.75rem;">Tabel Harga per Slot</div>
                <div style="overflow-x:auto;">
                    <table style="width:100%;border-collapse:collapse;font-size:11px;">
                        <thead>
                            <tr style="background:var(--g5);">
                                <th style="padding:6px 8px;text-align:left;font-weight:700;color:var(--g2);border-radius:6px 0 0 6px;">Slot</th>
                                <th style="padding:6px 5px;text-align:center;font-weight:700;color:#1a7c36;">Sen–Kam</th>
                                <th style="padding:6px 5px;text-align:center;font-weight:700;color:var(--orange);">Jumat</th>
                                <th style="padding:6px 8px;text-align:center;font-weight:700;color:var(--red);border-radius:0 6px 6px 0;">Sab/Min</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php
                            foreach ($BOOKING_PRICE_SLOTS as [$sh, $eh, $wd, $fri, $wk]):
                                $fmtSlot = sprintf('%02d:00–%02d:00', $sh, $eh);
                                $fmtWd  = $wd  !== null ? 'Rp ' . number_format($wd,  0, ',', '.') : '<span style="color:#ccc;">N/A</span>';
                                $fmtFri = $fri !== null ? 'Rp ' . number_format($fri, 0, ',', '.') : '<span style="color:#ccc;">N/A</span>';
                                $fmtWk  = $wk  !== null ? 'Rp ' . number_format($wk,  0, ',', '.') : '<span style="color:#ccc;">N/A</span>';
                            ?>
                            <tr style="border-bottom:1px solid var(--g4);">
                                <td style="padding:6px 8px;font-weight:700;color:var(--g1);white-space:nowrap;"><?php echo $fmtSlot; ?></td>
                                <td style="padding:6px 5px;text-align:center;color:var(--g2);"><?php echo $fmtWd; ?></td>
                                <td style="padding:6px 5px;text-align:center;color:var(--g2);"><?php echo $fmtFri; ?></td>
                                <td style="padding:6px 8px;text-align:center;color:var(--g2);"><?php echo $fmtWk; ?></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
                <div style="font-size:10.5px;color:var(--g3);margin-top:6px;">* Harga per slot 2 jam. Multi-slot dijumlah.</div>
            </div>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
<script src="https://npmcdn.to/flatpickr/dist/l10n/id.js"></script>
<script src='https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js'></script>
<script>
let calendar;
const pricePerHour = <?php echo $field['price']; ?>;
const dpPercentage = <?php echo DP_PERCENTAGE; ?>;
const minDpAmount  = <?php echo MIN_DP_AMOUNT; ?>; // Minimal DP Rp 500.000
const fieldImages  = <?php echo json_encode(array_combine(
    array_column($allFields, 'id'),
    array_map(fn($f) => getBookingFieldImg($f['name']), $allFields)
)); ?>;
const fieldPrices = <?php echo json_encode(array_combine(
    array_column($allFields, 'id'),
    array_column($allFields, 'price')
)); ?>;

const fp = flatpickr("#booking_date", {
    dateFormat: "Y-m-d",
    minDate: "today",
    locale: "id",
    disableMobile: true,
    onChange: function(selectedDates, dateStr, instance) {
        calculatePrice();
        if (calendar && selectedDates.length > 0) {
            calendar.gotoDate(dateStr);
            calendar.changeView('timeGridDay');
        }
    }
});

// Initialize FullCalendar
document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridDay',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridDay,timeGridWeek'
        },
        slotMinTime: '07:00:00',
        slotMaxTime: '23:00:00',
        allDaySlot: false,
        height: 400,
        locale: 'id',
        events: getEventSourceUrl()
    });
    calendar.render();
    
    const dVal = document.getElementById("booking_date").value;
    if (dVal) {
        calendar.gotoDate(dVal);
    }
});

function getEventSourceUrl() {
    const fieldId = document.getElementById('hidden_field_id').value;
    return `<?php echo APP_URL; ?>/customer/api/get_bookings.php?field_id=${fieldId}`;
}

// ── Slot price table (mirror of PHP $PRICE_SLOTS) ──
// [startH, endH, weekdayPrice, fridayPrice, weekendPrice]  null = N/A
const PRICE_SLOTS = [
    [6,  8,  null,    null,    2600000],
    [8,  10, 1300000, null,    2600000],
    [10, 12, 800000,  null,    1500000],
    [12, 14, 800000,  null,    1500000],
    [14, 16, 1300000, 1300000, 2600000],
    [16, 18, 2000000, 2300000, 2600000],
    [18, 20, 2300000, 2500000, 2800000],
    [20, 22, 2300000, 2500000, 2800000],
];

function getDayType(dateStr) {
    if (!dateStr) return 'weekday';
    const d = new Date(dateStr);
    const dow = d.getDay(); // 0=Sun,1=Mon,...,6=Sat
    if (dow === 5) return 'friday';
    if (dow === 0 || dow === 6) return 'weekend';
    return 'weekday';
}

const DAY_TYPE_LABELS = {
    weekday: '🗓️ Weekdays (Sen – Kam)',
    friday:  '📅 Weekend (Jumat)',
    weekend: '🎉 Weekend & Libur (Sab/Min)'
};

function calculateSlotPrice(stVal, etVal, dateStr) {
    const startH = parseInt(stVal.split(':')[0]);
    const startM = parseInt(stVal.split(':')[1] || '0');
    const endH   = parseInt(etVal.split(':')[0]);
    const endM   = parseInt(etVal.split(':')[1] || '0');
    const startFrac = startH + startM / 60;
    const endFrac   = endH + (endM > 0 ? Math.ceil(endM / 60) : 0); // ceil menit ke jam berikutnya

    const dayType = getDayType(dateStr);
    const colIdx  = dayType === 'friday' ? 3 : (dayType === 'weekend' ? 4 : 2);

    let total = 0;
    const breakdown = [];
    const naSlots = [];

    for (const slot of PRICE_SLOTS) {
        const [sh, eh] = slot;
        if (eh <= startFrac || sh >= endFrac) continue; // tidak overlap
        const price = slot[colIdx];
        const label = `${String(sh).padStart(2,'0')}:00 – ${String(eh).padStart(2,'0')}:00`;
        if (price === null) {
            naSlots.push(label);
        } else {
            total += price;
            breakdown.push({ label, price });
        }
    }

    return { total, breakdown, naSlots, dayType };
}

// ── Kalkulasi harga ──
function formatRp(n) {
    return 'Rp ' + Math.ceil(n).toLocaleString('id-ID');
}
function calculatePrice() {
    const st = document.getElementById('start_time').value;
    const et = document.getElementById('end_time').value;
    const dateStr = document.getElementById('booking_date').value;
    const naWarning = document.getElementById('naWarning');
    const breakdownEl = document.getElementById('slotBreakdownRows');
    
    // Reset
    naWarning.style.display = 'none';
    breakdownEl.innerHTML = '';
    document.getElementById('dayTypeLabel').textContent = '—';
    document.getElementById('totalPrice').textContent = '—';
    document.getElementById('dpAmount').textContent = '—';
    document.getElementById('duration').textContent = '—';
    document.getElementById('dpRowLabel').textContent = 'DP';
    
    if (!st || !et) return;
    const start = new Date('2000-01-01 ' + st);
    const end   = new Date('2000-01-01 ' + et);
    if (end <= start) {
        document.getElementById('duration').textContent = '⚠ Waktu tidak valid';
        return;
    }
    
    const hours = Math.max(1, Math.ceil((end - start) / 3600000));
    const result = calculateSlotPrice(st, et, dateStr);
    
    document.getElementById('dayTypeLabel').textContent = DAY_TYPE_LABELS[result.dayType] || result.dayType;
    document.getElementById('duration').textContent = hours + ' jam';
    
    // Tampilkan breakdown per slot
    result.breakdown.forEach(item => {
        const row = document.createElement('div');
        row.className = 'ps-row';
        row.style.cssText = 'font-size:12.5px;';
        row.innerHTML = `<span style="color:var(--g3)">${item.label}</span><span class="ps-val" style="color:var(--g2)">${formatRp(item.price)}</span>`;
        breakdownEl.appendChild(row);
    });
    
    if (result.naSlots.length > 0) {
        naWarning.style.display = 'block';
        naWarning.innerHTML = `⚠️ Slot <b>${result.naSlots.join(', ')}</b> tidak tersedia pada hari ini. Silakan pilih waktu lain.`;
        document.getElementById('totalPrice').textContent = 'Tidak tersedia';
        return;
    }
    
    if (result.breakdown.length === 0) {
        document.getElementById('totalPrice').textContent = '—';
        return;
    }
    
    const rawDp = result.total * dpPercentage / 100;
    const dp     = Math.max(rawDp, minDpAmount);
    const isMin  = dp > rawDp;

    document.getElementById('dpRowLabel').textContent = isMin
        ? 'DP Minimal'
        : `DP ${dpPercentage}%`;
    document.getElementById('totalPrice').textContent = formatRp(result.total);
    document.getElementById('dpAmount').textContent   = formatRp(dp);
}
document.getElementById('start_time').addEventListener('change', calculatePrice);
document.getElementById('end_time').addEventListener('change', calculatePrice);
calculatePrice();

// ── Update Calendar ──
function fetchSchedule() {
    if (calendar) {
        calendar.removeAllEventSources();
        calendar.addEventSource(getEventSourceUrl());
    }
}

// ── Field selector ──
function selectField(id, name, price) {
    document.getElementById('hidden_field_id').value = id;
    document.querySelectorAll('.field-option').forEach(el => el.classList.remove('selected'));
    document.getElementById('fo_' + id)?.closest('.field-option')?.classList.add('selected');
    // Update sidebar
    const img = fieldImages[id] || '';
    document.getElementById('sideFieldImg').src = img;
    document.getElementById('sideFieldName').textContent = name;
    
    calculatePrice();
    calculatePrice();
    fetchSchedule();
}

// ── Upload drag & drop ──
const uploadZone = document.getElementById('uploadZone');
const fileInput  = document.getElementById('payment_proof');
const preview    = document.getElementById('uploadPreview');
const placeholder= document.getElementById('uploadPlaceholder');

uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', e => { e.preventDefault(); uploadZone.classList.remove('drag-over'); const f = e.dataTransfer.files[0]; if (f) showPreview(f); });
fileInput.addEventListener('change', e => { if (e.target.files[0]) showPreview(e.target.files[0]); });

function showPreview(file) {
    preview.style.display = 'block';
    placeholder.style.display = 'none';
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => { preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`; };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = `<div class="pdf-preview"><div class="pdf-icon"><i class="bi bi-file-earmark-pdf-fill"></i></div><div><div class="pdf-name">${file.name}</div><div class="pdf-size">${(file.size/1024).toFixed(1)} KB</div></div></div>`;
    }
}

// ── Copy nomor rekening ──
function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        btn.innerHTML = '<i class="bi bi-check2"></i> Tersalin!';
        btn.style.background = 'rgba(52,199,89,.3)';
        setTimeout(() => {
            btn.innerHTML = '<i class="bi bi-copy"></i> Salin';
            btn.style.background = '';
        }, 2000);
    });
}

// ── Form submit loading state ──
document.getElementById('bookingForm').addEventListener('submit', function(e) {
    const st = document.getElementById('start_time').value;
    const et = document.getElementById('end_time').value;
    const bd = document.getElementById('booking_date').value;
    const fp = document.getElementById('payment_proof').files[0];
    if (!bd || !st || !et || !fp) return;

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    document.getElementById('submitIcon').style.display = 'none';
    document.getElementById('submitText').textContent = 'Memproses booking...';
    document.getElementById('submitSpinner').style.display = 'block';
});
</script>
</body>
</html>
