package repository;

import java.util.List;
import java.util.Optional;
import java.util.function.Predicate;

/**
 * =============================================================================
 * Interface: GenericRepository<T, ID>
 * Subject: Principles of Object-Oriented Programming (PSOOP / Java OOP)
 * Concepts: Java Generics, Abstraction, Type Safety, Separation of Concerns
 * =============================================================================
 * A generic data access interface providing standardized CRUD and query
 * operations for any airline domain entity (Booking, Passenger, Flight, Seat).
 *
 * @param <T>  The domain entity type (e.g. Booking, Passenger)
 * @param <ID> The primary key / unique identifier type (e.g. String PNR, Long ID)
 */
public interface GenericRepository<T, ID> {

    /**
     * Persists or updates the given entity in the repository.
     * @param entity the entity to save, must not be null
     * @return the saved entity
     */
    T save(T entity);

    /**
     * Saves all given entities.
     * @param entities collection of entities
     * @return list of saved entities
     */
    List<T> saveAll(Iterable<T> entities);

    /**
     * Retrieves an entity by its unique identifier.
     * @param id the entity identifier
     * @return an Optional containing the entity if found, or empty
     */
    Optional<T> findById(ID id);

    /**
     * Checks whether an entity with the given identifier exists.
     * @param id the entity identifier
     * @return true if entity exists, false otherwise
     */
    boolean existsById(ID id);

    /**
     * Returns all entities currently managed by the repository.
     * @return unmodifiable list of entities
     */
    List<T> findAll();

    /**
     * Finds entities matching a specific predicate filter.
     * @param filter functional predicate condition
     * @return list of matching entities
     */
    List<T> findBy(Predicate<T> filter);

    /**
     * Returns the total count of entities in the repository.
     * @return entity count
     */
    long count();

    /**
     * Deletes the entity with the specified identifier.
     * @param id the identifier of the entity to delete
     * @return true if entity was found and deleted, false otherwise
     */
    boolean deleteById(ID id);

    /**
     * Deletes the given entity.
     * @param entity the entity to delete
     * @return true if deleted, false otherwise
     */
    boolean delete(T entity);

    /**
     * Removes all entities from the repository.
     */
    void clear();
}
