<?php
require_once __DIR__ . '/../../includes/middleware.php';
requireAdmin();

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';

$id = $_GET['id'] ?? 0;

if ($id) {
    try {
        // Check if field has bookings
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM bookings WHERE field_id = ?");
        $stmt->execute([$id]);
        $hasBookings = $stmt->fetch()['count'] > 0;
        
        if ($hasBookings) {
            setFlashMessage('danger', 'Lapangan tidak dapat dihapus karena memiliki booking.');
        } else {
            $stmt = $pdo->prepare("DELETE FROM fields WHERE id = ?");
            $stmt->execute([$id]);
            setFlashMessage('success', 'Lapangan berhasil dihapus.');
        }
    } catch (PDOException $e) {
        setFlashMessage('danger', 'Terjadi kesalahan.');
    }
}

redirect(APP_URL . '/admin/fields/index.php');
