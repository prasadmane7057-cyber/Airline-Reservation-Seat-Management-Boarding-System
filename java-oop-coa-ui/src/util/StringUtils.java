package util;

// PSOOP Practical 2 - String, StringBuffer, StringBuilder
// Handling PNR, names, flight no., airport & seat codes
public class StringUtils {

    // Normalize a PNR to a consistent format: uppercase, no surrounding spaces
    public static String formatPNR(String rawPnr) {
        if (rawPnr == null) return "";
        return rawPnr.trim().toUpperCase();
    }

    // Capitalize each word of a passenger name using StringBuilder
    public static String capitalizeName(String rawName) {
        if (rawName == null || rawName.isEmpty()) return "";
        String[] words = rawName.trim().split("\\s+");
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < words.length; i++) {
            String w = words[i];
            if (w.isEmpty()) continue;
            result.append(Character.toUpperCase(w.charAt(0)));
            if (w.length() > 1) {
                result.append(w.substring(1).toLowerCase());
            }
            if (i < words.length - 1) result.append(" ");
        }
        return result.toString();
    }

    // Build a seat code like "12A" from a row number and column letter
    public static String formatSeatCode(int row, char col) {
        StringBuilder sb = new StringBuilder();
        sb.append(row);
        sb.append(Character.toUpperCase(col));
        return sb.toString();
    }

    // Parse a seat code like "12A" back into row (int) and column (char)
    public static int parseSeatRow(String seatCode) {
        StringBuilder digits = new StringBuilder();
        for (char c : seatCode.toCharArray()) {
            if (Character.isDigit(c)) digits.append(c);
        }
        return digits.length() == 0 ? -1 : Integer.parseInt(digits.toString());
    }

    public static char parseSeatColumn(String seatCode) {
        for (char c : seatCode.toCharArray()) {
            if (Character.isLetter(c)) return Character.toUpperCase(c);
        }
        return '?';
    }

    // Mask a contact number for display, keeping only the last 4 digits visible
    public static String maskContact(String contact) {
        if (contact == null || contact.length() < 4) return "****";
        StringBuffer masked = new StringBuffer();
        int visibleFrom = contact.length() - 4;
        for (int i = 0; i < contact.length(); i++) {
            masked.append(i < visibleFrom ? 'x' : contact.charAt(i));
        }
        return masked.toString();
    }

    public static void main(String[] args) {
        System.out.println("=== StringUtils Demo ===");
        System.out.println("formatPNR(\"  pnr001 \") -> " + formatPNR("  pnr001 "));
        System.out.println("capitalizeName(\"aarav SHARMA\") -> " + capitalizeName("aarav SHARMA"));
        System.out.println("formatSeatCode(12, 'a') -> " + formatSeatCode(12, 'a'));
        System.out.println("parseSeatRow(\"12A\") -> " + parseSeatRow("12A"));
        System.out.println("parseSeatColumn(\"12A\") -> " + parseSeatColumn("12A"));
        System.out.println("maskContact(\"9876543210\") -> " + maskContact("9876543210"));
    }
}