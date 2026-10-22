package util;

import model.Booking;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Locale;

public final class BookingFileManager {
    private static final String FILE_HEADER = "AIRLINE_BOOKINGS_V1";

    private BookingFileManager() {}

    public static List<Booking> loadBookings(Path file) throws IOException {
        List<Booking> bookings = new ArrayList<>();
        if (!Files.exists(file)) {
            System.out.println("Booking file not found; starting with no saved bookings: " + file);
            return bookings;
        }

        try (BufferedReader reader = Files.newBufferedReader(file, StandardCharsets.UTF_8)) {
            String header = reader.readLine();
            if (!FILE_HEADER.equals(header)) {
                System.err.println("Invalid booking file header; no bookings loaded from " + file);
                return bookings;
            }

            String line;
            int lineNumber = 1;
            while ((line = reader.readLine()) != null) {
                lineNumber++;
                try {
                    bookings.add(parseBooking(line));
                } catch (IllegalArgumentException exception) {
                    System.err.println("Skipping corrupt booking line " + lineNumber + " in "
                            + file + ": " + exception.getMessage());
                }
            }
        }
        return bookings;
    }

    public static void saveBookings(Path file, List<Booking> bookings) throws IOException {
        Path parent = file.toAbsolutePath().getParent();
        if (parent != null) Files.createDirectories(parent);

        try (BufferedWriter writer = Files.newBufferedWriter(file, StandardCharsets.UTF_8)) {
            writer.write(FILE_HEADER);
            writer.newLine();
            for (Booking booking : bookings) {
                writer.write(serializeBooking(booking));
                writer.newLine();
            }
        }
    }

    private static String serializeBooking(Booking booking) {
        if (booking == null) throw new IllegalArgumentException("booking must not be null");
        return encode(booking.getBookingId()) + "\t"
                + encode(booking.getPnr()) + "\t"
                + encode(booking.getPassengerName()) + "\t"
                + encode(booking.getFlightNumber()) + "\t"
                + encode(booking.getSeatNumber()) + "\t"
                + encode(booking.getBookingDate()) + "\t"
                + String.format(Locale.ROOT, "%.17g", booking.getFare()) + "\t"
                + encode(booking.getStatus());
    }

    private static Booking parseBooking(String line) {
        String[] fields = line.split("\t", -1);
        if (fields.length != 8) throw new IllegalArgumentException("expected 8 tab-separated fields");

        String bookingId = decode(fields[0]);
        String pnr = decode(fields[1]);
        String passengerName = decode(fields[2]);
        String flightNumber = decode(fields[3]);
        String seatNumber = decode(fields[4]);
        String bookingDate = decode(fields[5]);
        double fare;
        try {
            fare = Double.parseDouble(fields[6]);
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("fare is not a number");
        }
        String status = decode(fields[7]);

        if (bookingId.isEmpty() || pnr.isEmpty() || passengerName.isEmpty()
                || flightNumber.isEmpty() || seatNumber.isEmpty() || bookingDate.isEmpty()
                || status.isEmpty() || !Double.isFinite(fare) || fare < 0) {
            throw new IllegalArgumentException("booking fields are missing or invalid");
        }

        Booking booking = new Booking(passengerName, flightNumber, seatNumber, bookingDate);
        booking.setBookingId(bookingId);
        booking.setPnr(pnr);
        booking.setFare(fare);
        booking.setStatus(status);
        return booking;
    }

    private static String encode(String value) {
        if (value == null) throw new IllegalArgumentException("booking fields must not be null");
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private static String decode(String value) {
        try {
            return new String(Base64.getUrlDecoder().decode(value), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("invalid encoded text field");
        }
    }

    public static void main(String[] args) throws IOException {
        Path directory = Files.createTempDirectory("airline-booking-file-test");
        Path missingFile = directory.resolve("missing-bookings.csv");
        Path roundTripFile = directory.resolve("round-trip-bookings.csv");
        Path corruptFile = directory.resolve("corrupt-bookings.csv");
        try {
            ByteArrayOutputStream missingOutput = new ByteArrayOutputStream();
            List<Booking> missingBookings;
            PrintStream originalOut = System.out;
            try (PrintStream capturedOut = new PrintStream(missingOutput)) {
                System.setOut(capturedOut);
                missingBookings = loadBookings(missingFile);
            } finally {
                System.setOut(originalOut);
            }
            String missingMessage = new String(missingOutput.toByteArray(), StandardCharsets.UTF_8);
            if (!missingBookings.isEmpty() || !missingMessage.contains("starting with no saved bookings")) {
                throw new IllegalStateException("missing-file check failed");
            }
            System.out.println("Missing-file handling passed; starts with an empty booking list.");

            Booking original = new Booking("Aarav Sharma", "AI101", "12A", "2026-10-22");
            original.setBookingId("BK-ROUNDTRIP");
            original.setPnr("PNR123");
            original.setFare(4525.75);
            original.setStatus("CONFIRMED");
            saveBookings(roundTripFile, List.of(original));

            List<Booking> loaded = loadBookings(roundTripFile);
            if (loaded.size() != 1 || !sameBooking(original, loaded.get(0))) {
                throw new IllegalStateException("booking write/read round trip failed");
            }
            System.out.println("Booking write/read round trip passed.");

            Files.write(corruptFile, List.of(FILE_HEADER, "broken-line", serializeBooking(original)),
                    StandardCharsets.UTF_8);
            ByteArrayOutputStream corruptOutput = new ByteArrayOutputStream();
            List<Booking> recovered;
            PrintStream originalErr = System.err;
            try (PrintStream capturedErr = new PrintStream(corruptOutput)) {
                System.setErr(capturedErr);
                recovered = loadBookings(corruptFile);
            } finally {
                System.setErr(originalErr);
            }
            String corruptMessage = new String(corruptOutput.toByteArray(), StandardCharsets.UTF_8);
            if (recovered.size() != 1 || !sameBooking(original, recovered.get(0))
                    || !corruptMessage.contains("Skipping corrupt booking line 2")) {
                throw new IllegalStateException("corrupt-line recovery check failed");
            }
            System.out.println("Corrupt-line handling passed; invalid line skipped and valid booking loaded.");
        } finally {
            Files.deleteIfExists(missingFile);
            Files.deleteIfExists(roundTripFile);
            Files.deleteIfExists(corruptFile);
            Files.deleteIfExists(directory);
        }
    }

    private static boolean sameBooking(Booking expected, Booking actual) {
        return expected.getBookingId().equals(actual.getBookingId())
                && expected.getPnr().equals(actual.getPnr())
                && expected.getPassengerName().equals(actual.getPassengerName())
                && expected.getFlightNumber().equals(actual.getFlightNumber())
                && expected.getSeatNumber().equals(actual.getSeatNumber())
                && expected.getBookingDate().equals(actual.getBookingDate())
                && Double.compare(expected.getFare(), actual.getFare()) == 0
                && expected.getStatus().equals(actual.getStatus());
    }
}
