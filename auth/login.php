<?php
require_once __DIR__ . '/../includes/middleware.php';
redirectIfLoggedIn();

$error = null;
$success = getFlashMessage();

// Temporary debug - remove after fixing
echo "<!-- DEBUG: APP_URL = " . APP_URL . " -->";
if (isset($_SESSION['redirect_after_login'])) {
    echo "<!-- DEBUG: Stored redirect = " . $_SESSION['redirect_after_login'] . " -->";
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - <?php echo APP_NAME; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <script src="https://accounts.google.com/gsi/client" async defer></script>
    <style>
        body {
            background: #ffffff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-card {
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        .login-header {
            background: #0d6efd;
            color: white;
            padding: 2rem;
            text-align: center;
        }
        .login-body {
            padding: 2rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-5">
                <div class="login-card">
                    <div class="login-header">
                        <h2 class="mb-0"><i class="bi bi-calendar-check"></i> <?php echo APP_NAME; ?></h2>
                        <p class="mb-0 mt-2">Silakan login ke akun Anda</p>
                    </div>
                    <div class="login-body">
                        <?php if ($success): ?>
                            <div class="alert alert-<?php echo $success['type']; ?> alert-dismissible fade show" role="alert">
                                <?php echo $success['message']; ?>
                                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                            </div>
                        <?php endif; ?>
                        
                        <?php if ($error): ?>
                            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                                <?php echo $error; ?>
                                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                            </div>
                        <?php endif; ?>
                        
                        <form action="process_login.php" method="POST">
                            <div class="mb-3">
                                <label for="email" class="form-label">Email</label>
                                <div class="input-group">
                                    <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                                    <input type="email" class="form-control" id="email" name="email" required autofocus>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="password" class="form-label">Password</label>
                                <div class="input-group">
                                    <span class="input-group-text"><i class="bi bi-lock"></i></span>
                                    <input type="password" class="form-control" id="password" name="password" required>
                                </div>
                            </div>
                            
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary btn-lg">
                                    <i class="bi bi-box-arrow-in-right"></i> Login
                                </button>
                            </div>
                        </form>
                        
                        <?php if (defined('GOOGLE_CLIENT_ID') && GOOGLE_CLIENT_ID !== 'GANTI_DENGAN_CLIENT_ID_GOOGLE_ANDA.apps.googleusercontent.com'): ?>
                        <div class="mt-4 text-center">
                            <p class="text-muted mb-2">Atau masuk dengan</p>
                            <div id="g_id_onload"
                                 data-client_id="<?php echo GOOGLE_CLIENT_ID; ?>"
                                 data-context="signin"
                                 data-ux_mode="popup"
                                 data-login_uri="<?php echo APP_URL; ?>/auth/google_auth.php"
                                 data-auto_prompt="false">
                            </div>
                            <div class="g_id_signin d-flex justify-content-center"
                                 data-type="standard"
                                 data-shape="rectangular"
                                 data-theme="outline"
                                 data-text="signin_with"
                                 data-size="large"
                                 data-logo_alignment="left">
                            </div>
                        </div>
                        <?php endif; ?>
                        
                        <hr class="my-4">
                        
                        <div class="text-center">
                            <p class="mb-0">Belum punya akun? <a href="register.php">Daftar Sekarang</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
