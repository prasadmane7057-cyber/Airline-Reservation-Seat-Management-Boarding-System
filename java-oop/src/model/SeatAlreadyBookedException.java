/*
 * SeatAlreadyBookedException.java
 * -----------------------------------------------------------
 * PSOOP (Java) - Review 4, CO3 (custom exceptions)
 * Airline Reservation, Seat Management & Boarding System
 * Author: Vaishnavi
 * -----------------------------------------------------------
 * A CUSTOM CHECKED EXCEPTION: thrown when someone tries to book
 * a seat that has already been booked by another passenger.
 *
 * It extends Exception (not RuntimeException), which makes it a
 * CHECKED exception - any method that can throw it must either
 * handle it with try/catch or declare "throws
 * SeatAlreadyBookedException" in its own signature. That's the
 * right choice here: a seat conflict is an expected, recoverable
 * business situation (the caller should catch it and, e.g., offer
 * a different seat), not a programming bug.
 * -----------------------------------------------------------
 */
package model;

public class SeatAlreadyBookedException extends Exception {

    // Which seat the caller tried to book - kept so the code that
    // catches this exception can look at exactly which seat failed,
    // not just read the message text.
    private String seatNumber;

    public SeatAlreadyBookedException(String seatNumber) {
        // super(...) passes a human-readable message up to the
        // built-in Exception class, which is what getMessage() and
        // the default printStackTrace() output will show.
        super("Seat " + seatNumber + " is already booked.");
        this.seatNumber = seatNumber;
    }

    public String getSeatNumber() {
        return seatNumber;
    }
}
