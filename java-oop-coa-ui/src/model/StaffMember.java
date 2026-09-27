package model;

/**
 * Class: StaffMember (Extends Person)
 * Demonstrates: Multilevel Inheritance, super keyword
 */
public class StaffMember extends Person {
    private String staffId;
    private String department;
    private String role;

    public StaffMember(String id, String name, String email, String phone, String staffId, String department, String role) {
        super(id, name, email, phone);
        this.staffId = staffId;
        this.department = department;
        this.role = role;
    }

    public String getStaffId() { return staffId; }
    public void setStaffId(String staffId) { this.staffId = staffId; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    @Override
    public String getRoleDescription() {
        return "Staff Member [" + staffId + "] - " + role + " (" + department + ")";
    }

    @Override
    public String toString() {
        return "StaffMember [" + super.toString() + ", StaffID=" + staffId + ", Dept=" + department + ", Role=" + role + "]";
    }
}
