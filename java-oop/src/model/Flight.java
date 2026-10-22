package model;

/**
 * Class: Flight
 * Contains flight route, departure, arrival, aircraft, and pricing.
 * Demonstrates: Compile-Time Polymorphism via Method Overloading (calculateFare).
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

    // =========================================================================
    // COMPILE-TIME POLYMORPHISM: METHOD OVERLOADING (Static Binding)
    // =========================================================================

    /**
     * 1. Base fare calculation (no arguments)
     */
    public double calculateFare() {
        return this.baseFare;
    }

    /**
     * 2. Overloaded: Fare based on travel class
     */
    public double calculateFare(String travelClass) {
        if (travelClass == null) return this.baseFare;
        if ("First Class".equalsIgnoreCase(travelClass)) return baseFare * 2.5;
        if ("Business".equalsIgnoreCase(travelClass)) return baseFare * 1.8;
        return baseFare; // Economy default
    }

    /**
     * 3. Overloaded: Fare based on travel class + extra baggage weight (kg)
     */
    public double calculateFare(String travelClass, double baggageKg) {
        double fare = calculateFare(travelClass);
        if (baggageKg > 15.0) {
            fare += (baggageKg - 15.0) * 500.0; // Rs. 500 per kg above 15kg allowance
        }
        return fare;
    }

    /**
     * 4. Overloaded: Fare based on travel class + extra baggage + promo discount code
     */
    public double calculateFare(String travelClass, double baggageKg, String promoCode) {
        double fare = calculateFare(travelClass, baggageKg);
        if (promoCode != null && "FLYAI10".equalsIgnoreCase(promoCode.trim())) {
            fare *= 0.90; // 10% instant discount
        }
        return fare;
    }

    @Override
    public String toString() {
        return flightNumber + " (" + (source != null ? source.getAirportCode() : "N/A") + " -> " + 
               (destination != null ? destination.getAirportCode() : "N/A") + ") [" + aircraft + "]";
    }
}
