<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect(APP_URL . '/auth/login.php');
}

$email = sanitize($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if (empty($email) || empty($password)) {
    setFlashMessage('danger', 'Email dan password harus diisi.');
    redirect(APP_URL . '/auth/login.php');
}

try {
    $stmt = $pdo->prepare("SELECT id, name, email, password, role FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id']    = $user['id'];
        $_SESSION['user_name']  = $user['name'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_role']  = $user['role'];

        if ($user['role'] === 'admin') {
            redirect(APP_URL . '/admin/index.php');
        } else {
            // Cek apakah ada redirect setelah login (misal dari halaman booking)
            $redirectAfter = $_SESSION['redirect_after_login'] ?? '';
            unset($_SESSION['redirect_after_login']);
            if (!empty($redirectAfter) && strpos($redirectAfter, APP_URL) === 0) {
                // Only redirect if URL starts with current APP_URL (security check)
                redirect($redirectAfter);
            }
            redirect(APP_URL . '/customer/index.php');
        }
    } else {
        setFlashMessage('danger', 'Email atau password salah.');
        // Simpan kembali redirect jika ada
        redirect(APP_URL . '/auth/login.php');
    }
} catch (PDOException $e) {
    setFlashMessage('danger', 'Terjadi kesalahan. Silakan coba lagi.');
    redirect(APP_URL . '/auth/login.php');
}
