-- =======================================================
-- AIRLINE RESERVATION SYSTEM - SEED DATA
-- Database: airline_reservation
-- =======================================================

USE airline_reservation;

-- -------------------------------------------------------
-- 1. SEED USERS (Password for all accounts: admin123 / pass123)
-- -------------------------------------------------------
-- admin123 hash: $2a$10$twqayURvLWzPdD3mKW34nOv4lynHIvP5weSH.rLZACdhfffpHdZZy
-- pass123 hash:  $2a$10$kHj6fF1gUhYuokYPYjO71uT7X7pesR419p.lR/zaWyJ1mtxuTOrtm

INSERT INTO users (id, name, email, password_hash, role, phone, address, dob, status) VALUES
(1, 'System Administrator', 'admin@airline.com', '$2a$10$twqayURvLWzPdD3mKW34nOv4lynHIvP5weSH.rLZACdhfffpHdZZy', 'admin', '+91-9876543210', 'Headquarters, Terminal 3, New Delhi', '1985-05-15', 'ACTIVE'),
(2, 'Demo Passenger', 'passenger@airline.com', '$2a$10$kHj6fF1gUhYuokYPYjO71uT7X7pesR419p.lR/zaWyJ1mtxuTOrtm', 'passenger', '+91-9812345678', '402, Sunshine Heights, Mumbai', '1995-08-20', 'ACTIVE'),
(3, 'Aarav Sharma', 'aarav.sharma@example.com', '$2a$10$kHj6fF1gUhYuokYPYjO71uT7X7pesR419p.lR/zaWyJ1mtxuTOrtm', 'passenger', '+91-9823456789', '12/B, Green Avenue, Pune', '1992-03-12', 'ACTIVE'),
(4, 'Sneha Iyer', 'sneha.iyer@example.com', '$2a$10$kHj6fF1gUhYuokYPYjO71uT7X7pesR419p.lR/zaWyJ1mtxuTOrtm', 'passenger', '+91-9834567890', '701, Marina Bay, Chennai', '1998-11-25', 'ACTIVE'),
(5, 'Captain Rajesh Khanna', 'rajesh.staff@airline.com', '$2a$10$twqayURvLWzPdD3mKW34nOv4lynHIvP5weSH.rLZACdhfffpHdZZy', 'staff', '+91-9845678901', 'Aircrew Enclave, Bengaluru', '1980-01-10', 'ACTIVE');

-- -------------------------------------------------------
-- 2. SEED PASSENGERS & STAFF
-- -------------------------------------------------------
INSERT INTO passengers (id, user_id, name, email, phone, passport_number, gender, age, preferred_class) VALUES
(1, 2, 'Demo Passenger', 'passenger@airline.com', '+91-9812345678', 'Z9823412', 'Male', 29, 'Economy'),
(2, 3, 'Aarav Sharma', 'aarav.sharma@example.com', '+91-9823456789', 'M4512987', 'Male', 32, 'Business'),
(3, 4, 'Sneha Iyer', 'sneha.iyer@example.com', '+91-9834567890', 'K7823901', 'Female', 26, 'First Class');

INSERT INTO staff (id, user_id, staff_code, department, role) VALUES
(1, 5, 'STF-1001', 'Flight Operations', 'Senior Captain'),
(2, 1, 'ADM-0001', 'Management', 'Chief System Administrator');

-- -------------------------------------------------------
-- 3. SEED AIRPORTS
-- -------------------------------------------------------
INSERT INTO airports (id, airport_code, airport_name, city, country) VALUES
(1, 'BOM', 'Chhatrapati Shivaji Maharaj International Airport', 'Mumbai', 'India'),
(2, 'DEL', 'Indira Gandhi International Airport', 'Delhi', 'India'),
(3, 'BLR', 'Kempegowda International Airport', 'Bengaluru', 'India'),
(4, 'HYD', 'Rajiv Gandhi International Airport', 'Hyderabad', 'India'),
(5, 'PNQ', 'Pune International Airport', 'Pune', 'India'),
(6, 'CCU', 'Netaji Subhash Chandra Bose International Airport', 'Kolkata', 'India'),
(7, 'MAA', 'Chennai International Airport', 'Chennai', 'India');

