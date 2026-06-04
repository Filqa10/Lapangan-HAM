<?php
/**
 * Entry Point — Redirect sesuai status login
 */
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/functions.php';

if (isLoggedIn()) {
    if (isAdmin()) {
        redirect(APP_URL . '/admin/index.php');
    } else {
        redirect(APP_URL . '/customer/index.php');
    }
} else {
    // Tamu/guest → halaman info publik
    redirect(APP_URL . '/about.php');
}
