<?php
/**
 * Halaman Pelunasan Pembayaran
 * Untuk booking dengan status dp_paid (DP sudah diverifikasi admin)
 */
require_once __DIR__ . '/../../includes/middleware.php';
requireCustomer();

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/upload_functions.php';
require_once __DIR__ . '/../../includes/mail_functions.php';

$userId = $_SESSION['user_id'];

// Handle POST — upload bukti pelunasan
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $bookingId = (int) ($_POST['booking_id'] ?? 0);

    try {
        // Validasi kepemilikan & status
        $s = $pdo->prepare("
            SELECT b.*, f.name as field_name
            FROM bookings b JOIN fields f ON b.field_id = f.id
            WHERE b.id = ? AND b.user_id = ? AND b.status = 'dp_paid'
        ");
        $s->execute([$bookingId, $userId]);
        $bk = $s->fetch();

        if (!$bk) {
            setFlashMessage('danger', 'Booking tidak ditemukan atau status belum memenuhi syarat pelunasan.');
            redirect(APP_URL . '/customer/booking/pelunasan.php');
        }

        if (!empty($bk['payment_proof_2'])) {
            setFlashMessage('warning', 'Bukti pelunasan sudah diupload. Menunggu verifikasi admin.');
            redirect(APP_URL . '/customer/booking/pelunasan.php');
        }

        if (!isset($_FILES['payment_proof_2']) || $_FILES['payment_proof_2']['error'] === UPLOAD_ERR_NO_FILE) {
            setFlashMessage('danger', 'Bukti pembayaran pelunasan wajib diupload.');
            redirect(APP_URL . '/customer/booking/pelunasan.php');
        }

        $proof2 = uploadPaymentProof($_FILES['payment_proof_2']);
        if (!$proof2) {
            setFlashMessage('danger', 'Gagal upload. Pastikan file adalah gambar (JPG/PNG) atau PDF (maks 5MB).');
            redirect(APP_URL . '/customer/booking/pelunasan.php');
        }

        $pdo->prepare("
            UPDATE bookings SET payment_proof_2 = ?, payment_proof_2_uploaded_at = NOW(), status = 'payment_2_pending'
            WHERE id = ?
        ")->execute([$proof2, $bookingId]);

        $user = ['name' => $_SESSION['user_name'], 'email' => $_SESSION['user_email']];
        sendPaymentReceivedEmail($user, $bk, $bk['field_name'], 'Pelunasan');

        setFlashMessage('success', 'Bukti pelunasan berhasil diupload! Admin akan memverifikasi segera.');
        redirect(APP_URL . '/customer/booking/pelunasan.php');

    } catch (PDOException $e) {
        setFlashMessage('danger', 'Terjadi kesalahan. Silakan coba lagi.');
        redirect(APP_URL . '/customer/booking/pelunasan.php');
    }
}

// Ambil booking yang butuh pelunasan (dp_paid, belum upload proof_2)
try {
    $stmt = $pdo->prepare("
        SELECT b.*, f.name as field_name, f.price as field_price
        FROM bookings b JOIN fields f ON b.field_id = f.id
        WHERE b.user_id = ? AND b.status = 'dp_paid'
        ORDER BY b.booking_date ASC
    ");
    $stmt->execute([$userId]);
    $needPayment = $stmt->fetchAll();
} catch (PDOException $e) { $needPayment = []; }

// Ambil booking yang sudah upload tapi menunggu verifikasi
try {
    $stmt2 = $pdo->prepare("
        SELECT b.*, f.name as field_name
        FROM bookings b JOIN fields f ON b.field_id = f.id
        WHERE b.user_id = ? AND b.status = 'payment_2_pending'
        ORDER BY b.booking_date ASC
    ");
    $stmt2->execute([$userId]);
    $pendingVerif = $stmt2->fetchAll();
} catch (PDOException $e) { $pendingVerif = []; }

// Ambil booking yang sudah lunas
try {
    $stmt3 = $pdo->prepare("
        SELECT b.*, f.name as field_name
        FROM bookings b JOIN fields f ON b.field_id = f.id
        WHERE b.user_id = ? AND b.status IN ('paid','confirmed')
        ORDER BY b.booking_date DESC LIMIT 5
    ");
    $stmt3->execute([$userId]);
    $doneBookings = $stmt3->fetchAll();
} catch (PDOException $e) { $doneBookings = []; }
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pelunasan Pembayaran — <?php echo APP_NAME; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --blue:#007AFF; --blue-d:#0051D5; --blue-l:#EFF5FF;
            --green:#34C759; --orange:#FF9500; --red:#FF3B30; --indigo:#5856D6;
            --g1:#111; --g2:#444; --g3:#888; --g4:#ddd; --g5:#f5f5f7; --w:#fff;
        }
        *, *::before, *::after { box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: var(--g5); color: var(--g1); -webkit-font-smoothing: antialiased; }

        /* PAGE HERO */
        .page-hero {
            background: linear-gradient(135deg, #020918 0%, #0a1628 55%, #0d1f3c 100%);
            padding: 100px 0 60px; position: relative; overflow: hidden;
        }
        .page-hero::before {
            content:''; position:absolute; width:500px; height:500px;
            background:rgba(0,122,255,.15); border-radius:50%;
            top:-150px; left:-100px; filter:blur(80px); pointer-events:none;
        }
        .page-hero::after {
            content:''; position:absolute; width:350px; height:350px;
            background:rgba(88,86,214,.12); border-radius:50%;
            bottom:-80px; right:-80px; filter:blur(70px); pointer-events:none;
        }
        .hero-tag {
            display:inline-flex;align-items:center;gap:7px;
            background:rgba(0,122,255,.18);border:1px solid rgba(0,122,255,.35);
            color:#6EB7FF;padding:5px 14px;border-radius:20px;
            font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.9px;margin-bottom:1rem;
        }
        .page-hero h1 { font-size:clamp(1.7rem,4vw,2.6rem);font-weight:900;color:white;letter-spacing:-1px;line-height:1.15;margin-bottom:.5rem; }
        .page-hero p { color:rgba(255,255,255,.6);font-size:.95rem;margin:0; }
        .breadcrumb-hero { display:flex;align-items:center;gap:8px;margin-top:1.25rem; }
        .breadcrumb-hero a { color:rgba(255,255,255,.5);font-size:13px;text-decoration:none;transition:color .2s; }
        .breadcrumb-hero a:hover { color:white; }
        .breadcrumb-hero span { color:rgba(255,255,255,.3);font-size:13px; }
        .breadcrumb-hero .cur { color:rgba(255,255,255,.85);font-size:13px;font-weight:600; }

        /* MAIN CONTAINER */
        .main-wrap {
            max-width: 860px; margin: -36px auto 0; padding: 0 1.25rem 4rem; position:relative; z-index:10;
        }

        /* FLASH */
        .flash-box {
            display:flex;gap:12px;padding:1rem 1.25rem;
            border-radius:14px;margin-bottom:1.5rem;border:1.5px solid transparent;
        }
        .flash-success { background:#EDFAF2;border-color:#c7f0d8; }
        .flash-danger  { background:#FFF0EF;border-color:#FFD0CD; }
        .flash-warning { background:#FFF6EC;border-color:#FFE0B0; }
        .flash-icon { font-size:1.1rem;flex-shrink:0;margin-top:1px; }
        .flash-success .flash-icon { color:var(--green); }
        .flash-danger  .flash-icon { color:var(--red); }
        .flash-warning .flash-icon { color:var(--orange); }
        .flash-text { font-size:13.5px;font-weight:500; }

        /* SECTION LABEL */
        .sec-label {
            font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;
            color:var(--g3);margin-bottom:1rem;display:flex;align-items:center;gap:8px;
        }
        .sec-label::after { content:'';flex:1;height:1px;background:#e0e0e0; }

        /* BOOKING CARD */
        .bk-card {
            background:white;border:1.5px solid #eee;border-radius:20px;
            overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.05);margin-bottom:1rem;
            transition:box-shadow .2s;
        }
        .bk-card:hover { box-shadow:0 6px 24px rgba(0,0,0,.1); }
        .bk-card.urgent { border-color:#FF9500;box-shadow:0 0 0 2px rgba(255,149,0,.15); }
        .bk-card.done   { border-color:#34C759; }
        .bk-card.wait   { border-color:#5856D6; }

        .bk-head {
            padding:1.25rem 1.5rem;display:flex;align-items:center;gap:14px;
            border-bottom:1px solid #f4f4f4;
        }
        .bk-icon { width:46px;height:46px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0; }
        .bk-icon.orange { background:#FFF6EC;color:var(--orange); }
        .bk-icon.purple { background:#F0EEFF;color:var(--indigo); }
        .bk-icon.green  { background:#E8FAF0;color:var(--green); }
        .bk-field-name  { font-size:1rem;font-weight:800;margin:0; }
        .bk-date        { font-size:13px;color:var(--g3);margin:2px 0 0; }
        .bk-status      {
            margin-left:auto;padding:5px 12px;border-radius:20px;
            font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.3px;flex-shrink:0;
        }
        .st-dp_paid          { background:#EFF5FF;color:var(--blue); }
        .st-payment_2_pending{ background:#F0EEFF;color:var(--indigo); }
        .st-paid,.st-confirmed{ background:#E8FAF0;color:var(--green); }

        .bk-body { padding:1.25rem 1.5rem; }

        /* Price breakdown */
        .price-row {
            display:flex;justify-content:space-between;align-items:center;
            padding:8px 0;font-size:13.5px;color:var(--g2);
        }
        .price-row + .price-row { border-top:1px solid #f0f0f0; }
        .price-row.highlight { font-weight:800;font-size:15px;color:var(--g1); }
        .price-row.sisa { color:var(--red);font-weight:800; }
        .price-row .val { font-weight:700; }
        .price-block {
            background:var(--g5);border-radius:12px;padding:1rem;margin-bottom:1.25rem;
        }

        /* Bank card mini */
        .bank-mini {
            background:linear-gradient(135deg,#0d1f3c,#1a3563);
            border-radius:12px;padding:1rem 1.25rem;color:white;margin-bottom:1.25rem;
            display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;
        }
        .bank-mini .bm-label { font-size:11px;color:rgba(255,255,255,.6);font-weight:600;text-transform:uppercase;letter-spacing:.4px; }
        .bank-mini .bm-name  { font-size:.9rem;font-weight:800; }
        .bank-mini .bm-num   { font-size:1rem;font-weight:800;letter-spacing:1.5px; }
        .bank-mini .bm-holder{ font-size:12px;color:rgba(255,255,255,.65); }
        .copy-btn-mini {
            background:rgba(255,255,255,.12);border:none;color:white;
            padding:6px 14px;border-radius:8px;font-size:12px;font-weight:600;
            cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:5px;flex-shrink:0;
        }
        .copy-btn-mini:hover { background:rgba(255,255,255,.22); }

        /* Upload zone */
        .upload-zone {
            border:2px dashed var(--g4);border-radius:12px;
            padding:1.5rem;text-align:center;cursor:pointer;
            transition:all .25s;background:#fafafa;position:relative;
        }
        .upload-zone:hover,.upload-zone.dragover { border-color:var(--orange);background:#FFFBF5; }
        .upload-zone input[type="file"] { position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%; }
        .upload-icon2 { width:46px;height:46px;background:#FFF6EC;border-radius:12px;margin:0 auto .6rem;display:flex;align-items:center;justify-content:center;font-size:1.3rem;color:var(--orange); }
        .upload-zone h6 { font-size:.85rem;font-weight:700;margin:0 0 3px; }
        .upload-zone p { font-size:12px;color:var(--g3);margin:0; }
        .upload-preview { display:none;margin-top:1rem;border:1.5px solid var(--g4);border-radius:10px;overflow:hidden; }
        .upload-preview img { width:100%;max-height:160px;object-fit:cover;display:block; }

        /* Submit btn */
        .btn-lunasi {
            width:100%;padding:13px;
            background:linear-gradient(135deg,var(--orange),#e67e00);
            color:white;border:none;border-radius:13px;
            font-size:15px;font-weight:800;font-family:'Inter',sans-serif;
            cursor:pointer;transition:all .25s;
            display:flex;align-items:center;justify-content:center;gap:8px;
            box-shadow:0 6px 20px rgba(255,149,0,.35);
        }
        .btn-lunasi:hover { transform:translateY(-2px);box-shadow:0 10px 28px rgba(255,149,0,.45); }

        /* Empty state */
        .empty-state {
            background:white;border-radius:20px;border:1.5px solid #eee;
            padding:3.5rem 2rem;text-align:center;
        }
        .empty-icon { font-size:3.5rem;opacity:.2;display:block;margin-bottom:1rem; }

        /* Progress steps */
        .pay-steps { display:flex;gap:0;margin-bottom:1.5rem; }
        .ps-step {
            flex:1;text-align:center;position:relative;padding-bottom:.75rem;
        }
        .ps-step::after {
            content:'';position:absolute;top:15px;left:50%;right:-50%;
            height:2px;background:#eee;z-index:0;
        }
        .ps-step:last-child::after { display:none; }
        .ps-step.done::after { background:var(--green); }
        .ps-step.active::after { background:linear-gradient(to right,var(--orange),#eee); }
        .ps-num {
            width:32px;height:32px;border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-size:12px;font-weight:800;margin:0 auto .5rem;
            position:relative;z-index:1;
        }
        .ps-step.done   .ps-num { background:var(--green);color:white; }
        .ps-step.active .ps-num { background:var(--orange);color:white;box-shadow:0 4px 12px rgba(255,149,0,.35); }
        .ps-step.idle   .ps-num { background:#eee;color:var(--g3); }
        .ps-label { font-size:11px;font-weight:600;color:var(--g3); }
        .ps-step.active .ps-label { color:var(--orange); }
        .ps-step.done   .ps-label { color:var(--green); }

        /* Countdown badge */
        .countdown-badge {
            display:inline-flex;align-items:center;gap:6px;
            background:#FFF6EC;border:1.5px solid #FFD580;
            color:#CC7700;border-radius:10px;padding:5px 12px;
            font-size:12px;font-weight:700;margin-bottom:1rem;
        }

        @media(max-width:600px){
            .bk-head { flex-wrap:wrap; }
            .bk-status { margin-left:0; }
            .bank-mini { flex-direction:column;align-items:flex-start; }
        }
    </style>
</head>
<body>
<?php include __DIR__ . '/../../includes/customer/header.php'; ?>

<!-- HERO -->
<div class="page-hero">
    <div class="container position-relative" style="z-index:2;">
        <div class="hero-tag"><i class="bi bi-cash-stack"></i> Pembayaran</div>
        <h1>Pelunasan <span style="color:#FFB340;">Booking</span></h1>
        <p>Upload bukti transfer pelunasan untuk booking yang sudah dikonfirmasi DP-nya.</p>
        <div class="breadcrumb-hero">
            <a href="<?php echo APP_URL; ?>/customer/home.php"><i class="bi bi-house-fill"></i> Home</a>
            <span>/</span>
            <a href="<?php echo APP_URL; ?>/customer/profile.php">Profil</a>
            <span>/</span>
            <span class="cur">Pelunasan</span>
        </div>
    </div>
</div>

<div class="main-wrap">

    <?php
    $flash = getFlashMessage();
    if ($flash):
        $fc = match($flash['type']) { 'success'=>'flash-success','danger'=>'flash-danger', default=>'flash-warning' };
        $fi = match($flash['type']) { 'success'=>'bi-check-circle-fill','danger'=>'bi-exclamation-circle-fill', default=>'bi-exclamation-triangle-fill' };
    ?>
    <div class="flash-box <?php echo $fc; ?>">
        <i class="bi <?php echo $fi; ?> flash-icon"></i>
        <div class="flash-text"><?php echo htmlspecialchars($flash['message']); ?></div>
    </div>
    <?php endif; ?>

    <!-- BUTUH PELUNASAN -->
    <?php if (!empty($needPayment)): ?>
    <div class="sec-label"><i class="bi bi-exclamation-circle-fill" style="color:var(--orange);"></i> Menunggu Pelunasan (<?php echo count($needPayment); ?>)</div>

    <?php foreach ($needPayment as $bk):
        $sisa = $bk['price'] - $bk['dp_amount'];
        $daysLeft = (int) ((strtotime($bk['booking_date']) - time()) / 86400);
    ?>
    <div class="bk-card urgent">
        <!-- Progress Steps -->
        <div style="padding:1rem 1.5rem .5rem;">
            <div class="pay-steps">
                <div class="ps-step done">
                    <div class="ps-num"><i class="bi bi-check"></i></div>
                    <div class="ps-label">DP Dibayar</div>
                </div>
                <div class="ps-step done">
                    <div class="ps-num"><i class="bi bi-check"></i></div>
                    <div class="ps-label">DP Diverifikasi</div>
                </div>
                <div class="ps-step active">
                    <div class="ps-num">3</div>
                    <div class="ps-label">Bayar Sisa</div>
                </div>
                <div class="ps-step idle">
                    <div class="ps-num">4</div>
                    <div class="ps-label">Lunas ✓</div>
                </div>
            </div>
        </div>

        <div class="bk-head">
            <div class="bk-icon orange"><i class="bi bi-calendar-event-fill"></i></div>
            <div>
                <div class="bk-field-name"><?php echo htmlspecialchars($bk['field_name']); ?></div>
                <div class="bk-date">
                    <?php echo date('l, d F Y', strtotime($bk['booking_date'])); ?> &nbsp;·&nbsp;
                    <?php echo date('H:i', strtotime($bk['start_time'])); ?>–<?php echo date('H:i', strtotime($bk['end_time'])); ?> WIB
                </div>
            </div>
            <span class="bk-status st-dp_paid">DP Terverifikasi</span>
        </div>

        <div class="bk-body">
            <?php if ($daysLeft >= 0 && $daysLeft <= 3): ?>
            <div class="countdown-badge">
                <i class="bi bi-alarm-fill"></i>
                <?php echo $daysLeft == 0 ? 'Main hari ini!' : "Main dalam $daysLeft hari lagi"; ?> — Segera lunasi!
            </div>
            <?php endif; ?>

            <!-- Rincian Harga -->
            <div class="price-block">
                <div class="price-row">
                    <span>Total Harga</span>
                    <span class="val"><?php echo formatCurrency($bk['price']); ?></span>
                </div>
                <div class="price-row">
                    <span>DP yang sudah dibayar</span>
                    <span class="val" style="color:var(--green);">– <?php echo formatCurrency($bk['dp_amount']); ?></span>
                </div>
                <div class="price-row sisa">
                    <span><i class="bi bi-arrow-right-circle-fill me-1"></i>Sisa yang harus dibayar</span>
                    <span><?php echo formatCurrency($sisa); ?></span>
                </div>
            </div>

            <!-- Info Bank -->
            <div class="bank-mini">
                <div>
                    <div class="bm-label">Transfer pelunasan ke</div>
                    <div class="bm-name"><i class="bi bi-bank2 me-1"></i><?php echo BANK_NAME; ?></div>
                    <div class="bm-num"><?php echo BANK_NUMBER; ?></div>
                    <div class="bm-holder">a.n. <?php echo BANK_HOLDER; ?></div>
                </div>
                <button type="button" class="copy-btn-mini" onclick="copyNum('<?php echo BANK_NUMBER; ?>', this)">
                    <i class="bi bi-copy"></i> Salin No. Rek
                </button>
            </div>

            <!-- Form Upload -->
            <form method="POST" enctype="multipart/form-data" id="form_<?php echo $bk['id']; ?>">
                <input type="hidden" name="booking_id" value="<?php echo $bk['id']; ?>">

                <label style="font-size:13px;font-weight:700;color:var(--g1);display:flex;align-items:center;gap:6px;margin-bottom:.6rem;">
                    <i class="bi bi-cloud-upload-fill" style="color:var(--orange);"></i>
                    Upload Bukti Transfer Pelunasan <span style="color:var(--red);">*</span>
                </label>

                <div class="upload-zone" id="zone_<?php echo $bk['id']; ?>">
                    <input type="file" name="payment_proof_2" accept="image/jpeg,image/png,image/gif,application/pdf" required
                           onchange="showPreview(this, <?php echo $bk['id']; ?>)">
                    <div id="ph_<?php echo $bk['id']; ?>">
                        <div class="upload-icon2"><i class="bi bi-image-fill"></i></div>
                        <h6>Klik atau seret file ke sini</h6>
                        <p>Screenshot/foto bukti transfer • JPG, PNG, PDF • Maks 5MB</p>
                    </div>
                </div>
                <div class="upload-preview" id="prev_<?php echo $bk['id']; ?>"></div>

                <div style="margin-top:1rem;">
                    <button type="submit" class="btn-lunasi">
                        <i class="bi bi-send-fill"></i>
                        Kirim Bukti Pelunasan — <?php echo formatCurrency($sisa); ?>
                    </button>
                </div>
            </form>
        </div>
    </div>
    <?php endforeach; ?>
    <?php endif; ?>

    <!-- MENUNGGU VERIFIKASI PELUNASAN -->
    <?php if (!empty($pendingVerif)): ?>
    <div class="sec-label" style="margin-top:2rem;"><i class="bi bi-hourglass-split" style="color:var(--indigo);"></i> Menunggu Verifikasi Admin</div>
    <?php foreach ($pendingVerif as $bk): ?>
    <div class="bk-card wait">
        <div class="bk-head">
            <div class="bk-icon purple"><i class="bi bi-clock-fill"></i></div>
            <div>
                <div class="bk-field-name"><?php echo htmlspecialchars($bk['field_name']); ?></div>
                <div class="bk-date"><?php echo date('d F Y', strtotime($bk['booking_date'])); ?> &nbsp;·&nbsp; <?php echo date('H:i', strtotime($bk['start_time'])); ?>–<?php echo date('H:i', strtotime($bk['end_time'])); ?></div>
            </div>
            <span class="bk-status st-payment_2_pending">Verifikasi Pelunasan</span>
        </div>
        <div class="bk-body">
            <div style="display:flex;align-items:center;gap:10px;background:#F0EEFF;border:1.5px solid #d4c8ff;border-radius:12px;padding:.875rem 1rem;font-size:13px;">
                <i class="bi bi-hourglass-split" style="color:var(--indigo);font-size:1.1rem;"></i>
                <div>
                    <strong style="color:var(--indigo);">Bukti pelunasan sedang diverifikasi</strong><br>
                    <span style="color:#6b5fc7;">Admin akan memverifikasi dalam 1×24 jam. Anda akan mendapat notifikasi via email.</span>
                </div>
            </div>
            <?php if (!empty($bk['payment_proof_2'])): ?>
            <div style="margin-top:.875rem;">
                <a href="<?php echo getPaymentProofUrl($bk['payment_proof_2']); ?>" target="_blank"
                   style="display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--blue);font-weight:600;text-decoration:none;">
                    <i class="bi bi-eye-fill"></i> Lihat Bukti Pelunasan yang Diupload
                </a>
            </div>
            <?php endif; ?>
        </div>
    </div>
    <?php endforeach; ?>
    <?php endif; ?>

    <!-- BOOKING LUNAS -->
    <?php if (!empty($doneBookings)): ?>
    <div class="sec-label" style="margin-top:2rem;"><i class="bi bi-check-circle-fill" style="color:var(--green);"></i> Sudah Lunas</div>
    <?php foreach ($doneBookings as $bk): ?>
    <div class="bk-card done">
        <div class="bk-head" style="padding:1rem 1.5rem;">
            <div class="bk-icon green"><i class="bi bi-check-circle-fill"></i></div>
            <div>
                <div class="bk-field-name"><?php echo htmlspecialchars($bk['field_name']); ?></div>
                <div class="bk-date"><?php echo date('d F Y', strtotime($bk['booking_date'])); ?> &nbsp;·&nbsp; <?php echo date('H:i', strtotime($bk['start_time'])); ?>–<?php echo date('H:i', strtotime($bk['end_time'])); ?></div>
            </div>
            <span class="bk-status st-confirmed"><i class="bi bi-check-circle-fill me-1"></i>Lunas</span>
        </div>
        <div style="padding:.875rem 1.5rem;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #f0f0f0;">
            <span style="font-size:13px;color:var(--g3);">Total: <strong style="color:var(--g1);"><?php echo formatCurrency($bk['price']); ?></strong></span>
            <a href="<?php echo APP_URL; ?>/customer/booking/invoice.php?id=<?php echo $bk['id']; ?>" target="_blank"
               style="display:inline-flex;align-items:center;gap:5px;font-size:13px;color:var(--blue);font-weight:600;text-decoration:none;">
                <i class="bi bi-printer-fill"></i> Cetak Nota
            </a>
        </div>
    </div>
    <?php endforeach; ?>
    <?php endif; ?>

    <!-- EMPTY STATE — tidak ada yang perlu dilunasi -->
    <?php if (empty($needPayment) && empty($pendingVerif) && empty($doneBookings)): ?>
    <div class="empty-state">
        <i class="bi bi-cash-coin empty-icon"></i>
        <p style="font-weight:700;color:#444;margin-bottom:.5rem;">Belum ada pembayaran pelunasan</p>
        <p style="font-size:14px;color:var(--g3);margin-bottom:1.5rem;">
            Pelunasan muncul di sini setelah DP Anda diverifikasi oleh admin.
        </p>
        <a href="<?php echo APP_URL; ?>/customer/home.php"
           style="display:inline-flex;align-items:center;gap:8px;background:var(--blue);color:white;padding:11px 24px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:700;">
            <i class="bi bi-house-fill"></i> Kembali ke Home
        </a>
    </div>
    <?php elseif (empty($needPayment) && empty($pendingVerif)): ?>
    <div class="empty-state" style="margin-top:1.5rem;">
        <i class="bi bi-check-circle empty-icon" style="opacity:.3;color:var(--green);"></i>
        <p style="font-weight:700;color:#444;margin-bottom:.5rem;">Semua Booking Sudah Lunas! 🎉</p>
        <p style="font-size:14px;color:var(--g3);">Tidak ada pembayaran yang perlu diselesaikan saat ini.</p>
    </div>
    <?php endif; ?>

    <!-- BACK LINK -->
    <div style="margin-top:2rem;text-align:center;">
        <a href="<?php echo APP_URL; ?>/customer/profile.php"
           style="color:var(--g3);font-size:13px;text-decoration:none;display:inline-flex;align-items:center;gap:6px;">
            <i class="bi bi-arrow-left"></i> Kembali ke Profil Saya
        </a>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script>
function showPreview(input, id) {
    const file = input.files[0];
    if (!file) return;
    const prev = document.getElementById('prev_' + id);
    const ph   = document.getElementById('ph_' + id);
    prev.style.display = 'block';
    ph.style.display = 'none';
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => { prev.innerHTML = `<img src="${e.target.result}" alt="Preview">`; };
        reader.readAsDataURL(file);
    } else {
        prev.innerHTML = `<div style="padding:1rem;display:flex;align-items:center;gap:10px;background:#f8f9fa;">
            <div style="width:38px;height:38px;background:#FFF0EF;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#FF3B30;font-size:1.2rem;">📄</div>
            <div><div style="font-weight:700;font-size:13px;">${file.name}</div><div style="font-size:12px;color:#888;">${(file.size/1024).toFixed(1)} KB</div></div>
        </div>`;
    }
}

// Drag & drop
document.querySelectorAll('.upload-zone').forEach(zone => {
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('dragover'); });
});

function copyNum(num, btn) {
    navigator.clipboard.writeText(num).then(() => {
        btn.innerHTML = '<i class="bi bi-check2"></i> Tersalin!';
        btn.style.background = 'rgba(52,199,89,.3)';
        setTimeout(() => { btn.innerHTML = '<i class="bi bi-copy"></i> Salin No. Rek'; btn.style.background = ''; }, 2500);
    });
}
</script>
</body>
</html>
