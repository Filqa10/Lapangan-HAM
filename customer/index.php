<?php
require_once __DIR__ . '/../includes/middleware.php';
requireCustomer();

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

$isLoggedIn = isLoggedIn();
$userId     = $_SESSION['user_id'];
$userName   = $_SESSION['user_name'] ?? 'Pengguna';

// Statistics
$totalBookings = $pendingBookings = $confirmedBookings = $cancelledBookings = 0;
$recentBookings = [];
$nextBooking    = null;
$totalSpent     = 0;

try {
    $stmt = $pdo->prepare("SELECT COUNT(*) as t FROM bookings WHERE user_id = ?");
    $stmt->execute([$userId]); $totalBookings = $stmt->fetch()['t'];

    $stmt = $pdo->prepare("SELECT COUNT(*) as t FROM bookings WHERE user_id = ? AND status = 'pending'");
    $stmt->execute([$userId]); $pendingBookings = $stmt->fetch()['t'];

    $stmt = $pdo->prepare("SELECT COUNT(*) as t FROM bookings WHERE user_id = ? AND status IN ('dp_paid','payment_2_pending','paid','confirmed')");
    $stmt->execute([$userId]); $confirmedBookings = $stmt->fetch()['t'];

    $stmt = $pdo->prepare("SELECT COUNT(*) as t FROM bookings WHERE user_id = ? AND status = 'cancelled'");
    $stmt->execute([$userId]); $cancelledBookings = $stmt->fetch()['t'];

    $stmt = $pdo->prepare("SELECT COALESCE(SUM(price),0) as t FROM bookings WHERE user_id = ? AND status IN ('paid','confirmed')");
    $stmt->execute([$userId]); $totalSpent = $stmt->fetch()['t'];

    // Next upcoming booking
    $stmt = $pdo->prepare("
        SELECT b.*, f.name as field_name
        FROM bookings b JOIN fields f ON b.field_id = f.id
        WHERE b.user_id = ? AND b.booking_date >= CURDATE()
          AND b.status NOT IN ('cancelled')
        ORDER BY b.booking_date ASC, b.start_time ASC LIMIT 1
    ");
    $stmt->execute([$userId]); $nextBooking = $stmt->fetch() ?: null;

    // Recent bookings
    $stmt = $pdo->prepare("
        SELECT b.*, f.name as field_name
        FROM bookings b JOIN fields f ON b.field_id = f.id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC LIMIT 5
    ");
    $stmt->execute([$userId]); $recentBookings = $stmt->fetchAll();

    // All active fields
    $stmt = $pdo->query("SELECT * FROM fields WHERE status = 'active' ORDER BY price DESC");
    $allFields = $stmt->fetchAll();

} catch (PDOException $e) {
    $allFields = [];
}

$pageTitle = "Dashboard";
include __DIR__ . '/../includes/customer/header.php';

$hour = (int) date('H');
$greeting = $hour < 11 ? 'Selamat Pagi' : ($hour < 15 ? 'Selamat Siang' : ($hour < 18 ? 'Selamat Sore' : 'Selamat Malam'));
$firstName = explode(' ', $userName)[0];
?>

<style>
/* ─── Dashboard Premium Styles ─── */
.db-hero {
    background: linear-gradient(135deg, #007AFF 0%, #0051D5 55%, #3B0DBA 100%);
    border-radius: 20px;
    padding: 2rem 2.5rem;
    position: relative;
    overflow: hidden;
    color: white;
    margin-bottom: 1.75rem;
}
.db-hero::before {
    content:''; position:absolute; top:-60px; right:-80px;
    width:280px; height:280px; background:rgba(255,255,255,0.06); border-radius:50%;
}
.db-hero::after {
    content:''; position:absolute; bottom:-40px; left:30%;
    width:180px; height:180px; background:rgba(255,255,255,0.04); border-radius:50%;
}
.db-hero .greeting { font-size:13px; opacity:.75; font-weight:600; text-transform:uppercase; letter-spacing:.8px; }
.db-hero h1 { font-size:1.85rem; font-weight:800; letter-spacing:-.5px; margin:4px 0 6px; }
.db-hero p  { font-size:.9rem; opacity:.75; margin:0; }
.db-hero .hero-actions { margin-top:1.5rem; display:flex; gap:10px; flex-wrap:wrap; position:relative; z-index:1; }
.btn-hero-w {
    background:rgba(255,255,255,.18); border:1.5px solid rgba(255,255,255,.3);
    color:white; padding:9px 20px; border-radius:12px; font-size:13px; font-weight:700;
    text-decoration:none; display:inline-flex; align-items:center; gap:7px; transition:all .2s;
    backdrop-filter:blur(6px);
}
.btn-hero-w:hover { background:rgba(255,255,255,.28); color:white; }
.btn-hero-solid {
    background:white; color:#007AFF; border:none;
    padding:9px 20px; border-radius:12px; font-size:13px; font-weight:800;
    text-decoration:none; display:inline-flex; align-items:center; gap:7px; transition:all .2s;
    box-shadow:0 4px 14px rgba(0,0,0,.15);
}
.btn-hero-solid:hover { background:#EFF5FF; color:#0051D5; transform:translateY(-1px); }

/* Stat Cards */
.stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:1.75rem; }
@media(max-width:768px) { .stat-grid { grid-template-columns:repeat(2,1fr); } }
.scard {
    background:#fff; border:1.5px solid #eee; border-radius:16px; padding:1.25rem;
    transition:all .25s; position:relative; overflow:hidden;
}
.scard::after {
    content:''; position:absolute; top:0; left:0; right:0; height:3px;
    background:var(--sc-color); transform:scaleX(0); transform-origin:left;
    transition:transform .3s ease;
}
.scard:hover::after { transform:scaleX(1); }
.scard:hover { box-shadow:0 8px 24px rgba(0,0,0,.08); transform:translateY(-3px); }
.scard-icon {
    width:44px; height:44px; border-radius:12px;
    display:flex; align-items:center; justify-content:center;
    font-size:1.2rem; margin-bottom:.875rem; background:var(--sc-bg);
}
.scard-num { font-size:2rem; font-weight:900; letter-spacing:-1px; color:#111; line-height:1; }
.scard-lbl { font-size:11.5px; font-weight:600; color:#999; text-transform:uppercase; letter-spacing:.4px; margin-top:4px; }

/* Next Booking Banner */
.next-booking {
    background: linear-gradient(135deg, #EDFAF2 0%, #D4F5E2 100%);
    border: 1.5px solid #A8ECC6; border-radius:16px; padding:1rem 1.25rem;
    display:flex; align-items:center; gap:1rem; margin-bottom:1.75rem;
}
.next-booking .nb-icon {
    width:48px; height:48px; background:#34C759; border-radius:14px;
    display:flex; align-items:center; justify-content:center; color:white; font-size:1.3rem; flex-shrink:0;
}
.next-booking .nb-label { font-size:11px; font-weight:700; color:#1A9E48; text-transform:uppercase; letter-spacing:.5px; }
.next-booking .nb-title { font-size:.95rem; font-weight:800; color:#111; margin:2px 0; }
.next-booking .nb-sub   { font-size:12px; color:#555; margin:0; }
.nb-badge {
    margin-left:auto; background:#34C759; color:white;
    padding:5px 14px; border-radius:20px; font-size:11px; font-weight:700;
    white-space:nowrap;
}

/* Section Headings */
.db-section-head {
    display:flex; align-items:center; justify-content:space-between;
    margin-bottom:1rem;
}
.db-section-head h5 { font-weight:800; font-size:1rem; letter-spacing:-.2px; margin:0; }
.db-section-head a  { font-size:12.5px; font-weight:600; color:#007AFF; text-decoration:none; }
.db-section-head a:hover { text-decoration:underline; }
.section-divider { width:40px; height:3px; background:#007AFF; border-radius:4px; margin-bottom:1.25rem; }

/* Booking Activity Feed */
.activity-card {
    background:#fff; border:1.5px solid #eee; border-radius:16px; overflow:hidden;
}
.activity-item {
    display:flex; align-items:center; gap:.875rem;
    padding:.875rem 1.25rem; border-bottom:1px solid #f5f5f5;
    transition:background .15s;
}
.activity-item:last-child { border-bottom:none; }
.activity-item:hover { background:#fafafa; }
.act-avatar {
    width:40px; height:40px; border-radius:12px;
    display:flex; align-items:center; justify-content:center;
    font-size:1.1rem; flex-shrink:0;
}
.act-field { font-size:.875rem; font-weight:700; color:#111; margin:0 0 2px; }
.act-date  { font-size:11.5px; color:#888; margin:0; }
.act-price { font-size:.8rem; font-weight:700; color:#007AFF; }
.status-dot {
    display:inline-flex; align-items:center; gap:4px;
    padding:3px 10px; border-radius:20px; font-size:10.5px; font-weight:700; text-transform:uppercase;
}
.dot-pending           { background:#FFF6EC; color:#FF9500; }
.dot-dp_paid           { background:#EFF5FF; color:#007AFF; }
.dot-payment_2_pending { background:#F0EEFF; color:#5856D6; }
.dot-confirmed,
.dot-paid              { background:#EDFAF2; color:#34C759; }
.dot-cancelled         { background:#FFF0EF; color:#FF3B30; }

/* Field Quick-Booking Cards */
.field-quick-card {
    background:#fff; border:1.5px solid #eee; border-radius:16px; overflow:hidden;
    transition:all .25s;
}
.field-quick-card:hover { border-color:#007AFF; box-shadow:0 8px 24px rgba(0,122,255,.1); transform:translateY(-4px); }
.field-quick-card img { width:100%; height:160px; object-fit:cover; }
.fqc-body { padding:1rem 1.1rem 1.1rem; }
.fqc-type { font-size:10.5px; font-weight:700; color:#007AFF; text-transform:uppercase; letter-spacing:.5px; background:#EFF5FF; padding:2px 8px; border-radius:6px; margin-bottom:.5rem; display:inline-block; }
.fqc-name { font-weight:800; font-size:.95rem; color:#111; margin:0 0 2px; }
.fqc-price { font-size:.875rem; font-weight:700; color:#007AFF; }
.fqc-price span { font-weight:400; color:#aaa; font-size:12px; }
.btn-book-now {
    display:block; text-align:center; margin-top:.875rem;
    background:#007AFF; color:#fff; border-radius:10px; padding:9px;
    font-size:13px; font-weight:700; text-decoration:none; transition:all .2s;
}
.btn-book-now:hover { background:#0051D5; color:#fff; }

/* Calendar Card */
.calendar-card {
    background:#fff; border:1.5px solid #eee; border-radius:16px; overflow:hidden;
}
.calendar-card .cc-header {
    padding:1.1rem 1.25rem; border-bottom:1px solid #f0f0f0;
    display:flex; align-items:center; justify-content:space-between;
}
.calendar-card .cc-header h5 { font-weight:800; font-size:.95rem; margin:0; }
.legend-dot { width:10px; height:10px; border-radius:50%; display:inline-block; }
.fc .fc-toolbar-title { font-size:1rem !important; font-weight:800; letter-spacing:-.3px; }
.fc .fc-button-primary { background:#007AFF !important; border-color:#007AFF !important; border-radius:8px !important; font-size:12px !important; padding:5px 10px !important;}
.fc .fc-button-primary:hover { background:#0051D5 !important; border-color:#0051D5 !important; }
.fc-event { border-radius:5px !important; padding:2px 5px !important; font-size:.7rem !important; font-weight:600 !important; }
.fc-daygrid-day-number { font-size:12px; font-weight:600; }
.fc-col-header-cell-cushion { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; color:#666; }

/* Quick Actions */
.quick-actions { display:grid; grid-template-columns:repeat(4,1fr); gap:.75rem; margin-bottom:1.75rem; }
@media(max-width:600px) { .quick-actions { grid-template-columns:repeat(2,1fr); } }
.qa-btn {
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:.5rem; padding:1rem .5rem; background:#fff; border:1.5px solid #eee;
    border-radius:14px; text-decoration:none; transition:all .25s; color:#111;
}
.qa-btn:hover { border-color:#007AFF; background:#EFF5FF; color:#007AFF; transform:translateY(-3px); box-shadow:0 6px 18px rgba(0,122,255,.1); }
.qa-btn .qa-icon { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.2rem; }
.qa-btn span { font-size:12px; font-weight:700; text-align:center; }

/* Keuangan Summary */
.finance-card {
    background: linear-gradient(135deg, #111 0%, #1a1a2e 100%);
    border-radius:16px; padding:1.5rem; color:white;
}
.fc-label { font-size:11px; font-weight:700; opacity:.6; text-transform:uppercase; letter-spacing:.5px; }
.fc-amount { font-size:1.5rem; font-weight:900; letter-spacing:-.5px; }

/* Fade-in animation */
@keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
.fade-up { animation:fadeUp .45s ease forwards; }
.d1{animation-delay:.05s;opacity:0} .d2{animation-delay:.1s;opacity:0} .d3{animation-delay:.15s;opacity:0} .d4{animation-delay:.2s;opacity:0}
</style>

<link href='https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.css' rel='stylesheet'/>

<!-- ═══ BACK BUTTON ═══ -->
<div class="mb-3 fade-up">
    <button onclick="history.back()" class="btn btn-light rounded-pill px-4 py-2 fw-semibold shadow-sm" style="font-size:14px;border:1.5px solid #eaeaea;">
        <i class="bi bi-arrow-left me-2"></i>Kembali
    </button>
</div>

<!-- ═══ HERO GREETING ═══ -->
<div class="db-hero fade-up">
    <div class="d-flex align-items-start justify-content-between flex-wrap gap-3">
        <div style="position:relative;z-index:1;">
            <div class="greeting"><?php echo $greeting; ?>, 👋</div>
            <h1><?php echo htmlspecialchars($firstName); ?>!</h1>
            <p>Siap bermain hari ini? Booking lapangan favoritmu sekarang.</p>
            <div class="hero-actions">
                <a href="<?php echo APP_URL; ?>/customer/booking/create.php" class="btn-hero-solid">
                    <i class="bi bi-calendar-plus"></i> Booking Sekarang
                </a>
                <a href="<?php echo APP_URL; ?>/customer/profile.php" class="btn-hero-w">
                    <i class="bi bi-person-circle"></i> Profil Saya
                </a>
                <a href="<?php echo APP_URL; ?>/about.php" class="btn-hero-w">
                    <i class="bi bi-info-circle"></i> Info Lapangan
                </a>
            </div>
        </div>
        <div style="position:relative;z-index:1;text-align:right;">
            <div style="font-size:11px;opacity:.6;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Hari ini</div>
            <div style="font-size:1.1rem;font-weight:800;"><?php echo date('d F Y'); ?></div>
            <div style="font-size:2rem;opacity:.15;margin-top:4px;">🏟️</div>
        </div>
    </div>
</div>

<!-- ═══ STAT CARDS ═══ -->
<div class="stat-grid fade-up d1">
    <div class="scard" style="--sc-color:#007AFF;--sc-bg:#EFF5FF;">
        <div class="scard-icon"><i class="bi bi-calendar-check" style="color:#007AFF;"></i></div>
        <div class="scard-num"><?php echo $totalBookings; ?></div>
        <div class="scard-lbl">Total Booking</div>
    </div>
    <div class="scard" style="--sc-color:#FF9500;--sc-bg:#FFF6EC;">
        <div class="scard-icon"><i class="bi bi-clock-history" style="color:#FF9500;"></i></div>
        <div class="scard-num"><?php echo $pendingBookings; ?></div>
        <div class="scard-lbl">Menunggu</div>
    </div>
    <div class="scard" style="--sc-color:#34C759;--sc-bg:#EDFAF2;">
        <div class="scard-icon"><i class="bi bi-patch-check-fill" style="color:#34C759;"></i></div>
        <div class="scard-num"><?php echo $confirmedBookings; ?></div>
        <div class="scard-lbl">Dikonfirmasi</div>
    </div>
    <div class="scard" style="--sc-color:#FF3B30;--sc-bg:#FFF0EF;">
        <div class="scard-icon"><i class="bi bi-x-circle-fill" style="color:#FF3B30;"></i></div>
        <div class="scard-num"><?php echo $cancelledBookings; ?></div>
        <div class="scard-lbl">Dibatalkan</div>
    </div>
</div>

<!-- ═══ NEXT BOOKING ═══ -->
<?php if ($nextBooking): ?>
<div class="next-booking fade-up d2">
    <div class="nb-icon"><i class="bi bi-calendar-event-fill"></i></div>
    <div>
        <div class="nb-label">Booking Berikutnya</div>
        <div class="nb-title"><?php echo htmlspecialchars($nextBooking['field_name']); ?></div>
        <div class="nb-sub">
            <?php echo date('l, d F Y', strtotime($nextBooking['booking_date'])); ?> &nbsp;·&nbsp;
            <?php echo date('H:i', strtotime($nextBooking['start_time'])); ?>–<?php echo date('H:i', strtotime($nextBooking['end_time'])); ?>
        </div>
    </div>
    <div class="nb-badge"><i class="bi bi-check-circle me-1"></i><?php
        $sl = ['pending'=>'Pending','dp_paid'=>'DP OK','payment_2_pending'=>'Pelunasan','confirmed'=>'Konfirmasi','paid'=>'Lunas'];
        echo $sl[$nextBooking['status']] ?? $nextBooking['status'];
    ?></div>
</div>
<?php endif; ?>

<!-- ═══ QUICK ACTIONS ═══ -->
<div class="quick-actions fade-up d2">
    <a href="<?php echo APP_URL; ?>/customer/booking/create.php" class="qa-btn">
        <div class="qa-icon" style="background:#EFF5FF;color:#007AFF;"><i class="bi bi-calendar-plus-fill"></i></div>
        <span>Booking Baru</span>
    </a>
    <a href="<?php echo APP_URL; ?>/customer/profile.php" class="qa-btn">
        <div class="qa-icon" style="background:#FFF6EC;color:#FF9500;"><i class="bi bi-clock-history"></i></div>
        <span>Riwayat</span>
    </a>
    <a href="<?php echo APP_URL; ?>/customer/profile.php" class="qa-btn">
        <div class="qa-icon" style="background:#EDFAF2;color:#34C759;"><i class="bi bi-person-circle"></i></div>
        <span>Profil Saya</span>
    </a>
    <a href="<?php echo APP_URL; ?>/about.php#kontak" class="qa-btn">
        <div class="qa-icon" style="background:#F0EEFF;color:#5856D6;"><i class="bi bi-telephone-fill"></i></div>
        <span>Hubungi Kami</span>
    </a>
</div>

<!-- ═══ MAIN GRID ═══ -->
<div class="row g-4 fade-up d3">

    <!-- LEFT: Activity Feed -->
    <div class="col-lg-4">
        <!-- Booking Activity -->
        <div class="db-section-head">
            <div>
                <h5><i class="bi bi-activity me-2 text-primary"></i>Aktivitas Booking</h5>
                <div class="section-divider"></div>
            </div>
            <a href="<?php echo APP_URL; ?>/customer/profile.php">Lihat Semua →</a>
        </div>
        <div class="activity-card mb-4">
            <?php if (empty($recentBookings)): ?>
                <div style="padding:2.5rem 1.25rem;text-align:center;color:#aaa;">
                    <i class="bi bi-calendar-x" style="font-size:2.5rem;opacity:.25;display:block;margin-bottom:.75rem;"></i>
                    <p style="margin:0;font-weight:600;">Belum ada booking</p>
                    <p style="font-size:12px;margin:4px 0 1rem;">Mulai booking lapangan pertama Anda!</p>
                    <a href="<?php echo APP_URL; ?>/customer/booking/create.php" class="btn-book-now" style="display:inline-block;padding:8px 20px;">
                        Booking Sekarang
                    </a>
                </div>
            <?php else: ?>
                <?php
                $iconMap = [
                    'pending'           => ['bg'=>'#FFF6EC','color'=>'#FF9500','icon'=>'bi-clock'],
                    'dp_paid'           => ['bg'=>'#EFF5FF','color'=>'#007AFF','icon'=>'bi-credit-card'],
                    'payment_2_pending' => ['bg'=>'#F0EEFF','color'=>'#5856D6','icon'=>'bi-upload'],
                    'paid'              => ['bg'=>'#EDFAF2','color'=>'#34C759','icon'=>'bi-check-circle-fill'],
                    'confirmed'         => ['bg'=>'#EDFAF2','color'=>'#34C759','icon'=>'bi-patch-check-fill'],
                    'cancelled'         => ['bg'=>'#FFF0EF','color'=>'#FF3B30','icon'=>'bi-x-circle'],
                ];
                $statusLabel = [
                    'pending'=>'Pending','dp_paid'=>'DP Dibayar','payment_2_pending'=>'Pelunasan',
                    'paid'=>'Lunas','confirmed'=>'Dikonfirmasi','cancelled'=>'Dibatalkan'
                ];
                foreach ($recentBookings as $b):
                    $im = $iconMap[$b['status']] ?? ['bg'=>'#f5f5f5','color'=>'#888','icon'=>'bi-circle'];
                    $sl = $statusLabel[$b['status']] ?? $b['status'];
                ?>
                <div class="activity-item">
                    <div class="act-avatar" style="background:<?php echo $im['bg']; ?>;color:<?php echo $im['color']; ?>;">
                        <i class="bi <?php echo $im['icon']; ?>"></i>
                    </div>
                    <div class="flex-grow-1 min-w-0">
                        <div class="act-field"><?php echo htmlspecialchars($b['field_name']); ?></div>
                        <div class="act-date"><?php echo date('d M Y', strtotime($b['booking_date'])); ?> · <?php echo date('H:i', strtotime($b['start_time'])); ?>–<?php echo date('H:i', strtotime($b['end_time'])); ?></div>
                    </div>
                    <div class="text-end">
                        <div class="status-dot dot-<?php echo $b['status']; ?>"><?php echo $sl; ?></div>
                        <div class="act-price mt-1"><?php echo formatCurrency($b['price']); ?></div>
                    </div>
                </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>

        <!-- Finance Summary -->
        <div class="finance-card">
            <div class="fc-label">Total Pengeluaran</div>
            <div class="fc-amount"><?php echo formatCurrency($totalSpent); ?></div>
            <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,.1);display:flex;justify-content:space-between;align-items:center;">
                <div style="font-size:12px;opacity:.6;">Dari <?php echo $confirmedBookings; ?> booking berhasil</div>
                <a href="<?php echo APP_URL; ?>/customer/profile.php" style="font-size:12px;color:rgba(255,255,255,.8);text-decoration:none;font-weight:600;">Lihat Riwayat →</a>
            </div>
        </div>
    </div>

    <!-- RIGHT: Calendar + Fields -->
    <div class="col-lg-8">
        <!-- Calendar -->
        <div class="db-section-head">
            <div>
                <h5><i class="bi bi-calendar3 me-2 text-primary"></i>Jadwal Lapangan</h5>
                <div class="section-divider"></div>
            </div>
        </div>
        <div class="calendar-card mb-4">
            <div class="cc-header">
                <h5>Kalender Booking</h5>
                <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                    <span style="display:flex;align-items:center;gap:5px;font-size:11px;color:#666;font-weight:600;">
                        <span class="legend-dot" style="background:#FF9500;"></span>Pending
                    </span>
                    <span style="display:flex;align-items:center;gap:5px;font-size:11px;color:#666;font-weight:600;">
                        <span class="legend-dot" style="background:#5856D6;"></span>DP
                    </span>
                    <span style="display:flex;align-items:center;gap:5px;font-size:11px;color:#666;font-weight:600;">
                        <span class="legend-dot" style="background:#34C759;"></span>Dikonfirmasi
                    </span>
                </div>
            </div>
            <div style="padding:1rem;">
                <div id="calendar"></div>
            </div>
        </div>


    </div>
</div>

<script src='https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js'></script>
<script>
document.addEventListener('DOMContentLoaded', function () {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'id',
        themeSystem: 'bootstrap5',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
        },
        height: 'auto',
        dayMaxEvents: 3,
        events: '<?php echo APP_URL; ?>/customer/api/get_bookings.php',
        eventClick: function (info) {
            const e = info.event;
            const props = e.extendedProps;
            const modal = `
                <div class="modal fade" id="evModal" tabindex="-1"><div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg" style="border-radius:20px;overflow:hidden;">
                <div class="modal-header border-0" style="background:linear-gradient(135deg,#007AFF,#0051D5);color:white;padding:1.25rem 1.5rem;">
                    <h5 class="modal-title fw-bold text-white mb-0"><i class="bi bi-calendar-event me-2"></i>${e.title}</h5>
                    <button type="button" class="btn-close" style="filter:brightness(0) invert(1);" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4">
                    <div style="display:flex;flex-direction:column;gap:.75rem;">
                        <div style="background:#f8f9fa;border-radius:12px;padding:1rem;">
                            <div style="font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">Status</div>
                            <div style="font-weight:700;color:#007AFF;">${props.status || '-'}</div>
                        </div>
                        <div style="background:#f8f9fa;border-radius:12px;padding:1rem;">
                            <div style="font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">Tanggal</div>
                            <div style="font-weight:700;">${e.startStr ? e.startStr.split('T')[0] : '-'}</div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer border-0 pb-4 px-4">
                    <button class="btn btn-light rounded-3 px-4" data-bs-dismiss="modal">Tutup</button>
                    <a href="<?php echo APP_URL; ?>/customer/profile.php" class="btn btn-primary rounded-3 px-4 fw-bold">Lihat Detail</a>
                </div>
                </div></div></div>`;
            document.querySelectorAll('#evModal').forEach(el => el.remove());
            document.body.insertAdjacentHTML('beforeend', modal);
            new bootstrap.Modal(document.getElementById('evModal')).show();
        }
    });
    calendar.render();
});

// Counter animation
document.querySelectorAll('.scard-num').forEach(el => {
    const target = parseInt(el.textContent);
    if (isNaN(target) || target === 0) return;
    let current = 0;
    const step = Math.ceil(target / 20);
    const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current;
        if (current >= target) clearInterval(timer);
    }, 40);
});
</script>

<?php include __DIR__ . '/../includes/customer/footer.php'; ?>
