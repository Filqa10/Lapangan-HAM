<?php
require_once __DIR__ . '/../../includes/middleware.php';
requireCustomer();

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';

$bookingId = $_GET['id'] ?? null;
$userId = $_SESSION['user_id'];

if (!$bookingId) {
    die("ID Booking tidak ditemukan.");
}

try {
    $stmt = $pdo->prepare("
        SELECT b.*, f.name as field_name, f.price as field_price, f.address as field_address, u.name as customer_name, u.email as customer_email
        FROM bookings b
        JOIN fields f ON b.field_id = f.id
        JOIN users u ON b.user_id = u.id
        WHERE b.id = ? AND b.user_id = ?
    ");
    $stmt->execute([$bookingId, $userId]);
    $booking = $stmt->fetch();

    if (!$booking) {
        die("Booking tidak ditemukan atau Anda tidak memiliki akses.");
    }

} catch (PDOException $e) {
    die("Database error: " . $e->getMessage());
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice #<?php echo str_pad($booking['id'], 5, '0', STR_PAD_LEFT); ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background-color: #f8f9fa; font-family: 'Inter', sans-serif; }
        .invoice-card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); margin-top: 30px; margin-bottom: 30px; }
        .invoice-header { border-bottom: 2px solid #f1f1f1; padding-bottom: 20px; margin-bottom: 30px; }
        .invoice-logo { font-size: 24px; font-weight: 800; color: #007AFF; }
        .status-badge { padding: 8px 16px; border-radius: 50px; font-weight: 600; font-size: 14px; }
        @media print {
            .no-print { display: none !important; }
            body { background-color: white; }
            .invoice-card { box-shadow: none; margin-top: 0; padding: 20px; }
        }
    </style>
</head>
<body>

<div class="container">
    <div class="row justify-content-center">
        <div class="col-lg-8">
            <div class="no-print mt-4 d-flex justify-content-between align-items-center">
                <a href="../profile.php" class="btn btn-outline-secondary btn-sm"><i class="bi bi-arrow-left"></i> Kembali ke Profil & Riwayat</a>
                <button onclick="window.print()" class="btn btn-primary btn-sm"><i class="bi bi-printer"></i> Cetak Invoice</button>
            </div>

            <div class="invoice-card">
                <div class="invoice-header d-flex justify-content-between align-items-start">
                    <div>
                        <div class="invoice-logo mb-2"><?php echo APP_NAME; ?></div>
                        <p class="text-muted small mb-0">Invoice Pemesanan Lapangan</p>
                    </div>
                    <div class="text-end">
                        <h4 class="fw-bold mb-1">INVOICE</h4>
                        <p class="text-muted small mb-0">#<?php echo str_pad($booking['id'], 5, '0', STR_PAD_LEFT); ?></p>
                    </div>
                </div>

                <div class="row mb-4">
                    <div class="col-6">
                        <h6 class="text-uppercase text-muted fw-bold small">Diterbitkan Untuk:</h6>
                        <p class="mb-0 fw-bold"><?php echo htmlspecialchars($booking['customer_name']); ?></p>
                        <p class="small text-muted"><?php echo htmlspecialchars($booking['customer_email']); ?></p>
                    </div>
                    <div class="col-6 text-end">
                        <h6 class="text-uppercase text-muted fw-bold small">Tanggal Invoice:</h6>
                        <p class="mb-0"><?php echo date('d F Y', strtotime($booking['created_at'])); ?></p>
                    </div>
                </div>

                <div class="table-responsive mb-4">
                    <table class="table table-borderless">
                        <thead class="bg-light">
                            <tr>
                                <th class="small py-3">Deskripsi Lapangan</th>
                                <th class="small py-3 text-center">Tanggal Main</th>
                                <th class="small py-3 text-center">Waktu</th>
                                <th class="small py-3 text-end">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="py-3">
                                    <div class="fw-bold"><?php echo htmlspecialchars($booking['field_name']); ?></div>
                                    <div class="small text-muted"><?php echo htmlspecialchars($booking['field_address']); ?></div>
                                </td>
                                <td class="py-3 text-center">
                                    <?php echo date('d/m/Y', strtotime($booking['booking_date'])); ?>
                                </td>
                                <td class="py-3 text-center">
                                    <?php echo date('H:i', strtotime($booking['start_time'])); ?> - <?php echo date('H:i', strtotime($booking['end_time'])); ?>
                                </td>
                                <td class="py-3 text-end fw-bold">
                                    <?php echo formatCurrency($booking['price']); ?>
                                </td>
                            </tr>
                            <?php
                            // Breakdown harga per slot
                            $slotBreakdown = calculateBookingSlotPrice(
                                $booking['start_time'],
                                $booking['end_time'],
                                $booking['booking_date']
                            );
                            if ($slotBreakdown && !empty($slotBreakdown['breakdown'])):
                                foreach ($slotBreakdown['breakdown'] as $sItem):
                            ?>
                            <tr style="background:#f9f9f9;">
                                <td colspan="3" class="py-1 ps-4 small text-muted">
                                    <i class="bi bi-clock me-1"></i>
                                    Slot <?php echo htmlspecialchars($sItem['slot']); ?>
                                </td>
                                <td class="py-1 text-end small text-muted"><?php echo formatCurrency($sItem['price']); ?></td>
                            </tr>
                            <?php endforeach; endif; ?>
                        </tbody>
                    </table>
                </div>

                        <div class="row justify-content-end">
                            <div class="col-md-5">
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted small">Subtotal</span>
                                    <span><?php echo formatCurrency($booking['price']); ?></span>
                                </div>
                                <div class="d-flex justify-content-between mb-3 pt-2 border-top">
                                    <span class="fw-bold">Total Bayar</span>
                                    <span class="fw-bold text-primary fs-5"><?php echo formatCurrency($booking['price']); ?></span>
                                </div>
                                <div class="text-end">
                                    <?php if ($booking['status'] === 'confirmed' || $booking['status'] === 'paid'): ?>
                                        <span class="status-badge bg-success-subtle text-success border border-success">LUNAS / DIKONFIRMASI</span>
                                    <?php elseif ($booking['status'] === 'dp_paid'): ?>
                                        <span class="status-badge bg-info-subtle text-info border border-info">DP DIBAYAR</span>
                                    <?php elseif ($booking['status'] === 'payment_2_pending'): ?>
                                        <span class="status-badge bg-primary-subtle text-primary border border-primary">PELUNASAN PENDING</span>
                                    <?php elseif ($booking['status'] === 'cancelled'): ?>
                                        <span class="status-badge bg-danger-subtle text-danger border border-danger">DIBATALKAN</span>
                                    <?php else: ?>
                                        <span class="status-badge bg-warning-subtle text-warning border border-warning">PENDING VERIFIKASI</span>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>

                <div class="mt-5 pt-5 text-center border-top">
                    <p class="small text-muted">Terima kasih telah berolahraga bersama kami!</p>
                    <p class="fw-bold small mb-0"><?php echo APP_NAME; ?></p>
                </div>
            </div>
        </div>
    </div>
</div>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.2/font/bootstrap-icons.min.css">
</body>
</html>
