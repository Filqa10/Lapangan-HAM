<?php
/**
 * Middleware for Authentication & Authorization
 */

require_once __DIR__ . '/functions.php';

/**
 * Require login
 */
function requireLogin() {
    if (!isLoggedIn()) {
        setFlashMessage('danger', 'Silakan login terlebih dahulu.');
        redirect(APP_URL . '/auth/login.php');
    }
}

/**
 * Require admin
 */
function requireAdmin() {
    requireLogin();
    if (!isAdmin()) {
        setFlashMessage('danger', 'Akses ditolak. Hanya admin yang dapat mengakses halaman ini.');
        redirect(APP_URL . '/customer/index.php');
    }
}

/**
 * Require customer
 */
function requireCustomer($allowGuest = false) {
    if (!$allowGuest) {
        requireLogin();
    }
    
    if (isLoggedIn() && !isCustomer()) {
        setFlashMessage('danger', 'Akses ditolak. Hanya customer yang dapat mengakses halaman ini.');
        redirect(APP_URL . '/admin/index.php');
    }
}

/**
 * Redirect if already logged in
 */
function redirectIfLoggedIn() {
    if (isLoggedIn()) {
        if (isAdmin()) {
            redirect(APP_URL . '/admin/index.php');
        } else {
            redirect(APP_URL . '/customer/index.php');
        }
    }
}
