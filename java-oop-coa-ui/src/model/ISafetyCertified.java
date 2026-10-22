package model;

/**
 * Interface: ISafetyCertified
 * Defines contract for aviation safety clearance and certifications.
 * Demonstrates: Multiple Inheritance via Interfaces in Java.
 */
public interface ISafetyCertified {
    boolean verifySafetyClearance();
    String getSafetyCertificationLevel();
}
