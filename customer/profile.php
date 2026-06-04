<?php
require_once __DIR__ . '/../includes/middleware.php';
requireCustomer();

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/upload_functions.php';

$userId = $_SESSION['user_id'];

// Get filter for history
$statusFilter = $_GET['status'] ?? '';
$page        = max(1, intval($_GET['page'] ?? 1));
$perPage     = 8;
$offset      = ($page - 1) * $perPage;

try {
    // Get user details
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    // Booking stats
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM bookings WHERE user_id = ?");
    $stmt->execute([$userId]);
    $totalBookingsCount = $stmt->fetch()['total'];

    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM bookings WHERE user_id = ? AND status = 'pending'");
    $stmt->execute([$userId]);
    $pendingCount = $stmt->fetch()['total'];

    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM bookings WHERE user_id = ? AND status IN ('paid','confirmed')");
    $stmt->execute([$userId]);
    $confirmedCount = $stmt->fetch()['total'];

    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM bookings WHERE user_id = ? AND status = 'cancelled'");
    $stmt->execute([$userId]);
    $cancelledCount = $stmt->fetch()['total'];

    // Build filtered count
    $countSql = "SELECT COUNT(*) as total FROM bookings b JOIN fields f ON b.field_id = f.id WHERE b.user_id = ?";
    $countParams = [$userId];
    if ($statusFilter) {
        $countSql .= " AND b.status = ?";
        $countParams[] = $statusFilter;
    }
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($countParams);
    $filteredTotal = $stmt->fetch()['total'];
    $totalPages = ceil($filteredTotal / $perPage);

    // Build history query
    $sql = "
        SELECT b.*, f.name as field_name 
        FROM bookings b
        JOIN fields f ON b.field_id = f.id
        WHERE b.user_id = ?
    ";
    $params = [$userId];
    if ($statusFilter) {
        $sql .= " AND b.status = ?";
        $params[] = $statusFilter;
    }
    $sql .= " ORDER BY b.booking_date DESC, b.start_time DESC LIMIT ? OFFSET ?";
    $params[] = $perPage;
    $params[] = $offset;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $bookingHistory = $stmt->fetchAll();

} catch (PDOException $e) {
    setFlashMessage('danger', 'Gagal memuat profil.');
    $bookingHistory = [];
    $totalBookingsCount = $pendingCount = $confirmedCount = $cancelledCount = 0;
    $totalPages = 1;
}

$pageTitle = "Profil Saya";
include __DIR__ . '/../includes/customer/header.php';
?>

<style>
/* ============================================
   Profile Page - Premium Design
   ============================================ */

/* Profile Hero Card */
.profile-hero {
    background: linear-gradient(135deg, #007AFF 0%, #0051D5 60%, #3B0DBA 100%);
    border-radius: 20px;
    padding: 2.5rem 2rem 4rem;
    position: relative;
    overflow: hidden;
    color: white;
}
.profile-hero::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 220px; height: 220px;
    background: rgba(255,255,255,0.07);
    border-radius: 50%;
}
.profile-hero::after {
    content: '';
    position: absolute;
    bottom: -40px; left: -40px;
    width: 160px; height: 160px;
    background: rgba(255,255,255,0.05);
    border-radius: 50%;
}

.avatar-ring {
    width: 90px; height: 90px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    border: 3px solid rgba(255,255,255,0.4);
    display: flex; align-items: center; justify-content: center;
    font-size: 2.5rem;
    color: white;
    position: relative;
    z-index: 1;
    backdrop-filter: blur(10px);
}

.profile-name {
    font-size: 1.6rem;
    font-weight: 700;
    margin: 0;
    letter-spacing: -0.3px;
}
.profile-email {
    font-size: 0.875rem;
    opacity: 0.8;
    margin: 0;
}
.member-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 20px;
    padding: 4px 14px;
    font-size: 0.75rem;
    backdrop-filter: blur(4px);
}

