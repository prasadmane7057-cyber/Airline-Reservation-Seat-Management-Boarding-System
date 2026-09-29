package model;

public class PolymorphismDemo {
    public static void main(String[] args) {
        System.out.println("=== PSOOP Practical 5: Seat Class Polymorphism ===");

        SeatClass economy = new Economy();
        SeatClass business = new Business();
        SeatClass firstClass = new FirstClass();

        System.out.println("Economy Class  -> Fare: Rs. " + economy.getFare() + ", Boarding Priority: " + economy.getPriority());
        System.out.println("Business Class -> Fare: Rs. " + business.getFare() + ", Boarding Priority: " + business.getPriority());
        System.out.println("First Class    -> Fare: Rs. " + firstClass.getFare() + ", Boarding Priority: " + firstClass.getPriority());
    }
}
