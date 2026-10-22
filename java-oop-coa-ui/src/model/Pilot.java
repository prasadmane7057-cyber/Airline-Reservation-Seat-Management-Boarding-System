package model;

/**
 * Class: Pilot (Extends StaffMember -> Extends Person)
 * Demonstrates:
 *   1. Multilevel Inheritance (Person -> StaffMember -> Pilot)
 *   2. Multiple Inheritance via Interfaces (implements IBoardable, ISafetyCertified)
 *   3. Method Overriding & Dynamic Polymorphism
 */
public class Pilot extends StaffMember implements IBoardable, ISafetyCertified {
    private String licenseNumber;
    private int flyingHours;

    public Pilot(String id, String name, String email, String phone, String staffId, 
                 String department, String role, String licenseNumber, int flyingHours) {
        super(id, name, email, phone, staffId, department, role);
        this.licenseNumber = licenseNumber;
        this.flyingHours = flyingHours;
    }

    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }

    public int getFlyingHours() { return flyingHours; }
    public void setFlyingHours(int flyingHours) { this.flyingHours = flyingHours; }

    // --- IBoardable Implementation ---
    @Override
    public boolean canBoard() {
        return verifySafetyClearance() && flyingHours > 500;
    }

    @Override
    public String getBoardingZone() {
        return "PRIORITY_CREW_DECK";
    }

    @Override
    public void confirmBoarding() {
        System.out.println("   [Crew Boarding] Captain " + getName() + " boarded flight deck.");
    }

    // --- ISafetyCertified Implementation ---
    @Override
    public boolean verifySafetyClearance() {
        return licenseNumber != null && !licenseNumber.trim().isEmpty();
    }

    @Override
    public String getSafetyCertificationLevel() {
        return "LEVEL-4 (Commercial Multi-Engine Airline Transport Pilot)";
    }

    @Override
    public String getRoleDescription() {
        return "Commanding Pilot [License: " + licenseNumber + "] - Logged Hours: " + flyingHours + " hrs";
    }

    @Override
    public String toString() {
        return "Pilot [" + super.toString() + ", License=" + licenseNumber + ", FlyingHours=" + flyingHours + "]";
    }
}
