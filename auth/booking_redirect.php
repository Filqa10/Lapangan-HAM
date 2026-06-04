<?php
/**
 * Halaman perantara: simpan tujuan redirect ke session, lalu arahkan ke login
 * Digunakan oleh tombol "Booking Sekarang" untuk guest
 */
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

// Jika sudah login, langsung ke halaman booking
if (isLoggedIn()) {
    $fieldId = $_GET['field_id'] ?? '';
    $url = APP_URL . '/customer/booking/create.php' . ($fieldId ? '?field_id=' . (int)$fieldId : '');
    redirect($url);
}

// Simpan tujuan redirect ke session
$fieldId = $_GET['field_id'] ?? '';
$redirectUrl = APP_URL . '/customer/booking/create.php' . ($fieldId ? '?field_id=' . (int)$fieldId : '');
$_SESSION['redirect_after_login'] = $redirectUrl;

// Arahkan ke login dengan pesan
setFlashMessage('info', 'Silakan login atau daftar terlebih dahulu untuk melakukan booking.');
redirect(APP_URL . '/auth/login.php');
