package model;

/**
 * Abstract Base Class: SeatClass
 * Defines abstract fare and priority methods for travel tiers
 */
public abstract class SeatClass {
    public abstract double getFare();
    public abstract int getPriority();

    public String getClassName() {
        return this.getClass().getSimpleName();
    }
}
