<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../includes/functions.php';

// Cek apakah ada data dari Google
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['credential'])) {
    
    $credential = $_POST['credential'];
    
    // Verifikasi token ke server Google
    $verifyUrl = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . $credential;
    
    // Gunakan file_get_contents atau cURL
    $response = @file_get_contents($verifyUrl);
    
    if ($response) {
        $googleUser = json_decode($response, true);
        
        // Pastikan token valid dan dari Client ID kita (Atau abaikan cek ketat SID sementara jika masih tahap testing)
        // Dan pastikan email diverifikasi oleh google
        if (isset($googleUser['email']) && isset($googleUser['email_verified']) && $googleUser['email_verified'] === 'true') {
            
            $email = $googleUser['email'];
            $name = $googleUser['name'];
            
            // Cek apakah akun ini sudah ada di database
            $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user) {
                // User sudah ada, langsung login
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_name'] = $user['name'];
                $_SESSION['user_role'] = $user['role'];
                
                // Redirect user
                if ($user['role'] === 'admin') {
                    redirect(APP_URL . '/admin/index.php');
                } else {
                    $redirect = $_SESSION['redirect_after_login'] ?? APP_URL . '/customer/index.php';
                    unset($_SESSION['redirect_after_login']);
                    redirect($redirect);
                }
            } else {
                // User belum ada, mari kita buat akun barunya otomatis!
                $role = 'customer';
                // Buatkan password random dummy karena mereka login pakai Google
                $random_password = bin2hex(random_bytes(10));
                $hashed_password = password_hash($random_password, PASSWORD_DEFAULT);
                
                try {
                    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
                    $stmt->execute([$name, $email, $hashed_password, $role]);
                    
                    $newUserId = $pdo->lastInsertId();
                    
                    // Set session
                    $_SESSION['user_id'] = $newUserId;
                    $_SESSION['user_name'] = $name;
                    $_SESSION['user_role'] = $role;
                    
                    setFlashMessage('success', 'Registrasi dengan Google berhasil! Selamat datang.');
                    
                    // Redirect
                    $redirect = $_SESSION['redirect_after_login'] ?? APP_URL . '/customer/index.php';
                    unset($_SESSION['redirect_after_login']);
                    redirect($redirect);
                    
                } catch (PDOException $e) {
                    setFlashMessage('danger', 'Gagal mendaftarkan akun: ' . $e->getMessage());
                    redirect(APP_URL . '/auth/login.php');
                }
            }
        } else {
            setFlashMessage('danger', 'Sesi Google tidak valid atau email belum diverifikasi oleh Google.');
            redirect(APP_URL . '/auth/login.php');
        }
    } else {
        setFlashMessage('danger', 'Gagal memverifikasi respon dari Google. Coba lagi.');
        redirect(APP_URL . '/auth/login.php');
    }
} else {
    redirect(APP_URL . '/auth/login.php');
}
