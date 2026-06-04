<?php
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../includes/functions.php';

// 1. Hapus cookie session
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// 2. Clear semua data session & hancurkan
$_SESSION = [];
session_destroy();

// 3. Mulai session baru untuk flash message
session_start();
setFlashMessage('success', 'Anda telah berhasil logout. Sampai jumpa! 👋');

// 4. Redirect ke login
redirect(APP_URL . '/auth/login.php');
