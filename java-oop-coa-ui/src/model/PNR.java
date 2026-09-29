package model;

import java.security.SecureRandom;

/**
 * Class: PNR
 * Generates unique 6-character uppercase alphanumeric booking references
 * Demonstrates: static methods, final constants, StringBuilder
 */
public class PNR {
    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    public static String generatePNR() {
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        }
        return sb.toString();
    }
}