-- -------------------------------------------------------
-- 4. SEED AIRCRAFT
-- -------------------------------------------------------
INSERT INTO aircraft (id, model, registration_number, total_seats, first_class_seats, business_seats, economy_seats) VALUES
(1, 'Boeing 737-800', 'VT-SK1', 116, 8, 18, 90),
(2, 'Airbus A320neo', 'VT-SK2', 116, 8, 18, 90),
(3, 'Boeing 787-9 Dreamliner', 'VT-SK3', 116, 8, 18, 90);

-- -------------------------------------------------------
-- 5. SEED FLIGHTS
-- -------------------------------------------------------
INSERT INTO flights (id, flight_number, airline, aircraft_id, from_airport_id, to_airport_id, departure_time, arrival_time, duration, economy_fare, business_fare, first_class_fare, total_seats, available_seats, status) VALUES
(1, 'AI101', 'SkyWings Airlines', 1, 1, 2, '2026-10-15 06:00:00', '2026-10-15 08:15:00', '2h 15m', 4500.00, 11500.00, 21000.00, 116, 114, 'SCHEDULED'),
(2, 'AI202', 'SkyWings Airlines', 2, 2, 3, '2026-10-15 09:30:00', '2026-10-15 12:15:00', '2h 45m', 5200.00, 13000.00, 24000.00, 116, 115, 'SCHEDULED'),
(3, 'AI303', 'SkyWings Airlines', 1, 5, 4, '2026-10-15 14:00:00', '2026-10-15 15:20:00', '1h 20m', 3800.00, 9500.00, 18000.00, 116, 115, 'SCHEDULED'),
(4, 'AI404', 'SkyWings Airlines', 3, 1, 3, '2026-10-16 17:45:00', '2026-10-16 19:30:00', '1h 45m', 4800.00, 12200.00, 22500.00, 116, 115, 'SCHEDULED'),
(5, 'AI505', 'SkyWings Airlines', 2, 3, 2, '2026-10-16 20:15:00', '2026-10-16 23:00:00', '2h 45m', 5400.00, 13500.00, 25000.00, 116, 116, 'SCHEDULED'),
(6, 'AI606', 'SkyWings Airlines', 1, 4, 1, '2026-10-17 11:00:00', '2026-10-17 12:30:00', '1h 30m', 4100.00, 10500.00, 19500.00, 116, 116, 'SCHEDULED');

-- -------------------------------------------------------
-- 6. SEED SEATS (For Flight AI101, AI202, AI303, AI404)
-- Standard Configuration:
-- Rows 1-2: First Class (A, B, E, F) - 8 seats
-- Rows 3-5: Business (A, B, C, D, E, F) - 18 seats
-- Rows 6-20: Economy (A, B, C, D, E, F) - 90 seats
-- -------------------------------------------------------

