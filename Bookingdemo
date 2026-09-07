// BookingDemo.java
// NOT a required deliverable file - just a quick test harness so you can
// run something and see Booking/PNR/Person/StaffMember actually working
// before the Review 2 demo. Delete or keep in a "test" folder, your call.
 
public class BookingDemo {
    public static void main(String[] args) {
        System.out.println("=== Testing Booking + PNR ===");
        Booking b1 = new Booking("Rahul Sharma", "AI-202", "12A", "2026-09-10");
        Booking b2 = new Booking("Neha Verma", "AI-303", "14C", "2026-09-11");
        System.out.println(b1);
        System.out.println(b2);
        System.out.println("Is PNR valid? " + PNR.isValidPNR(b1.getPnr()));
 
        System.out.println("\n=== Testing Inheritance: Person -> StaffMember ===");
        StaffMember staff = new StaffMember("Anita Rao", 29, "Female", "9876543210",
                                             "EMP1001", "Cabin Crew");
        staff.displayDetails();
    }
}
 
