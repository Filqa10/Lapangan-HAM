<?php
require_once __DIR__ . '/config/database.php';
try {
    $stmt = $pdo->prepare("SELECT id, status FROM bookings ORDER BY id DESC LIMIT 1");
    $stmt->execute();
    $booking = $stmt->fetch();
    echo "Current status: " . $booking['status'] . "\n";
    
    $pdo->exec("UPDATE bookings SET status = 'dp_paid' WHERE id = " . $booking['id']);
    echo "Update to dp_paid successful.\n";
    
    $stmt->execute();
    $booking = $stmt->fetch();
    echo "New status: " . $booking['status'] . "\n";

} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