-- Flight 1 (AI101) Seats
INSERT INTO seats (flight_id, seat_number, row_number, column_letter, seat_class, is_occupied) VALUES
-- First Class Rows 1-2
(1, '1A', 1, 'A', 'First Class', FALSE), (1, '1B', 1, 'B', 'First Class', FALSE), (1, '1E', 1, 'E', 'First Class', FALSE), (1, '1F', 1, 'F', 'First Class', FALSE),
(1, '2A', 2, 'A', 'First Class', FALSE), (1, '2B', 2, 'B', 'First Class', FALSE), (1, '2E', 2, 'E', 'First Class', FALSE), (1, '2F', 2, 'F', 'First Class', FALSE),
-- Business Class Rows 3-5
(1, '3A', 3, 'A', 'Business', FALSE), (1, '3B', 3, 'B', 'Business', FALSE), (1, '3C', 3, 'C', 'Business', FALSE), (1, '3D', 3, 'D', 'Business', FALSE), (1, '3E', 3, 'E', 'Business', FALSE), (1, '3F', 3, 'F', 'Business', FALSE),
(1, '4A', 4, 'A', 'Business', FALSE), (1, '4B', 4, 'B', 'Business', FALSE), (1, '4C', 4, 'C', 'Business', FALSE), (1, '4D', 4, 'D', 'Business', FALSE), (1, '4E', 4, 'E', 'Business', FALSE), (1, '4F', 4, 'F', 'Business', FALSE),
(1, '5A', 5, 'A', 'Business', FALSE), (1, '5B', 5, 'B', 'Business', FALSE), (1, '5C', 5, 'C', 'Business', FALSE), (1, '5D', 5, 'D', 'Business', FALSE), (1, '5E', 5, 'E', 'Business', FALSE), (1, '5F', 5, 'F', 'Business', FALSE),
-- Economy Class Sample Rows 6-20 (6A occupied for seed booking)
(1, '6A', 6, 'A', 'Economy', TRUE), (1, '6B', 6, 'B', 'Economy', FALSE), (1, '6C', 6, 'C', 'Economy', FALSE), (1, '6D', 6, 'D', 'Economy', FALSE), (1, '6E', 6, 'E', 'Economy', FALSE), (1, '6F', 6, 'F', 'Economy', FALSE),
(1, '7A', 7, 'A', 'Economy', FALSE), (1, '7B', 7, 'B', 'Economy', FALSE), (1, '7C', 7, 'C', 'Economy', FALSE), (1, '7D', 7, 'D', 'Economy', FALSE), (1, '7E', 7, 'E', 'Economy', FALSE), (1, '7F', 7, 'F', 'Economy', FALSE),
(1, '8A', 8, 'A', 'Economy', FALSE), (1, '8B', 8, 'B', 'Economy', FALSE), (1, '8C', 8, 'C', 'Economy', FALSE), (1, '8D', 8, 'D', 'Economy', FALSE), (1, '8E', 8, 'E', 'Economy', FALSE), (1, '8F', 8, 'F', 'Economy', FALSE),
(1, '9A', 9, 'A', 'Economy', FALSE), (1, '9B', 9, 'B', 'Economy', FALSE), (1, '9C', 9, 'C', 'Economy', FALSE), (1, '9D', 9, 'D', 'Economy', FALSE), (1, '9E', 9, 'E', 'Economy', FALSE), (1, '9F', 9, 'F', 'Economy', FALSE),
(1, '10A', 10, 'A', 'Economy', FALSE), (1, '10B', 10, 'B', 'Economy', FALSE), (1, '10C', 10, 'C', 'Economy', FALSE), (1, '10D', 10, 'D', 'Economy', FALSE), (1, '10E', 10, 'E', 'Economy', FALSE), (1, '10F', 10, 'F', 'Economy', FALSE),
(1, '11A', 11, 'A', 'Economy', FALSE), (1, '11B', 11, 'B', 'Economy', FALSE), (1, '11C', 11, 'C', 'Economy', FALSE), (1, '11D', 11, 'D', 'Economy', FALSE), (1, '11E', 11, 'E', 'Economy', FALSE), (1, '11F', 11, 'F', 'Economy', FALSE),
(1, '12A', 12, 'A', 'Economy', FALSE), (1, '12B', 12, 'B', 'Economy', FALSE), (1, '12C', 12, 'C', 'Economy', FALSE), (1, '12D', 12, 'D', 'Economy', FALSE), (1, '12E', 12, 'E', 'Economy', FALSE), (1, '12F', 12, 'F', 'Economy', FALSE);

