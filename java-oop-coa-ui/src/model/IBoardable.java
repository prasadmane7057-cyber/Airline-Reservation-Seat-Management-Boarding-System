package model;

/**
 * Interface: IBoardable
 * Defines contract for boardable entities in the airline system
 * Demonstrates: Interface abstraction and polymorphism
 */
public interface IBoardable {
    boolean canBoard();
    String getBoardingZone();
    void confirmBoarding();
}
