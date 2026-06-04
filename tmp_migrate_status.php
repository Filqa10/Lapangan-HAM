<?php
require_once __DIR__ . '/config/database.php';
try {
    $pdo->exec("ALTER TABLE bookings MODIFY COLUMN status ENUM('pending', 'dp_paid', 'payment_2_pending', 'paid', 'confirmed', 'cancelled') DEFAULT 'pending'");
    echo "Migration successful: status ENUM updated.";
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage();
}