-- Flight 2 (AI202) Seats
INSERT INTO seats (flight_id, seat_number, row_number, column_letter, seat_class, is_occupied) VALUES
(2, '1A', 1, 'A', 'First Class', FALSE), (2, '1B', 1, 'B', 'First Class', FALSE), (2, '1E', 1, 'E', 'First Class', FALSE), (2, '1F', 1, 'F', 'First Class', FALSE),
(2, '2A', 2, 'A', 'First Class', FALSE), (2, '2B', 2, 'B', 'First Class', FALSE), (2, '2E', 2, 'E', 'First Class', FALSE), (2, '2F', 2, 'F', 'First Class', FALSE),
(2, '3A', 3, 'A', 'Business', TRUE), (2, '3B', 3, 'B', 'Business', FALSE), (2, '3C', 3, 'C', 'Business', FALSE), (2, '3D', 3, 'D', 'Business', FALSE), (2, '3E', 3, 'E', 'Business', FALSE), (2, '3F', 3, 'F', 'Business', FALSE),
(2, '4A', 4, 'A', 'Business', FALSE), (2, '4B', 4, 'B', 'Business', FALSE), (2, '4C', 4, 'C', 'Business', FALSE), (2, '4D', 4, 'D', 'Business', FALSE), (2, '4E', 4, 'E', 'Business', FALSE), (2, '4F', 4, 'F', 'Business', FALSE),
(2, '6A', 6, 'A', 'Economy', FALSE), (2, '6B', 6, 'B', 'Economy', FALSE), (2, '6C', 6, 'C', 'Economy', FALSE), (2, '6D', 6, 'D', 'Economy', FALSE), (2, '6E', 6, 'E', 'Economy', FALSE), (2, '6F', 6, 'F', 'Economy', FALSE),
(2, '7A', 7, 'A', 'Economy', FALSE), (2, '7B', 7, 'B', 'Economy', FALSE), (2, '7C', 7, 'C', 'Economy', FALSE), (2, '7D', 7, 'D', 'Economy', FALSE), (2, '7E', 7, 'E', 'Economy', FALSE), (2, '7F', 7, 'F', 'Economy', FALSE);

-- Flight 3 (AI303) Seats
INSERT INTO seats (flight_id, seat_number, row_number, column_letter, seat_class, is_occupied) VALUES
(3, '1A', 1, 'A', 'First Class', TRUE), (3, '1B', 1, 'B', 'First Class', FALSE), (3, '1E', 1, 'E', 'First Class', FALSE), (3, '1F', 1, 'F', 'First Class', FALSE),
(3, '2A', 2, 'A', 'First Class', FALSE), (3, '2B', 2, 'B', 'First Class', FALSE), (3, '2E', 2, 'E', 'First Class', FALSE), (3, '2F', 2, 'F', 'First Class', FALSE),
(3, '3A', 3, 'A', 'Business', FALSE), (3, '3B', 3, 'B', 'Business', FALSE), (3, '3C', 3, 'C', 'Business', FALSE), (3, '3D', 3, 'D', 'Business', FALSE), (3, '3E', 3, 'E', 'Business', FALSE), (3, '3F', 3, 'F', 'Business', FALSE),
(3, '6A', 6, 'A', 'Economy', FALSE), (3, '6B', 6, 'B', 'Economy', FALSE), (3, '6C', 6, 'C', 'Economy', FALSE), (3, '6D', 6, 'D', 'Economy', FALSE), (3, '6E', 6, 'E', 'Economy', FALSE), (3, '6F', 6, 'F', 'Economy', FALSE);

-- Flight 4 (AI404) Seats
INSERT INTO seats (flight_id, seat_number, row_number, column_letter, seat_class, is_occupied) VALUES
(4, '1A', 1, 'A', 'First Class', FALSE), (4, '1B', 1, 'B', 'First Class', FALSE), (4, '1E', 1, 'E', 'First Class', FALSE), (4, '1F', 1, 'F', 'First Class', FALSE),
(4, '3A', 3, 'A', 'Business', FALSE), (4, '3B', 3, 'B', 'Business', FALSE), (4, '3C', 3, 'C', 'Business', FALSE), (4, '3D', 3, 'D', 'Business', FALSE),
(4, '6A', 6, 'A', 'Economy', FALSE), (4, '6B', 6, 'B', 'Economy', FALSE), (4, '6C', 6, 'C', 'Economy', FALSE), (4, '6D', 6, 'D', 'Economy', FALSE),
(4, '8C', 8, 'C', 'Economy', TRUE);

