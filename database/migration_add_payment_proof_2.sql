-- Migration: Add payment_proof_2 column to bookings table
-- This adds support for the second payment (pelunasan) after DP

ALTER TABLE bookings 
ADD COLUMN payment_proof_2 VARCHAR(255) NULL AFTER payment_proof_uploaded_at,
ADD COLUMN payment_proof_2_uploaded_at TIMESTAMP NULL AFTER payment_proof_2,
MODIFY COLUMN status ENUM('pending', 'dp_paid', 'payment_2_pending', 'paid', 'confirmed', 'cancelled') DEFAULT 'pending';
