package model;

// PSOOP Practical 3 - Class, Object, Methods, Constructors
public class Flight {
    private String flightNumber;
    private String origin;
    private String destination;
    private String departureTime; // simple string form, e.g. "2026-09-10 14:30"
    private int totalSeats;
    private String aircraftType;

    public Flight() {
        this("UNSET", "N/A", "N/A", "N/A", 180, "N/A");
    }

    public Flight(String flightNumber, String origin, String destination,
                  String departureTime, int totalSeats, String aircraftType) {
        this.flightNumber = flightNumber;
        this.origin = origin;
        this.destination = destination;
        this.departureTime = departureTime;
        this.totalSeats = totalSeats;
        this.aircraftType = aircraftType;
    }

    public String getFlightNumber() { return flightNumber; }
    public String getOrigin() { return origin; }
    public String getDestination() { return destination; }
    public String getDepartureTime() { return departureTime; }
    public int getTotalSeats() { return totalSeats; }
    public String getAircraftType() { return aircraftType; }

    public void setDepartureTime(String departureTime) { this.departureTime = departureTime; }

    @Override
    public String toString() {
        return String.format("Flight %s | %s -> %s | Departs: %s | Seats: %d | %s",
                flightNumber, origin, destination, departureTime, totalSeats, aircraftType);
    }

    public static void main(String[] args) {
        System.out.println("=== Flight Demo ===");
        Flight f1 = new Flight("AI202", "Mumbai", "Delhi", "2026-09-10 14:30", 180, "Airbus A320");
        Flight f2 = new Flight("6E1407", "Pune", "Bengaluru", "2026-09-11 07:15", 186, "Airbus A320neo");
        System.out.println(f1);
        System.out.println(f2);
    }
}