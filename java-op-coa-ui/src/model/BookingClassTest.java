package model;
//Your test class is designed to check whether the three 
// booking classes in your airline reservation system work correctly

//It checks their fare calculations, boarding priorities, runtime polymorphism, 
// and whether they provide the methods required by the BookingClass interface.
public class BookingClassTest {
//counts how many tests are passed and how many are failed
    static int passCount = 0;
    static int failCount = 0;

//This is the method that checks whether a test passes or fails.
//NEW CONCEPT: Object is the root class of all classes in Java, using it here allows this 
// single check method to accept any kind of object or value—whether it is a String, an Integer,
//  a Boolean, a custom class, or an array.
    static void check(String testName, Object expected, Object actual) {
        if (expected.equals(actual)) {
            System.out.println("PASS - " + testName + " (got: " + actual + ")");
            passCount++;
        } else {
            System.out.println("FAIL - " + testName + " (expected: " + expected + ", got: " + actual + ")");
            failCount++;
        }
    }

    public static void main(String[] args) {

        double baseFare = 3000.0;   // same base fare used for every test below

        System.out.println("===== Test 1: Economy Class =====");
        BookingClass economy = new Economy();
        check("Economy fare",     3000.0, economy.getFare(baseFare));
        check("Economy priority", 3,      economy.getPriority());
        System.out.println();

        System.out.println("===== Test 2: Business Class =====");
        BookingClass business = new Business();
        check("Business fare",     4500.0, business.getFare(baseFare));
        check("Business priority", 2,      business.getPriority());
        System.out.println();

        System.out.println("===== Test 3: FirstClass Class =====");
        BookingClass firstClass = new FirstClass();
        check("FirstClass fare",     7500.0, firstClass.getFare(baseFare));
        check("FirstClass priority", 1,      firstClass.getPriority());
        System.out.println();

        
//this test case checks whether that the benefits and class name string are not null 
        System.out.println("===== Test 4: Interface Compliance =====");
//an array named all that can store references to objects implementing the BookingClass interface
        BookingClass[] all = { new Economy(), new Business(), new FirstClass() };
        for (BookingClass b : all) {//for each loop
                      
            String benefits = b.getBenefits();       // must exist
            String className = b.getClassName();     // must exist
//Checking whether the values are present
            boolean allPresent = (benefits != null) && (className != null);
            check(className + " implements all BookingClass methods", true, allPresent);
        }
        System.out.println();

        System.out.println("===== Summary =====");
        System.out.println("Passed: " + passCount + " / " + (passCount + failCount));
        if (failCount == 0) {
            System.out.println("ALL TESTS PASSED.");
        } else {
            System.out.println(failCount + " TEST(S) FAILED.");
        }
    }
}
