/*
 * InvalidPNRException.java
 * -----------------------------------------------------------
 * PSOOP (Java) - Review 4, CO3 (custom exceptions)
 * Airline Reservation, Seat Management & Boarding System
 * Author: Vaishnavi
 * -----------------------------------------------------------
 * A CUSTOM CHECKED EXCEPTION: thrown when someone looks up or
 * cancels a booking using a PNR that doesn't exist in the system -
 * e.g. a typo, an already-cancelled booking, or a fabricated PNR.
 *
 * Like SeatAlreadyBookedException, this extends Exception (checked),
 * not RuntimeException, because "PNR not found" is an expected
 * outcome of a lookup - the calling code is expected to handle it
 * (e.g. show "Booking not found, please check your PNR"), not crash.
 * -----------------------------------------------------------
 */
package model;

public class InvalidPNRException extends Exception {

    private String pnr;

    public InvalidPNRException(String pnr) {
        super("No booking found for PNR: " + pnr);
        this.pnr = pnr;
    }

    public String getPnr() {
        return pnr;
    }
}
