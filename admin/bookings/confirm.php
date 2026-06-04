<?php
require_once __DIR__ . '/../../includes/middleware.php';
requireAdmin();

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/mail_functions.php';

$bookingId = $_GET['id'] ?? 0;

if (!$bookingId) {
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
    
    if ($booking['status'] !== 'dp_paid') {
        setFlashMessage('danger', 'Hanya booking dengan status "DP Dibayar" yang dapat dikonfirmasi.');
        redirect(APP_URL . '/admin/bookings/index.php');
    }
    
    // Update status to confirmed
    $stmt = $pdo->prepare("UPDATE bookings SET status = 'confirmed' WHERE id = ?");
    $stmt->execute([$bookingId]);
    
    // Notify Customer
    $user = ['name' => $booking['customer_name'], 'email' => $booking['customer_email']];
    sendPaymentConfirmedEmail($user, $booking, $booking['field_name'], true);
    
    setFlashMessage('success', 'Booking berhasil dikonfirmasi.');
    redirect(APP_URL . '/admin/bookings/index.php');
} catch (PDOException $e) {
    setFlashMessage('danger', 'Terjadi kesalahan.');
    redirect(APP_URL . '/admin/bookings/index.php');
}