/* Stat Cards Float */
.stats-float {
    margin-top: -2rem;
    position: relative;
    z-index: 10;
}
.stat-pill {
    background: #fff;
    border-radius: 16px;
    padding: 1rem 1.25rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    text-align: center;
    border: 1px solid #f0f0f0;
    transition: all 0.2s ease;
}
.stat-pill:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(0,0,0,0.12);
}
.stat-pill .num {
    font-size: 1.75rem;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -1px;
}
.stat-pill .lbl {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
    margin-top: 4px;
    color: #888;
}
.stat-pill.blue  .num { color: #007AFF; }
.stat-pill.orange .num { color: #FF9500; }
.stat-pill.green  .num { color: #34C759; }
.stat-pill.red    .num { color: #FF3B30; }

/* Info Card */
.info-card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid #eaeaea;
    overflow: hidden;
}
.info-card .card-header-custom {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.info-card .card-header-custom h6 {
    margin: 0;
    font-weight: 700;
    font-size: 0.95rem;
    letter-spacing: -0.2px;
}
.info-row {
    display: flex;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #f9f9f9;
    gap: 1rem;
    transition: background 0.15s;
}
.info-row:last-child { border-bottom: none; }
.info-row:hover { background: #fafafa; }
.info-icon {
    width: 38px; height: 38px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1rem;
    flex-shrink: 0;
}
.info-icon.blue   { background: #EFF5FF; color: #007AFF; }
.info-icon.green  { background: #EDFAF2; color: #34C759; }
.info-icon.orange { background: #FFF6EC; color: #FF9500; }
.info-label {
    font-size: 0.7rem;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
    display: block;
}
.info-value {
    font-weight: 600;
    color: #111;
    font-size: 0.9rem;
    display: block;
    word-break: break-all;
}

/* History Card */
.history-card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid #eaeaea;
    overflow: hidden;
}
.history-card .card-header-custom {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #f0f0f0;
}

/* Filter Bar */
.filter-bar {
    background: #f9f9f9;
    border-radius: 12px;
    padding: 0.75rem 1rem;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    align-items: center;
}
.filter-chip {
    padding: 5px 14px;
    border-radius: 20px;
    border: 1.5px solid #e4e4e4;
    background: #fff;
    font-size: 0.78rem;
    font-weight: 600;
    color: #555;
    text-decoration: none;
    transition: all 0.15s;
    cursor: pointer;
}
.filter-chip:hover {
    border-color: #007AFF;
    color: #007AFF;
    background: #EFF5FF;
}
.filter-chip.active {
    background: #007AFF;
    border-color: #007AFF;
    color: white;
}

/* Booking Table */
.booking-table { border-collapse: collapse; width: 100%; }
.booking-table th {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 700;
    color: #999;
    padding: 12px 16px;
    background: #fafafa;
    border-bottom: 1px solid #eee;
}
.booking-table td {
    padding: 14px 16px;
    border-bottom: 1px solid #f5f5f5;
    font-size: 0.875rem;
    vertical-align: middle;
}
.booking-table tr:last-child td { border-bottom: none; }
.booking-table tbody tr { transition: background 0.1s; }
.booking-table tbody tr:hover { background: #fafafa; }

/* Status Badges */
.status-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.3px;
    text-transform: uppercase;
}
.status-pending    { background: #FFF6EC; color: #FF9500; }
.status-dp_paid    { background: #EFF5FF; color: #007AFF; }
.status-payment_2_pending { background: #F0EEFF; color: #5856D6; }
.status-paid,
.status-confirmed  { background: #EDFAF2; color: #1A9E48; }
.status-cancelled  { background: #FFF0EF; color: #FF3B30; }

/* Action Buttons */
.btn-action {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 8px;
    border: 1.5px solid #e4e4e4;
    background: #fff;
    font-size: 11px;
    font-weight: 600;
    color: #444;
    text-decoration: none;
    transition: all 0.15s;
    cursor: pointer;
}
.btn-action:hover { border-color: #007AFF; color: #007AFF; background: #EFF5FF; }
.btn-action.primary { background: #007AFF; border-color: #007AFF; color: #fff; }
.btn-action.primary:hover { background: #0051D5; border-color: #0051D5; color: #fff; }

/* Edit Profile Modal */
.modal-profile { border-radius: 20px !important; border: none; overflow: hidden; }
.modal-profile .modal-header {
    background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
    color: white;
    border-bottom: none;
    padding: 1.5rem;
}
.modal-profile .modal-header .btn-close { filter: brightness(0) invert(1); }
.field-group {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
    border: 1.5px solid transparent;
    transition: all 0.2s;
}
.field-group:focus-within {
    background: #fff;
    border-color: #007AFF;
    box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.08);
}
.field-group label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 700;
    color: #888;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
}
.field-group input {
    border: none;
    background: transparent;
    padding: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: #111;
    width: 100%;
    outline: none;
}
.field-group input::placeholder { color: #bbb; font-weight: 400; }

/* Empty State */
.empty-state {
    padding: 4rem 2rem;
    text-align: center;
    color: #aaa;
}
.empty-state-icon {
    font-size: 3.5rem;
    display: block;
    margin-bottom: 1rem;
    opacity: 0.25;
}

/* Pagination */
.pagination-custom {
    display: flex;
    gap: 6px;
    justify-content: center;
    padding: 1.25rem;
    border-top: 1px solid #f0f0f0;
}
.page-btn {
    width: 34px; height: 34px;
    border-radius: 8px;
    border: 1.5px solid #e4e4e4;
    background: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px;
    font-weight: 600;
    color: #444;
    text-decoration: none;
    transition: all 0.15s;
}
.page-btn:hover { border-color: #007AFF; color: #007AFF; }
.page-btn.active { background: #007AFF; border-color: #007AFF; color: #fff; }
.page-btn.disabled { opacity: 0.4; pointer-events: none; }

/* Password Section in Modal */
.divider-text {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 1.25rem 0 1rem;
    color: #ccc;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.divider-text::before, .divider-text::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #eee;
}

/* Responsive */
@media (max-width: 768px) {
    .profile-hero { padding: 1.5rem 1.25rem 3.5rem; }
    .profile-name { font-size: 1.3rem; }
    .stat-pill .num { font-size: 1.4rem; }
    .booking-table th:nth-child(4),
    .booking-table td:nth-child(4) { display: none; }
}

/* Smooth appear animation */
@keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
}
.animate-up { animation: fadeUp 0.4s ease forwards; }
.delay-1 { animation-delay: 0.05s; opacity: 0; }
.delay-2 { animation-delay: 0.10s; opacity: 0; }
.delay-3 { animation-delay: 0.15s; opacity: 0; }

/* Modal Z-index Fix */
.modal-backdrop {
    z-index: 1040 !important;
}
.modal {
    z-index: 1050 !important;
}
.modal-dialog {
    z-index: 1060 !important;
}
</style>

<!-- =============== BACK BUTTON =============== -->
<div class="mb-3 animate-up">
    <button onclick="history.back()" class="btn btn-light rounded-pill px-4 py-2 fw-semibold shadow-sm" style="font-size:14px;border:1.5px solid #eaeaea;">
        <i class="bi bi-arrow-left me-2"></i>Kembali
    </button>
</div>

<!-- =============== FLASH MESSAGE =============== -->
<?php
$flash = getFlashMessage();
if ($flash):
    $alertClass = match($flash['type']) {
        'success' => 'alert-success',
        'danger'  => 'alert-danger',
        'warning' => 'alert-warning',
        default   => 'alert-info'
    };
    $alertIcon = match($flash['type']) {
        'success' => 'bi-check-circle-fill',
        'danger'  => 'bi-exclamation-circle-fill',
        'warning' => 'bi-exclamation-triangle-fill',
        default   => 'bi-info-circle-fill'
    };
?>
<div class="alert <?php echo $alertClass; ?> alert-dismissible fade show d-flex align-items-center gap-2 rounded-3 animate-up mb-3" role="alert">
    <i class="bi <?php echo $alertIcon; ?>"></i>
    <div><?php echo htmlspecialchars($flash['message']); ?></div>
    <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
</div>
<?php endif; ?>

<!-- =============== PROFILE HERO =============== -->
<div class="profile-hero animate-up">
    <div class="d-flex align-items-center gap-3 mb-3 position-relative" style="z-index:1">
        <div class="avatar-ring">
            <?php echo strtoupper(mb_substr($user['name'], 0, 1)); ?>
        </div>
        <div>
            <h1 class="profile-name"><?php echo htmlspecialchars($user['name']); ?></h1>
            <p class="profile-email"><?php echo htmlspecialchars($user['email']); ?></p>
        </div>
    </div>
    <div class="position-relative" style="z-index:1">
        <span class="member-badge">
            <i class="bi bi-patch-check-fill" style="font-size:12px;"></i>
            Member sejak <?php echo date('d F Y', strtotime($user['created_at'])); ?>
        </span>
    </div>
</div>

<!-- =============== STATS FLOAT =============== -->
<div class="stats-float animate-up delay-1">
    <div class="row g-3">
        <div class="col-6 col-md-3">
            <div class="stat-pill blue">
                <div class="num"><?php echo $totalBookingsCount; ?></div>
                <div class="lbl">Total Booking</div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="stat-pill orange">
                <div class="num"><?php echo $pendingCount; ?></div>
                <div class="lbl">Pending</div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="stat-pill green">
                <div class="num"><?php echo $confirmedCount; ?></div>
                <div class="lbl">Dikonfirmasi</div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="stat-pill red">
                <div class="num"><?php echo $cancelledCount; ?></div>
                <div class="lbl">Dibatalkan</div>
            </div>
        </div>
    </div>
</div>

<!-- =============== MAIN CONTENT =============== -->
<div class="row g-4 mt-1">

    <!-- LEFT: Info + Edit -->
    <div class="col-lg-4 animate-up delay-2">
        <div class="info-card mb-4">
            <div class="card-header-custom">
                <h6><i class="bi bi-person-vcard me-2 text-primary"></i>Informasi Akun</h6>
                <button class="btn-action" data-bs-toggle="modal" data-bs-target="#editProfileModal">
                    <i class="bi bi-pencil"></i> Edit
                </button>
            </div>
            <div class="info-row">
                <div class="info-icon blue"><i class="bi bi-person"></i></div>
                <div>
                    <span class="info-label">Nama Lengkap</span>
                    <span class="info-value"><?php echo htmlspecialchars($user['name']); ?></span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-icon green"><i class="bi bi-envelope"></i></div>
                <div>
                    <span class="info-label">Email</span>
                    <span class="info-value"><?php echo htmlspecialchars($user['email']); ?></span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-icon orange"><i class="bi bi-telephone"></i></div>
                <div>
                    <span class="info-label">No. Telepon</span>
                    <span class="info-value"><?php echo $user['phone'] ? htmlspecialchars($user['phone']) : '<span style="color:#bbb;font-weight:400;">Belum diisi</span>'; ?></span>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="info-card">
            <div class="card-header-custom">
                <h6><i class="bi bi-lightning-charge me-2 text-warning"></i>Aksi Cepat</h6>
            </div>
            <div style="padding: 1rem 1.5rem; display: flex; flex-direction: column; gap: 10px;">
                <a href="<?php echo APP_URL; ?>/customer/booking/create.php" class="btn btn-primary rounded-3 w-100 fw-bold" style="font-size:14px;">
                    <i class="bi bi-calendar-plus me-2"></i>Booking Lapangan
                </a>
                <a href="<?php echo APP_URL; ?>/customer/index.php" class="btn btn-light rounded-3 w-100 fw-bold" style="font-size:14px; border: 1.5px solid #eaeaea;">
                    <i class="bi bi-speedometer2 me-2"></i>Dashboard
                </a>
                <button class="btn btn-light rounded-3 w-100 fw-bold" style="font-size:14px; border: 1.5px solid #eaeaea;" data-bs-toggle="modal" data-bs-target="#editProfileModal">
                    <i class="bi bi-lock me-2"></i>Ubah Password
                </button>
            </div>
        </div>
    </div>

    <!-- RIGHT: Booking History -->
    <div class="col-lg-8 animate-up delay-3">
        <div class="history-card">
            <div class="card-header-custom">
                <h6 class="fw-bold mb-3"><i class="bi bi-clock-history me-2 text-primary"></i>Riwayat Booking Saya</h6>
                <!-- Filter Chips -->
                <div class="filter-bar">
                    <span style="font-size:11px; font-weight:700; color:#999; text-transform:uppercase; letter-spacing:.5px; flex-shrink:0;">Filter:</span>
                    <a href="?status=" class="filter-chip <?php echo !$statusFilter ? 'active' : ''; ?>">Semua</a>
                    <a href="?status=pending" class="filter-chip <?php echo $statusFilter == 'pending' ? 'active' : ''; ?>">Pending</a>
                    <a href="?status=dp_paid" class="filter-chip <?php echo $statusFilter == 'dp_paid' ? 'active' : ''; ?>">DP Dibayar</a>
                    <a href="?status=payment_2_pending" class="filter-chip <?php echo $statusFilter == 'payment_2_pending' ? 'active' : ''; ?>">Pelunasan</a>
                    <a href="?status=confirmed" class="filter-chip <?php echo $statusFilter == 'confirmed' ? 'active' : ''; ?>">Dikonfirmasi</a>
                    <a href="?status=cancelled" class="filter-chip <?php echo $statusFilter == 'cancelled' ? 'active' : ''; ?>">Dibatalkan</a>
                </div>
            </div>

            <?php if (empty($bookingHistory)): ?>
                <div class="empty-state">
                    <i class="bi bi-calendar-x empty-state-icon"></i>
                    <p class="fw-semibold mb-1" style="color:#666;">Belum ada riwayat booking</p>
                    <p class="small mb-4" style="color:#aaa;">
                        <?php echo $statusFilter ? 'Tidak ada booking dengan status tersebut.' : 'Mulai booking lapangan favoritmu sekarang!'; ?>
                    </p>
                    <?php if (!$statusFilter): ?>
                        <a href="<?php echo APP_URL; ?>/customer/booking/create.php" class="btn btn-primary rounded-pill px-4">
                            <i class="bi bi-calendar-plus me-2"></i>Booking Sekarang
                        </a>
                    <?php endif; ?>
                </div>
            <?php else: ?>
                <div class="table-responsive">
                    <table class="booking-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Lapangan</th>
                                <th>Jadwal</th>
                                <th>Pembayaran</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php
                            $statusLabels = [
                                'pending'           => ['label' => 'Menunggu', 'dot' => '⏳'],
                                'dp_paid'           => ['label' => 'DP Dibayar', 'dot' => '💳'],
                                'payment_2_pending' => ['label' => 'Pelunasan', 'dot' => '📤'],
                                'paid'              => ['label' => 'Lunas', 'dot' => '✅'],
                                'confirmed'         => ['label' => 'Dikonfirmasi', 'dot' => '✅'],
                                'cancelled'         => ['label' => 'Dibatalkan', 'dot' => '❌'],
                            ];
                            foreach ($bookingHistory as $booking):
                                $sInfo  = $statusLabels[$booking['status']] ?? ['label' => $booking['status'], 'dot' => '•'];
                                $sCls   = 'status-' . $booking['status'];
                            ?>
                            <tr>
                                <td>
                                    <span style="font-weight:700; color:#bbb; font-size:12px;">#<?php echo $booking['id']; ?></span>
                                </td>
                                <td>
                                    <span class="fw-bold d-block" style="color:#111;"><?php echo htmlspecialchars($booking['field_name']); ?></span>
                                </td>
                                <td>
                                    <div style="font-weight:700; font-size:13px;"><?php echo date('d M Y', strtotime($booking['booking_date'])); ?></div>
                                    <div style="font-size:12px; color:#888;"><?php echo date('H:i', strtotime($booking['start_time'])); ?> – <?php echo date('H:i', strtotime($booking['end_time'])); ?></div>
                                </td>
                                <td>
                                    <div style="font-weight:700; font-size:13px;"><?php echo formatCurrency($booking['price']); ?></div>
                                    <div style="font-size:12px; color:#007AFF;">DP: <?php echo formatCurrency($booking['dp_amount']); ?></div>
                                </td>
                                <td>
                                    <span class="status-badge <?php echo $sCls; ?>">
                                        <?php echo $sInfo['label']; ?>
                                    </span>
                                </td>
                                <td>
                                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                                        <?php if (!empty($booking['payment_proof'])): ?>
                                            <button type="button" class="btn-action" data-bs-toggle="modal" data-bs-target="#dpImageModal<?php echo $booking['id']; ?>" title="Lihat Bukti DP">
                                                <i class="bi bi-eye"></i> DP
                                            </button>
                                        <?php endif; ?>

                                        <?php if (!empty($booking['payment_proof_2'])): ?>
                                            <button type="button" class="btn-action" data-bs-toggle="modal" data-bs-target="#payment2ImageModal<?php echo $booking['id']; ?>" title="Lihat Bukti Pelunasan">
                                                <i class="bi bi-eye"></i> Pelunasan
                                            </button>
                                        <?php endif; ?>

                                        <?php if ($booking['status'] === 'dp_paid' && empty($booking['payment_proof_2'])): ?>
                                            <button type="button" class="btn-action primary" data-bs-toggle="modal" data-bs-target="#uploadModal<?php echo $booking['id']; ?>">
                                                <i class="bi bi-upload"></i> Lunasi
                                            </button>
                                        <?php endif; ?>

                                        <?php if (in_array($booking['status'], ['paid', 'confirmed'])): ?>
                                            <a href="<?php echo APP_URL; ?>/customer/booking/invoice.php?id=<?php echo $booking['id']; ?>" target="_blank" class="btn-action" title="Cetak Nota">
                                                <i class="bi bi-printer"></i> Nota
                                            </a>
                                        <?php endif; ?>
                                    </div>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <?php if ($totalPages > 1): ?>
                <div class="pagination-custom">
                    <a href="?status=<?php echo $statusFilter; ?>&page=<?php echo $page - 1; ?>" class="page-btn <?php echo $page <= 1 ? 'disabled' : ''; ?>">
                        <i class="bi bi-chevron-left" style="font-size:12px;"></i>
                    </a>
                    <?php for ($p = 1; $p <= $totalPages; $p++): ?>
                        <a href="?status=<?php echo $statusFilter; ?>&page=<?php echo $p; ?>" class="page-btn <?php echo $p == $page ? 'active' : ''; ?>"><?php echo $p; ?></a>
                    <?php endfor; ?>
                    <a href="?status=<?php echo $statusFilter; ?>&page=<?php echo $page + 1; ?>" class="page-btn <?php echo $page >= $totalPages ? 'disabled' : ''; ?>">
                        <i class="bi bi-chevron-right" style="font-size:12px;"></i>
                    </a>
                </div>
                <?php endif; ?>
            <?php endif; ?>
        </div>
    </div>
</div>

<!-- =============== BOOKING MODALS =============== -->
<?php foreach ($bookingHistory as $booking): ?>
    <!-- Modal Lihat Bukti DP -->
    <?php if (!empty($booking['payment_proof'])): ?>
    <div class="modal fade" id="dpImageModal<?php echo $booking['id']; ?>" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 20px; overflow:hidden;">
                <div class="modal-header border-0" style="background: linear-gradient(135deg,#007AFF,#0051D5); color:white; padding:1.25rem 1.5rem;">
                    <h5 class="fw-bold mb-0 text-white"><i class="bi bi-image me-2"></i>Bukti Pembayaran DP</h5>
                    <button type="button" class="btn-close" style="filter:brightness(0) invert(1);" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4 text-center">
                    <img src="<?php echo getPaymentProofUrl($booking['payment_proof']); ?>"
                         alt="Bukti Pembayaran DP"
                         class="img-fluid rounded-3"
                         style="max-height: 70vh; width: auto;">
                </div>
                <div class="modal-footer border-0 px-4 pb-4">
                    <a href="<?php echo getPaymentProofUrl($booking['payment_proof']); ?>"
                       download
                       class="btn btn-light rounded-3 px-4">
                        <i class="bi bi-download me-2"></i>Download
                    </a>
                    <button type="button" class="btn btn-primary rounded-3 px-4" data-bs-dismiss="modal">Tutup</button>
                </div>
            </div>
        </div>
    </div>
    <?php endif; ?>

    <!-- Modal Lihat Bukti Pelunasan -->
    <?php if (!empty($booking['payment_proof_2'])): ?>
    <div class="modal fade" id="payment2ImageModal<?php echo $booking['id']; ?>" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 20px; overflow:hidden;">
                <div class="modal-header border-0" style="background: linear-gradient(135deg,#34C759,#1A9E48); color:white; padding:1.25rem 1.5rem;">
                    <h5 class="fw-bold mb-0 text-white"><i class="bi bi-image me-2"></i>Bukti Pelunasan</h5>
                    <button type="button" class="btn-close" style="filter:brightness(0) invert(1);" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4 text-center">
                    <img src="<?php echo getPaymentProofUrl($booking['payment_proof_2']); ?>"
                         alt="Bukti Pelunasan"
                         class="img-fluid rounded-3"
                         style="max-height: 70vh; width: auto;">
                </div>
                <div class="modal-footer border-0 px-4 pb-4">
                    <a href="<?php echo getPaymentProofUrl($booking['payment_proof_2']); ?>"
                       download
                       class="btn btn-light rounded-3 px-4">
                        <i class="bi bi-download me-2"></i>Download
                    </a>
                    <button type="button" class="btn btn-primary rounded-3 px-4" data-bs-dismiss="modal">Tutup</button>
                </div>
            </div>
        </div>
    </div>
    <?php endif; ?>

    <!-- Modal Upload Pelunasan -->
    <?php if ($booking['status'] === 'dp_paid' && empty($booking['payment_proof_2'])): ?>
    <div class="modal fade" id="uploadModal<?php echo $booking['id']; ?>" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 20px; overflow:hidden;">
                <form action="<?php echo APP_URL; ?>/customer/booking/upload_payment_2.php" method="POST" enctype="multipart/form-data">
                    <div class="modal-header border-0" style="background: linear-gradient(135deg,#007AFF,#0051D5); color:white; padding:1.25rem 1.5rem;">
                        <h5 class="fw-bold mb-0 text-white"><i class="bi bi-upload me-2"></i>Upload Bukti Pelunasan</h5>
                        <button type="button" class="btn-close" style="filter:brightness(0) invert(1);" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <input type="hidden" name="booking_id" value="<?php echo $booking['id']; ?>">
                        <div class="p-3 rounded-3 mb-3" style="background:#f8f9fa; border: 1px solid #eee;">
                            <div class="d-flex justify-content-between mb-1">
                                <span class="small text-muted">Lapangan:</span>
                                <span class="fw-bold small"><?php echo htmlspecialchars($booking['field_name']); ?></span>
                            </div>
                            <div class="d-flex justify-content-between mb-1">
                                <span class="small text-muted">Total Harga:</span>
                                <span class="fw-bold small"><?php echo formatCurrency($booking['price']); ?></span>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span class="small text-muted">Sisa yang harus dibayar:</span>
                                <span class="fw-bold text-primary"><?php echo formatCurrency($booking['price'] - $booking['dp_amount']); ?></span>
                            </div>
                        </div>
                        <div class="p-3 rounded-3 mb-4" style="background:#EFF5FF; border: 1px solid #cfe0ff;">
                            <small class="d-block mb-1 fw-bold text-primary"><i class="bi bi-bank me-1"></i>Transfer ke:</small>
                            <div class="fw-bold"><?php echo BANK_NAME; ?></div>
                            <div class="fw-bold text-primary" style="font-size:1.1rem;"><?php echo BANK_NUMBER; ?></div>
                            <div class="small">a.n. <?php echo BANK_HOLDER; ?></div>
                        </div>
                        <div class="field-group" style="margin-bottom:0;">
                            <label><i class="bi bi-image" style="color:#007AFF;"></i> Foto Bukti Transfer</label>
                            <input type="file" name="payment_proof_2" accept="image/*" required style="font-size:0.9rem; padding-top:4px;">
                        </div>
                    </div>
                    <div class="modal-footer border-0 px-4 pb-4">
                        <button type="button" class="btn btn-light rounded-3 px-4" data-bs-dismiss="modal">Batal</button>
                        <button type="submit" class="btn btn-primary rounded-3 px-4 fw-bold">
                            <i class="bi bi-upload me-2"></i>Upload & Kirim
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <?php endif; ?>
<?php endforeach; ?>

<!-- =============== EDIT PROFILE MODAL =============== -->
<div class="modal fade" id="editProfileModal" tabindex="-1" aria-labelledby="editProfileModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content modal-profile">
            <form action="<?php echo APP_URL; ?>/customer/process_update_profile.php" method="POST">
                <div class="modal-header">
                    <div>
                        <h5 class="fw-bold mb-0 text-white" id="editProfileModalLabel">
                            <i class="bi bi-person-gear me-2"></i>Edit Profil Saya
                        </h5>
                        <p class="mb-0 text-white" style="font-size:13px; opacity:0.75;">Perbarui informasi akun Anda</p>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-4">
                    <div class="field-group">
                        <label><i class="bi bi-person" style="color:#007AFF;"></i> Nama Lengkap</label>
                        <input type="text" name="name" id="profileName" autocomplete="name"
                               value="<?php echo htmlspecialchars($user['name']); ?>" 
                               placeholder="Masukkan nama lengkap" required>
                    </div>
                    <div class="field-group">
                        <label><i class="bi bi-envelope" style="color:#34C759;"></i> Alamat Email</label>
                        <input type="email" name="email" id="profileEmail" autocomplete="email"
                               value="<?php echo htmlspecialchars($user['email']); ?>" 
                               placeholder="Masukkan email" required>
                    </div>
                    <div class="field-group">
                        <label><i class="bi bi-telephone" style="color:#FF9500;"></i> Nomor Telepon</label>
                        <input type="tel" name="phone" id="profilePhone" autocomplete="tel"
                               value="<?php echo htmlspecialchars($user['phone'] ?? ''); ?>" 
                               placeholder="Contoh: 08123456789" required>
                    </div>

                    <div class="divider-text">Ubah Password (Opsional)</div>
                    
                    <div class="field-group">
                        <label><i class="bi bi-lock" style="color:#5856D6;"></i> Password Baru</label>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <input type="password" name="new_password" id="newPassInput" placeholder="Kosongkan jika tidak ingin ubah">
                            <button type="button" onclick="togglePass('newPassInput', this)" style="background:none;border:none;padding:0;color:#999;cursor:pointer;flex-shrink:0;">
                                <i class="bi bi-eye" style="font-size:16px;"></i>
                            </button>
                        </div>
                    </div>
                    <div class="field-group" style="margin-bottom:0;">
                        <label><i class="bi bi-lock-fill" style="color:#5856D6;"></i> Konfirmasi Password Baru</label>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <input type="password" name="confirm_password" id="confirmPassInput" placeholder="Ulangi password baru">
                            <button type="button" onclick="togglePass('confirmPassInput', this)" style="background:none;border:none;padding:0;color:#999;cursor:pointer;flex-shrink:0;">
                                <i class="bi bi-eye" style="font-size:16px;"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer border-0 px-4 pb-4 gap-2">
                    <button type="button" class="btn btn-light rounded-3 px-4" data-bs-dismiss="modal">Batal</button>
                    <button type="submit" class="btn btn-primary rounded-3 px-4 fw-bold">
                        <i class="bi bi-check-circle me-2"></i>Simpan Perubahan
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
function togglePass(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon  = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'bi bi-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'bi bi-eye';
    }
}
</script>

<?php include __DIR__ . '/../includes/customer/footer.php'; ?>
