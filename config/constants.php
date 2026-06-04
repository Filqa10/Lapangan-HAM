<?php
/**
 * Application Constants
 */

// Application settings
define('APP_NAME', 'Booking Lapangan');
define('STADIUM_NAME', 'Stadion H. Abdul Malik');

// Auto-detect base URL
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';

// Get base path by comparing document root with this file's location
$docRoot = rtrim(str_replace('\\', '/', realpath($_SERVER['DOCUMENT_ROOT'] ?? '')), '/');
$appRoot = rtrim(str_replace('\\', '/', realpath(dirname(__DIR__))), '/');

// Calculate relative path from document root to app root
if ($docRoot === $appRoot) {
    $baseDir = '';
} else {
    $baseDir = str_replace($docRoot, '', $appRoot);
}

define('APP_URL', $protocol . '://' . $host . $baseDir);

define('TIMEZONE', 'Asia/Jakarta');
define('DP_PERCENTAGE', 30); // DP percentage (30%)
define('MIN_DP_AMOUNT', 500000); // Minimal DP Rp 500.000
define('APP_ADDRESS', 'Stadion H. Abdul Malik Jl. Yayasan No.RT.006/01, Grogol, Kec. Limo, Kota Depok, Jawa Barat 16512');

// Bank Account Details
define('BANK_NAME', 'Bank BLU BCA');
define('BANK_NUMBER', '008598155069');
define('BANK_HOLDER', 'Filqa');

// Set timezone
date_default_timezone_set(TIMEZONE);

// Session configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.use_strict_mode', 1);
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Google Sign-In Client ID (Isi ini dari Google Cloud Console)
define('GOOGLE_CLIENT_ID', 'GANTI_DENGAN_CLIENT_ID_GOOGLE_ANDA.apps.googleusercontent.com');

// Path constants
define('BASE_PATH', dirname(__DIR__));
define('ASSETS_PATH', BASE_PATH . '/assets');

// Load Image Configurations
require_once __DIR__ . '/images.php';
