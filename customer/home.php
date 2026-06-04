<?php
/**
 * Home — Halaman Utama Customer (Sudah Login)
 * Sama seperti about.php tapi dengan greeting personal & stats booking
 */
require_once __DIR__ . '/../includes/middleware.php';
requireCustomer();

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

$userId   = $_SESSION['user_id'];
$userName = $_SESSION['user_name'] ?? 'Pengguna';

// Stats booking user
$totalBookings = $pendingBookings = $confirmedBookings = $cancelledBookings = 0;
$nextBooking = null;
try {
    $s = $pdo->prepare("SELECT COUNT(*) as t FROM bookings WHERE user_id = ?");
    $s->execute([$userId]); $totalBookings = $s->fetch()['t'];

    $s = $pdo->prepare("SELECT COUNT(*) as t FROM bookings WHERE user_id = ? AND status = 'pending'");
    $s->execute([$userId]); $pendingBookings = $s->fetch()['t'];

    $s = $pdo->prepare("SELECT COUNT(*) as t FROM bookings WHERE user_id = ? AND status IN ('dp_paid','payment_2_pending','paid','confirmed')");
    $s->execute([$userId]); $confirmedBookings = $s->fetch()['t'];

    $s = $pdo->prepare("SELECT COUNT(*) as t FROM bookings WHERE user_id = ? AND status = 'cancelled'");
    $s->execute([$userId]); $cancelledBookings = $s->fetch()['t'];

    $s = $pdo->prepare("
        SELECT b.*, f.name as field_name FROM bookings b JOIN fields f ON b.field_id = f.id
        WHERE b.user_id = ? AND b.booking_date >= CURDATE() AND b.status NOT IN ('cancelled')
        ORDER BY b.booking_date ASC, b.start_time ASC LIMIT 1
    ");
    $s->execute([$userId]); $nextBooking = $s->fetch() ?: null;
} catch (PDOException $e) {}

// Data lapangan aktif
try {
    $stmt = $pdo->query("SELECT * FROM fields WHERE status = 'active' ORDER BY price DESC");
    $fields = $stmt->fetchAll();
} catch (PDOException $e) { $fields = []; }

// Jadwal hari ini
$today = date('Y-m-d');
try {
    $stmt = $pdo->prepare("
        SELECT b.start_time, b.end_time, b.status, f.name as field_name
        FROM bookings b JOIN fields f ON b.field_id = f.id
        WHERE b.booking_date = ? AND b.status NOT IN ('cancelled')
        ORDER BY b.start_time ASC
    ");
    $stmt->execute([$today]); $todayBookings = $stmt->fetchAll();
} catch (PDOException $e) { $todayBookings = []; }

$hour = (int) date('H');
$greeting = $hour < 11 ? 'Selamat Pagi' : ($hour < 15 ? 'Selamat Siang' : ($hour < 18 ? 'Selamat Sore' : 'Selamat Malam'));
$firstName = explode(' ', $userName)[0];
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Home — <?php echo APP_NAME; ?></title>
    <meta name="description" content="Halaman utama <?php echo APP_NAME; ?> — booking lapangan, cek jadwal, dan informasi fasilitas stadium.">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --blue:#007AFF; --blue-d:#0051D5;
            --green:#34C759; --orange:#FF9500;
            --red:#FF3B30; --indigo:#5856D6;
            --g1:#111; --g2:#444; --g3:#888; --g4:#ccc; --g5:#f5f5f7; --w:#fff;
        }
        *{box-sizing:border-box;}
        body{font-family:'Inter',-apple-system,sans-serif;color:var(--g1);background:var(--w);overflow-x:hidden;-webkit-font-smoothing:antialiased;}
        html{scroll-behavior:smooth;}

        /* ── NAVBAR ── */
        .site-nav{position:sticky;top:0;left:0;right:0;z-index:1000;background:rgba(0,0,0,0.55);backdrop-filter:blur(16px) saturate(1.8);border-bottom:1px solid rgba(255,255,255,.08);padding:14px 0;transition:background .3s;}
        .site-nav.scrolled{background:rgba(255,255,255,.97);border-bottom-color:rgba(0,0,0,.08);box-shadow:0 2px 20px rgba(0,0,0,.08);}
        .site-nav .brand{font-weight:800;font-size:1.1rem;color:white;text-decoration:none;display:flex;align-items:center;gap:8px;}
        .site-nav.scrolled .brand{color:var(--g1);}

        /* Hamburger button */
        .nav-hamburger{background:rgba(255,255,255,0.15);border:1.5px solid rgba(255,255,255,0.3);border-radius:12px;width:42px;height:42px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;color:white;font-size:20px;position:relative;}
        .nav-hamburger:hover{background:rgba(255,255,255,.25);}
        .site-nav.scrolled .nav-hamburger{background:var(--g5);border-color:var(--g4);color:var(--g1);}
        .nav-hamburger .badge-dot{position:absolute;top:6px;right:6px;width:8px;height:8px;background:#FF3B30;border-radius:50%;border:2px solid #0051D5;}

        /* Overlay */
        .nav-overlay{position:fixed;inset:0;z-index:1001;display:none;}
        .nav-overlay.open{display:block;}

        /* Dropdown */
        .nav-dropdown{position:fixed;top:66px;right:1rem;background:white;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.18),0 2px 12px rgba(0,0,0,.08);border:1px solid rgba(0,0,0,.07);min-width:230px;padding:10px;z-index:1002;opacity:0;visibility:hidden;transform:translateY(-8px) scale(.97);transform-origin:top right;transition:all .22s cubic-bezier(.4,0,.2,1);}
        .nav-dropdown.open{opacity:1;visibility:visible;transform:translateY(0) scale(1);}
        .nav-user-info{padding:10px 14px 12px;border-bottom:1px solid #f0f0f0;margin-bottom:6px;}
        .nav-user-info .user-name{font-weight:700;font-size:14px;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .nav-user-info .user-email{font-size:12px;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .nav-dropdown a{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;color:#444;font-size:14px;font-weight:500;text-decoration:none;transition:all .15s;position:relative;}
        .nav-dropdown a:hover{background:#f5f5f5;color:#111;}
        .nav-dropdown a i{width:20px;text-align:center;color:#888;font-size:15px;}
        .nav-dropdown a.active-link{background:#EFF5FF;color:#007AFF;font-weight:600;}
        .nav-dropdown a.active-link i{color:#007AFF;}
        .nav-dropdown .nav-divider{height:1px;background:#f0f0f0;margin:6px 0;}
        .nav-badge{margin-left:auto;background:#FF3B30;color:white;font-size:10px;font-weight:800;min-width:18px;height:18px;padding:0 4px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
        .nav-dropdown .btn-logout{background:#FFF0EF;color:#FF3B30;font-weight:700;border-radius:10px;margin-top:4px;}
        .nav-dropdown .btn-logout:hover{background:#FFE5E3;color:#cc2e23;}
        .nav-dropdown .btn-logout i{color:#FF3B30;}

        /* ── HERO ── */
        .hero{min-height:100vh;background:linear-gradient(175deg,#020918 0%,#0a1628 40%,#0d1f3c 70%,#122748 100%);display:flex;align-items:center;position:relative;overflow:hidden;padding-top:80px;}
        .hero-bg-orb{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;}
        .orb1{width:600px;height:600px;background:rgba(0,122,255,.18);top:-100px;left:-150px;}
        .orb2{width:400px;height:400px;background:rgba(88,86,214,.15);bottom:-50px;right:-100px;}
        .orb3{width:300px;height:300px;background:rgba(52,199,89,.08);top:50%;left:50%;}
        .hero-tag{display:inline-flex;align-items:center;gap:8px;background:rgba(0,122,255,.15);border:1px solid rgba(0,122,255,.3);color:#6EB7FF;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:1.5rem;}
        .hero h1{font-size:clamp(2.2rem,5vw,3.8rem);font-weight:900;color:white;line-height:1.1;letter-spacing:-1.5px;margin-bottom:1.25rem;}
        .hero h1 span{color:#6EB7FF;}
        .hero p.lead{font-size:1.05rem;color:rgba(255,255,255,.65);line-height:1.7;margin-bottom:1.5rem;max-width:520px;}
        .hero-cta{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:2rem;}
        .btn-hero-primary{background:var(--blue);color:white;border:none;padding:14px 28px;border-radius:14px;font-size:15px;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:8px;transition:all .25s;box-shadow:0 8px 24px rgba(0,122,255,.35);}
        .btn-hero-primary:hover{background:var(--blue-d);color:white;transform:translateY(-2px);box-shadow:0 12px 32px rgba(0,122,255,.45);}
        .btn-hero-ghost{background:rgba(255,255,255,.08);color:rgba(255,255,255,.85);border:1.5px solid rgba(255,255,255,.15);padding:14px 28px;border-radius:14px;font-size:15px;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:8px;transition:all .25s;}
        .btn-hero-ghost:hover{background:rgba(255,255,255,.15);color:white;}

        /* Hero stats */
        .hero-stats{display:flex;gap:2rem;flex-wrap:wrap;margin-bottom:2rem;}
        .hero-stat .num{font-size:1.6rem;font-weight:800;color:white;letter-spacing:-.5px;}
        .hero-stat .lbl{font-size:12px;color:rgba(255,255,255,.5);font-weight:500;}

        /* Personal stat pills in hero */
        .hero-personal-stats{display:flex;gap:10px;flex-wrap:wrap;}
        .hps{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);border-radius:12px;padding:8px 16px;backdrop-filter:blur(8px);}
        .hps .hps-num{font-size:1.2rem;font-weight:800;color:white;}
        .hps .hps-lbl{font-size:11px;color:rgba(255,255,255,.55);font-weight:500;}

        /* Next booking banner */
        .next-bk-hero{display:flex;align-items:center;gap:12px;background:rgba(52,199,89,.15);border:1.5px solid rgba(52,199,89,.35);border-radius:14px;padding:12px 18px;margin-bottom:2rem;}
        .next-bk-hero .nb-icon{width:40px;height:40px;background:#34C759;border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-size:1.1rem;flex-shrink:0;}
        .next-bk-hero .nb-label{font-size:10px;font-weight:700;color:#5EE080;text-transform:uppercase;letter-spacing:.5px;}
        .next-bk-hero .nb-title{font-size:.9rem;font-weight:700;color:white;}
        .next-bk-hero .nb-sub{font-size:12px;color:rgba(255,255,255,.6);}

        /* Hero image */
        .hero-img-wrapper{border-radius:24px;overflow:hidden;box-shadow:0 40px 80px rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.1);position:relative;}
        .hero-img-wrapper img{width:100%;height:480px;object-fit:cover;display:block;}
        .img-overlay{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,.85));padding:2rem 1.5rem 1.5rem;}
        .img-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(0,122,255,.9);color:white;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;margin-bottom:.5rem;}

        /* Quick Actions */
        .quick-actions-bar{display:grid;grid-template-columns:repeat(4,1fr);gap:.75rem;margin:2rem 0;}
        @media(max-width:600px){.quick-actions-bar{grid-template-columns:repeat(2,1fr);}}
        .qa-btn{display:flex;flex-direction:column;align-items:center;gap:.5rem;padding:1.1rem .5rem;background:white;border:1.5px solid #eee;border-radius:16px;text-decoration:none;transition:all .25s;color:var(--g1);}
        .qa-btn:hover{border-color:var(--blue);background:#EFF5FF;color:var(--blue);transform:translateY(-3px);box-shadow:0 6px 18px rgba(0,122,255,.1);}
        .qa-icon{width:46px;height:46px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;}
        .qa-btn span{font-size:12px;font-weight:700;text-align:center;}

        /* ── SECTION ── */
        section{padding:80px 0;}
        .section-tag{display:inline-block;background:#EFF5FF;color:var(--blue);padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:1rem;}
        .section-title{font-size:clamp(1.6rem,3.5vw,2.4rem);font-weight:800;letter-spacing:-.8px;line-height:1.15;}
        .section-sub{color:var(--g3);max-width:560px;}

        /* ── FIELD CARDS ── */
        .field-card{border:1.5px solid #eee;border-radius:20px;overflow:hidden;background:white;transition:all .3s cubic-bezier(.4,0,.2,1);box-shadow:0 2px 12px rgba(0,0,0,.04);}
        .field-card:hover{transform:translateY(-6px);box-shadow:0 16px 40px rgba(0,0,0,.12);border-color:var(--blue);}
        .field-card img{width:100%;height:200px;object-fit:cover;}
        .field-card .fc-body{padding:1.5rem;}
        .field-type-badge{display:inline-flex;align-items:center;gap:5px;background:#EFF5FF;color:var(--blue);padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;margin-bottom:.75rem;text-transform:uppercase;}
        .field-name{font-size:1.1rem;font-weight:700;margin-bottom:.25rem;}
        .field-price{font-size:1.4rem;font-weight:800;color:var(--blue);}
        .field-price span{font-size:13px;font-weight:400;color:var(--g3);}
        .feat-chip{display:flex;align-items:center;gap:5px;background:var(--g5);padding:4px 10px;border-radius:8px;font-size:12px;color:var(--g2);font-weight:500;}
        .btn-cta-field{display:block;text-align:center;margin-top:1.25rem;background:var(--blue);color:white;border-radius:12px;padding:11px;font-size:14px;font-weight:700;text-decoration:none;transition:all .2s;}
        .btn-cta-field:hover{background:var(--blue-d);color:white;}

        /* ── FACILITIES ── */
        .fac-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1.5rem;}
        .fac-card{border:1.5px solid #eee;border-radius:18px;padding:1.75rem 1.5rem;text-align:center;background:white;transition:all .25s;}
        .fac-card:hover{border-color:var(--blue);box-shadow:0 8px 28px rgba(0,122,255,.1);transform:translateY(-4px);}
        .fac-icon{width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:26px;margin:0 auto 1rem;}
        .fac-card h6{font-weight:700;margin-bottom:.4rem;}
        .fac-card p{font-size:13px;color:var(--g3);margin:0;}

        /* ── HOW IT WORKS ── */
        .steps{display:flex;gap:2rem;flex-wrap:wrap;}
        .step{flex:1;min-width:200px;display:flex;gap:1rem;align-items:flex-start;}
        .step-num{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,var(--blue),var(--blue-d));color:white;font-weight:800;font-size:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(0,122,255,.35);}
        .step h6{font-weight:700;margin-bottom:4px;}
        .step p{font-size:13.5px;color:var(--g3);margin:0;}

        /* ── PRICING ── */
        .pricing-card{background:white;border-radius:20px;padding:2rem;border:1.5px solid #eee;position:relative;overflow:hidden;transition:all .25s;}
        .pricing-card.featured{border-color:var(--blue);box-shadow:0 8px 32px rgba(0,122,255,.15);}
        .pricing-card.featured::before{content:'Terpopuler';position:absolute;top:16px;right:-28px;background:var(--blue);color:white;font-size:10px;font-weight:700;text-transform:uppercase;padding:4px 32px;letter-spacing:.5px;transform:rotate(45deg);}
        .pricing-price{font-size:2.2rem;font-weight:900;color:var(--g1);letter-spacing:-1px;}
        .pricing-price sub{font-size:14px;font-weight:500;color:var(--g3);}
        .pricing-note{font-size:13px;color:var(--g3);margin-bottom:1.5rem;}
        .pricing-feat li{font-size:13.5px;color:var(--g2);padding:6px 0;border-bottom:1px solid var(--g5);display:flex;align-items:center;gap:8px;}
        .pricing-feat li:last-child{border-bottom:none;}

        /* ── SCHEDULE ── */
        .schedule-block{background:var(--g5);border-radius:18px;padding:1.5rem;}
        .schedule-item{display:flex;align-items:center;gap:1rem;background:white;border-radius:12px;padding:.875rem 1rem;margin-bottom:.75rem;border:1.5px solid #eee;}
        .schedule-item:last-child{margin-bottom:0;}
        .sch-time{font-weight:800;font-size:15px;min-width:95px;color:var(--g1);}
        .sch-field{font-size:13px;color:var(--g3);flex:1;}
        .sch-badge{font-size:10.5px;font-weight:700;padding:3px 10px;border-radius:20px;}

        /* ── CONTACT ── */
        .contact-item{display:flex;gap:1rem;align-items:flex-start;padding:1.25rem;background:var(--g5);border-radius:16px;margin-bottom:1rem;transition:all .2s;}
        .contact-item:hover{background:#EFF5FF;}
        .contact-icon{width:44px;height:44px;border-radius:12px;background:var(--blue);color:white;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
        .contact-label{font-size:11px;text-transform:uppercase;letter-spacing:.5px;font-weight:700;color:var(--g3);}
        .contact-val{font-weight:600;font-size:.95rem;}
        .social-link{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;text-decoration:none;transition:all .2s;border:1.5px solid #eee;}
        .social-link:hover{transform:translateY(-3px);box-shadow:0 6px 16px rgba(0,0,0,.12);}
        .sl-ig{color:#E1306C;} .sl-fb{color:#1877F2;} .sl-wa{color:#25D366;} .sl-tt{color:#111;}
        .map-wrap{border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);}

        /* ── FOOTER ── */
        .site-footer{background:#040d1e;color:rgba(255,255,255,.5);padding:2rem 0;text-align:center;font-size:13px;}
        .site-footer a{color:rgba(255,255,255,.7);text-decoration:none;}
        .site-footer a:hover{color:white;}

        /* ── STAT CARDS ── */
        .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;}
        @media(max-width:768px){.stat-grid{grid-template-columns:repeat(2,1fr);}}
        .scard{background:#fff;border:1.5px solid #eee;border-radius:16px;padding:1.25rem;transition:all .25s;position:relative;overflow:hidden;}
        .scard::after{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--sc-color);transform:scaleX(0);transform-origin:left;transition:transform .3s ease;}
        .scard:hover::after{transform:scaleX(1);}
        .scard:hover{box-shadow:0 8px 24px rgba(0,0,0,.08);transform:translateY(-3px);}
        .scard-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;margin-bottom:.875rem;background:var(--sc-bg);}
        .scard-num{font-size:2rem;font-weight:900;letter-spacing:-1px;color:#111;line-height:1;}
        .scard-lbl{font-size:11.5px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:.4px;margin-top:4px;}

        /* ── FADE IN ── */
        .fade-in{opacity:1;transform:translateY(0);transition:opacity .6s ease,transform .6s ease;}
        .fade-in.animate{opacity:0;transform:translateY(20px);}
        .fade-in.animate.visible{opacity:1;transform:translateY(0);}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp .45s ease forwards;}

        /* ── RESPONSIVE ── */
        @media(max-width:768px){
            section{padding:60px 0;}
            .hero h1{font-size:2rem;}
            .hero-img-wrapper img{height:280px;}
            .steps{flex-direction:column;}
            .site-nav .nav-links .nl{display:none;}
        }
    </style>
</head>
<body>

<!-- Overlay -->
<div class="nav-overlay" id="navOverlay" onclick="closeNavMenu()"></div>

<!-- NAVBAR -->
<nav class="site-nav" id="siteNav">
    <div class="container d-flex align-items-center justify-content-between">
        <a href="<?php echo APP_URL; ?>/customer/home.php" class="brand">
            <i class="bi bi-lightning-charge-fill" style="color:#6EB7FF;"></i>
            <?php echo APP_NAME; ?>
        </a>
        <?php
        $pelunasanCount = 0;
        if (isset($pdo)) {
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
    <div class="nav-user-info">
        <div class="user-name"><i class="bi bi-person-fill me-1" style="color:#007AFF;"></i><?php echo htmlspecialchars($_SESSION['user_name'] ?? 'Customer'); ?></div>
        <div class="user-email"><?php echo htmlspecialchars($_SESSION['user_email'] ?? ''); ?></div>
    </div>
    <a href="#beranda" onclick="closeNavMenu()"><i class="bi bi-house-fill"></i> Beranda</a>
    <a href="#fasilitas" onclick="closeNavMenu()"><i class="bi bi-stars"></i> Fasilitas</a>
    <a href="#harga" onclick="closeNavMenu()"><i class="bi bi-tag"></i> Harga</a>
    <a href="#jadwal" onclick="closeNavMenu()"><i class="bi bi-calendar3"></i> Jadwal</a>
    <a href="#kontak" onclick="closeNavMenu()"><i class="bi bi-telephone"></i> Kontak</a>
    <div class="nav-divider"></div>
    <a href="<?php echo APP_URL; ?>/customer/index.php" onclick="closeNavMenu()"><i class="bi bi-speedometer2"></i> Dashboard</a>
    <a href="<?php echo APP_URL; ?>/customer/booking/create.php" onclick="closeNavMenu()"><i class="bi bi-calendar-plus"></i> Booking Baru</a>
    <a href="<?php echo APP_URL; ?>/customer/booking/pelunasan.php" onclick="closeNavMenu()">
        <i class="bi bi-cash-coin"></i> Pelunasan
        <?php if ($pelunasanCount > 0): ?><span class="nav-badge"><?php echo $pelunasanCount; ?></span><?php endif; ?>
    </a>
    <a href="<?php echo APP_URL; ?>/customer/profile.php" onclick="closeNavMenu()"><i class="bi bi-person-circle"></i> Profil Saya</a>
    <div class="nav-divider"></div>
    <a href="<?php echo APP_URL; ?>/auth/logout.php" class="btn-logout" id="logoutBtn">
        <i class="bi bi-box-arrow-right"></i> Logout
    </a>
</div>

<script>
function toggleNavMenu() {
    const d=document.getElementById('navDropdown'),o=document.getElementById('navOverlay'),i=document.getElementById('hamburgerIcon'),open=d.classList.contains('open');
    d.classList.toggle('open',!open); o.classList.toggle('open',!open);
    i.className = open ? 'bi bi-list' : 'bi bi-x-lg';
}
function closeNavMenu(){
    document.getElementById('navDropdown').classList.remove('open');
    document.getElementById('navOverlay').classList.remove('open');
    document.getElementById('hamburgerIcon').className='bi bi-list';
}
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeNavMenu(); });
// Navbar scroll effect
const sNav=document.getElementById('siteNav');
window.addEventListener('scroll',()=>{ sNav.classList.toggle('scrolled', window.scrollY>60); });
</script>

<!-- HERO -->
<section class="hero" id="beranda">
    <div class="hero-bg-orb orb1"></div>
    <div class="hero-bg-orb orb2"></div>
    <div class="hero-bg-orb orb3"></div>
    <div class="container py-5">
        <div class="row align-items-center g-5">
            <div class="col-lg-6">
                <div class="hero-tag">
                    <i class="bi bi-person-check-fill"></i>
                    <?php echo $greeting; ?>, <?php echo htmlspecialchars($firstName); ?>! 👋
                </div>
                <h1><?php echo STADIUM_NAME; ?></h1>
                <p class="lead">
                    Selamat datang kembali! Lapangan sepak bola modern berstandar internasional siap untuk Anda.
                    Cek jadwal, booking slot, dan nikmati fasilitas terbaik.
                </p>

                <?php if ($nextBooking): ?>
                <div class="next-bk-hero">
                    <div class="nb-icon"><i class="bi bi-calendar-event-fill"></i></div>
                    <div>
                        <div class="nb-label">Booking Berikutnya</div>
                        <div class="nb-title"><?php echo htmlspecialchars($nextBooking['field_name']); ?></div>
                        <div class="nb-sub">
                            <?php echo date('d F Y', strtotime($nextBooking['booking_date'])); ?> &nbsp;·&nbsp;
                            <?php echo date('H:i', strtotime($nextBooking['start_time'])); ?>–<?php echo date('H:i', strtotime($nextBooking['end_time'])); ?>
                        </div>
                    </div>
                </div>
                <?php endif; ?>

                <div class="hero-cta">
                    <a href="<?php echo APP_URL; ?>/customer/booking/create.php" class="btn-hero-primary">
                        <i class="bi bi-calendar-plus"></i> Booking Sekarang
                    </a>
                </div>

                <!-- Personal Stats -->
                <div class="hero-personal-stats">
                    <div class="hps">
                        <div class="hps-num"><?php echo $totalBookings; ?></div>
                        <div class="hps-lbl">Total Booking</div>
                    </div>
                    <div class="hps">
                        <div class="hps-num"><?php echo $confirmedBookings; ?></div>
                        <div class="hps-lbl">Dikonfirmasi</div>
                    </div>
                    <div class="hps">
                        <div class="hps-num"><?php echo $pendingBookings; ?></div>
                        <div class="hps-lbl">Pending</div>
                    </div>
                    <!-- Stadium stats -->
                    <div class="hps">
                        <div class="hps-num">Ready</div>
                        <div class="hps-lbl">Kapasitas</div>
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
                        <div style="color:rgba(255,255,255,.9);font-size:14px;font-weight:600;"><?php echo APP_ADDRESS; ?></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- QUICK ACTIONS -->
<div class="container">
    <div class="quick-actions-bar fade-up" style="margin-top:2.5rem;">
        <a href="<?php echo APP_URL; ?>/customer/booking/create.php" class="qa-btn">
            <div class="qa-icon" style="background:#EFF5FF;color:var(--blue);"><i class="bi bi-calendar-plus-fill"></i></div>
            <span>Booking Baru</span>
        </a>
        <a href="<?php echo APP_URL; ?>/customer/index.php" class="qa-btn">
            <div class="qa-icon" style="background:#E8FAF0;color:var(--green);"><i class="bi bi-speedometer2"></i></div>
            <span>Dashboard</span>
        </a>
        <a href="<?php echo APP_URL; ?>/customer/profile.php" class="qa-btn">
            <div class="qa-icon" style="background:#FFF6EC;color:var(--orange);"><i class="bi bi-person-circle"></i></div>
            <span>Profil Saya</span>
        </a>
        <a href="#kontak" class="qa-btn">
            <div class="qa-icon" style="background:#F0EEFF;color:var(--indigo);"><i class="bi bi-telephone-fill"></i></div>
            <span>Hubungi Kami</span>
        </a>
    </div>
</div>

<!-- STAT CARDS -->
<div class="container my-4 fade-in">
    <div class="stat-grid">
        <div class="scard" style="--sc-color:#007AFF;--sc-bg:#EFF5FF;">
            <div class="scard-icon"><i class="bi bi-calendar-check" style="color:#007AFF;"></i></div>
            <div class="scard-num"><?php echo $totalBookings; ?></div>
            <div class="scard-lbl">Total Booking</div>
        </div>
        <div class="scard" style="--sc-color:#FF9500;--sc-bg:#FFF6EC;">
            <div class="scard-icon"><i class="bi bi-clock-history" style="color:#FF9500;"></i></div>
            <div class="scard-num"><?php echo $pendingBookings; ?></div>
            <div class="scard-lbl">Menunggu</div>
        </div>
        <div class="scard" style="--sc-color:#34C759;--sc-bg:#EDFAF2;">
            <div class="scard-icon"><i class="bi bi-patch-check-fill" style="color:#34C759;"></i></div>
            <div class="scard-num"><?php echo $confirmedBookings; ?></div>
            <div class="scard-lbl">Dikonfirmasi</div>
        </div>
        <div class="scard" style="--sc-color:#FF3B30;--sc-bg:#FFF0EF;">
            <div class="scard-icon"><i class="bi bi-x-circle-fill" style="color:#FF3B30;"></i></div>
            <div class="scard-num"><?php echo $cancelledBookings; ?></div>
            <div class="scard-lbl">Dibatalkan</div>
        </div>
    </div>
</div>

<!-- ══════════════════════════════════════
     SLIDER GALERI LAPANGAN
══════════════════════════════════════ -->
<section id="galeri" style="padding:70px 0 60px;background:white;">
    <div class="container">
        <div class="text-center mb-5 fade-in">
            <div class="section-tag">Galeri Lapangan</div>
            <h2 class="section-title">Lihat Langsung Fasilitas Kami</h2>
            <p class="section-sub mx-auto mt-2">Lapangan berstandar tinggi dengan fasilitas lengkap untuk pengalaman bermain terbaik Anda.</p>
        </div>

        <!-- SLIDER WRAPPER -->
        <div class="field-slider-wrap fade-in">
            <!-- Main Slide -->
            <div class="slider-main" id="sliderMain">
                <div class="slide active" data-index="0">
                    <img src="<?php echo IMG_SLIDER_1_MAIN; ?>" alt="Lapangan Futsal A">
                    <div class="slide-caption">
                        <div class="sc-tag"><i class="bi bi-patch-check-fill"></i> Lapangan Futsal A</div>
                        <div class="sc-title"><?php echo STADIUM_NAME; ?></div>
                        <div class="sc-sub">Lapangan futsal berstandar nasional — lantai solid, cat garis profesional, siap kompetisi</div>
                    </div>
                </div>
                <div class="slide" data-index="1">
                    <img src="<?php echo IMG_SLIDER_2_MAIN; ?>" alt="Lampu LED">
                    <div class="slide-caption">
                        <div class="sc-tag"><i class="bi bi-lightbulb-fill" style="color:#FFD60A;"></i> Pencahayaan LED</div>
                        <div class="sc-title">Lampu LED 2000 Lux</div>
                        <div class="sc-sub">Pertandingan malam hari seterang siang — visibilitas sempurna dari semua sudut lapangan</div>
                    </div>
                </div>
                <div class="slide" data-index="2">
                    <img src="<?php echo IMG_SLIDER_3_MAIN; ?>" alt="Tribun Penonton">
                    <div class="slide-caption">
                        <div class="sc-tag"><i class="bi bi-people-fill"></i> Tribun</div>
                        <div class="sc-title">Tribun Penonton Berkapasitas Besar</div>
                        <div class="sc-sub">Dukung tim favorit Anda dengan nyaman dari area tribun yang luas dan ber-atap</div>
                    </div>
                </div>
                <div class="slide" data-index="3">
                    <img src="<?php echo IMG_SLIDER_4_MAIN; ?>" alt="Ruang Ganti">
                    <div class="slide-caption">
                        <div class="sc-tag"><i class="bi bi-droplet-fill" style="color:#5AC8FA;"></i> Fasilitas</div>
                        <div class="sc-title">Ruang Ganti & Shower</div>
                        <div class="sc-sub">Fasilitas ruang ganti bersih dengan shower air panas dan loker pribadi tersedia</div>
                    </div>
                </div>
                <div class="slide" data-index="4">
                    <img src="<?php echo IMG_SLIDER_5_MAIN; ?>" alt="Area Parkir">
                    <div class="slide-caption">
                        <div class="sc-tag"><i class="bi bi-p-circle-fill" style="color:#34C759;"></i> Parkir</div>
                        <div class="sc-title">Area Parkir Luas & Aman</div>
                        <div class="sc-sub">Parkir gratis untuk ratusan kendaraan, dijaga 24 jam dengan sistem keamanan CCTV</div>
                    </div>
                </div>

                <!-- Nav Arrows -->
                <button class="slider-arrow prev" id="sliderPrev" aria-label="Sebelumnya">
                    <i class="bi bi-chevron-left"></i>
                </button>
                <button class="slider-arrow next" id="sliderNext" aria-label="Berikutnya">
                    <i class="bi bi-chevron-right"></i>
                </button>

                <!-- Slide counter -->
                <div class="slide-counter" id="slideCounter">1 / 5</div>

                <!-- Auto-play progress bar -->
                <div class="progress-bar-wrap"><div class="progress-bar-fill" id="progressBar"></div></div>
            </div>

            <!-- Thumbnail strip -->
            <div class="slider-thumbs" id="sliderThumbs">
                <div class="thumb active" data-slide="0">
                    <img src="<?php echo IMG_SLIDER_1_THUMB; ?>" alt="Lapangan Futsal A">
                    <span>Lapangan Futsal A</span>
                </div>
                <div class="thumb" data-slide="1">
                    <img src="<?php echo IMG_SLIDER_2_THUMB; ?>" alt="Lampu LED">
                    <span>Lampu LED</span>
                </div>
                <div class="thumb" data-slide="2">
                    <img src="<?php echo IMG_SLIDER_3_THUMB; ?>" alt="Tribun">
                    <span>Tribun</span>
                </div>
                <div class="thumb" data-slide="3">
                    <img src="<?php echo IMG_SLIDER_4_THUMB; ?>" alt="Shower">
                    <span>Shower</span>
                </div>
                <div class="thumb" data-slide="4">
                    <img src="<?php echo IMG_SLIDER_5_THUMB; ?>" alt="Parkir">
                    <span>Parkir</span>
                </div>
            </div>
        </div>
    </div>
</section>

<style>
/* ══ SLIDER STYLES ══ */
.field-slider-wrap { max-width: 960px; margin: 0 auto; }
.slider-thumbs { grid-template-columns: repeat(5, 1fr) !important; }

.slider-main {
    position: relative;
    border-radius: 22px;
    overflow: hidden;
    aspect-ratio: 16/7;
    background: #111;
    box-shadow: 0 20px 60px rgba(0,0,0,.22);
    cursor: grab;
}
.slider-main:active { cursor: grabbing; }

.slide {
    position: absolute; inset: 0;
    opacity: 0; transition: opacity .65s ease;
    pointer-events: none;
}
.slide.active { opacity: 1; pointer-events: auto; }
.slide img {
    width: 100%; height: 100%;
    object-fit: cover; display: block;
    transition: transform 8s ease;
}
.slide.active img { transform: scale(1.04); }

/* Caption overlay */
.slide-caption {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    background: linear-gradient(transparent, rgba(0,0,0,.82));
    padding: 2.5rem 2rem 1.5rem;
}
.sc-tag {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(0,122,255,.8); color: white;
    padding: 4px 12px; border-radius: 20px;
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: .7px; margin-bottom: .5rem;
}
.sc-title { font-size: clamp(1.2rem,2.5vw,1.6rem); font-weight: 800; color: white; letter-spacing: -.5px; margin-bottom: .25rem; }
.sc-sub   { font-size: 13.5px; color: rgba(255,255,255,.7); max-width: 500px; }

/* Arrows */
.slider-arrow {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 44px; height: 44px; border-radius: 50%;
    background: rgba(255,255,255,.18); border: 1.5px solid rgba(255,255,255,.25);
    backdrop-filter: blur(8px); color: white;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem; cursor: pointer; z-index: 10;
    transition: all .2s;
}
.slider-arrow:hover { background: rgba(255,255,255,.3); transform: translateY(-50%) scale(1.08); }
.slider-arrow.prev { left: 16px; }
.slider-arrow.next { right: 16px; }

/* Counter */
.slide-counter {
    position: absolute; top: 14px; right: 16px;
    background: rgba(0,0,0,.45); color: white;
    padding: 4px 12px; border-radius: 20px;
    font-size: 12px; font-weight: 700; backdrop-filter: blur(6px);
}

/* Progress bar */
.progress-bar-wrap {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 3px; background: rgba(255,255,255,.2); z-index: 10;
}
.progress-bar-fill {
    height: 100%; background: var(--blue);
    transition: width linear;
}

/* Thumbnails */
.slider-thumbs {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: .75rem;
    margin-top: 1rem;
}
@media(max-width: 640px){ .slider-thumbs { grid-template-columns: repeat(3,1fr); } }

.thumb {
    border-radius: 12px; overflow: hidden;
    border: 2px solid transparent;
    cursor: pointer; transition: all .2s;
    position: relative; background: #eee;
}
.thumb:hover { border-color: rgba(0,122,255,.5); transform: translateY(-2px); }
.thumb.active { border-color: var(--blue); box-shadow: 0 0 0 2px rgba(0,122,255,.2); }
.thumb img { width: 100%; height: 72px; object-fit: cover; display: block; }
.thumb span {
    display: block; text-align: center; font-size: 10px; font-weight: 700;
    color: var(--g2); padding: 4px 4px 6px; background: white;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.thumb.active span { color: var(--blue); }
@media(max-width:500px){ .thumb img { height: 52px; } }
</style>



<!-- FASILITAS -->
<section id="fasilitas">
    <div class="container">
        <div class="row align-items-center g-5 mb-5 fade-in">
            <div class="col-lg-5">
                <div class="section-tag">Fasilitas</div>
                <h2 class="section-title">Semua yang Anda Butuhkan</h2>
                <p class="section-sub mt-3">Kami menyediakan fasilitas lengkap agar pengalaman bermain Anda semakin nyaman dari awal hingga akhir.</p>
            </div>
        </div>
        <div class="fac-grid fade-in">
            <div class="fac-card"><div class="fac-icon" style="background:#EFF5FF;color:var(--blue);">🏟️</div><h6>Tribun Penonton</h6><p>Kapasitas memadai dengan pandangan luas ke seluruh lapangan.</p></div>
            <div class="fac-card"><div class="fac-icon" style="background:#E8FAF0;color:var(--green);">💡</div><h6>Lampu LED 2000 Lux</h6><p>Pencahayaan powerful untuk pertandingan malam hari seterang siang.</p></div>
            <div class="fac-card"><div class="fac-icon" style="background:#FFF5E6;color:var(--orange);">🚿</div><h6>Ruang Ganti & Shower</h6><p>Kamar mandi bersih dan nyaman untuk semua pemain.</p></div>
            <div class="fac-card"><div class="fac-icon" style="background:#F0EEFF;color:var(--indigo);">🅿️</div><h6>Parkir Luas & Aman</h6><p>Area parkir memadai untuk kendaraan roda dua dan empat.</p></div>
            <div class="fac-card"><div class="fac-icon" style="background:#FFF0EF;color:var(--red);">🍜</div><h6>Kantin</h6><p>Aneka menu makanan dan minuman segar untuk mengisi energi.</p></div>
            <div class="fac-card"><div class="fac-icon" style="background:#EFF5FF;color:var(--blue);">🕌</div><h6>Mushola</h6><p>Tempat ibadah bersih dan nyaman di area kompleks.</p></div>

            <div class="fac-card"><div class="fac-icon" style="background:#FFF5E6;color:var(--orange);">🏥</div><h6>P3K Siaga</h6><p>Petugas P3K tersedia untuk memastikan keselamatan semua pemain.</p></div>
        </div>
    </div>
</section>

<!-- CARA BOOKING -->
<section style="background:linear-gradient(135deg,#f5f7ff 0%,#eaf2ff 100%);">
    <div class="container fade-in">
        <div class="text-center mb-5">
            <div class="section-tag">Cara Booking</div>
            <h2 class="section-title">Cukup 4 Langkah Mudah</h2>
            <p class="section-sub mx-auto mt-2">Booking lapangan tidak pernah semudah ini. Amankan slot favoritmu sekarang!</p>
        </div>
        <div class="steps">
            <div class="step"><div class="step-num">1</div><div><h6>Booking</h6><p>Langsung masuk ke form booking karena website ini menyedikan satu lapangan eksklusif.</p></div></div>
            <div class="step"><div class="step-num">2</div><div><h6>Tentukan Waktu</h6><p>Pilih tanggal dan jam bermain melalui kalender ketersediaan real-time.</p></div></div>
            <div class="step"><div class="step-num">3</div><div><h6>Bayar Minimal DP</h6><p>Amankan slot dengan membayar minimal DP via transfer bank dan upload bukti.</p></div></div>
            <div class="step"><div class="step-num">4</div><div><h6>Main & Lunasi</h6><p>Datang, main, dan selesaikan pembayaran sisa. Nikmati lapangan terbaik kami!</p></div></div>
        </div>
        <div class="text-center mt-5">
            <a href="<?php echo APP_URL; ?>/customer/booking/create.php" class="btn-hero-primary d-inline-flex">
                <i class="bi bi-calendar-plus"></i> Booking Sekarang
            </a>
        </div>
    </div>
</section>

<!-- HARGA -->
<section id="harga">
    <div class="container">
        <div class="text-center mb-5 fade-in">
            <div class="section-tag">Tarif Sewa</div>
            <h2 class="section-title">Harga Transparan, Tidak Ada Biaya Tersembunyi</h2>
            <p class="section-sub mx-auto mt-2">Cukup bayar minimal DP untuk mengamankan slot. Lunasi sebelum atau saat bermain.</p>
        </div>
        <div class="row g-4 justify-content-center fade-in">
            <?php if (empty($fields)): ?>
                <p class="text-center text-muted">Belum ada data harga.</p>
            <?php else:
                $featuredIdx = 0;
                foreach ($fields as $i => $field) {
                    if ($field['price'] == max(array_column($fields,'price'))) { $featuredIdx = $i; break; }
                }
                foreach ($fields as $i => $field):
                    $isFeatured = ($i === $featuredIdx);
                    $dp = $field['price'] * 0.3;
            ?>
            <div class="col-md-6 col-lg-4">
                <div class="pricing-card <?php echo $isFeatured ? 'featured' : ''; ?>">
                    <div style="font-size:12px;font-weight:700;color:var(--g3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:.5rem;"><?php echo htmlspecialchars($field['name']); ?></div>
                    <div class="pricing-price"><?php echo formatCurrency($field['price']); ?><sub>/slot</sub></div>
                    <div class="pricing-note">DP hanya <strong><?php echo formatCurrency($dp); ?></strong> untuk booking</div>
                    <ul class="list-unstyled pricing-feat">
                        <li><i class="bi bi-check-circle-fill" style="color:var(--green);"></i> Lapangan berstandar resmi</li>
                        <li><i class="bi bi-check-circle-fill" style="color:var(--green);"></i> Pencahayaan LED tersedia</li>
                        <li><i class="bi bi-check-circle-fill" style="color:var(--green);"></i> Ruang ganti & shower</li>
                        <li><i class="bi bi-check-circle-fill" style="color:var(--green);"></i> Parkir gratis</li>
                        <li><i class="bi bi-check-circle-fill" style="color:var(--green);"></i> Booking online 24 jam</li>
                    </ul>
                    <a href="<?php echo APP_URL; ?>/customer/booking/create.php?field_id=<?php echo $field['id']; ?>"
                       class="btn-cta-field mt-3" style="background:<?php echo $isFeatured ? 'var(--blue)' : '#111'; ?>;">
                        <i class="bi bi-calendar-plus"></i> Booking Lapangan Ini
                    </a>
                </div>
            </div>
            <?php endforeach; endif; ?>
        </div>
    </div>
</section>

<!-- JADWAL HARI INI -->
<section id="jadwal" style="background:#fafafa;">
    <div class="container">
        <div class="row g-5 align-items-start fade-in">
            <div class="col-lg-5">
                <div class="section-tag">Jadwal Hari Ini</div>
                <h2 class="section-title">Cek Ketersediaan Lapangan</h2>
                <p class="section-sub mt-3">Lihat slot yang sudah terisi hari ini — <strong><?php echo date('d F Y'); ?></strong>. Slot kosong berarti lapangan siap untuk Anda booking.</p>
                <div class="mt-4 p-4 rounded-4" style="background:#EFF5FF;border:1.5px solid #d0e5ff;">
                    <div style="font-size:13px;font-weight:700;color:var(--blue);margin-bottom:8px;"><i class="bi bi-lightning-charge me-1"></i>Booking Cepat</div>
                    <p style="font-size:13px;color:#3a5a9b;margin:0 0 12px;">Slot masih tersedia? Langsung booking sekarang sebelum diambil orang lain!</p>
                    <a href="<?php echo APP_URL; ?>/customer/booking/create.php"
                       style="display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--blue);background:white;padding:8px 16px;border-radius:10px;text-decoration:none;box-shadow:0 2px 8px rgba(0,122,255,.15);">
                        <i class="bi bi-calendar-plus"></i> Booking Sekarang
                    </a>
                </div>
            </div>
            <div class="col-lg-7">
                <div class="schedule-block">
                    <div style="font-size:13px;font-weight:700;color:var(--g3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:1rem;">
                        <i class="bi bi-calendar-event me-2"></i>Booking Hari Ini — <?php echo date('d F Y'); ?>
                    </div>
                    <?php if (empty($todayBookings)): ?>
                        <div style="text-align:center;padding:2.5rem 1rem;color:var(--g3);">
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

<!-- KONTAK & MAPS -->
<section id="kontak">
    <div class="container">
        <div class="text-center mb-5 fade-in">
            <div class="section-tag">Kontak</div>
            <h2 class="section-title">Hubungi Kami</h2>
            <p class="section-sub mx-auto mt-2">Punya pertanyaan? Tim kami siap membantu Anda.</p>
        </div>
        <div class="row g-5 fade-in">
            <div class="col-lg-5">
                <div class="contact-item"><div class="contact-icon"><i class="bi bi-geo-alt-fill"></i></div><div><div class="contact-label">Alamat</div><div class="contact-val"><?php echo APP_ADDRESS; ?></div></div></div>
                <div class="contact-item"><div class="contact-icon"><i class="bi bi-telephone-fill"></i></div><div><div class="contact-label">Telepon / WhatsApp</div><div class="contact-val">+62 812 3456 7890</div></div></div>
                <div class="contact-item"><div class="contact-icon"><i class="bi bi-envelope-fill"></i></div><div><div class="contact-label">Email</div><div class="contact-val">info@bookinglapangan.com</div></div></div>
                <div class="contact-item"><div class="contact-icon" style="background:#25D366;"><i class="bi bi-clock-fill"></i></div><div><div class="contact-label">Jam Operasional</div><div class="contact-val">Setiap Hari, 07.00 – 23.00 WIB</div></div></div>
                <div class="mt-4">
                    <div style="font-size:13px;font-weight:700;color:var(--g3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;">Ikuti Kami</div>
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
                    <iframe src="https://maps.google.com/maps?q=<?php echo urlencode(STADIUM_NAME . ' ' . APP_ADDRESS); ?>&t=&z=16&ie=UTF8&iwloc=&output=embed"
                        width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- FOOTER -->
<footer class="site-footer">
    <div class="container">
        <p>© <?php echo date('Y'); ?> <strong style="color:rgba(255,255,255,.8);"><?php echo APP_NAME; ?></strong>. Semua hak dilindungi. &nbsp;|&nbsp;
            <a href="<?php echo APP_URL; ?>/customer/home.php">Beranda</a> &nbsp;|&nbsp;
            <a href="#lapangan">Lapangan</a> &nbsp;|&nbsp;
            <a href="<?php echo APP_URL; ?>/customer/index.php">Dashboard</a> &nbsp;|&nbsp;
            <a href="#kontak">Kontak</a> &nbsp;|&nbsp;
            <a href="<?php echo APP_URL; ?>/auth/logout.php" onclick="return confirm('Yakin ingin logout?')">Logout</a>
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

// Smooth active nav highlight on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nl[href^="#"]');
window.addEventListener('scroll', () => {
    let cur = '';
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 120) cur = s.getAttribute('id'); });
    navLinks.forEach(l => { l.classList.toggle('active', l.getAttribute('href') === '#' + cur); });
});

// Scroll-triggered fade-in
const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.remove('animate');
            e.target.classList.add('visible');
            observer.unobserve(e.target);
        }
    });
}, { threshold: 0.05 });
document.querySelectorAll('.fade-in').forEach(el => {
    el.classList.add('animate');
    observer.observe(el);
});

// Counter animation
document.querySelectorAll('.scard-num').forEach(el => {
    const target = parseInt(el.textContent);
    if (isNaN(target) || target === 0) return;
    let current = 0;
    const step = Math.ceil(target / 20);
    const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current;
        if (current >= target) clearInterval(timer);
    }, 40);
});
// ══ SLIDER LAPANGAN ══
(function() {
    const slides    = document.querySelectorAll('.slide');
    const thumbs    = document.querySelectorAll('.thumb');
    const counter   = document.getElementById('slideCounter');
    const bar       = document.getElementById('progressBar');
    const prevBtn   = document.getElementById('sliderPrev');
    const nextBtn   = document.getElementById('sliderNext');
    const DURATION  = 5000; // ms per slide
    let current     = 0;
    let autoTimer   = null;
    let barTimer    = null;
    const total     = slides.length;

    function goTo(idx) {
        slides[current].classList.remove('active');
        thumbs[current].classList.remove('active');
        current = (idx + total) % total;
        slides[current].classList.add('active');
        thumbs[current].classList.add('active');
        if (counter) counter.textContent = (current + 1) + ' / ' + total;
        startProgressBar();
    }

    function startProgressBar() {
        if (!bar) return;
        clearInterval(barTimer);
        bar.style.transition = 'none';
        bar.style.width = '0%';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                bar.style.transition = 'width ' + DURATION + 'ms linear';
                bar.style.width = '100%';
            });
        });
    }

    function startAuto() {
        clearInterval(autoTimer);
        autoTimer = setInterval(() => goTo(current + 1), DURATION);
    }

    function resetAuto() {
        clearInterval(autoTimer);
        startAuto();
    }

    // Arrow buttons
    if (prevBtn) prevBtn.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { goTo(current + 1); resetAuto(); });

    // Thumbnail clicks
    thumbs.forEach(t => {
        t.addEventListener('click', () => {
            goTo(parseInt(t.dataset.slide));
            resetAuto();
        });
    });

    // Keyboard navigation
    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft')  { goTo(current - 1); resetAuto(); }
        if (e.key === 'ArrowRight') { goTo(current + 1); resetAuto(); }
    });

    // Drag/swipe support
    const sliderEl = document.getElementById('sliderMain');
    if (sliderEl) {
        let startX = 0, isDragging = false;
        sliderEl.addEventListener('mousedown',  e => { startX = e.clientX; isDragging = true; });
        sliderEl.addEventListener('mouseup',    e => {
            if (!isDragging) return; isDragging = false;
            const diff = e.clientX - startX;
            if (Math.abs(diff) > 50) { goTo(diff < 0 ? current + 1 : current - 1); resetAuto(); }
        });
        sliderEl.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, {passive:true});
        sliderEl.addEventListener('touchend',   e => {
            const diff = e.changedTouches[0].clientX - startX;
            if (Math.abs(diff) > 40) { goTo(diff < 0 ? current + 1 : current - 1); resetAuto(); }
        }, {passive:true});
        // Pause on hover
        sliderEl.addEventListener('mouseenter', () => clearInterval(autoTimer));
        sliderEl.addEventListener('mouseleave', () => startAuto());
    }

    // Init
    startProgressBar();
    startAuto();
})();
</script>
</body>
</html>
