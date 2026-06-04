<?php
require_once __DIR__ . '/../../includes/middleware.php';
// Allow customer access
requireCustomer();

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';

header('Content-Type: application/json');

$fieldId = (int)($_GET['field_id'] ?? 0);
$date = $_GET['date'] ?? '';

if (!$fieldId || empty($date)) {
    echo json_encode([]);
    exit;
}

try {
    // Fetch bookings for the specific field and date that are not cancelled
    $stmt = $pdo->prepare("
        SELECT start_time, end_time, status 
        FROM bookings 
        WHERE field_id = ? AND booking_date = ? AND status != 'cancelled'
        ORDER BY start_time ASC
    ");
    $stmt->execute([$fieldId, $date]);
    $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // format to HH:MM
    $formatted = [];
    foreach ($bookings as $b) {
        $formatted[] = [
            'start' => date('H:i', strtotime($b['start_time'])),
            'end' => date('H:i', strtotime($b['end_time'])),
            'status' => $b['status']
        ];
    }
    
    echo json_encode($formatted);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Database error']);
}
