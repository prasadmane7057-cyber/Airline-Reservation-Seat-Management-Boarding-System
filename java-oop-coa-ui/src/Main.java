import model.*;
import util.StringUtils;
import util.ValidationUtils;
import java.util.*;
import java.util.function.Predicate;

/**
 * =========================================================================
 * AIRLINE RESERVATION, SEAT MANAGEMENT & BOARDING SYSTEM
 * Master Academic Engineering Java PSOOP Demonstration
 * =========================================================================
 * Comprehensive Demonstration of Course Outcomes:
 * 1. Java Fundamentals: Control statements, loops, arrays & validation
 * 2. String, StringBuilder & StringBuffer operations
 * 3. Encapsulation & Class/Object architecture
 * 4. Hierarchical & Multilevel Inheritance (Person -> Passenger, Person -> StaffMember -> Pilot)
 * 5. Abstract Classes (Person, SeatClass) & Interfaces (IBoardable)
 * 6. Dynamic Polymorphism & Method Overriding
 * 7. Keywords Demonstration (static, final, super, this)
 * 8. Lambda Expressions, Predicates, Comparators & Stream API
 * 9. MySQL Database Singleton JDBC Connection Architecture
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("=======================================================================");
        System.out.println("   AIRLINE RESERVATION SYSTEM - JAVA OOP ACADEMIC COMPONENT");
        System.out.println("=======================================================================\n");

        // 1. FUNDAMENTALS: Validation, Control Statements, Looping & Arrays (CO1)
        System.out.println("--- 1. JAVA FUNDAMENTALS (Validation, Loops, Arrays) ---");
        String[] samplePNRs = {"PNR001", "PN1002", "PNR9", "PNR777"};
        for (String pnr : samplePNRs) {
            System.out.println("   Validation Check -> " + pnr + " : " + (ValidationUtils.validatePNR(pnr) ? "VALID" : "INVALID"));
        }
        System.out.println("   Age Check (29 yrs) -> " + (ValidationUtils.validateAge(29) ? "VALID" : "INVALID"));
        System.out.println("   Flight Code Check (AI202) -> " + (ValidationUtils.validateFlightNumber("AI202") ? "VALID" : "INVALID"));

        // 2. STRING, STRINGBUILDER & STRINGBUFFER (CO1)
        System.out.println("\n--- 2. STRING, STRINGBUILDER & STRINGBUFFER ---");
        System.out.println("   StringUtils.capitalizeName(\"aarav sharma\")  -> " + StringUtils.capitalizeName("aarav sharma"));
        System.out.println("   StringUtils.formatSeatCode(12, 'a')         -> " + StringUtils.formatSeatCode(12, 'a'));
        System.out.println("   StringUtils.maskContact(\"9876543210\")         -> " + StringUtils.maskContact("9876543210"));
        System.out.println("   PNR.generatePNR() (Secure Random Alphanum) -> " + PNR.generatePNR());

        // 3. OBJECT CREATION & ENCAPSULATION (CO1)
        System.out.println("\n--- 3. AIRPORTS & FLIGHTS CREATION (Encapsulation) ---");
        Airport bom = new Airport("BOM", "Chhatrapati Shivaji Maharaj Intl", "Mumbai", "India");
        Airport del = new Airport("DEL", "Indira Gandhi International Airport", "Delhi", "India");
        Airport blr = new Airport("BLR", "Kempegowda International Airport", "Bengaluru", "India");

        Flight ai101 = new Flight("AI101", bom, del, "2026-10-15 06:00", "2026-10-15 08:15", "Boeing 737-800", 4500.00);
        Flight ai202 = new Flight("AI202", del, blr, "2026-10-15 09:30", "2026-10-15 12:15", "Airbus A320neo", 5200.00);

        System.out.println("   Created Flight: " + ai101);
        System.out.println("   Created Flight: " + ai202);

        // 4. INHERITANCE & RUNTIME POLYMORPHISM (CO2)
        System.out.println("\n--- 4. INHERITANCE & DYNAMIC POLYMORPHISM (Person Hierarchy) ---");
        Person pax1 = new Passenger("PNR001", "Aarav Sharma", 29, 'M', "9876543210", 12, "Business");
        Person pax2 = new Passenger("PNR002", "Sneha Iyer", 27, 'F', "9876500003", 1, "First Class");
        Person pax3 = new Passenger("PNR003", "Rohan Mehta", 41, 'M', "9876500002", 22, "Economy");
        Person staff1 = new StaffMember("S001", "Vikram Patel", "vikram@airline.com", "+91-9856789012", "STF-101", "Ground Operations", "Duty Manager");
        Person pilot1 = new Pilot("P101", "Captain Rajesh Khanna", "rajesh@airline.com", "+91-9867890123", "PLT-501", "Flight Deck", "Chief Captain", "ATPL-9021", 8500);

        List<Person> personList = Arrays.asList(pax1, pax2, pax3, staff1, pilot1);
        for (Person p : personList) {
            // Dynamic Method Dispatch (calls overridden getRoleDescription)
            System.out.println("   [Dynamic Dispatch] " + p.getName() + " -> " + p.getRoleDescription());
        }

        // 5. ABSTRACT CLASS & POLYMORPHISM: SEAT CLASSES (CO2)
        System.out.println("\n--- 5. ABSTRACT CLASS: SeatClass Polymorphism ---");
        SeatClass economyTier = new Economy();
        SeatClass businessTier = new Business();
        SeatClass firstTier = new FirstClass();
        System.out.println("   Economy Class  -> Fare: Rs. " + economyTier.getFare() + " | Priority: " + economyTier.getPriority());
        System.out.println("   Business Class -> Fare: Rs. " + businessTier.getFare() + " | Priority: " + businessTier.getPriority());
        System.out.println("   First Class    -> Fare: Rs. " + firstTier.getFare() + " | Priority: " + firstTier.getPriority());

        // 6. INTERFACE IMPLEMENTATION: IBoardable (CO2)
        System.out.println("\n--- 6. INTERFACE IMPLEMENTATION: IBoardable ---");
        Seat seat1 = new Seat("1A", "First Class", "AVAILABLE");
        Booking b1 = new Booking("B101", (Passenger) pax2, ai101, seat1, 20000.00, "CONFIRMED");
        System.out.println("   Booking Reference: " + b1.getPnr());
        System.out.println("   Can Passenger Board? " + b1.canBoard());
        System.out.println("   Boarding Zone: " + b1.getBoardingZone());
        b1.confirmBoarding();
        System.out.println("   Status After Boarding: " + b1.getStatus());

        // 7. LAMBDA EXPRESSIONS & STREAM API (CO2)
        System.out.println("\n--- 7. LAMBDA EXPRESSIONS & STREAMS (Filters & Comparators) ---");
        List<Passenger> paxList = new ArrayList<>(Arrays.asList((Passenger) pax1, (Passenger) pax2, (Passenger) pax3));

        // Lambda Predicate Filter
        Predicate<Passenger> isEconomyOrBusiness = p -> !p.getTravelClass().equalsIgnoreCase("First Class");
        System.out.println("   Filter Non-First Class (Lambda Predicate):");
        paxList.stream().filter(isEconomyOrBusiness).forEach(p -> System.out.println("      " + p));

        // Lambda Comparator Sort by Seat Number
        System.out.println("   Sorted by Seat Number (Lambda Comparator):");
        paxList.sort((p1, p2) -> Integer.compare(p1.getSeatNo(), p2.getSeatNo()));
        paxList.forEach(p -> System.out.println("      Seat " + p.getSeatNo() + " -> " + p.getName() + " (" + p.getTravelClass() + ")"));

        // 8. JDBC MYSQL DATABASE CONNECTION ARCHITECTURE (CO1)
        System.out.println("\n--- 8. DATABASE JDBC INTEGRATION ---");
        System.out.println("   Testing JDBC connection to MySQL Database...");
        DBConnection.getConnection();

        System.out.println("\n=======================================================================");
        System.out.println("   JAVA OOP DEMONSTRATION COMPLETED SUCCESSFULLY");
        System.out.println("=======================================================================");
    }
}
