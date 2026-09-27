package model;

public class PolymorphismDemo {

    public static void main(String[] args) {

        SeatClass economy = new Economy();
        SeatClass business = new Business();
        SeatClass firstClass = new FirstClass();

        System.out.println("AIRLINE SEAT CLASS DETAILS");
        System.out.println("--------------------------");

        System.out.println("Economy Fare: Rs. " + economy.getFare());
        System.out.println("Economy Priority: " + economy.getPriority());

        System.out.println();

        System.out.println("Business Fare: Rs. " + business.getFare());
        System.out.println("Business Priority: " + business.getPriority());

        System.out.println();

        System.out.println("First Class Fare: Rs. " + firstClass.getFare());
        System.out.println("First Class Priority: " + firstClass.getPriority());
    }
}
