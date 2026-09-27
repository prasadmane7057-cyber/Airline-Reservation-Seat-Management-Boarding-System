package model;

public class Person {

    private final String personId;
    private final String name;
    private final int age;
    private final String phone;
    private final String email;

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

    public int getAge() {
        return age;
    }

    public String getPhone() {
        return phone;
    }

    public String getEmail() {
        return email;
    }

    public void displayPerson() {
        System.out.println("ID: " + personId);
        System.out.println("Name: " + name);
        System.out.println("Age: " + age);
        System.out.println("Phone: " + phone);
        System.out.println("Email: " + email);
    }
}
