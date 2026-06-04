<?php
require_once __DIR__ . '/../../includes/middleware.php';
// Allow guest access
requireCustomer(true);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';

header('Content-Type: application/json');

try {
    $fieldId = isset($_GET['field_id']) ? (int)$_GET['field_id'] : 0;

    $query = "
        SELECT 
            b.id, 
            b.booking_date, 
            b.start_time, 
            b.end_time, 
            b.status,
            f.name as field_name,
            f.address as field_address
        FROM bookings b
        JOIN fields f ON b.field_id = f.id
        WHERE b.status != 'cancelled'
    ";
    
    $params = [];
    if ($fieldId > 0) {
        $query .= " AND b.field_id = ?";
        $params[] = $fieldId;
    }

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $bookings = $stmt->fetchAll();

    $events = [];
    foreach ($bookings as $booking) {
        // Color coding based on status
        $color = '#007AFF'; // Default blue
        if ($booking['status'] === 'pending') $color = '#FF9500'; // Orange
        if ($booking['status'] === 'paid' || $booking['status'] === 'confirmed') $color = '#34C759'; // Green
        if ($booking['status'] === 'dp_paid') $color = '#5856D6'; // Indigo

        $events[] = [
            'id' => $booking['id'],
            'title' => $booking['field_name'] . ' (' . date('H:i', strtotime($booking['start_time'])) . '-' . date('H:i', strtotime($booking['end_time'])) . ')',
            'start' => $booking['booking_date'] . 'T' . $booking['start_time'],
            'end' => $booking['booking_date'] . 'T' . $booking['end_time'],
            'extendedProps' => [
                'status' => $booking['status'],
                'address' => $booking['field_address']
            ],
            'backgroundColor' => $color,
            'borderColor' => $color,
            'allDay' => false
        ];
    }

    echo json_encode($events);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
