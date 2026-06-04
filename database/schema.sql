-- Database Schema for Booking Lapangan Application
-- Created for PHP Native Application

-- Create Database
CREATE DATABASE IF NOT EXISTS booking_lapangan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE booking_lapangan;

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'customer') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: fields (lapangan)
CREATE TABLE IF NOT EXISTS fields (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: bookings
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    field_id INT NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    dp_amount DECIMAL(10, 2) NOT NULL,
    payment_proof VARCHAR(255) NULL,
    payment_proof_uploaded_at TIMESTAMP NULL,
    status ENUM('pending', 'dp_paid', 'confirmed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_field_id (field_id),
    INDEX idx_booking_date (booking_date),
    INDEX idx_status (status),
    -- Prevent double booking (same field, date, and overlapping time)
    UNIQUE KEY unique_booking (field_id, booking_date, start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Default Admin User
-- Password: admin123 (hashed)
INSERT INTO users (name, email, password, role) VALUES
('Administrator', 'admin@bookinglapangan.com', '$2y$10$8h93mJq0Zrl3XiScpdoYyOnvcmjVSGp7Ytt8R9NA5zgIBJJuKUVj.', 'admin');

-- Insert Sample Fields
INSERT INTO fields (name, price, status) VALUES
('Lapangan Futsal A', 150000.00, 'active'),
('Lapangan Futsal B', 150000.00, 'active'),
('Lapangan Voli', 100000.00, 'active'),
('Lapangan Badminton 1', 80000.00, 'active'),
('Lapangan Badminton 2', 80000.00, 'active');
