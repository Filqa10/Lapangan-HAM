<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect(APP_URL . '/auth/register.php');
}

$name = sanitize($_POST['name'] ?? '');
$email = sanitize($_POST['email'] ?? '');
$phone = sanitize($_POST['phone'] ?? '');
$password = $_POST['password'] ?? '';
$password_confirm = $_POST['password_confirm'] ?? '';

// Validation
if (empty($name) || empty($email) || empty($phone) || empty($password)) {
    setFlashMessage('danger', 'Semua field harus diisi.');
    redirect(APP_URL . '/auth/register.php');
}

if (strlen($password) < 6) {
    setFlashMessage('danger', 'Password minimal 6 karakter.');
    redirect(APP_URL . '/auth/register.php');
}

if ($password !== $password_confirm) {
    setFlashMessage('danger', 'Password dan konfirmasi password tidak sesuai.');
    redirect(APP_URL . '/auth/register.php');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    setFlashMessage('danger', 'Format email tidak valid.');
    redirect(APP_URL . '/auth/register.php');
}

try {
    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        setFlashMessage('danger', 'Email sudah terdaftar. Silakan gunakan email lain.');
        redirect(APP_URL . '/auth/register.php');
    }
    
    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Insert user
    $stmt = $pdo->prepare("INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, 'customer')");
    $stmt->execute([$name, $email, $phone, $hashedPassword]);
    
    setFlashMessage('success', 'Registrasi berhasil! Silakan login.');
    redirect(APP_URL . '/auth/login.php');
} catch (PDOException $e) {
    // Temporary debugging - show actual error
    setFlashMessage('danger', 'Database Error: ' . $e->getMessage());
    redirect(APP_URL . '/auth/register.php');
}
