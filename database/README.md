# Airline Reservation Database Setup Guide

This database holds all persistent entities for the **Airline Reservation, Seat Management & Boarding System**.

## Database Specifications
- **DBMS**: MySQL 8.0+ / MariaDB
- **Database Name**: `airline_reservation`
- **Port**: `3306`

## Relational Entity Model
```
users (base account, role: admin/passenger/staff)
  ├── passengers (passenger profile details)
  ├── staff (airline staff profile details)
  └── bookings
        ├── booking_passengers (assigned seat per passenger)
        │     └── seats (individual seat record per flight)
        ├── payments (transaction logs)
        ├── pnr_records (unique 6-character PNR reference)
        └── boarding (check-in, gate, boarding sequence)

airports
  └── flights (origin, destination, departure, fares)
        └── seats (First Class, Business, Economy layout)

aircraft (seating capacities and registration)
  └── flights
```

---

## Setup Instructions

### Option 1: Using MySQL Command Line Client (CLI)
1. Open terminal / Command Prompt.
2. Log into MySQL as root or privileged user:
   ```bash
   mysql -u root -p
   ```
3. Run the schema and seed scripts:
   ```sql
   SOURCE schema.sql;
   SOURCE seed.sql;
   ```
4. Verify database creation:
   ```sql
   SHOW DATABASES;
   USE airline_reservation;
   SHOW TABLES;
   ```

---

### Option 2: Using MySQL Workbench
1. Open **MySQL Workbench** and connect to your local MySQL server.
2. Click **File -> Open SQL Script...** and select `schema.sql`.
3. Click the ⚡ **Execute** button to create tables.
4. Click **File -> Open SQL Script...** and select `seed.sql`.
5. Click the ⚡ **Execute** button to populate initial seed data.
6. Refresh the schema navigator on the left to inspect `airline_reservation`.

---

## Preloaded Demo Accounts
| Role | Email | Password |
| :--- | :--- | :--- |
| **System Admin** | `admin@airline.com` | `admin123` |
| **Demo Passenger** | `passenger@airline.com` | `pass123` |
| **Passenger 2** | `aarav.sharma@example.com` | `pass123` |
| **Passenger 3** | `sneha.iyer@example.com` | `pass123` |
