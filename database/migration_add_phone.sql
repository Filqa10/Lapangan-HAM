-- Migration: Add phone column to users table

ALTER TABLE users
ADD COLUMN phone VARCHAR(20) NULL AFTER email;
