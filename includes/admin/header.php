<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($pageTitle) ? $pageTitle . ' - ' : ''; ?><?php echo APP_NAME; ?> - Admin</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css">
    <style>
        :root {
            --primary: #0d6efd;
            --sidebar-width: 250px;
            --sidebar-bg: #2c3e50;
            --sidebar-color: #ecf0f1;
        }
        
        body {
            font-size: 0.9rem;
            background-color: #ffffff;
        }
        
        .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            width: var(--sidebar-width);
            background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
            color: var(--sidebar-color);
            overflow-y: auto;
            z-index: 1000;
            transition: all 0.3s;
        }
        
        .sidebar-header {
            padding: 1.5rem;
            background: rgba(0,0,0,0.2);
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .sidebar-menu {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .sidebar-menu li {
            margin: 0;
        }
        
        .sidebar-menu a {
            display: flex;
            align-items: center;
            padding: 0.875rem 1.5rem;
            color: var(--sidebar-color);
            text-decoration: none;
            transition: all 0.3s;
            border-left: 3px solid transparent;
        }
        
        .sidebar-menu a:hover {
            background: rgba(255,255,255,0.1);
            border-left-color: var(--primary);
            color: white;
        }
        
        .sidebar-menu a.active {
            background: rgba(255,255,255,0.15);
            border-left-color: var(--primary);
            color: white;
        }
        
        .sidebar-menu i {
            width: 20px;
            margin-right: 0.75rem;
        }
        
        .main-content {
            margin-left: var(--sidebar-width);
            padding: 1.5rem;
            min-height: 100vh;
        }
        
        .navbar {
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 1.5rem;
            border-radius: 0.5rem;
        }
        
        .card {
            border: none;
            box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.075);
            margin-bottom: 1.5rem;
        }
        
        .card-header {
            background: white;
            border-bottom: 1px solid #dee2e6;
            font-weight: 600;
            padding: 1rem 1.5rem;
        }
        
        .stat-card {
            border-left: 4px solid var(--primary);
        }
        
        .stat-card.stat-success {
            border-left-color: #28a745;
        }
        
        .stat-card.stat-warning {
            border-left-color: #ffc107;
        }
        
        .stat-card.stat-info {
            border-left-color: #17a2b8;
        }
        
        .stat-card .card-body {
            padding: 1.5rem;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #2c3e50;
        }
        
        @media (max-width: 768px) {
            .sidebar {
                transform: translateX(-100%);
            }
            
            .sidebar.show {
                transform: translateX(0);
            }
            
            .main-content {
                margin-left: 0;
            }
        }
    </style>
</head>
<body>
    <!-- Sidebar -->
    <div class="sidebar">
        <div class="sidebar-header">
            <h4 class="mb-0"><i class="bi bi-calendar-check"></i> <?php echo APP_NAME; ?></h4>
            <small class="text-muted">Admin Panel</small>
        </div>
        <ul class="sidebar-menu">
            <li>
                <a href="<?php echo APP_URL; ?>/admin/index.php" class="<?php echo (basename($_SERVER['PHP_SELF']) == 'index.php') ? 'active' : ''; ?>">
                    <i class="bi bi-speedometer2"></i>
                    <span>Dashboard</span>
                </a>
            </li>
            <li>
                <a href="<?php echo APP_URL; ?>/admin/fields/index.php" class="<?php echo (strpos($_SERVER['PHP_SELF'], '/fields/') !== false) ? 'active' : ''; ?>">
                    <i class="bi bi-geo-alt"></i>
                    <span>Detail Lapangan</span>
                </a>
            </li>
            <li>
                <a href="<?php echo APP_URL; ?>/admin/bookings/index.php" class="<?php echo (strpos($_SERVER['PHP_SELF'], '/bookings/') !== false) ? 'active' : ''; ?>">
                    <i class="bi bi-calendar3"></i>
                    <span>Booking</span>
                </a>
            </li>
            <li>
                <a href="<?php echo APP_URL; ?>/auth/logout.php" onclick="return confirm('Yakin ingin logout?')">
                    <i class="bi bi-box-arrow-right"></i>
                    <span>Logout</span>
                </a>
            </li>
        </ul>
    </div>
    
    <!-- Main Content -->
    <div class="main-content">
        <!-- Navbar -->
        <nav class="navbar navbar-expand-lg">
            <div class="container-fluid">
                <button class="btn btn-sm d-md-none" type="button" onclick="document.querySelector('.sidebar').classList.toggle('show')">
                    <i class="bi bi-list"></i>
                </button>
                <div class="ms-auto">
                    <span class="me-3"><i class="bi bi-person-circle"></i> <?php echo htmlspecialchars($_SESSION['user_name'] ?? ''); ?></span>
                </div>
            </div>
        </nav>
