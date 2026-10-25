package util;

import model.Booking;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

public final class BookingFileManagerTest {
    private BookingFileManagerTest() {}

    public static void main(String[] args) throws Exception {
        Path folder = Files.createTempDirectory("booking-file-test");
        Path missing = folder.resolve("missing.txt");
        Path saved = folder.resolve("bookings.txt");
        Path corrupt = folder.resolve("corrupt.txt");

        try {
            if (!BookingFileManager.loadBookings(missing).isEmpty()) {
                throw new AssertionError("Missing files should load as an empty list.");
            }

            Booking expected = new Booking("Aarav Sharma", "AI101", "12A", "2026-10-22");
            expected.setBookingId("BK-TEST");
            expected.setPnr("PNR123");
            expected.setFare(4525.75);
            BookingFileManager.saveBookings(saved, List.of(expected));

            List<Booking> loaded = BookingFileManager.loadBookings(saved);
            if (loaded.size() != 1 || !sameBooking(expected, loaded.get(0))) {
                throw new AssertionError("Saved booking did not load correctly.");
            }

            List<String> lines = Files.readAllLines(saved, StandardCharsets.UTF_8);
            Files.write(corrupt, List.of(lines.get(0), "broken-line", lines.get(1)),
                    StandardCharsets.UTF_8);
            ByteArrayOutputStream errors = new ByteArrayOutputStream();
            PrintStream originalError = System.err;
            List<Booking> recovered;
            try (PrintStream capturedError = new PrintStream(errors)) {
                System.setErr(capturedError);
                recovered = BookingFileManager.loadBookings(corrupt);
            } finally {
                System.setErr(originalError);
            }
            String warning = new String(errors.toByteArray(), StandardCharsets.UTF_8);
            if (recovered.size() != 1 || !warning.contains("Skipping corrupt booking line 2")) {
                throw new AssertionError("A corrupt line prevented valid bookings from loading.");
            }
            System.out.println("Booking file checks passed.");
        } finally {
            Files.deleteIfExists(missing);
            Files.deleteIfExists(saved);
            Files.deleteIfExists(corrupt);
            Files.deleteIfExists(folder);
        }
    }

    private static boolean sameBooking(Booking first, Booking second) {
        return first.getBookingId().equals(second.getBookingId())
                && first.getPnr().equals(second.getPnr())
                && first.getPassengerName().equals(second.getPassengerName())
                && first.getFlightNumber().equals(second.getFlightNumber())
                && first.getSeatNumber().equals(second.getSeatNumber())
                && first.getBookingDate().equals(second.getBookingDate())
                && Double.compare(first.getFare(), second.getFare()) == 0
                && first.getStatus().equals(second.getStatus());
    }
}
