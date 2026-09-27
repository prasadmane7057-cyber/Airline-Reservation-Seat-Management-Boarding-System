package model;

import java.util.ArrayList;
import java.util.List;

/**
 * Class: Passenger (Extends Person)
 * Demonstrates: Inheritance, Method Overriding, ArrayList
 */
public class Passenger extends Person {
    private String preferredClass;
    private int seatNo;
    private List<Booking> bookings;

    public Passenger(String id, String name, String email, String phone, String preferredClass) {
        super(id, name, email, phone);
        this.preferredClass = preferredClass;
        this.seatNo = 1;
        this.bookings = new ArrayList<>();
    }

    public Passenger(String pnr, String name, int age, char gender, String contact, int seatNo, String travelClass) {
        super(pnr, name, age, gender, contact);
        this.preferredClass = travelClass;
        this.seatNo = seatNo;
        this.bookings = new ArrayList<>();
    }

    public String getPnr() { return getId(); }
    public String getTravelClass() { return preferredClass; }
    public String getPreferredClass() { return preferredClass; }
    public void setPreferredClass(String preferredClass) { this.preferredClass = preferredClass; }

    public int getSeatNo() { return seatNo; }
    public void setSeatNo(int seatNo) { this.seatNo = seatNo; }

    public List<Booking> getBookings() { return bookings; }
    public void addBooking(Booking booking) { this.bookings.add(booking); }

    @Override
    public String getRoleDescription() {
        return "Passenger (Class: " + preferredClass + ", Seat: " + seatNo + ", Total Bookings: " + bookings.size() + ")";
    }

    @Override
    public String toString() {
        return String.format("Passenger [PNR=%s, Name=%-15s, Age=%2d, Gender=%c, Contact=%s, Seat=%2d, Class=%s]",
                id, name, age, gender, phone, seatNo, preferredClass);
    }
}
