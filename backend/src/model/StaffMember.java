package model;

public class StaffMember extends Person {

    private final String employeeId;
    private final String department;
    private final String designation;

    public StaffMember(String personId, String name, int age,
                        String phone, String email,
                        String employeeId,
                        String department,
                        String designation) {

        super(personId, name, age, phone, email);

        this.employeeId = employeeId;
        this.department = department;
        this.designation = designation;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public String getDepartment() {
        return department;
    }

    public String getDesignation() {
        return designation;
    }

    public void displayStaff() {

        displayPerson();

        System.out.println("Employee ID: " + employeeId);
        System.out.println("Department: " + department);
        System.out.println("Designation: " + designation);
    }
}