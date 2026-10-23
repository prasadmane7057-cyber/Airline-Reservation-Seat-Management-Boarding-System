/*
 * BookingService.java
 * -----------------------------------------------------------
 * PSOOP (Java) - Review 4, CO3 (exception handling in the booking flow)
 * Airline Reservation, Seat Management & Boarding System
 * Author: Vaishnavi
 * -----------------------------------------------------------
 * This is where SeatAlreadyBookedException and InvalidPNRException
 * actually get thrown and caught - the "booking flow" the task
 * description refers to.
 *
 * INTEGRATION NOTE: the project's real Passenger/Booking/PNR
 * classes (built by other teammates) weren't available to build
 * this against directly, so this file keeps its OWN tiny internal
 * record of "which PNR booked which seat" using a HashMap, exactly
 * the way Siddhi's Review 4 task already plans to use a HashMap
 * for PNR-to-Booking lookup. That keeps this file fully compilable
 * and testable right now. To wire it into the real system later,
 * replace the two HashMap fields below with calls into the real
 * Booking/PNR classes and the PL team's PNR hash table - the
 * method signatures (bookSeat, cancelBooking, lookupSeat) and the
 * exceptions they throw do not need to change.
 * -----------------------------------------------------------
 */

package model;

import java.util.HashMap;
import java.util.Map;

public class BookingService {

    // pnrToSeat:  "PNR1001" -> "12A"   (what seat does this PNR hold?)
    // seatToPnr:  "12A" -> "PNR1001"   (is this seat already taken, and by whom?)
    // Kept as two maps (instead of searching one map both ways) so
    // both lookups stay fast - this mirrors the PL team's PNR
    // hashing practical, just done here in Java for now.
    private Map<String, String> pnrToSeat;
    private Map<String, String> seatToPnr;

    public BookingService() {
        pnrToSeat = new HashMap<>();
        seatToPnr = new HashMap<>();
    }

    // -------------------------------------------------------
    // bookSeat(): reserves a seat under a PNR.
    // Throws SeatAlreadyBookedException if that seat is already
    // taken by someone else - this is a CHECKED exception, so
    // every caller of this method is forced by the compiler to
    // either catch it or declare it, which is exactly what we
    // want for a real booking failure that must not be ignored.
    // -------------------------------------------------------
    public void bookSeat(String pnr, String seatNumber) throws SeatAlreadyBookedException {
        if (seatToPnr.containsKey(seatNumber)) {
            throw new SeatAlreadyBookedException(seatNumber);
        }

        pnrToSeat.put(pnr, seatNumber);
        seatToPnr.put(seatNumber, pnr);
    }

    // -------------------------------------------------------
    // lookupSeat(): finds which seat a PNR holds.
    // Throws InvalidPNRException if the PNR was never booked (or
    // was already cancelled).
    // -------------------------------------------------------
    public String lookupSeat(String pnr) throws InvalidPNRException {
        if (!pnrToSeat.containsKey(pnr)) {
            throw new InvalidPNRException(pnr);
        }
        return pnrToSeat.get(pnr);
    }

    // -------------------------------------------------------
    // cancelBooking(): releases a PNR's seat so it can be booked
    // by someone else. Throws InvalidPNRException on an unknown
    // PNR, same as lookupSeat().
    // -------------------------------------------------------
    public void cancelBooking(String pnr) throws InvalidPNRException {
        if (!pnrToSeat.containsKey(pnr)) {
            throw new InvalidPNRException(pnr);
        }

        String seatNumber = pnrToSeat.get(pnr);
        pnrToSeat.remove(pnr);
        seatToPnr.remove(seatNumber);
    }

    // =========================================================
    // DEMO: exercises every exception path, using try/catch for
    // the error cases and try/finally to show finally running
    // EVERY time - whether the try block succeeded or an
    // exception was thrown and caught.
    // =========================================================
    public static void main(String[] args) {
        BookingService service = new BookingService();

        System.out.println("===== Booking Flow Exception Demo =====\n");

        // ---- Case 1: a normal, successful booking ----
        System.out.println("-- Case 1: book seat 12A for PNR1001 --");
        try {
            service.bookSeat("PNR1001", "12A");
            System.out.println("  Booked successfully.");
        } catch (SeatAlreadyBookedException e) {
            System.out.println("  FAILED: " + e.getMessage());
        } finally {
            System.out.println("  [finally] booking attempt for PNR1001 finished.\n");
        }

        // ---- Case 2: try to book the SAME seat again under a different PNR ----
        System.out.println("-- Case 2: book seat 12A again, this time for PNR1002 --");
        try {
            service.bookSeat("PNR1002", "12A");
            System.out.println("  Booked successfully.");   // this line will NOT run
        } catch (SeatAlreadyBookedException e) {
            System.out.println("  CAUGHT SeatAlreadyBookedException: " + e.getMessage());
            System.out.println("  (conflicting seat was: " + e.getSeatNumber() + ")");
        } finally {
            System.out.println("  [finally] booking attempt for PNR1002 finished.\n");
        }

        // ---- Case 3: look up a PNR that was never booked ----
        System.out.println("-- Case 3: look up PNR9999, which was never booked --");
        try {
            String seat = service.lookupSeat("PNR9999");
            System.out.println("  Found seat: " + seat);   // this line will NOT run
        } catch (InvalidPNRException e) {
            System.out.println("  CAUGHT InvalidPNRException: " + e.getMessage());
        } finally {
            System.out.println("  [finally] lookup attempt for PNR9999 finished.\n");
        }

        // ---- Case 4: cancel a real booking, then try to cancel it again ----
        System.out.println("-- Case 4: cancel PNR1001, then try to cancel it again --");
        try {
            service.cancelBooking("PNR1001");
            System.out.println("  PNR1001 cancelled - seat 12A is free again.");
        } catch (InvalidPNRException e) {
            System.out.println("  CAUGHT InvalidPNRException: " + e.getMessage());
        } finally {
            System.out.println("  [finally] first cancel attempt finished.\n");
        }

        try {
            service.cancelBooking("PNR1001");   // already cancelled - PNR no longer exists
            System.out.println("  PNR1001 cancelled - seat 12A is free again.");   // this line will NOT run
        } catch (InvalidPNRException e) {
            System.out.println("  CAUGHT InvalidPNRException: " + e.getMessage());
        } finally {
            System.out.println("  [finally] second cancel attempt finished.\n");
        }

        // ---- Case 5: seat 12A was freed in Case 4 - confirm it can be rebooked ----
        System.out.println("-- Case 5: book the now-free seat 12A for PNR1002 --");
        try {
            service.bookSeat("PNR1002", "12A");
            System.out.println("  Booked successfully - confirms cancellation genuinely freed the seat.");
        } catch (SeatAlreadyBookedException e) {
            System.out.println("  FAILED: " + e.getMessage());
        } finally {
            System.out.println("  [finally] booking attempt for PNR1002 finished.");
        }
    }
}
