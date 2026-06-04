<?php
/**
 * Email Notification Functions
 */

/**
 * Send email notification (Simulated or via mail())
 */
function sendEmailNotification($to, $subject, $message) {
    // Headers for HTML email
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: " . APP_NAME . " <noreply@" . strtolower(str_replace(' ', '', APP_NAME)) . ".com>" . "\r\n";

    // In a local environment, mail() might not work without setup.
    // We'll attempt to send it, but also log it for verification.
    try {
        $mailSent = @mail($to, $subject, $message, $headers);
        
        // Log the email to a file for easy verification during development
        $logDir = __DIR__ . '/../logs';
        if (!is_dir($logDir)) {
            mkdir($logDir, 0777, true);
        }
        
        $logFile = $logDir . '/email_notifications.log';
        $logContent = "------------------------------------------\n";
        $logContent .= "DATE: " . date('Y-m-d H:i:s') . "\n";
        $logContent .= "TO: " . $to . "\n";
        $logContent .= "SUBJECT: " . $subject . "\n";
        $logContent .= "MESSAGE: " . strip_tags($message) . "\n";
        $logContent .= "STATUS: " . ($mailSent ? 'Sent (Attempted)' : 'Failed (Local Server Restriction)') . "\n";
        $logContent .= "------------------------------------------\n\n";
        
        file_put_contents($logFile, $logContent, FILE_APPEND);
        
        return $mailSent;
    } catch (Exception $e) {
        return false;
    }
}

/**
 * Prepare Payment Received Email
 */
function sendPaymentReceivedEmail($user, $booking, $fieldName, $type = 'DP') {
    $subject = "Pembayaran " . $type . " Diterima - " . APP_NAME;
    
    $message = "
    <html>
    <head>
        <title>Pembayaran Diterima</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { width: 80%; margin: 20px auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
            .header { background: #007AFF; color: white; padding: 10px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 20px; }
            .details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 15px; }
            .footer { margin-top: 20px; font-size: 12px; color: #777; text-align: center; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>" . APP_NAME . "</h2>
            </div>
            <div class='content'>
                <p>Halo <strong>" . htmlspecialchars($user['name']) . "</strong>,</p>
                <p>Terima kasih! Kami telah menerima bukti pembayaran <strong>" . $type . "</strong> Anda untuk pesanan berikut:</p>
                
                <div class='details'>
                    <p><strong>ID Booking:</strong> #" . $booking['id'] . "</p>
                    <p><strong>Lapangan:</strong> " . htmlspecialchars($fieldName) . "</p>
                    <p><strong>Tanggal Main:</strong> " . date('d M Y', strtotime($booking['booking_date'])) . "</p>
                    <p><strong>Waktu:</strong> " . date('H:i', strtotime($booking['start_time'])) . " - " . date('H:i', strtotime($booking['end_time'])) . "</p>
                </div>
                
                <p>Saat ini admin kami sedang melakukan verifikasi bukti pembayaran Anda. Kami akan memberikan notifikasi setelah status pesanan diperbarui.</p>
                
                <p>Silakan pantau status pesanan Anda di menu <strong>Profil Saya</strong> di aplikasi.</p>
            </div>
            <div class='footer'>
                <p>&copy; " . date('Y') . " " . APP_NAME . ". Seluruh Hak Dilindungi.</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    return sendEmailNotification($user['email'], $subject, $message);
}

/**
 * Prepare Payment Confirmed Email
 */
function sendPaymentConfirmedEmail($user, $booking, $fieldName, $isFinal = false) {
    $statusText = $isFinal ? "Lunas & Dikonfirmasi" : "DP Berhasil Diverifikasi";
    $subject = "Update Status Pesanan: " . $statusText . " - " . APP_NAME;
    
    $message = "
    <html>
    <head>
        <title>Status Pesanan Diperbarui</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { width: 80%; margin: 20px auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
            .header { background: #34C759; color: white; padding: 10px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 20px; }
            .details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 15px; }
            .footer { margin-top: 20px; font-size: 12px; color: #777; text-align: center; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>Konfirmasi Pembayaran</h2>
            </div>
            <div class='content'>
                <p>Halo <strong>" . htmlspecialchars($user['name']) . "</strong>,</p>
                <p>Kabar baik! Pembayaran Anda telah <strong>DIVERIFIKASI</strong> oleh admin kami.</p>
                
                <div class='details'>
                    <p><strong>Status Baru:</strong> " . $statusText . "</p>
                    <p><strong>ID Booking:</strong> #" . $booking['id'] . "</p>
                    <p><strong>Lapangan:</strong> " . htmlspecialchars($fieldName) . "</p>
                </div>
                ";
                
    if ($isFinal) {
        $message .= "<p>Pesanan Anda kini sudah <strong>LUNAS</strong>. Silakan tunjukkan Invoice/Nota yang tersedia di aplikasi saat tiba di lokasi lapangan.</p>";
    } else {
        $message .= "<p>Pembayaran DP Anda sudah masuk. Jangan lupa untuk melakukan pelunasan sebelum waktu bermain dimulai.</p>";
    }
    
    $message .= "
                <p>Selamat berolahraga!</p>
            </div>
            <div class='footer'>
                <p>&copy; " . date('Y') . " " . APP_NAME . ". Seluruh Hak Dilindungi.</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    return sendEmailNotification($user['email'], $subject, $message);
}
