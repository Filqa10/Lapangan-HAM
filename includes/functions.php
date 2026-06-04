<?php
/**
 * Helper Functions
 */

// Require constants first
if (!defined('APP_NAME')) {
    require_once __DIR__ . '/../config/constants.php';
}

// Note: database.php should be included separately in files that use database functions
// This is to avoid circular dependencies

/**
 * Check if user is logged in
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

/**
 * Check if user is admin
 */
function isAdmin() {
    return isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin';
}

/**
 * Check if user is customer
 */
function isCustomer() {
    return isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'customer';
}

/**
 * Get current user data
 */
function getCurrentUser() {
    global $pdo;
    if (!isLoggedIn()) {
        return null;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT id, name, email, role FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        return $stmt->fetch();
    } catch (PDOException $e) {
        return null;
    }
}

/**
 * Redirect to URL
 */
function redirect($url) {
    header("Location: " . $url);
    exit();
}

/**
 * Flash message helper
 */
function setFlashMessage($type, $message) {
    $_SESSION['flash_message'] = [
        'type' => $type,
        'message' => $message
    ];
}

function getFlashMessage() {
    if (isset($_SESSION['flash_message'])) {
        $message = $_SESSION['flash_message'];
        unset($_SESSION['flash_message']);
        return $message;
    }
    return null;
}

/**
 * Format currency
 */
function formatCurrency($amount) {
    return 'Rp ' . number_format($amount, 0, ',', '.');
}

/**
 * Format date
 */
function formatDate($date) {
    return date('d M Y', strtotime($date));
}

/**
 * Format datetime
 */
function formatDateTime($datetime) {
    return date('d M Y H:i', strtotime($datetime));
}

/**
 * Format time
 */
function formatTime($time) {
    return date('H:i', strtotime($time));
}

/**
 * Check if booking time slot is available
 */
function isTimeSlotAvailable($fieldId, $bookingDate, $startTime, $endTime, $excludeBookingId = null) {
    global $pdo;
    
    try {
        $sql = "SELECT COUNT(*) as count FROM bookings 
                WHERE field_id = ? 
                AND booking_date = ? 
                AND status != 'cancelled'
                AND (
                    (start_time <= ? AND end_time > ?) OR
                    (start_time < ? AND end_time >= ?) OR
                    (start_time >= ? AND end_time <= ?)
                )";
        
        if ($excludeBookingId) {
            $sql .= " AND id != ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$fieldId, $bookingDate, $startTime, $startTime, $endTime, $endTime, $startTime, $endTime, $excludeBookingId]);
        } else {
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$fieldId, $bookingDate, $startTime, $startTime, $endTime, $endTime, $startTime, $endTime]);
        }
        
        $result = $stmt->fetch();
        return $result['count'] == 0;
    } catch (PDOException $e) {
        return false;
    }
}

/**
 * Calculate DP amount (minimum Rp 500.000)
 */
function calculateDP($price) {
    $dp = ($price * DP_PERCENTAGE) / 100;
    return max($dp, MIN_DP_AMOUNT);
}

/**
 * Sanitize input
 */
function sanitize($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// ─── Tabel Harga Slot Booking ───────────────────────────
// Format: [startH, endH, harga_weekday, harga_jumat, harga_weekend]
// null = N/A (slot tidak tersedia di hari tersebut)
$BOOKING_PRICE_SLOTS = [
    [6,  8,  null,    null,    2600000],
    [8,  10, 1300000, null,    2600000],
    [10, 12, 800000,  null,    1500000],
    [12, 14, 800000,  null,    1500000],
    [14, 16, 1300000, 1300000, 2600000],
    [16, 18, 2000000, 2300000, 2600000],
    [18, 20, 2300000, 2500000, 2800000],
    [20, 22, 2300000, 2500000, 2800000],
];

/**
 * Get day type string from a date string ('weekday', 'friday', 'weekend')
 */
function getBookingDayType($dateStr) {
    $dow = (int) date('w', strtotime($dateStr));
    if ($dow === 5) return 'friday';
    if ($dow === 0 || $dow === 6) return 'weekend';
    return 'weekday';
}

/**
 * Calculate total booking price based on time slot + day type.
 * Returns array ['total', 'breakdown', 'dayType'] or null if slots are N/A.
 */
function calculateBookingSlotPrice($startTime, $endTime, $dateStr) {
    global $BOOKING_PRICE_SLOTS;
    $dayType = getBookingDayType($dateStr);
    $startH  = (int) date('H', strtotime($startTime));
    $endH    = (int) date('H', strtotime($endTime));
    if ((int) date('i', strtotime($endTime)) > 0) $endH++;

    $total     = 0;
    $breakdown = [];

    foreach ($BOOKING_PRICE_SLOTS as [$sh, $eh, $wd, $fri, $wk]) {
        if ($eh <= $startH || $sh >= $endH) continue;

        $slotPrice = ($dayType === 'friday') ? $fri
                   : (($dayType === 'weekend') ? $wk : $wd);

        if ($slotPrice === null) {
            return null; // Slot N/A
        }

        $total += $slotPrice;
        $breakdown[] = [
            'slot'  => sprintf('%02d:00–%02d:00', $sh, $eh),
            'price' => $slotPrice,
        ];
    }

    if ($total === 0) return null;
    return ['total' => $total, 'breakdown' => $breakdown, 'dayType' => $dayType];
}

/**
 * Get minimum price across all available weekday slots
 */
function getMinSlotPrice() {
    global $BOOKING_PRICE_SLOTS;
    $prices = array_filter(array_column($BOOKING_PRICE_SLOTS, 2)); // weekday prices only
    return !empty($prices) ? min($prices) : 0;
}
