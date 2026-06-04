<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($pageTitle) ? $pageTitle . ' - ' : ''; ?><?php echo APP_NAME; ?></title>
    <!-- DEBUG: APP_URL = <?php echo APP_URL; ?> -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    <style>
        /* ========================================
           Apple HIG + Geist Design System
           ======================================== */

        :root {
            --geist-foreground: #000000;
            --geist-background: #ffffff;
            --geist-gray: #666666;
            --geist-gray-light: #999999;
            --geist-gray-lighter: #eaeaea;
            --geist-gray-lightest: #fafafa;
            --geist-border: #d4d4d4;

            --accent-blue: #007AFF;
            --accent-green: #34C759;
            --accent-orange: #FF9500;
            --accent-red: #FF3B30;
            --accent-indigo: #5856D6;

            --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04);
            --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.06);
            --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.08);
            --shadow-hover: 0 8px 24px rgba(0, 0, 0, 0.12);

            --space-1: 4px;
            --space-2: 8px;
            --space-3: 12px;
            --space-4: 16px;
            --space-5: 20px;
            --space-6: 24px;
            --space-8: 32px;
            --space-10: 40px;
            --space-12: 48px;

            --radius-sm: 8px;
            --radius-md: 12px;
            --radius-lg: 16px;
            --radius-xl: 20px;

            --font-system: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            --font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        }

        * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

        body {
            font-family: var(--font-system);
            background-color: var(--geist-background);
            color: var(--geist-foreground);
            line-height: 1.6;
            font-size: 15px;
        }

        /* ========================================
           Navigation - Hamburger Menu
           ======================================== */

        .navbar {
            background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
            border-bottom: none;
            box-shadow: 0 2px 8px rgba(0, 122, 255, 0.15);
            padding: var(--space-3) 0;
            position: sticky;
            top: 0;
            z-index: 1000;
        }

        .navbar-brand {
            font-weight: 600;
            color: white !important;
            font-size: 17px;
            letter-spacing: -0.3px;
            display: flex;
            align-items: center;
            gap: var(--space-2);
            text-decoration: none;
        }

        .navbar-brand i { color: white; font-size: 20px; }

        /* Hamburger button */
        .nav-hamburger {
            background: rgba(255,255,255,0.15);
            border: 1.5px solid rgba(255,255,255,0.3);
            border-radius: 12px;
            width: 42px; height: 42px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all 0.2s;
            color: white; font-size: 20px;
            position: relative;
        }
        .nav-hamburger:hover { background: rgba(255,255,255,0.25); }

        /* Badge titik merah di hamburger jika ada notif */
        .nav-hamburger .badge-dot {
            position: absolute; top: 6px; right: 6px;
            width: 8px; height: 8px;
            background: #FF3B30; border-radius: 50%;
            border: 2px solid #0051D5;
        }

        /* Overlay backdrop */
        .nav-overlay {
            position: fixed; inset: 0; z-index: 1001;
            display: none;
        }
        .nav-overlay.open { display: block; }

        /* Dropdown panel */
        .nav-dropdown {
            position: fixed; top: 64px; right: 1rem;
            background: white;
            border-radius: 18px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 2px 12px rgba(0,0,0,0.08);
            border: 1px solid rgba(0,0,0,0.07);
            min-width: 230px;
            padding: 10px;
            z-index: 1002;
            opacity: 0; visibility: hidden;
            transform: translateY(-8px) scale(0.97);
            transform-origin: top right;
            transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
        }
        .nav-dropdown.open {
            opacity: 1; visibility: visible;
            transform: translateY(0) scale(1);
        }

        /* User info di top dropdown */
        .nav-user-info {
            padding: 10px 14px 12px;
            border-bottom: 1px solid #f0f0f0;
            margin-bottom: 6px;
        }
        .nav-user-info .user-name {
            font-weight: 700; font-size: 14px; color: #111;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .nav-user-info .user-email {
            font-size: 12px; color: #888;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        /* Link items di dropdown */
        .nav-dropdown a {
            display: flex; align-items: center; gap: 10px;
            padding: 10px 14px; border-radius: 10px;
            color: #444; font-size: 14px; font-weight: 500;
            text-decoration: none; transition: all 0.15s;
            position: relative;
        }
        .nav-dropdown a:hover { background: #f5f5f5; color: #111; }
        .nav-dropdown a i { width: 20px; text-align: center; color: #888; font-size: 15px; }
        .nav-dropdown a.active-link { background: #EFF5FF; color: #007AFF; font-weight: 600; }
        .nav-dropdown a.active-link i { color: #007AFF; }

        .nav-dropdown .nav-divider { height: 1px; background: #f0f0f0; margin: 6px 0; }

        /* Badge notif angka di link */
        .nav-badge {
            margin-left: auto;
            background: #FF3B30; color: white;
            font-size: 10px; font-weight: 800;
            min-width: 18px; height: 18px;
            padding: 0 4px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
        }

        /* Tombol logout merah */
        .nav-dropdown .btn-logout {
            background: #FFF0EF; color: #FF3B30;
            font-weight: 700; border-radius: 10px;
            margin-top: 4px;
        }
        .nav-dropdown .btn-logout:hover { background: #FFE5E3; color: #cc2e23; }
        .nav-dropdown .btn-logout i { color: #FF3B30; }

        /* ========================================
           Cards - Geist Style
           ======================================== */

        .card {
            background: var(--geist-background);
            border: 1px solid var(--geist-border);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-sm);
            margin-bottom: var(--space-6);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
        }

        .card:hover { box-shadow: var(--shadow-md); border-color: var(--geist-gray); }

        .card-header {
            background: transparent;
            border-bottom: 1px solid var(--geist-border);
            padding: var(--space-5) var(--space-6);
            font-weight: 600;
            font-size: 16px;
            color: var(--geist-foreground);
        }

        .card-body { padding: var(--space-6); }

        /* ========================================
           Stat Cards - Apple HIG Metrics
           ======================================== */

        .stat-card {
            background: var(--geist-background);
            border: 1px solid var(--geist-border);
            border-radius: var(--radius-lg);
            padding: var(--space-6);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }

        .stat-card::before {
            content: '';
            position: absolute; top: 0; left: 0; right: 0; height: 3px;
            background: var(--accent-blue);
            transform: scaleX(0); transform-origin: left;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .stat-card:hover::before { transform: scaleX(1); }
        .stat-card:hover { border-color: var(--geist-gray); box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .stat-card[data-type="warning"]::before { background: var(--accent-orange); }
        .stat-card[data-type="success"]::before { background: var(--accent-green); }
        .stat-card .card-body { padding: 0; }

        .stat-card h6 {
            font-size: 13px; font-weight: 500; color: var(--geist-gray);
            text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: var(--space-3);
        }

        .stat-number {
            font-size: 36px; font-weight: 700; color: var(--geist-foreground);
            line-height: 1; letter-spacing: -1px; font-variant-numeric: tabular-nums;
        }

        .stat-icon {
            width: 48px; height: 48px; border-radius: var(--radius-md);
            background: var(--geist-gray-lightest);
            display: flex; align-items: center; justify-content: center; font-size: 24px;
        }
        .stat-icon.blue { color: var(--accent-blue); }
        .stat-icon.orange { color: var(--accent-orange); }
        .stat-icon.green { color: var(--accent-green); }

        /* ========================================
           Tables - Clean & Spacious
           ======================================== */

        .table { --bs-table-bg: transparent; margin-bottom: 0; font-size: 14px; }

        .table thead th {
            border-bottom: 1px solid var(--geist-border);
            background: var(--geist-gray-lightest);
            font-weight: 600; font-size: 12px;
            text-transform: uppercase; letter-spacing: 0.5px;
            color: var(--geist-gray); padding: var(--space-3) var(--space-4);
        }

        .table tbody td {
            border-bottom: 1px solid var(--geist-gray-lighter);
            padding: var(--space-4); vertical-align: middle; color: var(--geist-foreground);
        }
        .table tbody tr { transition: background-color 0.15s ease; }
        .table tbody tr:hover { background-color: var(--geist-gray-lightest); }
        .table tbody tr:last-child td { border-bottom: none; }

        /* ========================================
           Badges - Apple Style
           ======================================== */

        .badge {
            padding: var(--space-1) var(--space-3);
            border-radius: var(--radius-sm);
            font-weight: 600; font-size: 11px;
            text-transform: uppercase; letter-spacing: 0.5px;
        }
        .bg-warning { background-color: var(--accent-orange) !important; color: white !important; }
        .bg-info    { background-color: var(--accent-blue)   !important; color: white !important; }
        .bg-success { background-color: var(--accent-green)  !important; color: white !important; }
        .bg-danger  { background-color: var(--accent-red)    !important; color: white !important; }

        /* ========================================
           Buttons - Apple HIG
           ======================================== */

        .btn {
            border-radius: var(--radius-md);
            padding: var(--space-3) var(--space-5);
            font-weight: 600; font-size: 14px; border: none;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            display: inline-flex; align-items: center; gap: var(--space-2);
        }
        .btn-primary { background-color: var(--accent-blue); color: white; }
        .btn-primary:hover { background-color: #0051D5; transform: translateY(-1px); box-shadow: var(--shadow-md); }
        .btn-primary:active { transform: translateY(0); }

        /* ========================================
           Empty States
           ======================================== */

        .text-center.text-muted { color: var(--geist-gray) !important; }
        .text-muted { color: var(--geist-gray-light) !important; }

        /* ========================================
           Footer
           ======================================== */

        footer {
            background: var(--geist-foreground);
            color: var(--geist-background);
            padding: var(--space-8) 0;
            margin-top: var(--space-12);
            border-top: 1px solid var(--geist-border);
        }

        /* ========================================
           Responsive - Mobile First
           ======================================== */

        @media (max-width: 768px) {
            body { font-size: 14px; }
            .stat-card { padding: var(--space-3) !important; }
            .stat-card h6 { font-size: 10px !important; margin-bottom: var(--space-1) !important; }
            .stat-number { font-size: 18px !important; }
            .stat-icon { width: 32px !important; height: 32px !important; font-size: 16px !important; position: absolute; top: 12px; right: 12px; }
            .card-body { padding: var(--space-4); }
            .table { font-size: 13px; }
            .navbar-brand { font-size: 16px; }
        }

        /* ========================================
           Utilities
           ======================================== */

        .field-card { height: 100%; }
        .field-card img { height: 200px; object-fit: cover; border-radius: var(--radius-md); }

        /* Dark mode support disabled to keep background white */
    </style>
</head>
<body>

<!-- Overlay backdrop -->
<div class="nav-overlay" id="navOverlay" onclick="closeNavMenu()"></div>

<!-- Navbar -->
<nav class="navbar" id="siteNav">
    <div class="container d-flex align-items-center justify-content-between">
        <a class="navbar-brand" href="<?php echo APP_URL; ?>/customer/home.php">
            <i class="bi bi-calendar-check"></i> <?php echo APP_NAME; ?>
        </a>

        <!-- Hamburger button -->
        <?php
        $pelunasanCount = 0;
        if (isLoggedIn() && isset($pdo)) {
            try {
                $sp = $pdo->prepare("SELECT COUNT(*) as c FROM bookings WHERE user_id = ? AND status = 'dp_paid'");
                $sp->execute([$_SESSION['user_id']]);
                $pelunasanCount = (int)($sp->fetch()['c'] ?? 0);
            } catch (Exception $e) {}
        }
        ?>
        <button class="nav-hamburger" id="navHamburger" onclick="toggleNavMenu()" aria-label="Menu">
            <i class="bi bi-list" id="hamburgerIcon"></i>
            <?php if ($pelunasanCount > 0): ?>
            <span class="badge-dot"></span>
            <?php endif; ?>
        </button>
    </div>
</nav>

<!-- Dropdown panel -->
<div class="nav-dropdown" id="navDropdown">
    <?php if (isLoggedIn()): ?>
    <div class="nav-user-info">
        <div class="user-name">
            <i class="bi bi-person-fill me-1" style="color:#007AFF;"></i>
            <?php echo htmlspecialchars($_SESSION['user_name'] ?? 'Customer'); ?>
        </div>
        <div class="user-email"><?php echo htmlspecialchars($_SESSION['user_email'] ?? ''); ?></div>
    </div>
    <?php endif; ?>

    <a href="<?php echo APP_URL; ?>/customer/home.php" onclick="closeNavMenu()"
       class="<?php echo (basename($_SERVER['PHP_SELF']) == 'home.php') ? 'active-link' : ''; ?>">
        <i class="bi bi-house-fill"></i> Home
    </a>
    <a href="<?php echo APP_URL; ?>/about.php" onclick="closeNavMenu()"
       class="<?php echo (basename($_SERVER['PHP_SELF']) == 'about.php') ? 'active-link' : ''; ?>">
        <i class="bi bi-info-circle"></i> Info Lapangan
    </a>

    <?php if (isLoggedIn()): ?>
    <div class="nav-divider"></div>
    <a href="<?php echo APP_URL; ?>/customer/index.php" onclick="closeNavMenu()"
       class="<?php echo (basename($_SERVER['PHP_SELF']) == 'index.php' && strpos($_SERVER['PHP_SELF'], '/customer/') !== false) ? 'active-link' : ''; ?>">
        <i class="bi bi-speedometer2"></i> Dashboard
    </a>
    <a href="<?php echo APP_URL; ?>/customer/booking/create.php" onclick="closeNavMenu()"
       class="<?php echo (strpos($_SERVER['PHP_SELF'], '/booking/create') !== false) ? 'active-link' : ''; ?>">
        <i class="bi bi-calendar-plus"></i> Booking Baru
    </a>
    <a href="<?php echo APP_URL; ?>/customer/booking/pelunasan.php" onclick="closeNavMenu()"
       class="<?php echo (strpos($_SERVER['PHP_SELF'], 'pelunasan') !== false) ? 'active-link' : ''; ?>">
        <i class="bi bi-cash-coin"></i> Pelunasan
        <?php if ($pelunasanCount > 0): ?>
        <span class="nav-badge"><?php echo $pelunasanCount; ?></span>
        <?php endif; ?>
    </a>
    <a href="<?php echo APP_URL; ?>/customer/profile.php" onclick="closeNavMenu()"
       class="<?php echo (basename($_SERVER['PHP_SELF']) == 'profile.php') ? 'active-link' : ''; ?>">
        <i class="bi bi-person-circle"></i> Profil Saya
    </a>
    <div class="nav-divider"></div>
    <a href="<?php echo APP_URL; ?>/auth/logout.php" class="btn-logout"
       onclick="return doLogout('<?php echo APP_URL; ?>/auth/logout.php')">
        <i class="bi bi-box-arrow-right"></i> Logout
    </a>
    <?php else: ?>
    <div class="nav-divider"></div>
    <a href="<?php echo APP_URL; ?>/auth/login.php" onclick="closeNavMenu()">
        <i class="bi bi-box-arrow-in-right"></i> Masuk / Login
    </a>
    <a href="<?php echo APP_URL; ?>/auth/register.php" onclick="closeNavMenu()">
        <i class="bi bi-person-plus"></i> Daftar Akun
    </a>
    <?php endif; ?>
</div>

<script>
function toggleNavMenu() {
    const dropdown = document.getElementById('navDropdown');
    const overlay  = document.getElementById('navOverlay');
    const icon     = document.getElementById('hamburgerIcon');
    const isOpen   = dropdown.classList.contains('open');
    if (isOpen) {
        dropdown.classList.remove('open');
        overlay.classList.remove('open');
        icon.className = 'bi bi-list';
    } else {
        dropdown.classList.add('open');
        overlay.classList.add('open');
        icon.className = 'bi bi-x-lg';
    }
}
function closeNavMenu() {
    document.getElementById('navDropdown').classList.remove('open');
    document.getElementById('navOverlay').classList.remove('open');
    document.getElementById('hamburgerIcon').className = 'bi bi-list';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNavMenu(); });
function doLogout(url) {
    // Tutup overlay dulu agar tidak menghalangi
    closeNavMenu();
    // Tampilkan konfirmasi setelah dropdown hilang
    setTimeout(function() {
        if (confirm('Yakin ingin logout?')) {
            window.location.href = url;
        }
    }, 50);
    return false; // Mencegah default link navigation
}
</script>

    <main class="container my-4">
