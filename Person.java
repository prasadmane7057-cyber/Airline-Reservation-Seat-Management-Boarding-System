// Person.java
// PSOOP Practical 4 - Inheritance (parent class)
// Owner: Varad
// Passenger.java (Siddhi) and StaffMember.java (below) both extend this class.
 
public class Person {
    protected String name;
    protected int age;
    protected String gender;
    protected String contactNumber;
 
    public Person(String name, int age, String gender, String contactNumber) {
        this.name = name;
        this.age = age;
        this.gender = gender;
        this.contactNumber = contactNumber;
    }
 
    public String getName() {
        return name;
    }
 
    public int getAge() {
        return age;
    }
 
    public String getGender() {
        return gender;
    }
 
    public String getContactNumber() {
        return contactNumber;
    }
 
    // Meant to be overridden by child classes (Passenger, StaffMember)
    public void displayDetails() {
        System.out.println("Name    : " + name);
        System.out.println("Age     : " + age);
        System.out.println("Gender  : " + gender);
        System.out.println("Contact : " + contactNumber);
    }
}