-- -------------------------------------------------------
-- 7. SEED BOOKINGS
-- -------------------------------------------------------
INSERT INTO bookings (id, pnr, user_id, flight_id, total_fare, base_fare, tax_amount, discount_amount, booking_status, payment_status, travel_class, booking_date) VALUES
(1, 'AI8K92', 3, 1, 4810.00, 4500.00, 810.00, 500.00, 'CONFIRMED', 'PAID', 'Economy', '2026-09-20 10:15:00'),
(2, 'SK7M41', 2, 2, 14840.00, 13000.00, 2340.00, 500.00, 'CONFIRMED', 'PAID', 'Business', '2026-09-22 14:30:00'),
(3, 'BL9X33', 4, 3, 20740.00, 18000.00, 3240.00, 500.00, 'CONFIRMED', 'PAID', 'First Class', '2026-09-24 16:45:00'),
(4, 'HY5P18', 2, 4, 5164.00, 4800.00, 864.00, 500.00, 'CONFIRMED', 'PAID', 'Economy', '2026-09-25 18:20:00'),
(5, 'CN2R77', 2, 1, 4810.00, 4500.00, 810.00, 500.00, 'CANCELLED', 'REFUNDED', 'Economy', '2026-09-18 08:00:00');

-- -------------------------------------------------------
-- 8. SEED BOOKING PASSENGERS
-- -------------------------------------------------------
INSERT INTO booking_passengers (id, booking_id, seat_id, full_name, age, gender, passport_id, seat_number, travel_class) VALUES
(1, 1, 27, 'Aarav Sharma', 32, 'Male', 'M4512987', '6A', 'Economy'),
(2, 2, 51, 'Demo Passenger', 29, 'Male', 'Z9823412', '3A', 'Business'),
(3, 3, 67, 'Sneha Iyer', 26, 'Female', 'K7823901', '1A', 'First Class'),
(4, 4, 91, 'Demo Passenger', 29, 'Male', 'Z9823412', '8C', 'Economy');

-- -------------------------------------------------------
-- 9. SEED PAYMENTS
-- -------------------------------------------------------
INSERT INTO payments (id, booking_id, transaction_id, payment_method, amount, payment_status, payment_date) VALUES
(1, 1, 'TXN-908234101', 'Credit Card', 4810.00, 'SUCCESS', '2026-09-20 10:17:00'),
(2, 2, 'TXN-908234202', 'UPI', 14840.00, 'SUCCESS', '2026-09-22 14:32:00'),
(3, 3, 'TXN-908234303', 'Net Banking', 20740.00, 'SUCCESS', '2026-09-24 16:47:00'),
(4, 4, 'TXN-908234404', 'Debit Card', 5164.00, 'SUCCESS', '2026-09-25 18:22:00'),
(5, 5, 'TXN-908234505', 'Credit Card', 4810.00, 'REFUNDED', '2026-09-18 08:02:00');

-- -------------------------------------------------------
-- 10. SEED PNR RECORDS
-- -------------------------------------------------------
INSERT INTO pnr_records (id, pnr, booking_id, is_active) VALUES
(1, 'AI8K92', 1, TRUE),
(2, 'SK7M41', 2, TRUE),
(3, 'BL9X33', 3, TRUE),
(4, 'HY5P18', 4, TRUE),
(5, 'CN2R77', 5, FALSE);

-- -------------------------------------------------------
-- 11. SEED BOARDING RECORDS
-- -------------------------------------------------------
INSERT INTO boarding (id, booking_id, passenger_id, flight_id, seat_number, gate, boarding_group, boarding_time, check_in_status, boarding_status) VALUES
(1, 1, 1, 1, '6A', 'Gate 3A', 'Group 3', '2026-10-15 05:15:00', 'CHECKED_IN', 'BOARDING'),
(2, 2, 2, 2, '3A', 'Gate 1B', 'Group 1', '2026-10-15 08:45:00', 'CHECKED_IN', 'CHECKED_IN'),
(3, 3, 3, 3, '1A', 'Gate 2C', 'Group 1', '2026-10-15 13:15:00', 'CHECKED_IN', 'BOARDED'),
(4, 4, 4, 4, '8C', 'Gate 4D', 'Group 3', '2026-10-16 17:00:00', 'NOT_CHECKED_IN', 'NOT_CHECKED_IN');
