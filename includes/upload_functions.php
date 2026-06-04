<?php
/**
 * Upload File Functions
 */

require_once __DIR__ . '/../config/constants.php';

/**
 * Upload payment proof file
 * @param array $file $_FILES array
 * @return string|false Filename on success, false on failure
 */
function uploadPaymentProof($file) {
    if (!isset($file['error']) || is_array($file['error'])) {
        return false;
    }

    // Check for upload errors
    switch ($file['error']) {
        case UPLOAD_ERR_OK:
            break;
        case UPLOAD_ERR_NO_FILE:
            return false;
        case UPLOAD_ERR_INI_SIZE:
        case UPLOAD_ERR_FORM_SIZE:
            return false;
        default:
            return false;
    }

    // Check file size (max 5MB)
    if ($file['size'] > 5242880) {
        return false;
    }

    // Check file type
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);
    
    if (!in_array($mimeType, $allowedTypes)) {
        return false;
    }

    // Create uploads directory if not exists
    $uploadDir = BASE_PATH . '/uploads/payment_proofs/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid('payment_', true) . '.' . $extension;
    $filepath = $uploadDir . $filename;

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        return false;
    }

    return $filename;
}

/**
 * Get payment proof URL
 * @param string $filename
 * @return string
 */
function getPaymentProofUrl($filename) {
    if (empty($filename)) {
        return null;
    }
    return APP_URL . '/uploads/payment_proofs/' . $filename;
}

/**
 * Delete payment proof file
 * @param string $filename
 * @return bool
 */
function deletePaymentProof($filename) {
    if (empty($filename)) {
        return true;
    }
    
    $filepath = BASE_PATH . '/uploads/payment_proofs/' . $filename;
    if (file_exists($filepath)) {
        return unlink($filepath);
    }
    return true;
}
