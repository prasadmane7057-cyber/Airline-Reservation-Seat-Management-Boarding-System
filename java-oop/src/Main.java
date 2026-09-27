
import model.Passenger;
import util.ValidationUtils;
import java.util.*;
import java.util.function.Predicate;

public class Main {
    public static void main(String[] args) {
        System.out.println("Airline Management System");
         demoPassengerModule();
    }
    public static void demoPassengerModule() {
    System.out.println("=== Practical 1: Validation Demo ===");
    String[] samplePNRs = {"PNR001", "PN1002", "PNR9", "PNR777"};
    for (String pnr : samplePNRs) {
        System.out.println(pnr + " -> " + (ValidationUtils.validatePNR(pnr) ? "VALID" : "INVALID"));
    }
    System.out.println("Age 29 -> " + (ValidationUtils.validateAge(29) ? "VALID" : "INVALID"));
    System.out.println("Age -5 -> " + (ValidationUtils.validateAge(-5) ? "VALID" : "INVALID"));
    System.out.println("Seat 45 of 180 -> " + (ValidationUtils.validateSeatNumber(45, 180) ? "VALID" : "INVALID"));
    System.out.println("Flight AI202 -> " + (ValidationUtils.validateFlightNumber("AI202") ? "VALID" : "INVALID"));

    System.out.println("\n=== Practical 3: Passenger + Lambda Demo ===");
    List<Passenger> passengers = new ArrayList<>();
    passengers.add(new Passenger("PNR001", "Aarav Sharma", 29, 'M', "9876543210", 12, "Economy"));
    passengers.add(new Passenger("PNR002", "Isha Verma", 34, 'F', "9876500001", 5, "Business"));
    passengers.add(new Passenger("PNR003", "Rohan Mehta", 41, 'M', "9876500002", 22, "Economy"));
    passengers.add(new Passenger("PNR004", "Sneha Iyer", 27, 'F', "9876500003", 1, "First"));

    passengers.forEach(System.out::println);

    Predicate<Passenger> isEconomy = p -> p.getTravelClass().equals("Economy");
    System.out.println("\nEconomy passengers (lambda filter):");
    passengers.stream().filter(isEconomy).forEach(System.out::println);

    passengers.sort((p1, p2) -> p1.getSeatNo() - p2.getSeatNo());
    System.out.println("\nSorted by seat number (lambda comparator):");
    passengers.forEach(System.out::println);
}
} 
