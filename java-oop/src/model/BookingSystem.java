// BookingSystemTest.java | PSOOP | Review 4 (CO3) | Siddhi
// Test that uses values typed by the user (nothing hardcoded). Run: java BookingSystemTest
// Expected results are worked out from what the user typed.

import java.util.ArrayList;

public class BookingSystemTest {
    static int passed = 0, failed = 0;

    static void check(String name, boolean ok) {
        if (ok) { passed++; System.out.println("PASS: " + name); }
        else    { failed++; System.out.println("FAIL: " + name); }
    }

    public static void main(String[] args) {
        BookingSystem.BookingStore store = new BookingSystem.BookingStore();

        System.out.println("===== Enter test data =====");
        String flight = BookingSystem.ConsoleInput.text("Flight number: ");
        int n = BookingSystem.ConsoleInput.number("How many passengers (2-6)? ", 2, 6);

        check("Add flight", store.addFlight(flight));
        check("Duplicate flight rejected", !store.addFlight(flight.toLowerCase()));

        // ---- read passengers from the user ----
        BookingSystem.BookingRecord[] all = new BookingSystem.BookingRecord[n];
        for (int i = 0; i < n; i++) {
            System.out.println("\nPassenger " + (i + 1) + ":");
            while (true) {
                String pnr  = BookingSystem.ConsoleInput.text("  PNR: ");
                String name = BookingSystem.ConsoleInput.text("  Passenger name: ");
                String seat = BookingSystem.ConsoleInput.seat();
                BookingClass bc = BookingSystem.ConsoleInput.bookingClass();
                BookingSystem.BookingRecord b =
                    new BookingSystem.BookingRecord(pnr, name, flight, seat, bc, "Confirmed");
                if (store.addBooking(b)) { all[i] = b; break; }
                System.out.println("  Not accepted (PNR or seat already used). Enter this passenger again.");
            }
        }

        System.out.println("\n===== Bookings =====");
        check("Total bookings equals number entered", store.totalBookings() == n);
        for (int i = 0; i < n; i++) {
            check("Find by PNR " + all[i].getPnr(), store.findByPnr(all[i].getPnr()) == all[i]);
        }
        check("Unknown PNR returns null", store.findByPnr("NO-SUCH-PNR") == null);

        System.out.println("\n===== Rejections =====");
        BookingSystem.BookingRecord first = all[0];
        check("Duplicate PNR rejected", !store.addBooking(new BookingSystem.BookingRecord(
              first.getPnr(), "X", flight, "99Z", new Economy(), "Confirmed")));
        check("Same seat rejected", !store.addBooking(new BookingSystem.BookingRecord(
              "NEWPNR", "X", flight, first.getSeatNumber(), new Economy(), "Confirmed")));
        check("Unknown flight rejected", !store.addBooking(new BookingSystem.BookingRecord(
              "NEWPNR2", "X", "NOFLIGHT", "99Z", new Economy(), "Confirmed")));

        System.out.println("\n===== Cancel (first passenger) =====");
        check("Cancel " + first.getPnr(), store.cancelBooking(first.getPnr()));
        ArrayList<BookingSystem.BookingRecord> active = store.getActiveBookingsForFlight(flight);
        check("Active bookings reduced by one", active.size() == n - 1);
        check("Cancelled seat can be booked again", store.addBooking(new BookingSystem.BookingRecord(
              "REUSE1", "Y", flight, first.getSeatNumber(), new Economy(), "Confirmed")));
        active = store.getActiveBookingsForFlight(flight);      // refresh after re-booking

        System.out.println("\n===== Boarding order =====");
        BookingSystem.PassengerSorter.sortForBoarding(active);
        for (BookingSystem.BookingRecord b : active) System.out.println("  " + b);
        boolean orderOk = true;
        for (int i = 0; i + 1 < active.size(); i++) {
            BookingSystem.BookingRecord a = active.get(i), b = active.get(i + 1);
            int pa = a.getBookingClass().getPriority(), pb = b.getBookingClass().getPriority();
            if (pa > pb) orderOk = false;
            if (pa == pb) {
                int ra = BookingSystem.PassengerSorter.rowOf(a.getSeatNumber());
                int rb = BookingSystem.PassengerSorter.rowOf(b.getSeatNumber());
                if (ra > rb) orderOk = false;
                if (ra == rb && BookingSystem.PassengerSorter.letterOf(a.getSeatNumber())
                              > BookingSystem.PassengerSorter.letterOf(b.getSeatNumber())) orderOk = false;
            }
        }
        check("Boarding order: class priority, then seat row, then letter", orderOk);

        System.out.println("\nPassed: " + passed + "  Failed: " + failed);
        if (failed == 0) System.out.println("ALL TESTS PASSED.");
    }
}