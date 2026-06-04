<?php
require_once __DIR__ . '/../includes/middleware.php';
requireAdmin();

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/upload_functions.php';

// Get statistics
try {
    // Total fields
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM fields");
    $totalFields = $stmt->fetch()['total'];
    
    // Total bookings
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM bookings");
    $totalBookings = $stmt->fetch()['total'];

    // Pending bookings
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM bookings WHERE status = 'pending'");
    $pendingBookings = $stmt->fetch()['total'];

    // Paid (DP Paid) bookings
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM bookings WHERE status = 'dp_paid'");
    $paidBookings = $stmt->fetch()['total'];

    // Completed (Confirmed) bookings
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM bookings WHERE status = 'confirmed'");
    $completedBookings = $stmt->fetch()['total'];
    
    // Total DP amount
    $stmt = $pdo->query("SELECT COALESCE(SUM(dp_amount), 0) as total FROM bookings WHERE status IN ('dp_paid', 'confirmed', 'paid')");
    $totalDP = $stmt->fetch()['total'];

    // Daily Income (Today)
    $stmt = $pdo->query("SELECT COALESCE(SUM(price), 0) as total FROM bookings WHERE booking_date = CURDATE() AND status IN ('confirmed', 'paid')");
    $dailyIncome = $stmt->fetch()['total'];

    // Monthly Income (This Month)
    $stmt = $pdo->query("SELECT COALESCE(SUM(price), 0) as total FROM bookings WHERE MONTH(booking_date) = MONTH(CURDATE()) AND YEAR(booking_date) = YEAR(CURDATE()) AND status IN ('confirmed', 'paid')");
    $monthlyIncome = $stmt->fetch()['total'];

    // Daily Income Trends (Last 7 Days)
    $stmt = $pdo->query("
        SELECT booking_date, COALESCE(SUM(price), 0) as total 
        FROM bookings 
        WHERE status IN ('confirmed', 'paid') 
        GROUP BY booking_date 
        ORDER BY booking_date DESC 
        LIMIT 7
    ");
    $dailyTrends = $stmt->fetchAll();

    // Monthly Income Trends (Last 6 Months)
    $stmt = $pdo->query("
        SELECT DATE_FORMAT(booking_date, '%Y-%m') as month, COALESCE(SUM(price), 0) as total 
        FROM bookings 
        WHERE status IN ('confirmed', 'paid') 
        GROUP BY month 
        ORDER BY month DESC 
        LIMIT 6
    ");
    $monthlyTrends = $stmt->fetchAll();
    
    // Recent bookings
    $stmt = $pdo->prepare("
        SELECT b.*, u.name as customer_name, f.name as field_name 
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN fields f ON b.field_id = f.id
        ORDER BY b.created_at DESC
        LIMIT 10
    ");
    $stmt->execute();
    $recentBookings = $stmt->fetchAll();
    
} catch (PDOException $e) {
    $totalFields = 0;
    $totalBookings = 0;
    $pendingBookings = 0;
    $paidBookings = 0;
    $completedBookings = 0;
    $totalDP = 0;
    $dailyIncome = 0;
    $monthlyIncome = 0;
    $dailyTrends = [];
    $monthlyTrends = [];
    $recentBookings = [];
}

$pageTitle = "Dashboard";
include __DIR__ . '/../includes/admin/header.php';
?>

<div class="row mb-4 g-3">
    <div class="col-md-2">
        <div class="card stat-card h-100 shadow-sm border-0 rounded-4">
            <div class="card-body p-3">
                <h6 class="text-muted small mb-2 text-uppercase fw-bold" style="font-size: 10px;">Lapangan</h6>
                <div class="d-flex justify-content-between align-items-center">
                    <div class="stat-number fs-3 fw-bold text-dark"><?php echo $totalFields; ?></div>
                    <div class="text-primary opacity-50"><i class="bi bi-grid fs-4"></i></div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="col-md-2">
        <div class="card stat-card h-100 shadow-sm border-0 rounded-4 bg-primary text-white">
            <div class="card-body p-3">
                <h6 class="text-white small mb-2 text-uppercase fw-bold opacity-75" style="font-size: 10px;">Total Booking</h6>
                <div class="d-flex justify-content-between align-items-center">
                    <div class="stat-number fs-3 fw-bold"><?php echo $totalBookings; ?></div>
                    <div class="opacity-50"><i class="bi bi-calendar-check fs-4"></i></div>
                </div>
            </div>
        </div>
    </div>

    <div class="col-md-2">
        <div class="card stat-card h-100 shadow-sm border-0 rounded-4 bg-warning text-white">
            <div class="card-body p-3 text-center">
                <h6 class="text-white small mb-2 text-uppercase fw-bold opacity-75" style="font-size: 10px;">Pending Verifikasi</h6>
                <h2 class="fw-bold mb-0"><?php echo $pendingBookings; ?></h2>
            </div>
        </div>
    </div>

    <div class="col-md-2">
        <div class="card stat-card h-100 shadow-sm border-0 rounded-4 bg-info text-white">
            <div class="card-body p-3 text-center">
                <h6 class="text-white small mb-2 text-uppercase fw-bold opacity-75" style="font-size: 10px;">DP Dibayar</h6>
                <h2 class="fw-bold mb-0"><?php echo $paidBookings; ?></h2>
            </div>
        </div>
    </div>

    <div class="col-md-2">
        <div class="card stat-card h-100 shadow-sm border-0 rounded-4 bg-success text-white">
            <div class="card-body p-3 text-center">
                <h6 class="text-white small mb-2 text-uppercase fw-bold opacity-75" style="font-size: 10px;">Lunas / Dikonfirmasi</h6>
                <h2 class="fw-bold mb-0"><?php echo $completedBookings; ?></h2>
            </div>
        </div>
    </div>
    
    <div class="col-md-2">
        <div class="card stat-card h-100 shadow-sm border-0 rounded-4">
            <div class="card-body p-3">
                <h6 class="text-muted small mb-2 text-uppercase fw-bold" style="font-size: 10px;">Pendapatan DP</h6>
                <div class="stat-number fs-6 fw-bold text-truncate text-primary" title="<?php echo formatCurrency($totalDP); ?>"><?php echo formatCurrency($totalDP); ?></div>
            </div>
        </div>
    </div>
</div>

<!-- Income Section -->
<div class="row mb-4 g-4">
    <!-- Summary Cards -->
    <div class="col-lg-4">
        <div class="card border-0 shadow-sm rounded-4 mb-4 bg-primary text-white">
            <div class="card-body p-4 text-center">
                <h6 class="text-uppercase small fw-bold opacity-75 mb-3">Pendapatan Hari Ini</h6>
                <h2 class="fw-bold mb-0"><?php echo formatCurrency($dailyIncome); ?></h2>
                <p class="small mb-0 opacity-75"><?php echo date('d M Y'); ?></p>
            </div>
        </div>
        <div class="card border-0 shadow-sm rounded-4 bg-dark text-white">
            <div class="card-body p-4 text-center">
                <h6 class="text-uppercase small fw-bold opacity-75 mb-3">Pendapatan Bulan Ini</h6>
                <h2 class="fw-bold mb-0"><?php echo formatCurrency($monthlyIncome); ?></h2>
                <p class="small mb-0 opacity-75"><?php echo date('F Y'); ?></p>
            </div>
        </div>
    </div>

    <!-- Daily Trends -->
    <div class="col-lg-4">
        <div class="card border-0 shadow-sm rounded-4 h-100 bg-white">
            <div class="card-header bg-white border-0 pt-4 px-4">
                <h6 class="fw-bold mb-0 text-primary">Tren 7 Hari Terakhir</h6>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr style="font-size: 10px; text-transform: uppercase;">
                                <th class="px-4">Tanggal</th>
                                <th class="text-end px-4">Pendapatan</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (empty($dailyTrends)): ?>
                                <tr><td colspan="2" class="text-center py-4 text-muted small">Belum ada data</td></tr>
                            <?php else: ?>
                                <?php foreach ($dailyTrends as $trend): ?>
                                    <tr>
                                        <td class="px-4 small"><?php echo date('d/m/Y', strtotime($trend['booking_date'])); ?></td>
                                        <td class="text-end px-4 fw-bold small text-primary"><?php echo formatCurrency($trend['total']); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Monthly Trends -->
    <div class="col-lg-4">
        <div class="card border-0 shadow-sm rounded-4 h-100 bg-white">
            <div class="card-header bg-white border-0 pt-4 px-4">
                <h6 class="fw-bold mb-0 text-dark">Tren 6 Bulan Terakhir</h6>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr style="font-size: 10px; text-transform: uppercase;">
                                <th class="px-4">Bulan</th>
                                <th class="text-end px-4">Pendapatan</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (empty($monthlyTrends)): ?>
                                <tr><td colspan="2" class="text-center py-4 text-muted small">Belum ada data</td></tr>
                            <?php else: ?>
                                <?php foreach ($monthlyTrends as $trend): ?>
                                    <tr>
                                        <td class="px-4 small"><?php echo date('M Y', strtotime($trend['month'] . '-01')); ?></td>
                                        <td class="text-end px-4 fw-bold small"><?php echo formatCurrency($trend['total']); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="card border-0 shadow-sm rounded-4">
    <div class="card-header bg-white border-0 pt-4 px-4">
        <h5 class="fw-bold mb-0"><i class="bi bi-calendar3 me-2 text-primary"></i>Booking Terbaru</h5>
    </div>
    <div class="card-body px-4 pb-4">
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Lapangan</th>
                        <th>Jadwal Main</th>
                        <th>Harga / DP</th>
                        <th>Status</th>
                        <th>Dibuat</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($recentBookings)): ?>
                        <tr>
                            <td colspan="7" class="text-center py-5 text-muted">Tidak ada data booking</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($recentBookings as $booking): 
                            $statusClass = [
                                'pending' => 'warning',
                                'dp_paid' => 'info',
                                'payment_2_pending' => 'primary',
                                'paid' => 'success',
                                'confirmed' => 'success',
                                'cancelled' => 'danger'
                            ];
                            $statusLabel = [
                                'pending' => 'Pending Verifikasi',
                                'dp_paid' => 'DP Dibayar',
                                'payment_2_pending' => 'Pelunasan Pending',
                                'paid' => 'Lunas / Dikonfirmasi',
                                'confirmed' => 'Lunas / Dikonfirmasi',
                                'cancelled' => 'Dibatalkan'
                            ];
                            $class = $statusClass[$booking['status']] ?? 'secondary';
                            $label = $statusLabel[$booking['status']] ?? $booking['status'];
                        ?>
                            <tr>
                                <td class="small text-muted">#<?php echo $booking['id']; ?></td>
                                <td class="fw-bold"><?php echo htmlspecialchars($booking['customer_name']); ?></td>
                                <td><?php echo htmlspecialchars($booking['field_name']); ?></td>
                                <td>
                                    <div class="small fw-bold"><?php echo formatDate($booking['booking_date']); ?></div>
                                    <div class="small text-muted"><?php echo formatTime($booking['start_time']); ?> - <?php echo formatTime($booking['end_time']); ?></div>
                                </td>
                                <td>
                                    <div class="small fw-bold"><?php echo formatCurrency($booking['price']); ?></div>
                                    <div class="small text-primary">DP: <?php echo formatCurrency($booking['dp_amount']); ?></div>
                                </td>
                                <td>
                                    <span class="badge bg-<?php echo $class; ?> rounded-pill px-3" style="font-size: 10px;">
                                        <?php echo strtoupper($label); ?>
                                    </span>
                                </td>
                                <td class="small text-muted"><?php echo formatDateTime($booking['created_at']); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
        <div class="text-center mt-4">
            <a href="<?php echo APP_URL; ?>/admin/bookings/index.php" class="btn btn-outline-primary rounded-pill px-4">Lihat Semua Booking</a>
        </div>
    </div>
</div>

<?php include __DIR__ . '/../includes/admin/header.php'; ?>
