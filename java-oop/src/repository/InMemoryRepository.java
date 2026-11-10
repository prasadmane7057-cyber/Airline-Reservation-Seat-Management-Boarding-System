package repository;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/**
 * =============================================================================
 * Class: InMemoryRepository<T, ID>
 * Subject: Principles of Object-Oriented Programming (Java OOP / PSOOP)
 * Concepts: Java Generics (<T, ID>), Functional Interfaces, Concurrent Collections
 * =============================================================================
 * Thread-safe generic repository implementation using ConcurrentHashMap.
 * Utilizes a functional key extractor to deduce the primary key from entities.
 *
 * @param <T>  Domain entity type
 * @param <ID> Unique identifier type
 */
public class InMemoryRepository<T, ID> implements GenericRepository<T, ID> {

    protected final Map<ID, T> storage = new ConcurrentHashMap<>();
    protected final Function<T, ID> idExtractor;
    protected final String entityName;

    /**
     * Constructs a generic repository with a lambda identifier extractor.
     *
     * @param idExtractor Function mapping an entity to its unique primary key
     * @param entityName  Descriptive name of the entity for error reporting
     */
    public InMemoryRepository(Function<T, ID> idExtractor, String entityName) {
        this.idExtractor = Objects.requireNonNull(idExtractor, "ID extractor must not be null");
        this.entityName = entityName != null ? entityName : "Entity";
    }

    @Override
    public T save(T entity) {
        Objects.requireNonNull(entity, entityName + " to save must not be null");
        ID id = idExtractor.apply(entity);
        Objects.requireNonNull(id, entityName + " identifier cannot be null");
        storage.put(id, entity);
        return entity;
    }

    @Override
    public List<T> saveAll(Iterable<T> entities) {
        Objects.requireNonNull(entities, "Entities collection must not be null");
        List<T> result = new ArrayList<>();
        for (T entity : entities) {
            result.add(save(entity));
        }
        return Collections.unmodifiableList(result);
    }

    @Override
    public Optional<T> findById(ID id) {
        if (id == null) return Optional.empty();
        return Optional.ofNullable(storage.get(id));
    }

    @Override
    public boolean existsById(ID id) {
        if (id == null) return false;
        return storage.containsKey(id);
    }

    @Override
    public List<T> findAll() {
        return Collections.unmodifiableList(new ArrayList<>(storage.values()));
    }

    @Override
    public List<T> findBy(Predicate<T> filter) {
        Objects.requireNonNull(filter, "Filter predicate must not be null");
        return storage.values().stream()
                .filter(filter)
                .collect(Collectors.collectingAndThen(Collectors.toList(), Collections::unmodifiableList));
    }

    @Override
    public long count() {
        return storage.size();
    }

    @Override
    public boolean deleteById(ID id) {
        if (id == null) return false;
        return storage.remove(id) != null;
    }

    @Override
    public boolean delete(T entity) {
        if (entity == null) return false;
        ID id = idExtractor.apply(entity);
        return deleteById(id);
    }

    @Override
    public void clear() {
        storage.clear();
    }

    @Override
    public String toString() {
        return entityName + "Repository [count=" + storage.size() + "]";
    }
}
