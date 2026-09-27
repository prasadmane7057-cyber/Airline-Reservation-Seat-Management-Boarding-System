package model;

/**
 * Class: Booking
 * Implements: IBoardable
 * Encapsulates passenger, flight, seat allocation, PNR, and calculated fare.
 * Supports overloaded constructors for simple demo as well as full flight management.
 */
public class Booking implements IBoardable {
    private String bookingId;
    private String passengerName;
    private String flightNumber;
    private String seatNumber;
    private String bookingDate;
    private Passenger passenger;
    private Flight flight;
    private Seat seat;
    private String pnr;
    private double fare;
    private String status; // "CONFIRMED", "WAITLISTED", "CANCELLED", "BOARDED"
    private boolean boarded;

    // Constructor 1: Simple Demo (used in BookingDemo & DS Practical)
    public Booking(String passengerName, String flightNumber, String seatNumber, String bookingDate) {
        this.pnr = PNR.generatePNR();
        this.bookingId = "BK-" + this.pnr;
        this.passengerName = passengerName;
        this.flightNumber = flightNumber;
        this.seatNumber = seatNumber;
        this.bookingDate = bookingDate;
        this.fare = 5000.0;
        this.status = "CONFIRMED";
        this.boarded = false;
    }

    // Constructor 2: Full Enterprise Model (used in Main.java & PSOOP Final)
    public Booking(String bookingId, Passenger passenger, Flight flight, Seat seat, double fare, String status) {
        this.bookingId = bookingId;
        this.passenger = passenger;
        this.flight = flight;
        this.seat = seat;
        this.pnr = PNR.generatePNR();
        this.fare = fare;
        this.status = status;
        this.boarded = false;
        this.passengerName = (passenger != null) ? passenger.getName() : "";
        this.flightNumber = (flight != null) ? flight.getFlightNumber() : "";
        this.seatNumber = (seat != null) ? seat.getSeatNumber() : "";
        this.bookingDate = "2026-10-15";

        if (passenger != null) {
            passenger.addBooking(this);
        }
    }

    public String getBookingId() { return bookingId; }
    public void setBookingId(String bookingId) { this.bookingId = bookingId; }

    public String getPnr() { return pnr; }
    public void setPnr(String pnr) { this.pnr = pnr; }

    public String getPassengerName() { return passengerName; }
    public void setPassengerName(String passengerName) { this.passengerName = passengerName; }

    public String getFlightNumber() { return flightNumber; }
    public void setFlightNumber(String flightNumber) { this.flightNumber = flightNumber; }

    public String getSeatNumber() { return seatNumber; }
    public void setSeatNumber(String seatNumber) { this.seatNumber = seatNumber; }

    public String getBookingDate() { return bookingDate; }
    public void setBookingDate(String bookingDate) { this.bookingDate = bookingDate; }

    public Passenger getPassenger() { return passenger; }
    public void setPassenger(Passenger passenger) { this.passenger = passenger; }

    public Flight getFlight() { return flight; }
    public void setFlight(Flight flight) { this.flight = flight; }

    public Seat getSeat() { return seat; }
    public void setSeat(Seat seat) { this.seat = seat; }

    public double getFare() { return fare; }
    public void setFare(double fare) { this.fare = fare; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    // Interface IBoardable implementations
    @Override
    public boolean canBoard() {
        return "CONFIRMED".equalsIgnoreCase(status) && !boarded;
    }

    @Override
    public String getBoardingZone() {
        if (seat != null && seat.getSeatClass() != null) {
            if (seat.getSeatClass().toLowerCase().contains("first")) return "Zone 1 (Priority)";
            if (seat.getSeatClass().toLowerCase().contains("business")) return "Zone 2 (Business)";
        }
        return "Zone 3 (Economy)";
    }

    @Override
    public void confirmBoarding() {
        this.boarded = true;
        this.status = "BOARDED";
    }

    @Override
    public String toString() {
        if (passenger != null && flight != null) {
            return "Booking [PNR=" + pnr + ", Passenger=" + passenger.getName() +
                   ", Flight=" + flight.getFlightNumber() +
                   ", " + (seat != null ? seat.toString() : "No Seat") +
                   ", Fare=Rs." + fare + ", Status=" + status + "]";
        }
        return "Booking [PNR=" + pnr +
               ", Passenger=" + passengerName +
               ", Flight=" + flightNumber +
               ", Seat=" + seatNumber +
               ", Date=" + bookingDate +
               ", Status=" + status + "]";
    }
}
