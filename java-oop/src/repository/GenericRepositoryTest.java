package repository;

import model.Booking;
import model.Passenger;

import java.util.List;
import java.util.Optional;

/**
 * =============================================================================
 * Class: GenericRepositoryTest
 * Subject: Principles of Object-Oriented Programming (Java OOP / PSOOP)
 * Purpose: Validates compile-time type safety, CRUD operations, and stream queries.
 * =============================================================================
 */
public class GenericRepositoryTest {

    public static void main(String[] args) {
        System.out.println("====================================================================");
        System.out.println("   JAVA OOP: GENERIC REPOSITORY ARCHITECTURE TEST (<T, ID>)         ");
        System.out.println("====================================================================");

        // 1. Initialize BookingRepository
        BookingRepository bookingRepo = new BookingRepository();
        System.out.println("\n--- TEST 1: Initializing Generic Repository & Saving Entities ---");

        Booking b1 = new Booking("Aarav Sharma", "AI101", "12A", "2026-10-15");
        Booking b2 = new Booking("Sneha Iyer", "AI202", "3B", "2026-10-15");
        Booking b3 = new Booking("Rohan Mehta", "AI101", "14C", "2026-10-16");
        Booking b4 = new Booking("Priya Desai", "AI303", "1A", "2026-10-16");

        bookingRepo.save(b1);
        bookingRepo.save(b2);
        bookingRepo.save(b3);
        bookingRepo.save(b4);

        System.out.println("Total saved bookings in repository: " + bookingRepo.count());
        assert bookingRepo.count() == 4 : "Count check failed";

        // 2. Lookup by ID (PNR)
        System.out.println("\n--- TEST 2: FindById (O(1) PNR Lookup) ---");
        String testPnr = b1.getPnr();
        Optional<Booking> fetched = bookingRepo.findById(testPnr);
        System.out.println("Querying PNR: " + testPnr);
        if (fetched.isPresent()) {
            Booking b = fetched.get();
            System.out.println("  [FOUND] Passenger: " + b.getPassengerName() 
                    + " | Flight: " + b.getFlightNumber() + " | Seat: " + b.getSeatNumber());
        } else {
            System.err.println("  [ERROR] PNR not found!");
        }

        // 3. Domain-Specific Query: Find by Flight Number
        System.out.println("\n--- TEST 3: Domain Filter: findByFlightNumber('AI101') ---");
        List<Booking> ai101Bookings = bookingRepo.findByFlightNumber("AI101");
        System.out.println("Found " + ai101Bookings.size() + " bookings for AI101:");
        for (Booking b : ai101Bookings) {
            System.out.println("  * PNR: " + b.getPnr() + " -> " + b.getPassengerName() + " (" + b.getSeatNumber() + ")");
        }
        assert ai101Bookings.size() == 2 : "AI101 booking count mismatch";

        // 4. Passenger Repository Demonstration
        System.out.println("\n--- TEST 4: Generic Passenger Repository ---");
        PassengerRepository passengerRepo = new PassengerRepository();

        Passenger p1 = new Passenger("PAX-101", "Aarav Sharma", "aarav@example.com", "+91-9823456789", "Business");
        Passenger p2 = new Passenger("PAX-102", "Sneha Iyer", "sneha@example.com", "+91-9834567890", "First Class");
        Passenger p3 = new Passenger("PAX-103", "Vikram Rao", "vikram@example.com", "+91-9845678901", "Economy");

        passengerRepo.saveAll(List.of(p1, p2, p3));
        System.out.println("Total passengers registered: " + passengerRepo.count());

        Optional<Passenger> optPax = passengerRepo.findByEmail("sneha@example.com");
        optPax.ifPresent(p -> System.out.println("  [EMAIL LOOKUP SUCCESS] " + p.getName() + " (" + p.getPreferredClass() + ")"));

        // 5. Deletion & Exists Check
        System.out.println("\n--- TEST 5: Deletion & Existence Checks ---");
        boolean deleted = bookingRepo.deleteById(b2.getPnr());
        System.out.println("Deleted booking " + b2.getPnr() + ": " + deleted);
        System.out.println("Exists check for " + b2.getPnr() + ": " + bookingRepo.existsById(b2.getPnr()));
        System.out.println("Remaining bookings: " + bookingRepo.count());
        assert bookingRepo.count() == 3 : "Post-delete count mismatch";

        System.out.println("\n====================================================================");
        System.out.println("  ALL GENERIC REPOSITORY TESTS PASSED SUCCESSFULLY!                 ");
        System.out.println("====================================================================");
    }
}
