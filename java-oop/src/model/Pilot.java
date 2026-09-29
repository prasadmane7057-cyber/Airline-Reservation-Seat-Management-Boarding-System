package model;

/**
 * Class: Pilot (Extends StaffMember -> Extends Person)
 * Demonstrates: Multilevel Inheritance, Method Overriding, Polymorphism
 */
public class Pilot extends StaffMember {
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

    @Override
    public String getRoleDescription() {
        return "Commanding Pilot [License: " + licenseNumber + "] - Logged Hours: " + flyingHours + " hrs";
    }

    @Override
    public String toString() {
        return "Pilot [" + super.toString() + ", License=" + licenseNumber + ", FlyingHours=" + flyingHours + "]";
    }
}
