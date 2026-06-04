<?php
/**
 * Halaman Publik - Informasi Lapangan (Tanpa Login)
 * Dapat diakses oleh siapa saja tanpa perlu mendaftar
 */

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/functions.php';

$isLoggedIn = isLoggedIn();

// Ambil data lapangan aktif
try {
    $stmt = $pdo->query("SELECT * FROM fields WHERE status = 'active' ORDER BY price DESC");
    $fields = $stmt->fetchAll();
} catch (PDOException $e) {
    $fields = [];
}

// Jadwal hari ini yang terisi (untuk info ketersediaan)
$today = date('Y-m-d');
try {
    $stmt = $pdo->prepare("
        SELECT b.start_time, b.end_time, b.status, f.name as field_name
        FROM bookings b
        JOIN fields f ON b.field_id = f.id
        WHERE b.booking_date = ? AND b.status NOT IN ('cancelled')
        ORDER BY b.start_time ASC
    ");
    $stmt->execute([$today]);
    $todayBookings = $stmt->fetchAll();
} catch (PDOException $e) {
    $todayBookings = [];
}

$pageTitle = "Informasi Lapangan";
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $pageTitle; ?> — <?php echo APP_NAME; ?></title>
    <meta name="description" content="Informasi lengkap <?php echo STADIUM_NAME; ?> — fasilitas, harga sewa lapangan, jam operasional, dan cara booking. Buka untuk semua pengunjung.">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --blue:   #007AFF;
            --blue-d: #0051D5;
            --green:  #34C759;
            --orange: #FF9500;
            --red:    #FF3B30;
            --indigo: #5856D6;
            --gray1:  #111;
            --gray2:  #444;
            --gray3:  #888;
            --gray4:  #ccc;
            --gray5:  #f5f5f7;
            --white:  #fff;
        }

        * { box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, sans-serif;
            color: var(--gray1);
            background: var(--white);
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
        }

        /* ─── NAVBAR ─── */
        .site-nav {
            position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
            background: rgba(0,0,0,0.55);
            backdrop-filter: blur(16px) saturate(1.8);
            -webkit-backdrop-filter: blur(16px);
            border-bottom: 1px solid rgba(255,255,255,0.08);
            padding: 14px 0;
            transition: background 0.3s;
        }
        .site-nav.scrolled {
            background: rgba(255,255,255,0.95);
            border-bottom-color: rgba(0,0,0,0.08);
            box-shadow: 0 2px 20px rgba(0,0,0,0.08);
        }
        .site-nav .brand {
            font-weight: 800; font-size: 1.1rem; letter-spacing: -0.3px;
            color: white; text-decoration: none; display: flex; align-items: center; gap: 8px;
        }
        .site-nav.scrolled .brand { color: var(--gray1); }

        /* Hamburger button */
        .nav-hamburger {
            background: rgba(255,255,255,0.12);
            border: 1.5px solid rgba(255,255,255,0.25);
            border-radius: 12px;
            width: 44px; height: 44px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all 0.2s;
            color: white; font-size: 20px;
        }
        .nav-hamburger:hover { background: rgba(255,255,255,0.22); }
        .site-nav.scrolled .nav-hamburger {
            background: var(--gray5);
            border-color: var(--gray4);
            color: var(--gray1);
        }
        .site-nav.scrolled .nav-hamburger:hover { background: #e8e8e8; }

        /* Dropdown menu panel */
        .nav-dropdown {
            position: fixed; top: 72px; right: 1rem;
            background: white;
            border-radius: 18px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 2px 12px rgba(0,0,0,0.08);
            border: 1px solid rgba(0,0,0,0.07);
            min-width: 220px;
            padding: 10px;
            z-index: 999;
            opacity: 0; visibility: hidden;
            transform: translateY(-8px) scale(0.97);
            transform-origin: top right;
            transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
        }
        .nav-dropdown.open {
            opacity: 1; visibility: visible;
            transform: translateY(0) scale(1);
        }
        .nav-dropdown a {
            display: flex; align-items: center; gap: 10px;
            padding: 10px 14px; border-radius: 10px;
            color: var(--gray2); font-size: 14px; font-weight: 500;
            text-decoration: none; transition: all 0.15s;
        }
        .nav-dropdown a:hover { background: var(--gray5); color: var(--gray1); }
        .nav-dropdown a i { width: 20px; text-align: center; color: var(--gray3); font-size: 15px; }
        .nav-dropdown .nav-divider {
            height: 1px; background: #f0f0f0; margin: 6px 0;
        }
        .nav-dropdown .btn-booking {
            background: var(--blue); color: white;
            font-weight: 700; border-radius: 10px;
            justify-content: center;
            margin-top: 4px;
        }
        .nav-dropdown .btn-booking:hover { background: var(--blue-d); color: white; }
        .nav-dropdown .btn-booking i { color: white; }
        .nav-dropdown .btn-dashboard {
            background: #EFF5FF; color: var(--blue);
            font-weight: 700; border-radius: 10px;
            justify-content: center;
        }
        .nav-dropdown .btn-dashboard:hover { background: #dbeafe; color: var(--blue-d); }

        /* Overlay backdrop */
        .nav-overlay {
            position: fixed; inset: 0; z-index: 998;
            display: none;
        }
        .nav-overlay.open { display: block; }

        /* ─── HERO ─── */
        .hero {
            min-height: 100vh;
            background: linear-gradient(175deg, #020918 0%, #0a1628 40%, #0d1f3c 70%, #122748 100%);
            display: flex; align-items: center;
            position: relative; overflow: hidden;
            padding-top: 80px;
        }
        .hero-bg-orb {
            position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none;
        }
        .orb1 { width: 600px; height: 600px; background: rgba(0,122,255,0.18); top: -100px; left: -150px; }
        .orb2 { width: 400px; height: 400px; background: rgba(88,86,214,0.15); bottom: -50px; right: -100px; }
        .orb3 { width: 300px; height: 300px; background: rgba(52,199,89,0.08); top: 50%; left: 50%; }

        .hero-tag {
            display: inline-flex; align-items: center; gap: 8px;
            background: rgba(0,122,255,0.15); border: 1px solid rgba(0,122,255,0.3);
            color: #6EB7FF; padding: 6px 16px; border-radius: 20px;
            font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
            margin-bottom: 1.5rem;
        }
        .hero h1 {
            font-size: clamp(2.2rem, 5vw, 3.8rem);
            font-weight: 900; color: white; line-height: 1.1;
            letter-spacing: -1.5px; margin-bottom: 1.25rem;
        }
        .hero h1 span { color: #6EB7FF; }
        .hero p.lead {
            font-size: 1.05rem; color: rgba(255,255,255,0.65);
            line-height: 1.7; margin-bottom: 2rem; max-width: 520px;
        }
        .hero-cta { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 3rem; }
        .btn-hero-primary {
            background: var(--blue); color: white; border: none;
            padding: 14px 28px; border-radius: 14px; font-size: 15px;
            font-weight: 700; text-decoration: none; display: inline-flex;
            align-items: center; gap: 8px; transition: all 0.25s;
            box-shadow: 0 8px 24px rgba(0,122,255,0.35);
        }
        .btn-hero-primary:hover { background: var(--blue-d); color: white; transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,122,255,0.45); }
        .btn-hero-ghost {
            background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.85);
            border: 1.5px solid rgba(255,255,255,0.15);
            padding: 14px 28px; border-radius: 14px; font-size: 15px;
            font-weight: 600; text-decoration: none; display: inline-flex;
            align-items: center; gap: 8px; transition: all 0.25s;
            backdrop-filter: blur(8px);
        }
        .btn-hero-ghost:hover { background: rgba(255,255,255,0.15); color: white; border-color: rgba(255,255,255,0.3); }
        .hero-stats { display: flex; gap: 2rem; flex-wrap: wrap; }
        .hero-stat { }
        .hero-stat .num { font-size: 1.6rem; font-weight: 800; color: white; letter-spacing: -0.5px; }
        .hero-stat .lbl { font-size: 12px; color: rgba(255,255,255,0.5); font-weight: 500; }

        /* Hero image side */
        .hero-img-wrapper {
            border-radius: 24px; overflow: hidden;
            box-shadow: 0 40px 80px rgba(0,0,0,0.5);
            border: 1px solid rgba(255,255,255,0.1);
            position: relative;
        }
        .hero-img-wrapper img { width: 100%; height: 480px; object-fit: cover; display: block; }
        .img-overlay {
            position: absolute; bottom: 0; left: 0; right: 0;
            background: linear-gradient(transparent, rgba(0,0,0,0.85));
            padding: 2rem 1.5rem 1.5rem;
        }
        .img-badge {
            display: inline-flex; align-items: center; gap: 6px;
            background: rgba(0,122,255,0.9); color: white;
            padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700;
            margin-bottom: 0.5rem;
        }

        /* ─── SECTION WRAPPER ─── */
        section { padding: 80px 0; }
        .section-tag {
            display: inline-block;
            background: #EFF5FF; color: var(--blue);
            padding: 5px 14px; border-radius: 20px;
            font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;
            margin-bottom: 1rem;
        }
        .section-title {
            font-size: clamp(1.6rem, 3.5vw, 2.4rem);
            font-weight: 800; letter-spacing: -0.8px; line-height: 1.15;
        }
        .section-sub { color: var(--gray3); max-width: 560px; }

        /* ─── FIELD CARDS ─── */
        .field-card {
            border: 1.5px solid #eee;
            border-radius: 20px; overflow: hidden; background: white;
            transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
            box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }
        .field-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 16px 40px rgba(0,0,0,0.12);
            border-color: var(--blue);
        }
        .field-card img { width: 100%; height: 200px; object-fit: cover; }
        .field-card .fc-body { padding: 1.5rem; }
        .field-type-badge {
            display: inline-flex; align-items: center; gap: 5px;
            background: #EFF5FF; color: var(--blue);
            padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;
            margin-bottom: 0.75rem; text-transform: uppercase;
        }
        .field-name { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.25rem; }
        .field-price { font-size: 1.4rem; font-weight: 800; color: var(--blue); }
        .field-price span { font-size: 13px; font-weight: 400; color: var(--gray3); }
        .field-feat {
            display: flex; flex-wrap: wrap; gap: 8px; margin-top: 1rem;
        }
        .feat-chip {
            display: flex; align-items: center; gap: 5px;
            background: var(--gray5); padding: 4px 10px; border-radius: 8px;
            font-size: 12px; color: var(--gray2); font-weight: 500;
        }
        .btn-cta-field {
            display: block; text-align: center; margin-top: 1.25rem;
            background: var(--blue); color: white; border-radius: 12px;
            padding: 11px; font-size: 14px; font-weight: 700;
            text-decoration: none; transition: all 0.2s;
        }
        .btn-cta-field:hover { background: var(--blue-d); color: white; }
        .btn-cta-preview {
            display: block; text-align: center; margin-top: 1.25rem;
            background: var(--gray5); color: var(--gray2); border-radius: 12px;
            border: 1.5px solid #e4e4e4; padding: 10px; font-size: 14px; font-weight: 600;
            text-decoration: none; transition: all 0.2s;
        }
        .btn-cta-preview:hover { border-color: var(--blue); color: var(--blue); background: #EFF5FF; }

        /* ─── FACILITIES ─── */
        .fac-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 1.5rem;
        }
        .fac-card {
            border: 1.5px solid #eee; border-radius: 18px; padding: 1.75rem 1.5rem;
            text-align: center; background: white;
            transition: all 0.25s;
        }
        .fac-card:hover {
            border-color: var(--blue);
            box-shadow: 0 8px 28px rgba(0,122,255,0.1);
            transform: translateY(-4px);
        }
        .fac-icon {
            width: 56px; height: 56px; border-radius: 16px;
            display: flex; align-items: center; justify-content: center;
            font-size: 26px; margin: 0 auto 1rem;
        }
        .fac-card h6 { font-weight: 700; margin-bottom: 0.4rem; }
        .fac-card p { font-size: 13px; color: var(--gray3); margin: 0; }

        /* ─── HOW IT WORKS ─── */
        .steps { display: flex; gap: 2rem; flex-wrap: wrap; }
        .step {
            flex: 1; min-width: 200px;
            display: flex; gap: 1rem; align-items: flex-start;
        }
        .step-num {
            width: 40px; height: 40px; border-radius: 12px;
            background: linear-gradient(135deg, var(--blue), var(--blue-d));
            color: white; font-weight: 800; font-size: 16px;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,122,255,0.35);
        }
        .step h6 { font-weight: 700; margin-bottom: 4px; }
        .step p { font-size: 13.5px; color: var(--gray3); margin: 0; }

        /* ─── TODAY SCHEDULE ─── */
        .schedule-block {
            background: var(--gray5); border-radius: 18px; padding: 1.5rem;
        }
        .schedule-item {
            display: flex; align-items: center; gap: 1rem;
            background: white; border-radius: 12px; padding: 0.875rem 1rem;
            margin-bottom: 0.75rem; border: 1.5px solid #eee;
        }
        .schedule-item:last-child { margin-bottom: 0; }
        .sch-time {
            font-weight: 800; font-size: 15px; min-width: 95px; color: var(--gray1);
        }
        .sch-field { font-size: 13px; color: var(--gray3); flex: 1; }
        .sch-badge {
            font-size: 10.5px; font-weight: 700; padding: 3px 10px; border-radius: 20px;
        }

        /* ─── PRICING ─── */
        .pricing-card {
            background: white; border-radius: 20px; padding: 2rem;
            border: 1.5px solid #eee; position: relative; overflow: hidden;
            transition: all 0.25s;
        }
        .pricing-card.featured {
            border-color: var(--blue);
            box-shadow: 0 8px 32px rgba(0,122,255,0.15);
        }
        .pricing-card.featured::before {
            content: 'Terpopuler';
            position: absolute; top: 16px; right: -28px;
            background: var(--blue); color: white;
            font-size: 10px; font-weight: 700; text-transform: uppercase;
            padding: 4px 32px; letter-spacing: 0.5px;
            transform: rotate(45deg);
        }
        .pricing-type { font-size: 12px; font-weight: 700; color: var(--gray3); text-transform: uppercase; letter-spacing: 0.5px; }
        .pricing-price { font-size: 2.2rem; font-weight: 900; color: var(--gray1); letter-spacing: -1px; }
        .pricing-price sub { font-size: 14px; font-weight: 500; color: var(--gray3); }
        .pricing-note { font-size: 13px; color: var(--gray3); margin-bottom: 1.5rem; }
        .pricing-feat li { font-size: 13.5px; color: var(--gray2); padding: 6px 0; border-bottom: 1px solid var(--gray5); display: flex; align-items: center; gap: 8px; }
        .pricing-feat li:last-child { border-bottom: none; }

        /* ─── CTA BANNER ─── */
        .cta-banner {
            background: linear-gradient(135deg, #020918 0%, #051230 40%, #000c22 100%);
            border-radius: 28px; padding: 4rem 3rem; text-align: center;
            position: relative; overflow: hidden;
        }
        .cta-banner::before {
            content: '';
            position: absolute; top: -80px; left: 50%;
            transform: translateX(-50%);
            width: 600px; height: 300px;
            background: radial-gradient(ellipse, rgba(0,122,255,0.2) 0%, transparent 70%);
        }
        .cta-banner h2 {
            font-size: clamp(1.8rem, 4vw, 2.8rem);
            font-weight: 900; color: white; letter-spacing: -1px; position: relative;
        }
        .cta-banner p { color: rgba(255,255,255,0.6); font-size: 1.05rem; position: relative; }
        .cta-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; position: relative; }
        .btn-cta-white {
            background: white; color: var(--blue); padding: 14px 32px;
            border-radius: 14px; font-weight: 700; font-size: 15px;
            text-decoration: none; display: inline-flex; align-items: center; gap: 8px;
            transition: all 0.2s; box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        }
        .btn-cta-white:hover { background: #EFF5FF; color: var(--blue-d); transform: translateY(-2px); }
        .btn-cta-outline {
            background: transparent; color: rgba(255,255,255,0.8);
            border: 1.5px solid rgba(255,255,255,0.25);
            padding: 14px 28px; border-radius: 14px; font-weight: 600; font-size: 15px;
            text-decoration: none; display: inline-flex; align-items: center; gap: 8px;
            transition: all 0.2s;
        }
        .btn-cta-outline:hover { background: rgba(255,255,255,0.1); color: white; border-color: rgba(255,255,255,0.4); }

        /* ─── CONTACT ─── */
        .contact-item {
            display: flex; gap: 1rem; align-items: flex-start;
            padding: 1.25rem; background: var(--gray5); border-radius: 16px;
            margin-bottom: 1rem; transition: all 0.2s;
        }
        .contact-item:hover { background: #EFF5FF; }
        .contact-icon {
            width: 44px; height: 44px; border-radius: 12px;
            background: var(--blue); color: white;
            display: flex; align-items: center; justify-content: center;
            font-size: 18px; flex-shrink: 0;
        }
        .contact-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; color: var(--gray3); }
        .contact-val { font-weight: 600; font-size: 0.95rem; }

        /* ─── SOCIAL ─── */
        .social-link {
            width: 44px; height: 44px; border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            font-size: 20px; text-decoration: none; transition: all 0.2s;
            border: 1.5px solid #eee;
        }
        .social-link:hover { transform: translateY(-3px); box-shadow: 0 6px 16px rgba(0,0,0,0.12); }
        .sl-ig { color: #E1306C; }
        .sl-fb { color: #1877F2; }
        .sl-wa { color: #25D366; }
        .sl-tt { color: #111; }

        /* ─── MAP ─── */
        .map-wrap { border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }

        /* ─── FOOTER ─── */
        .site-footer {
            background: #040d1e; color: rgba(255,255,255,0.5);
            padding: 2rem 0; text-align: center; font-size: 13px;
        }
        .site-footer a { color: rgba(255,255,255,0.7); text-decoration: none; }
        .site-footer a:hover { color: white; }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 768px) {
            section { padding: 60px 0; }
            .cta-banner { padding: 2.5rem 1.5rem; }
            .hero h1 { font-size: 2rem; }
            .hero-img-wrapper img { height: 280px; }
            .steps { flex-direction: column; }
            .site-nav .nav-links .nl { display: none; }
        }

        /* ─── SMOOTH SCROLL ─── */
        html { scroll-behavior: smooth; }

        /* ─── ANIMATE ─── */
        .fade-in { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .fade-in.visible { opacity: 1; transform: translateY(0); }
    </style>
</head>
<body>

<!-- ═══════════════════════════════════════
     NAVBAR
═══════════════════════════════════════ -->
<!-- Overlay (close dropdown when clicking outside) -->
<div class="nav-overlay" id="navOverlay" onclick="closeNavMenu()"></div>

<nav class="site-nav" id="siteNav">
    <div class="container d-flex align-items-center justify-content-between">
        <a href="<?php echo APP_URL; ?>/index.php" class="brand">
            <i class="bi bi-lightning-charge-fill" style="color:#6EB7FF;"></i>
            <?php echo APP_NAME; ?>
        </a>
        <!-- Hamburger button -->
        <button class="nav-hamburger" id="navHamburger" onclick="toggleNavMenu()" aria-label="Menu">
            <i class="bi bi-list" id="hamburgerIcon"></i>
        </button>
    </div>
</nav>

<!-- Dropdown panel -->
<div class="nav-dropdown" id="navDropdown">
    <a href="#fasilitas" onclick="closeNavMenu()"><i class="bi bi-stars"></i> Fasilitas</a>
    <a href="#harga" onclick="closeNavMenu()"><i class="bi bi-tag"></i> Harga</a>
    <a href="#jadwal" onclick="closeNavMenu()"><i class="bi bi-calendar3"></i> Jadwal</a>
    <a href="#faq" onclick="closeNavMenu()"><i class="bi bi-question-circle"></i> FAQ</a>
    <a href="#kontak" onclick="closeNavMenu()"><i class="bi bi-telephone"></i> Kontak</a>
    <div class="nav-divider"></div>
    <?php if ($isLoggedIn): ?>
        <a href="<?php echo APP_URL; ?>/customer/index.php" class="btn-dashboard">
            <i class="bi bi-speedometer2"></i> Dashboard Saya
        </a>
    <?php else: ?>
        <a href="<?php echo APP_URL; ?>/auth/login.php" onclick="closeNavMenu()">
            <i class="bi bi-box-arrow-in-right"></i> Masuk / Login
        </a>
        <a href="<?php echo APP_URL; ?>/auth/booking_redirect.php" class="btn-booking" onclick="closeNavMenu()">
            <i class="bi bi-calendar-plus"></i> Booking Sekarang
        </a>
    <?php endif; ?>
</div>

<!-- ═══════════════════════════════════════
     HERO
═══════════════════════════════════════ -->
<section class="hero" id="beranda">
    <div class="hero-bg-orb orb1"></div>
    <div class="hero-bg-orb orb2"></div>
    <div class="hero-bg-orb orb3"></div>

    <div class="container py-5">
        <div class="row align-items-center g-5">
            <div class="col-lg-6">
                <div class="hero-tag">
                    <i class="bi bi-geo-alt-fill"></i> <?php echo APP_ADDRESS; ?>
                </div>
                <h1><?php echo STADIUM_NAME; ?></h1>
                <p class="lead">
                    Lapangan sepak bola modern berstandar internasional. Rumput sintetis premium,
                    pencahayaan LED 2000 lux, dan fasilitas lengkap untuk pengalaman bermain terbaik.
                </p>
                <div class="hero-cta">
                    <?php if (!$isLoggedIn): ?>
                        <a href="<?php echo APP_URL; ?>/auth/booking_redirect.php" class="btn-hero-primary">
                            <i class="bi bi-calendar-plus"></i> Booking Sekarang
                        </a>
                    <?php else: ?>
                        <a href="<?php echo APP_URL; ?>/customer/booking/create.php" class="btn-hero-primary">
                            <i class="bi bi-calendar-plus"></i> Booking Sekarang
                        </a>
                    <?php endif; ?>
                </div>
                <div class="hero-stats">
                    <div class="hero-stat">
                        <div class="num">FIFA</div>
                        <div class="lbl">Standard Grass</div>
                    </div>
                    <div class="hero-stat">
                        <div class="num">2000</div>
                        <div class="lbl">Lux LED Light</div>
                    </div>
                    <div class="hero-stat">
                        <div class="num">Ready</div>
                        <div class="lbl">Seats Capacity</div>
                    </div>
                    <div class="hero-stat">
                        <div class="num">24/7</div>
                        <div class="lbl">Booking Online</div>
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="hero-img-wrapper">
                    <img src="<?php echo IMG_HERO; ?>" 
                         onerror="this.onerror=null;this.src='https://picsum.photos/seed/stadium/900/600'" 
                         alt="Lapangan Stadion">
                    <div class="img-overlay">
                        <div class="img-badge"><i class="bi bi-patch-check-fill"></i> Beroperasi Aktif</div>
                        <div style="color:rgba(255,255,255,0.9); font-size:14px; font-weight:600;"><?php echo APP_ADDRESS; ?></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>


<!-- ═══════════════════════════════════════
     FASILITAS
═══════════════════════════════════════ -->
<section id="fasilitas">
    <div class="container">
        <div class="row align-items-center g-5 mb-5 fade-in">
            <div class="col-lg-5">
                <div class="section-tag">Fasilitas</div>
                <h2 class="section-title">Semua yang Anda Butuhkan</h2>
                <p class="section-sub mt-3">
                    Kami menyediakan fasilitas lengkap agar pengalaman bermain Anda semakin nyaman
                    dari awal hingga akhir.
                </p>
            </div>
        </div>
        <div class="fac-grid fade-in">
            <div class="fac-card">
                <div class="fac-icon" style="background:#EFF5FF; color:var(--blue);">🏟️</div>
                <h6>Tribun Penonton</h6>
                <p>Kapasitas memadai dengan pandangan luas ke seluruh lapangan.</p>
            </div>
            <div class="fac-card">
                <div class="fac-icon" style="background:#E8FAF0; color:var(--green);">💡</div>
                <h6>Lampu LED 2000 Lux</h6>
                <p>Pencahayaan powerful untuk pertandingan malam hari seterang siang.</p>
            </div>
            <div class="fac-card">
                <div class="fac-icon" style="background:#FFF5E6; color:var(--orange);">🚿</div>
                <h6>Ruang Ganti & Shower</h6>
                <p>Kamar mandi bersih dan nyaman untuk semua pemain.</p>
            </div>
            <div class="fac-card">
                <div class="fac-icon" style="background:#F0EEFF; color:var(--indigo);">🅿️</div>
                <h6>Parkir Luas & Aman</h6>
                <p>Area parkir yang memadai untuk kendaraan roda dua dan empat.</p>
            </div>
            <div class="fac-card">
                <div class="fac-icon" style="background:#FFF0EF; color:var(--red);">🍜</div>
                <h6>Kantin</h6>
                <p>Aneka menu makanan dan minuman segar untuk mengisi energi.</p>
            </div>
            <div class="fac-card">
                <div class="fac-icon" style="background:#EFF5FF; color:var(--blue);">🕌</div>
                <h6>Mushola</h6>
                <p>Tempat ibadah yang bersih dan nyaman tersedia di area kompleks.</p>
            </div>

            <div class="fac-card">
                <div class="fac-icon" style="background:#FFF5E6; color:var(--orange);">🏥</div>
                <h6>P3K Siaga</h6>
                <p>Petugas P3K tersedia untuk memastikan keselamatan semua pemain.</p>
            </div>
        </div>
    </div>
</section>

<!-- ═══════════════════════════════════════
     CARA BOOKING (HOW IT WORKS)
═══════════════════════════════════════ -->
<section style="background:linear-gradient(135deg,#f5f7ff 0%,#eaf2ff 100%);">
    <div class="container fade-in">
        <div class="text-center mb-5">
            <div class="section-tag">Cara Booking</div>
            <h2 class="section-title">Cukup 4 Langkah Mudah</h2>
            <p class="section-sub mx-auto mt-2">Booking lapangan tidak pernah semudah ini. Daftar sekarang dan amankan slot favoritmu!</p>
        </div>
        <div class="steps">
            <div class="step">
                <div class="step-num">1</div>
                <div>
                    <h6>Daftar Akun</h6>
                    <p>Buat akun gratis dengan nama, email, dan nomor telepon Anda. Proses hanya butuh 1 menit.</p>
                </div>
            </div>
            <div class="step">
                <div class="step-num">2</div>
                <div>
                    <h6>Pilih Lapangan & Waktu</h6>
                    <p>Pilih jenis lapangan, tanggal, dan jam bermain yang tersedia melalui kalender real-time.</p>
                </div>
            </div>
            <div class="step">
                <div class="step-num">3</div>
                <div>
                    <h6>Bayar Minimal DP</h6>
                    <p>Amankan slot Anda dengan membayar minimal DP via transfer bank dan upload bukti.</p>
                </div>
            </div>
            <div class="step">
                <div class="step-num">4</div>
                <div>
                    <h6>Main & Lunasi</h6>
                    <p>Datang, main, dan selesaikan pembayaran sisa. Nikmati lapangan terbaik kami!</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ═══════════════════════════════════════
     HARGA / PRICING
═══════════════════════════════════════ -->
<section id="harga">
    <div class="container">
        <div class="text-center mb-5 fade-in">
            <div class="section-tag">Tarif Sewa</div>
            <h2 class="section-title">Harga Transparan, Tidak Ada Biaya Tersembunyi</h2>
            <p class="section-sub mx-auto mt-2">Harga bervariasi berdasarkan slot waktu dan tipe hari. Cukup bayar minimal DP untuk mengamankan slot.</p>
        </div>
        <!-- Slot Pricing Table -->
        <div class="fade-in" style="overflow-x:auto;background:white;border:1.5px solid #eee;border-radius:20px;padding:1.5rem 2rem;">
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr style="border-bottom:2px solid #eee;">
                        <th style="padding:12px 10px;text-align:left;font-size:13px;font-weight:700;color:#555;">Slot Waktu</th>
                        <th style="padding:12px 10px;text-align:center;font-size:13px;font-weight:700;color:#1a7c36;background:#EDFAF2;border-radius:8px 0 0 8px;">Sen – Kam <br><span style="font-size:10px;font-weight:500;color:#555;">Weekdays</span></th>
                        <th style="padding:12px 10px;text-align:center;font-size:13px;font-weight:700;color:#FF9500;background:#FFF6EC;">Jumat <br><span style="font-size:10px;font-weight:500;color:#555;">Weekend Awal</span></th>
                        <th style="padding:12px 10px;text-align:center;font-size:13px;font-weight:700;color:#FF3B30;background:#FFF0EF;border-radius:0 8px 8px 0;">Sab / Min / Libur <br><span style="font-size:10px;font-weight:500;color:#555;">Weekend & Publik Holiday</span></th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    $dayColorWd  = '#EDFAF2';
                    $dayColorFri = '#FFF6EC';
                    $dayColorWk  = '#FFF0EF';
                    foreach ($BOOKING_PRICE_SLOTS as [$sh, $eh, $wd, $fri, $wk]):
                        $slotLabel = sprintf('%02d:00 – %02d:00', $sh, $eh);
                        $fWd  = $wd  !== null ? 'Rp ' . number_format($wd,  0, ',', '.') : '<span style="color:#ccc;font-size:12px;">N/A</span>';
                        $fFri = $fri !== null ? 'Rp ' . number_format($fri, 0, ',', '.') : '<span style="color:#ccc;font-size:12px;">N/A</span>';
                        $fWk  = $wk  !== null ? 'Rp ' . number_format($wk,  0, ',', '.') : '<span style="color:#ccc;font-size:12px;">N/A</span>';
                    ?>
                    <tr style="border-bottom:1px solid #f4f4f4;">
                        <td style="padding:12px 10px;font-weight:700;color:#111;white-space:nowrap;"><i class="bi bi-clock me-2" style="color:#007AFF;"></i><?php echo $slotLabel; ?></td>
                        <td style="padding:12px 10px;text-align:center;background:#EDFAF2;font-weight:600;font-size:14px;color:#1a7c36;"><?php echo $fWd; ?></td>
                        <td style="padding:12px 10px;text-align:center;background:#FFF6EC;font-weight:600;font-size:14px;color:#FF9500;"><?php echo $fFri; ?></td>
                        <td style="padding:12px 10px;text-align:center;background:#FFF0EF;font-weight:600;font-size:14px;color:#FF3B30;"><?php echo $fWk; ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid #f0f0f0;display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;">
                <span style="font-size:12px;color:#888;">* Harga per slot 2 jam. Jika booking melewati beberapa slot, harga dijumlahkan.</span>
                <span style="font-size:12px;font-weight:700;color:#34C759;"><i class="bi bi-check-circle-fill me-1"></i>Minimal DP <?php echo formatCurrency(MIN_DP_AMOUNT); ?></span>
                <span style="font-size:12px;font-weight:700;color:#007AFF;"><i class="bi bi-book me-1"></i>Booking online 24/7</span>
            </div>
        </div>
        <div class="text-center mt-4 fade-in">
            <?php if ($isLoggedIn): ?>
            <a href="<?php echo APP_URL; ?>/customer/booking/create.php" class="btn-cta-white" style="background:#007AFF;color:white;padding:14px 36px;border-radius:14px;font-weight:700;font-size:15px;text-decoration:none;display:inline-flex;align-items:center;gap:8px;">
                <i class="bi bi-calendar-plus"></i> Booking Sekarang
            </a>
            <?php else: ?>
            <a href="<?php echo APP_URL; ?>/auth/booking_redirect.php" class="btn-cta-white" style="background:#007AFF;color:white;padding:14px 36px;border-radius:14px;font-weight:700;font-size:15px;text-decoration:none;display:inline-flex;align-items:center;gap:8px;">
                <i class="bi bi-calendar-plus"></i> Booking Sekarang
            </a>
            <?php endif; ?>
        </div>
    </div>
</section>

<!-- ═══════════════════════════════════════
     JADWAL HARI INI
═══════════════════════════════════════ -->
<section id="jadwal" style="background:#fafafa;">
    <div class="container">
        <div class="row g-5 align-items-start fade-in">
            <div class="col-lg-5">
                <div class="section-tag">Jadwal Hari Ini</div>
                <h2 class="section-title">Cek Ketersediaan Lapangan</h2>
                <p class="section-sub mt-3">
                    Lihat slot yang sudah terisi hari ini — <strong><?php echo date('d F Y'); ?></strong>.
                    Slot kosong berarti lapangan siap untuk Anda booking.
                </p>
                <div class="mt-4 p-4 rounded-4" style="background:#EFF5FF; border:1.5px solid #d0e5ff;">
                    <div style="font-size:13px;font-weight:700;color:var(--blue);margin-bottom:8px;">
                        <i class="bi bi-info-circle me-1"></i> Info Booking
                    </div>
                    <p style="font-size:13px;color:#3a5a9b;margin:0;">
                        Slot kosong artinya lapangan tersedia. Klik <strong>Booking Sekarang</strong> untuk amankan jadwal Anda.
                        Sistem booking online tersedia 24 jam.
                    </p>
                    <?php if (!$isLoggedIn): ?>
                    <div style="margin-top:12px;">
                        <a href="<?php echo APP_URL; ?>/auth/booking_redirect.php" style="font-size:13px;font-weight:700;color:var(--blue);text-decoration:none;">
                            Booking Sekarang →
                        </a>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
            <div class="col-lg-7">
                <div class="schedule-block">
                    <div style="font-size:13px;font-weight:700;color:var(--gray3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:1rem;">
                        <i class="bi bi-calendar-event me-2"></i>Booking Hari Ini — <?php echo date('d F Y'); ?>
                    </div>
                    <?php if (empty($todayBookings)): ?>
                        <div style="text-align:center;padding:2.5rem 1rem;color:var(--gray3);">
                            <i class="bi bi-calendar-check" style="font-size:2.5rem;opacity:.3;display:block;margin-bottom:.75rem;"></i>
                            <p style="margin:0;font-weight:600;">Belum ada booking hari ini</p>
                            <p style="margin:4px 0 0;font-size:13px;">Semua slot masih tersedia!</p>
                        </div>
                    <?php else: ?>
                        <?php foreach ($todayBookings as $bk):
                            $statusColors = [
                                'pending'           => ['bg'=>'#FFF6EC','color'=>'#FF9500'],
                                'dp_paid'           => ['bg'=>'#EFF5FF','color'=>'#007AFF'],
                                'payment_2_pending' => ['bg'=>'#F0EEFF','color'=>'#5856D6'],
                                'paid'              => ['bg'=>'#E8FAF0','color'=>'#34C759'],
                                'confirmed'         => ['bg'=>'#E8FAF0','color'=>'#34C759'],
                            ];
                            $sc = $statusColors[$bk['status']] ?? ['bg'=>'#f5f5f5','color'=>'#888'];
                            $slabel = ['pending'=>'Pending','dp_paid'=>'DP Dibayar','payment_2_pending'=>'Pelunasan','paid'=>'Lunas','confirmed'=>'Dikonfirmasi'];
                            $sl = $slabel[$bk['status']] ?? $bk['status'];
                        ?>
                        <div class="schedule-item">
                            <div class="sch-time"><?php echo date('H:i', strtotime($bk['start_time'])); ?> – <?php echo date('H:i', strtotime($bk['end_time'])); ?></div>
                            <div class="sch-field"><?php echo htmlspecialchars($bk['field_name']); ?></div>
                            <span class="sch-badge" style="background:<?php echo $sc['bg']; ?>;color:<?php echo $sc['color']; ?>;"><?php echo $sl; ?></span>
                        </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ═══════════════════════════════════════
     CTA BANNER
═══════════════════════════════════════ -->
<?php if (!$isLoggedIn): ?>
<section style="padding:60px 0;">
    <div class="container fade-in">
        <div class="cta-banner">
            <h2>Siap untuk Bermain?</h2>
            <p class="mt-3 mb-4">Booking lapangan favorit Anda sekarang. Proses cepat, mudah, dan tersedia 24 jam online.</p>
            <div class="cta-actions">
                <a href="<?php echo APP_URL; ?>/auth/booking_redirect.php" class="btn-cta-white">
                    <i class="bi bi-calendar-plus"></i> Booking Sekarang
                </a>
                <a href="<?php echo APP_URL; ?>/auth/register.php" class="btn-cta-outline">
                    <i class="bi bi-person-plus"></i> Daftar Gratis
                </a>
            </div>
        </div>
    </div>
</section>
<?php endif; ?>

<!-- ═══════════════════════════════════════
     FAQ (PERTANYAAN SERING DITANYAKAN)
═══════════════════════════════════════ -->
<section id="faq" style="background:#fff;">
    <div class="container fade-in">
        <div class="text-center mb-5">
            <div class="section-tag">Bantuan</div>
            <h2 class="section-title">Pertanyaan yang Sering Ditanyakan (FAQ)</h2>
            <p class="section-sub mx-auto mt-2">Temukan jawaban untuk pertanyaan umum mengenai aturan dan tata cara penyewaan lapangan kami.</p>
        </div>
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <div class="accordion" id="accordionFAQ">
                    <div class="accordion-item mb-3" style="border:1.5px solid #eee; border-radius:12px; overflow:hidden;">
                        <h2 class="accordion-header" id="headingOne">
                            <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne" style="font-weight:700; color:var(--gray1);">
                                Apakah saya harus membayar lunas di depan?
                            </button>
                        </h2>
                        <div id="collapseOne" class="accordion-collapse collapse show" aria-labelledby="headingOne" data-bs-parent="#accordionFAQ">
                            <div class="accordion-body" style="color:var(--gray2); font-size:14px;">
                                Tidak. Anda dapat memilih opsi untuk mengamankan jam sewa hanya dengan membayar Minimal DP yang ditetapkan (saat ini <?php echo formatCurrency(MIN_DP_AMOUNT); ?>). Sisa pelunasan bisa dibayarkan dan diunggah nanti sebelum hari H bermain.
                            </div>
                        </div>
                    </div>
                    <div class="accordion-item mb-3" style="border:1.5px solid #eee; border-radius:12px; overflow:hidden;">
                        <h2 class="accordion-header" id="headingTwo">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo" style="font-weight:700; color:var(--gray1);">
                                Bagaimana kebijakan pembatalan jadwal booking?
                            </button>
                        </h2>
                        <div id="collapseTwo" class="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#accordionFAQ">
                            <div class="accordion-body" style="color:var(--gray2); font-size:14px;">
                                Pembatalan jadwal dapat diajukan kepada Admin melalui halaman Kontak (WhatsApp). Apabila dibatalkan mendadak, DP yang telah dibayarkan mungkin tidak dapat dikembalikan.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ═══════════════════════════════════════
     KONTAK & MAPS
═══════════════════════════════════════ -->
<section id="kontak">
    <div class="container">
        <div class="text-center mb-5 fade-in">
            <div class="section-tag">Kontak</div>
            <h2 class="section-title">Hubungi Kami</h2>
            <p class="section-sub mx-auto mt-2">Punya pertanyaan? Tim kami siap membantu Anda.</p>
        </div>
        <div class="row g-5 fade-in">
            <div class="col-lg-5">
                <div class="contact-item">
                    <div class="contact-icon"><i class="bi bi-geo-alt-fill"></i></div>
                    <div>
                        <div class="contact-label">Alamat</div>
                        <div class="contact-val"><?php echo APP_ADDRESS; ?></div>
                    </div>
                </div>
                <div class="contact-item">
                    <div class="contact-icon"><i class="bi bi-telephone-fill"></i></div>
                    <div>
                        <div class="contact-label">Telepon / WhatsApp</div>
                        <div class="contact-val">+62 812 3456 7890</div>
                    </div>
                </div>
                <div class="contact-item">
                    <div class="contact-icon"><i class="bi bi-envelope-fill"></i></div>
                    <div>
                        <div class="contact-label">Email</div>
                        <div class="contact-val">info@<?php echo strtolower(str_replace(' ','',$_SERVER['HTTP_HOST']??'lapangan')); ?>.com</div>
                    </div>
                </div>
                <div class="contact-item" style="background:var(--gray5);">
                    <div class="contact-icon" style="background:#25D366;"><i class="bi bi-clock-fill"></i></div>
                    <div>
                        <div class="contact-label">Jam Operasional</div>
                        <div class="contact-val">Setiap Hari, 07.00 – 23.00 WIB</div>
                    </div>
                </div>
                <div class="mt-4">
                    <div style="font-size:13px;font-weight:700;color:var(--gray3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;">Ikuti Kami</div>
                    <div style="display:flex;gap:10px;">
                        <a href="https://instagram.com" target="_blank" class="social-link sl-ig"><i class="bi bi-instagram"></i></a>
                        <a href="https://facebook.com" target="_blank" class="social-link sl-fb"><i class="bi bi-facebook"></i></a>
                        <a href="https://wa.me/6281234567890" target="_blank" class="social-link sl-wa"><i class="bi bi-whatsapp"></i></a>
                        <a href="https://tiktok.com" target="_blank" class="social-link sl-tt"><i class="bi bi-tiktok"></i></a>
                    </div>
                </div>
            </div>
            <div class="col-lg-7">
                <div class="map-wrap" style="height:400px;">
                    <iframe
                        src="https://maps.google.com/maps?q=<?php echo urlencode(STADIUM_NAME . ' ' . APP_ADDRESS); ?>&t=&z=16&ie=UTF8&iwloc=&output=embed"
                        width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy">
                    </iframe>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ═══════════════════════════════════════
     FOOTER
═══════════════════════════════════════ -->
<footer class="site-footer">
    <div class="container">
        <p>© <?php echo date('Y'); ?> <strong style="color:rgba(255,255,255,0.8);"><?php echo APP_NAME; ?></strong>. Semua hak dilindungi. &nbsp;|&nbsp;
            <a href="<?php echo APP_URL; ?>/about.php">Beranda</a> &nbsp;|&nbsp;
            <a href="#lapangan">Lapangan</a> &nbsp;|&nbsp;
            <a href="#kontak">Kontak</a>
            <?php if (!$isLoggedIn): ?>
            &nbsp;|&nbsp;
            <a href="<?php echo APP_URL; ?>/auth/login.php">Login</a> &nbsp;|&nbsp;
            <a href="<?php echo APP_URL; ?>/auth/register.php">Daftar</a>
            <?php endif; ?>
        </p>
    </div>
</footer>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script>
// Navbar scroll effect
const nav = document.getElementById('siteNav');
window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
});

// Hamburger menu toggle
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

// Close on ESC key
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeNavMenu();
});

// Scroll-triggered fade-in
const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('visible');
            observer.unobserve(e.target);
        }
    });
}, { threshold: 0.12 });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
</script>
</body>
</html>
