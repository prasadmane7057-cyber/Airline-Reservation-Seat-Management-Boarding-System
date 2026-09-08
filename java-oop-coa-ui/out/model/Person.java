package model;

/**
 * Practical 4 & 7: Abstract Base Class Person
 * @author Varad Kurwade & Prasad Mane
 * @course Problem Solving using OOP (Java)
 * @project Airline Reservation, Seat Management & Boarding System
 */
public abstract class Person {

    protected final String personId;
    protected String name;
    protected int age;
    protected String phone;
    protected String email;

    public Person(String personId, String name, int age,
                  String phone, String email) {
        this.personId = personId;
        this.name = name;
        this.age = age;
        this.phone = phone;
        this.email = email;
    }

    public String getPersonId() {
        return personId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    // Abstract method to be overridden by subclasses (Polymorphism)
    public abstract void displayDetails();

    public void displayPerson() {
        System.out.println("Person ID : " + personId);
        System.out.println("Name      : " + name);
        System.out.println("Age       : " + age);
        System.out.println("Phone     : " + phone);
        System.out.println("Email     : " + email);
    }
}
