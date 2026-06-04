<?php
require_once __DIR__ . '/../../includes/middleware.php';
requireAdmin();

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/upload_functions.php';

// Get filter
$statusFilter = $_GET['status'] ?? '';

// Build query
$sql = "
    SELECT b.*, u.name as customer_name, u.email as customer_email, f.name as field_name 
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN fields f ON b.field_id = f.id
";

$params = [];
if ($statusFilter) {
    $sql .= " WHERE b.status = ?";
    $params[] = $statusFilter;
}

$sql .= " ORDER BY b.created_at DESC";

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $bookings = $stmt->fetchAll();
} catch (PDOException $e) {
    $bookings = [];
}

$pageTitle = "Daftar Booking";
include __DIR__ . '/../../includes/admin/header.php';
?>

<div class="d-flex justify-content-between align-items-center mb-4">
    <h3><i class="bi bi-calendar3"></i> Daftar Booking</h3>
    <button onclick="history.back()" class="btn btn-outline-secondary btn-sm rounded-pill px-3">
        <i class="bi bi-arrow-left me-1"></i> Kembali
    </button>
</div>

<div class="card">
    <div class="card-header">
        <div class="row align-items-center">
            <div class="col-md-6">
                <h5 class="mb-0">Semua Booking</h5>
            </div>
            <div class="col-md-6">
                <form method="GET" class="d-flex gap-2">
                    <select name="status" class="form-select form-select-sm">
                        <option value="">Semua Status</option>
                        <option value="pending" <?php echo $statusFilter == 'pending' ? 'selected' : ''; ?>>Pending Verifikasi</option>
                        <option value="dp_paid" <?php echo $statusFilter == 'dp_paid' ? 'selected' : ''; ?>>DP Dibayar</option>
                        <option value="payment_2_pending" <?php echo $statusFilter == 'payment_2_pending' ? 'selected' : ''; ?>>Pelunasan Pending</option>
                        <option value="confirmed" <?php echo $statusFilter == 'confirmed' ? 'selected' : ''; ?>>Lunas / Dikonfirmasi</option>
                        <option value="cancelled" <?php echo $statusFilter == 'cancelled' ? 'selected' : ''; ?>>Dibatalkan</option>
                    </select>
                    <button type="submit" class="btn btn-sm btn-primary">Filter</button>
                    <?php if ($statusFilter): ?>
                        <a href="<?php echo APP_URL; ?>/admin/bookings/index.php" class="btn btn-sm btn-secondary">Reset</a>
                    <?php endif; ?>
                </form>
            </div>
        </div>
    </div>
    <div class="card-body">
        <div class="table-responsive">
            <table class="table table-hover" id="bookingsTable">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Lapangan</th>
                        <th>Tanggal</th>
                        <th>Waktu</th>
                        <th>Harga</th>
                        <th>DP</th>
                        <th>Bukti Pembayaran</th>
                        <th>Status</th>
                        <th>Tanggal Booking</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($bookings as $booking): ?>
                            <tr>
                                <td>#<?php echo $booking['id']; ?></td>
                                <td>
                                    <div><?php echo htmlspecialchars($booking['customer_name']); ?></div>
                                    <small class="text-muted"><?php echo htmlspecialchars($booking['customer_email']); ?></small>
                                </td>
                                <td><?php echo htmlspecialchars($booking['field_name']); ?></td>
                                <td><?php echo formatDate($booking['booking_date']); ?></td>
                                <td><?php echo formatTime($booking['start_time']); ?> - <?php echo formatTime($booking['end_time']); ?></td>
                                <td><?php echo formatCurrency($booking['price']); ?></td>
                                <td><?php echo formatCurrency($booking['dp_amount']); ?></td>
                                <td>
                                    <?php if (!empty($booking['payment_proof'])): ?>
                                        <?php $proofUrl = getPaymentProofUrl($booking['payment_proof']); ?>
                                        <a href="<?php echo $proofUrl; ?>" target="_blank" class="btn btn-sm btn-outline-primary">
                                            <i class="bi bi-eye"></i> Lihat Bukti
                                        </a>
                                    <?php else: ?>
                                        <span class="text-muted">-</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <?php
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
                                    <span class="badge bg-<?php echo $class; ?> badge-status"><?php echo $label; ?></span>
                                </td>
                                <td><?php echo formatDateTime($booking['created_at']); ?></td>
                                <td>
                                    <?php if ($booking['status'] === 'pending' && !empty($booking['payment_proof'])): ?>
                                        <a href="<?php echo APP_URL; ?>/admin/bookings/verify.php?id=<?php echo $booking['id']; ?>&action=approve" 
                                           class="btn btn-sm btn-success"
                                           onclick="return confirm('Verifikasi pembayaran DP? Status akan diubah menjadi DP Dibayar.')">
                                            <i class="bi bi-check-circle"></i> Setuju DP
                                        </a>
                                        <a href="<?php echo APP_URL; ?>/admin/bookings/verify.php?id=<?php echo $booking['id']; ?>&action=reject" 
                                           class="btn btn-sm btn-danger"
                                           onclick="return confirm('Tolak bukti pembayaran? Customer harus upload ulang.')">
                                            <i class="bi bi-x-circle"></i> Tolak
                                        </a>
                                    <?php elseif ($booking['status'] === 'payment_2_pending' && !empty($booking['payment_proof_2'])): ?>
                                        <?php $proof2Url = getPaymentProofUrl($booking['payment_proof_2']); ?>
                                        <a href="<?php echo $proof2Url; ?>" target="_blank" class="btn btn-sm btn-outline-info mb-1">
                                            <i class="bi bi-eye"></i> Lihat Pelunasan
                                        </a>
                                        <a href="<?php echo APP_URL; ?>/admin/bookings/verify.php?id=<?php echo $booking['id']; ?>&action=approve_2" 
                                           class="btn btn-sm btn-success"
                                           onclick="return confirm('Verifikasi pembayaran pelunasan? Status akan diubah menjadi Lunas.')">
                                            <i class="bi bi-check-circle"></i> Setuju Pelunasan
                                        </a>
                                        <a href="<?php echo APP_URL; ?>/admin/bookings/verify.php?id=<?php echo $booking['id']; ?>&action=reject_2" 
                                           class="btn btn-sm btn-danger"
                                           onclick="return confirm('Tolak bukti pelunasan? Customer harus upload ulang.')">
                                            <i class="bi bi-x-circle"></i> Tolak
                                        </a>
                                    <?php elseif ($booking['status'] === 'dp_paid'): ?>
                                        <span class="text-muted">Menunggu Pelunasan</span>
                                    <?php elseif ($booking['status'] === 'paid'): ?>
                                        <a href="<?php echo APP_URL; ?>/admin/bookings/confirm.php?id=<?php echo $booking['id']; ?>" 
                                           class="btn btn-sm btn-primary"
                                           onclick="return confirm('Konfirmasi booking? Status akan diubah menjadi Confirmed.')">
                                            <i class="bi bi-check-lg"></i> Konfirmasi
                                        </a>
                                    <?php else: ?>
                                        <span class="text-muted">-</span>
                                    <?php endif; ?>
                                </td>
                            </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?php
$pageScripts = '
<script>
$(document).ready(function() {
    $("#bookingsTable").DataTable({
        language: {
            url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/id.json",
            emptyTable: "Tidak ada data booking"
        },
        order: [[9, "desc"]]
    });
});
</script>
';
include __DIR__ . '/../../includes/admin/footer.php';
?>
