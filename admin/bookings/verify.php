<?php
require_once __DIR__ . '/../../includes/middleware.php';
requireAdmin();

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/mail_functions.php';

$bookingId = $_GET['id'] ?? 0;
$action = $_GET['action'] ?? ''; // 'approve', 'reject', 'approve_2', 'reject_2'

if (!$bookingId || !in_array($action, ['approve', 'reject', 'approve_2', 'reject_2'])) {
    setFlashMessage('danger', 'Parameter tidak valid.');
    redirect(APP_URL . '/admin/bookings/index.php');
}

// Get booking data
try {
    $stmt = $pdo->prepare("
        SELECT b.*, u.name as customer_name, u.email as customer_email, f.name as field_name 
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN fields f ON b.field_id = f.id
        WHERE b.id = ?
    ");
    $stmt->execute([$bookingId]);
    $booking = $stmt->fetch();
    
    if (!$booking) {
        setFlashMessage('danger', 'Booking tidak ditemukan.');
        redirect(APP_URL . '/admin/bookings/index.php');
    }
    
    // Handle DP verification (first payment)
    if ($action === 'approve' || $action === 'reject') {
        if ($booking['status'] !== 'pending') {
            setFlashMessage('danger', 'Booking ini sudah diverifikasi.');
            redirect(APP_URL . '/admin/bookings/index.php');
        }
        
        if (empty($booking['payment_proof'])) {
            setFlashMessage('danger', 'Booking ini belum memiliki bukti pembayaran DP.');
            redirect(APP_URL . '/admin/bookings/index.php');
        }
        
        if ($action === 'approve') {
            $pdo->exec("UPDATE bookings SET status = 'dp_paid' WHERE id = $bookingId");
            
            // Notify Customer
            $user = ['name' => $booking['customer_name'], 'email' => $booking['customer_email']];
            sendPaymentConfirmedEmail($user, $booking, $booking['field_name'], false);
            
            setFlashMessage('success', 'Pembayaran DP berhasil diverifikasi. Status booking diubah menjadi "DP Dibayar".');
        } else {
            // Reject - delete payment proof
            require_once __DIR__ . '/../../includes/upload_functions.php';
            deletePaymentProof($booking['payment_proof']);
            $stmt = $pdo->prepare("UPDATE bookings SET payment_proof = NULL, payment_proof_uploaded_at = NULL, status = 'pending' WHERE id = ?");
            $stmt->execute([$bookingId]);
            setFlashMessage('warning', 'Bukti pembayaran DP ditolak. Customer harus upload ulang bukti pembayaran.');
        }
    }
    
    // Handle Pelunasan verification (second payment)
    if ($action === 'approve_2' || $action === 'reject_2') {
        if ($booking['status'] !== 'payment_2_pending') {
            setFlashMessage('danger', 'Status booking tidak valid untuk verifikasi pelunasan.');
            redirect(APP_URL . '/admin/bookings/index.php');
        }
        
        if (empty($booking['payment_proof_2'])) {
            setFlashMessage('danger', 'Booking ini belum memiliki bukti pelunasan.');
            redirect(APP_URL . '/admin/bookings/index.php');
        }
        
        if ($action === 'approve_2') {
            $pdo->exec("UPDATE bookings SET status = 'paid' WHERE id = $bookingId");
            
            // Notify Customer
            $user = ['name' => $booking['customer_name'], 'email' => $booking['customer_email']];
            sendPaymentConfirmedEmail($user, $booking, $booking['field_name'], true);
            
            setFlashMessage('success', 'Pembayaran pelunasan berhasil diverifikasi. Status booking diubah menjadi "Lunas".');
        } else {
            // Reject - delete payment proof 2
            require_once __DIR__ . '/../../includes/upload_functions.php';
            deletePaymentProof($booking['payment_proof_2']);
            $stmt = $pdo->prepare("UPDATE bookings SET payment_proof_2 = NULL, payment_proof_2_uploaded_at = NULL, status = 'dp_paid' WHERE id = ?");
            $stmt->execute([$bookingId]);
            setFlashMessage('warning', 'Bukti pelunasan ditolak. Customer harus upload ulang bukti pelunasan.');
        }
    }
    
    redirect(APP_URL . '/admin/bookings/index.php');
} catch (PDOException $e) {
    setFlashMessage('danger', 'Terjadi kesalahan.');
    redirect(APP_URL . '/admin/bookings/index.php');
}
