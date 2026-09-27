package model;

/**
 * Class: Flight
 * Contains flight route, departure, arrival, aircraft, and pricing
 */
public class Flight {
    private String flightNumber;
    private Airport source;
    private Airport destination;
    private String departureTime;
    private String arrivalTime;
    private String aircraft;
    private double baseFare;

    public Flight(String flightNumber, Airport source, Airport destination, 
                  String departureTime, String arrivalTime, String aircraft, double baseFare) {
        this.flightNumber = flightNumber;
        this.source = source;
        this.destination = destination;
        this.departureTime = departureTime;
        this.arrivalTime = arrivalTime;
        this.aircraft = aircraft;
        this.baseFare = baseFare;
    }

    public String getFlightNumber() { return flightNumber; }
    public void setFlightNumber(String flightNumber) { this.flightNumber = flightNumber; }

    public Airport getSource() { return source; }
    public void setSource(Airport source) { this.source = source; }

    public Airport getDestination() { return destination; }
    public void setDestination(Airport destination) { this.destination = destination; }

    public String getDepartureTime() { return departureTime; }
    public void setDepartureTime(String departureTime) { this.departureTime = departureTime; }

    public String getArrivalTime() { return arrivalTime; }
    public void setArrivalTime(String arrivalTime) { this.arrivalTime = arrivalTime; }

    public String getAircraft() { return aircraft; }
    public void setAircraft(String aircraft) { this.aircraft = aircraft; }

    public double getBaseFare() { return baseFare; }
    public void setBaseFare(double baseFare) { this.baseFare = baseFare; }

    @Override
    public String toString() {
        return flightNumber + " (" + (source != null ? source.getAirportCode() : "N/A") + " -> " + 
               (destination != null ? destination.getAirportCode() : "N/A") + ") [" + aircraft + "]";
    }
}
