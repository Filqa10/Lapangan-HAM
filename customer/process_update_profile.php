<?php
require_once __DIR__ . '/../includes/middleware.php';
requireCustomer();

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect(APP_URL . '/customer/profile.php');
}

$userId  = $_SESSION['user_id'];
$name    = sanitize($_POST['name']    ?? '');
$email   = sanitize($_POST['email']   ?? '');
$phone   = sanitize($_POST['phone']   ?? '');
$newPass = $_POST['new_password']    ?? '';
$confPass = $_POST['confirm_password'] ?? '';

// Basic validation
if (empty($name) || empty($email) || empty($phone)) {
    setFlashMessage('danger', 'Nama, email, dan nomor telepon harus diisi.');
    redirect(APP_URL . '/customer/profile.php');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    setFlashMessage('danger', 'Format email tidak valid.');
    redirect(APP_URL . '/customer/profile.php');
}

// Password validation (only if user wants to change)
$changePassword = !empty($newPass);
if ($changePassword) {
    if (strlen($newPass) < 6) {
        setFlashMessage('danger', 'Password baru minimal 6 karakter.');
        redirect(APP_URL . '/customer/profile.php');
    }
    if ($newPass !== $confPass) {
        setFlashMessage('danger', 'Konfirmasi password tidak cocok.');
        redirect(APP_URL . '/customer/profile.php');
    }
}

try {
    // Check if email is already used by another user
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
    $stmt->execute([$email, $userId]);
    if ($stmt->fetch()) {
        setFlashMessage('danger', 'Email sudah digunakan oleh akun lain.');
        redirect(APP_URL . '/customer/profile.php');
    }

    if ($changePassword) {
        $hashedPassword = password_hash($newPass, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ?, phone = ?, password = ? WHERE id = ?");
        $stmt->execute([$name, $email, $phone, $hashedPassword, $userId]);
    } else {
        $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?");
        $stmt->execute([$name, $email, $phone, $userId]);
    }

    // Update session
    $_SESSION['user_name']  = $name;
    $_SESSION['user_email'] = $email;

    $msg = 'Profil berhasil diperbarui.';
    if ($changePassword) {
        $msg .= ' Password juga telah diubah.';
    }
    setFlashMessage('success', $msg);

} catch (PDOException $e) {
    setFlashMessage('danger', 'Terjadi kesalahan saat memperbarui profil. Silakan coba lagi.');
}

redirect(APP_URL . '/customer/profile.php');
