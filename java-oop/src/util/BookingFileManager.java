package util;

import model.Booking;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Locale;

public final class BookingFileManager {
    private static final String FILE_HEADER = "AIRLINE_BOOKINGS_V1";
    private static final int FIELD_COUNT = 8;

    private BookingFileManager() {}

    public static List<Booking> loadBookings(Path file) throws IOException {
        List<Booking> bookings = new ArrayList<>();
        if (!Files.exists(file)) {
            System.out.println("Booking file not found; starting with no saved bookings: " + file);
            return bookings;
        }

        try (BufferedReader reader = Files.newBufferedReader(file, StandardCharsets.UTF_8)) {
            if (!FILE_HEADER.equals(reader.readLine())) {
                System.err.println("Invalid booking file header; no bookings loaded from " + file);
                return bookings;
            }

            String line;
            for (int lineNumber = 2; (line = reader.readLine()) != null; lineNumber++) {
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
                writer.write(formatBooking(booking));
                writer.newLine();
            }
        }
    }

    private static String formatBooking(Booking booking) {
        if (booking == null) throw new IllegalArgumentException("booking must not be null");
        return String.join("\t",
                encode(booking.getBookingId()),
                encode(booking.getPnr()),
                encode(booking.getPassengerName()),
                encode(booking.getFlightNumber()),
                encode(booking.getSeatNumber()),
                encode(booking.getBookingDate()),
                String.format(Locale.ROOT, "%.17g", booking.getFare()),
                encode(booking.getStatus()));
    }

    private static Booking parseBooking(String line) {
        String[] fields = line.split("\t", -1);
        if (fields.length != FIELD_COUNT) {
            throw new IllegalArgumentException("expected 8 tab-separated fields");
        }

        String bookingId = decode(fields[0]);
        String pnr = decode(fields[1]);
        String name = decode(fields[2]);
        String flight = decode(fields[3]);
        String seat = decode(fields[4]);
        String date = decode(fields[5]);
        String status = decode(fields[7]);
        double fare;

        try {
            fare = Double.parseDouble(fields[6]);
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("fare is not a number");
        }

        if (bookingId.isEmpty() || pnr.isEmpty() || name.isEmpty() || flight.isEmpty()
                || seat.isEmpty() || date.isEmpty() || status.isEmpty()
                || !Double.isFinite(fare) || fare < 0) {
            throw new IllegalArgumentException("booking fields are missing or invalid");
        }

        Booking booking = new Booking(name, flight, seat, date);
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
}
