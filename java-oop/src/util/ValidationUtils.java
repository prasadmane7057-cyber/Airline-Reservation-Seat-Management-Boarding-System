package util;

// PSOOP Practical 1 - Fundamentals of Java
// Control statements, looping, arrays used for passenger/flight input validation
public class ValidationUtils {

    // Validate PNR: must be "PNR" followed by exactly 3 digits, e.g. PNR001
    public static boolean validatePNR(String pnr) {
        if (pnr == null || pnr.length() != 6) return false;
        if (!pnr.substring(0, 3).equals("PNR")) return false;
        for (int i = 3; i < pnr.length(); i++) {
            if (!Character.isDigit(pnr.charAt(i))) return false;
        }
        return true;
    }

    // Validate age: reasonable passenger age range
    public static boolean validateAge(int age) {
        return age > 0 && age <= 120;
    }

    // Validate seat number against total seats on the aircraft (loop-based bounds check)
    public static boolean validateSeatNumber(int seatNo, int totalSeats) {
        for (int i = 1; i <= totalSeats; i++) {
            if (i == seatNo) return true;
        }
        return false;
    }

    // Validate flight number: 2-char airline code (letters and/or digits, e.g. AI, 6E)
    // followed by 3-4 digit flight number, e.g. AI202, 6E1407
    public static boolean validateFlightNumber(String flightNo) {
        if (flightNo == null || flightNo.length() < 5 || flightNo.length() > 6) return false;
        String airlineCode = flightNo.substring(0, 2);
        for (int i = 0; i < airlineCode.length(); i++) {
            if (!Character.isLetterOrDigit(airlineCode.charAt(i))) return false;
        }
        String numberPart = flightNo.substring(2);
        int digitCount = 0;
        for (int i = 0; i < numberPart.length(); i++) {
            if (!Character.isDigit(numberPart.charAt(i))) return false;
            digitCount++;
        }
        return digitCount >= 3 && digitCount <= 4;
    }
}
