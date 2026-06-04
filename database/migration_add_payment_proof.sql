-- Migration: Add payment_proof column to bookings table
-- Run this SQL to update existing database

ALTER TABLE bookings 
ADD COLUMN payment_proof VARCHAR(255) NULL AFTER dp_amount,
ADD COLUMN payment_proof_uploaded_at TIMESTAMP NULL AFTER payment_proof;

-- Update existing bookings (optional - set default if needed)
-- UPDATE bookings SET payment_proof = NULL WHERE payment_proof IS NULL;
