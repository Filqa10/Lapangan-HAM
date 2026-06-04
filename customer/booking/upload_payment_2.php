<?php
require_once __DIR__ . '/../../includes/middleware.php';
requireCustomer();

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/upload_functions.php';
require_once __DIR__ . '/../../includes/mail_functions.php';

$bookingId = $_POST['booking_id'] ?? 0;

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !$bookingId) {
    setFlashMessage('danger', 'Request tidak valid.');
    redirect(APP_URL . '/customer/profile.php');
}

// Validate booking ownership and status
try {
    $userId = $_SESSION['user_id'];
    $stmt = $pdo->prepare("
        SELECT b.*, f.name as field_name 
        FROM bookings b 
        JOIN fields f ON b.field_id = f.id 
        WHERE b.id = ? AND b.user_id = ?
    ");
    $stmt->execute([$bookingId, $userId]);
    $booking = $stmt->fetch();
    
    if (!$booking) {
        setFlashMessage('danger', 'Booking tidak ditemukan.');
        redirect(APP_URL . '/customer/profile.php');
    }
    
    // Check if eligible for 2nd payment upload (DP must be verified first)
    if ($booking['status'] !== 'dp_paid') {
        setFlashMessage('danger', 'Pelunasan hanya bisa diupload setelah DP diverifikasi.');
        redirect(APP_URL . '/customer/profile.php');
    }
    
    // Check if 2nd payment proof already uploaded
    if (!empty($booking['payment_proof_2'])) {
        setFlashMessage('warning', 'Bukti pelunasan sudah diupload. Menunggu verifikasi admin.');
        redirect(APP_URL . '/customer/profile.php');
    }
    
    // Validate file upload
    if (!isset($_FILES['payment_proof_2']) || $_FILES['payment_proof_2']['error'] === UPLOAD_ERR_NO_FILE) {
        setFlashMessage('danger', 'Bukti pembayaran pelunasan wajib diupload.');
        redirect(APP_URL . '/customer/profile.php');
    }
    
    // Upload payment proof
    $paymentProof2 = uploadPaymentProof($_FILES['payment_proof_2']);
    if (!$paymentProof2) {
        setFlashMessage('danger', 'Gagal upload bukti pembayaran. Pastikan file adalah gambar (JPG/PNG) atau PDF (maks 5MB).');
        redirect(APP_URL . '/customer/profile.php');
    }
    
    // Update booking with 2nd payment proof
    $stmt = $pdo->prepare("
        UPDATE bookings 
        SET payment_proof_2 = ?, payment_proof_2_uploaded_at = NOW(), status = 'payment_2_pending'
        WHERE id = ?
    ");
    $stmt->execute([$paymentProof2, $bookingId]);
    
    // Send Email Notification
    $user = [
        'name' => $_SESSION['user_name'],
        'email' => $_SESSION['user_email']
    ];
    sendPaymentReceivedEmail($user, $booking, $booking['field_name'], 'Pelunasan');
    
    setFlashMessage('success', 'Bukti pembayaran pelunasan berhasil diupload! Menunggu verifikasi admin.');
    redirect(APP_URL . '/customer/profile.php');
    
} catch (PDOException $e) {
    setFlashMessage('danger', 'Terjadi kesalahan database.');
    redirect(APP_URL . '/customer/profile.php');
}
