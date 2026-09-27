-- =======================================================
-- AIRLINE RESERVATION, SEAT MANAGEMENT & BOARDING SYSTEM
-- Database Schema: airline_reservation
-- =======================================================

CREATE DATABASE IF NOT EXISTS airline_reservation;
USE airline_reservation;

-- Drop tables in reverse order of foreign key dependencies
DROP TABLE IF EXISTS boarding;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS booking_passengers;
DROP TABLE IF EXISTS pnr_records;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS seats;
DROP TABLE IF EXISTS flights;
DROP TABLE IF EXISTS aircraft;
DROP TABLE IF EXISTS airports;
DROP TABLE IF EXISTS staff;
DROP TABLE IF EXISTS passengers;
DROP TABLE IF EXISTS users;

-- -------------------------------------------------------
-- 1. USERS TABLE (Authentication & Base Account Info)
-- -------------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('passenger', 'admin', 'staff') NOT NULL DEFAULT 'passenger',
    phone VARCHAR(20),
    address TEXT,
    dob DATE,
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- 2. PASSENGERS TABLE (Extended Passenger Profile)
-- -------------------------------------------------------
CREATE TABLE passengers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,
    phone VARCHAR(20),
    passport_number VARCHAR(50),
    gender ENUM('Male', 'Female', 'Other'),
    age INT,
    preferred_class ENUM('Economy', 'Business', 'First Class') DEFAULT 'Economy',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- 3. STAFF TABLE (Extended Staff/Crew Profile)
-- -------------------------------------------------------
CREATE TABLE staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    staff_code VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- 4. AIRPORTS TABLE
-- -------------------------------------------------------
CREATE TABLE airports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    airport_code VARCHAR(10) NOT NULL UNIQUE,
    airport_name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- 5. AIRCRAFT TABLE
-- -------------------------------------------------------
CREATE TABLE aircraft (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model VARCHAR(100) NOT NULL,
    registration_number VARCHAR(50) NOT NULL UNIQUE,
    total_seats INT NOT NULL DEFAULT 120,
    first_class_seats INT NOT NULL DEFAULT 8,
    business_seats INT NOT NULL DEFAULT 18,
    economy_seats INT NOT NULL DEFAULT 94,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- 6. FLIGHTS TABLE
-- -------------------------------------------------------
CREATE TABLE flights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flight_number VARCHAR(20) NOT NULL UNIQUE,
    airline VARCHAR(100) NOT NULL DEFAULT 'SkyWings Airlines',
    aircraft_id INT NOT NULL,
    from_airport_id INT NOT NULL,
    to_airport_id INT NOT NULL,
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    duration VARCHAR(50) NOT NULL,
    economy_fare DECIMAL(10, 2) NOT NULL DEFAULT 5000.00,
    business_fare DECIMAL(10, 2) NOT NULL DEFAULT 12000.00,
    first_class_fare DECIMAL(10, 2) NOT NULL DEFAULT 22000.00,
    total_seats INT NOT NULL DEFAULT 120,
    available_seats INT NOT NULL DEFAULT 120,
    status ENUM('SCHEDULED', 'BOARDING', 'DEPARTED', 'DELAYED', 'CANCELLED', 'COMPLETED') DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aircraft_id) REFERENCES aircraft(id) ON DELETE RESTRICT,
    FOREIGN KEY (from_airport_id) REFERENCES airports(id) ON DELETE RESTRICT,
    FOREIGN KEY (to_airport_id) REFERENCES airports(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- 7. SEATS TABLE (Flight Specific Seat Allocations)
-- -------------------------------------------------------
CREATE TABLE seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flight_id INT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    row_number INT NOT NULL,
    column_letter VARCHAR(2) NOT NULL,
    seat_class ENUM('First Class', 'Business', 'Economy') NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE,
    price_multiplier DECIMAL(3, 2) DEFAULT 1.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_flight_seat (flight_id, seat_number),
    FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- 8. BOOKINGS TABLE
-- -------------------------------------------------------
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pnr VARCHAR(10) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    flight_id INT NOT NULL,
    total_fare DECIMAL(10, 2) NOT NULL,
    base_fare DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    booking_status ENUM('CONFIRMED', 'CANCELLED', 'COMPLETED', 'PENDING') DEFAULT 'CONFIRMED',
    payment_status ENUM('PAID', 'PENDING', 'REFUNDED', 'FAILED') DEFAULT 'PAID',
    travel_class ENUM('First Class', 'Business', 'Economy') NOT NULL DEFAULT 'Economy',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- 9. BOOKING_PASSENGERS TABLE (Individual Passenger Per Booking)
-- -------------------------------------------------------
CREATE TABLE booking_passengers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    seat_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    passport_id VARCHAR(50),
    seat_number VARCHAR(10) NOT NULL,
    travel_class ENUM('First Class', 'Business', 'Economy') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- 10. PAYMENTS TABLE
-- -------------------------------------------------------
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    payment_method ENUM('Credit Card', 'Debit Card', 'UPI', 'Net Banking') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_status ENUM('SUCCESS', 'FAILED', 'REFUNDED') DEFAULT 'SUCCESS',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- 11. PNR_RECORDS TABLE
-- -------------------------------------------------------
CREATE TABLE pnr_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pnr VARCHAR(10) NOT NULL UNIQUE,
    booking_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- 12. BOARDING TABLE (Boarding Management & Pass Records)
-- -------------------------------------------------------
CREATE TABLE boarding (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    passenger_id INT NOT NULL,
    flight_id INT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    gate VARCHAR(10) DEFAULT 'Gate 4B',
    boarding_group VARCHAR(10) DEFAULT 'Group 2',
    boarding_time DATETIME,
    check_in_status ENUM('NOT_CHECKED_IN', 'CHECKED_IN') DEFAULT 'NOT_CHECKED_IN',
    boarding_status ENUM('NOT_CHECKED_IN', 'CHECKED_IN', 'BOARDING', 'BOARDED') DEFAULT 'NOT_CHECKED_IN',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (passenger_id) REFERENCES booking_passengers(id) ON DELETE CASCADE,
    FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
