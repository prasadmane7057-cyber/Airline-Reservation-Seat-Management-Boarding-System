package repository;

import model.Passenger;
import java.util.List;
import java.util.Optional;

/**
 * =============================================================================
 * Class: PassengerRepository
 * Subject: Principles of Object-Oriented Programming (Java OOP / PSOOP)
 * Concepts: Generic Specialization, Predicate Lambdas
 * =============================================================================
 * Specialized repository for managing Passenger records using ID/PNR as primary key.
 */
public class PassengerRepository extends InMemoryRepository<Passenger, String> {

    public PassengerRepository() {
        super(Passenger::getId, "Passenger");
    }

    /**
     * Looks up a passenger by their email address.
     * @param email passenger email
     * @return Optional passenger
     */
    public Optional<Passenger> findByEmail(String email) {
        if (email == null) return Optional.empty();
        return findBy(p -> email.equalsIgnoreCase(p.getEmail())).stream().findFirst();
    }

    /**
     * Finds passengers by their preferred travel class.
     * @param travelClass e.g. "Business", "First Class", "Economy"
     * @return list of matching passengers
     */
    public List<Passenger> findByPreferredClass(String travelClass) {
        if (travelClass == null) return List.of();
        return findBy(p -> travelClass.equalsIgnoreCase(p.getPreferredClass()));
    }
}
