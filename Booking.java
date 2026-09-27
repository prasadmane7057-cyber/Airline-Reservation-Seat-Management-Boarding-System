// Booking.java
// PSOOP Practical 3 (part)
// Owner: Varad
// Represents one booking record. Uses PNR.java to generate its PNR.
 
public class Booking {
    private String pnr;
    private String passengerName;
    private String flightNumber;
    private String seatNumber;
    private String bookingDate;
    private String status; // "CONFIRMED", "WAITLISTED", "CANCELLED" (waitlist/cancel logic comes in Review 3)
 
    public Booking(String passengerName, String flightNumber, String seatNumber, String bookingDate) {
        this.pnr = PNR.generatePNR();
        this.passengerName = passengerName;
        this.flightNumber = flightNumber;
        this.seatNumber = seatNumber;
        this.bookingDate = bookingDate;
        this.status = "CONFIRMED";
    }
 
    public String getPnr() {
        return pnr;
    }
 
    public String getPassengerName() {
        return passengerName;
    }
 
    public String getFlightNumber() {
        return flightNumber;
    }
 
    public String getSeatNumber() {
        return seatNumber;
    }
 
    public String getBookingDate() {
        return bookingDate;
    }
 
    public String getStatus() {
        return status;
    }
 
    public void setStatus(String status) {
        this.status = status;
    }
 
    @Override
    public String toString() {
        return "Booking [PNR=" + pnr +
               ", Passenger=" + passengerName +
               ", Flight=" + flightNumber +
               ", Seat=" + seatNumber +
               ", Date=" + bookingDate +
               ", Status=" + status + "]";
    }
}
