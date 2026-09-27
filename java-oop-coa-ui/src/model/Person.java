package model;

/**
 * Abstract Base Class: Person
 * Demonstrates: Abstraction, Encapsulation, and Polymorphism
 */
public abstract class Person {
    protected String id;
    protected String name;
    protected String email;
    protected String phone;
    protected int age;
    protected char gender;

    public Person() {}

    public Person(String id, String name, String email, String phone) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.age = 30;
        this.gender = 'U';
    }

    public Person(String id, String name, int age, char gender, String phone) {
        this.id = id;
        this.name = name;
        this.age = age;
        this.gender = gender;
        this.phone = phone;
        this.email = name.toLowerCase().replace(" ", ".") + "@airline.com";
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }

    public char getGender() { return gender; }
    public void setGender(char gender) { this.gender = gender; }

    // Abstract method to be overridden by subclasses (Polymorphism)
    public abstract String getRoleDescription();

    @Override
    public String toString() {
        return "Person [ID=" + id + ", Name=" + name + ", Phone=" + phone + "]";
    }
}
