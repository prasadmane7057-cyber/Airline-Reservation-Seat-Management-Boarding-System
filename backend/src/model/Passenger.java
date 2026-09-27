package model;

// PSOOP Practical 3 - Class, Object, Methods, Constructors, Lambda
// Core airline domain model: Passenger
public class Passenger {
    private String pnr;
    private String name;
    private int age;
    private char gender;
    private String contact;
    private int seatNo;
    private String travelClass;

    // Default constructor
    public Passenger() {
        this("UNASSIGNED", "Unknown", 0, 'O', "0000000000", 0, "Economy");
    }

    // Parameterized constructor
    public Passenger(String pnr, String name, int age, char gender,
                      String contact, int seatNo, String travelClass) {
        this.pnr = pnr;
        this.name = name;
        this.age = age;
        this.gender = gender;
        this.contact = contact;
        this.seatNo = seatNo;
        this.travelClass = travelClass;
    }

    // Getters
    public String getPnr() { return pnr; }
    public String getName() { return name; }
    public int getAge() { return age; }
    public char getGender() { return gender; }
    public String getContact() { return contact; }
    public int getSeatNo() { return seatNo; }
    public String getTravelClass() { return travelClass; }

    // Setters
    public void setSeatNo(int seatNo) { this.seatNo = seatNo; }
    public void setTravelClass(String travelClass) { this.travelClass = travelClass; }
    public void setContact(String contact) { this.contact = contact; }

    @Override
    public String toString() {
        return String.format("PNR:%s | %-15s | Age:%-3d | Seat:%-3d | %s",
                pnr, name, age, seatNo, travelClass);
    }
}
