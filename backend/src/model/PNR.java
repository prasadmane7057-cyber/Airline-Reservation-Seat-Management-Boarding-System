package model;
import java.util.Random;
 
public class PNR {
    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int LENGTH = 6;
    private static final Random random = new Random();
 
    // Generates a new PNR, e.g. "K3F9AZ"
    public static String generatePNR() {
        StringBuilder pnr = new StringBuilder();
        for (int i = 0; i < LENGTH; i++) {
            int index = random.nextInt(CHARACTERS.length());
            pnr.append(CHARACTERS.charAt(index));
        }
        return pnr.toString();
    }
 
    // Checks a PNR is exactly 6 characters, all letters/digits
    public static boolean isValidPNR(String pnr) {
        if (pnr == null || pnr.length() != LENGTH) {
            return false;
        }
        for (char c : pnr.toCharArray()) {
            if (!Character.isLetterOrDigit(c)) {
                return false;
            }
        }
        return true;
    }
}
 