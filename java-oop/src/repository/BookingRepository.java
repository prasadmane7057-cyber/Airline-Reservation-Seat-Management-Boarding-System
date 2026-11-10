package repository;

import model.Booking;
import java.util.List;
import java.util.stream.Collectors;

/**
 * =============================================================================
 * Class: BookingRepository
 * Subject: Principles of Object-Oriented Programming (Java OOP / PSOOP)
 * Concepts: Generic Inheritance, Domain Specialization, Stream API Filtering
 * =============================================================================
 * Specialized repository for managing Booking entities using PNR as primary key.
 */
public class BookingRepository extends InMemoryRepository<Booking, String> {

    public BookingRepository() {
        super(Booking::getPnr, "Booking");
    }

    /**
     * Finds all active bookings for a specific flight.
     * @param flightNumber e.g. "AI101"
     * @return list of bookings for the flight
     */
    public List<Booking> findByFlightNumber(String flightNumber) {
        if (flightNumber == null) return List.of();
        return findBy(b -> flightNumber.equalsIgnoreCase(b.getFlightNumber()));
    }

    /**
     * Finds bookings matching a status (e.g. "CONFIRMED", "CANCELLED", "BOARDED").
     * @param status booking status
     * @return list of matching bookings
     */
    public List<Booking> findByStatus(String status) {
        if (status == null) return List.of();
        return findBy(b -> status.equalsIgnoreCase(b.getStatus()));
    }

    /**
     * Finds all bookings for a given passenger name (case-insensitive substring).
     * @param passengerName passenger name query
     * @return list of bookings
     */
    public List<Booking> findByPassengerName(String passengerName) {
        if (passengerName == null) return List.of();
        String query = passengerName.toLowerCase();
        return findBy(b -> b.getPassengerName() != null && b.getPassengerName().toLowerCase().contains(query));
    }
}
