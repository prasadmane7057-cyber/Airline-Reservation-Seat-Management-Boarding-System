package model;

public class BookingDemo {
    public static void main(String[] args) {
        System.out.println("=== PSOOP: Booking Record Demo ===");
        Booking b1 = new Booking("Rahul Sharma", "AI-202", "12A", "2026-09-10");
        Booking b2 = new Booking("Neha Verma", "AI-303", "14C", "2026-09-11");

        System.out.println(b1);
        System.out.println(b2);
    }
}
