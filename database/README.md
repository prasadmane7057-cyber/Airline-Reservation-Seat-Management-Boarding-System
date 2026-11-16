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

### Supabase reservation schema

The existing Supabase project currently exposes `public.flights` with its existing flight records. The additive migration in [`supabase_reservations_migration.sql`](./supabase_reservations_migration.sql) adds:

- `users`: the authenticated account profile used by the existing Express authentication flow.
- `passengers`: passenger identity and contact details, optionally linked to a Supabase user.
- `seats`: per-flight seat numbers, classes, and availability states.
- `bookings`: PNR, passenger/flight/seat references, fare, status, and booking time.

Bookings reference the existing `flights.id` and the selected seat for that same flight. Foreign keys, unique active-seat constraints, row locking, RLS policies, and server-side RPCs protect reservation, cancellation, and boarding operations. The fare values follow the project's stated fare structure: Economy ₹5,000, Business ₹10,000, and First Class ₹20,000.

**The migration has not been applied.** Review it first, then open the existing Supabase project, choose **SQL Editor → New query**, paste the complete file, and run it only after approving the schema changes. It does not modify or seed flights, or create airports/aircraft. Do not use the MySQL scripts below in Supabase, and do not run the legacy `supabase_airline_schema.sql` for this minimal migration.

After applying it, verify the `users`, `passengers`, `seats`, and `bookings` tables, row-level security policies, and RPC functions in the Supabase dashboard before using reservation APIs. Seat records must be created from the airline's actual seat inventory; the migration deliberately creates no fabricated seats.

The migration does not promote any account to administrator. After verifying the intended account exists, an authorized project owner may grant the admin role in SQL Editor using that account's actual email:

```sql
update public.users
set role = 'admin'
where id = (
  select id from auth.users
  where email = lower('<trusted-admin-email>')
);
```

Replace the placeholder with the email of a trusted account; do not grant admin access based on a client-supplied role.

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
