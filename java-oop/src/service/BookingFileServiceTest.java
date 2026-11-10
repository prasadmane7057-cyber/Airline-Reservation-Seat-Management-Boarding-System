package service;

import model.Booking;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

public class BookingFileServiceTest {

    public static void main(String[] args) {
        System.out.println("=================================================");
        System.out.println("     RUNNING BOOKING FILE SERVICE TEST SUITE     ");
        System.out.println("=================================================");

        BookingFileService service = new BookingFileService();
        Path tempDir = null;
        Path quotedCsv = null;
        Path invalidHeader = null;

        try {
            // Setup sample bookings
            List<Booking> testBookings = new ArrayList<>();
            
            Booking b1 = new Booking("Aarav Sharma", "AI101", "12A", "2026-10-15");
            b1.setBookingId("BK-AI8K92");
            b1.setPnr("AI8K92");
            b1.setFare(6500.0);
            b1.setStatus("CONFIRMED");
            testBookings.add(b1);

            Booking b2 = new Booking("Sneha Iyer", "AI202", "3B", "2026-10-16");
            b2.setBookingId("BK-SK7M41");
            b2.setPnr("SK7M41");
            b2.setFare(12000.0);
            b2.setStatus("CONFIRMED");
            testBookings.add(b2);

            Booking b3 = new Booking("Rohan Mehta", "AI303", "14C", "2026-10-17");
            b3.setBookingId("BK-DL4Q78");
            b3.setPnr("DL4Q78");
            b3.setFare(5000.0);
            b3.setStatus("CANCELLED");
            testBookings.add(b3);

            // 1. Test CSV Save & Load
            Path tempCsv = Files.createTempFile("test_bookings_", ".csv");
            System.out.println("\n[TEST 1] Saving " + testBookings.size() + " bookings to CSV: " + tempCsv);
            service.saveToCsv(tempCsv, testBookings);

            System.out.println("[TEST 1] Loading bookings back from CSV...");
            List<Booking> loadedCsv = service.loadFromCsv(tempCsv);
            assert loadedCsv.size() == 3 : "Expected 3 bookings, got " + loadedCsv.size();
            assert "AI8K92".equals(loadedCsv.get(0).getPnr()) : "PNR mismatch on item 0";
            assert "Sneha Iyer".equals(loadedCsv.get(1).getPassengerName()) : "Name mismatch on item 1";
            assert "CANCELLED".equals(loadedCsv.get(2).getStatus()) : "Status mismatch on item 2";
            System.out.println("✓ Test 1 PASSED: CSV roundtrip verified (Count = " + loadedCsv.size() + ")");

            tempDir = Files.createTempDirectory("booking_service_errors_");
            quotedCsv = tempDir.resolve("quoted.csv");
            Booking quotedBooking = new Booking("Aarav, \"Ace\"\nSharma", "AI101", "12A", "2026-10-15");
            quotedBooking.setBookingId("BK-QUOTED");
            quotedBooking.setPnr("PNR-QUOTED");
            service.saveToCsv(quotedCsv, List.of(quotedBooking));
            List<Booking> quotedLoaded = service.loadFromCsv(quotedCsv);
            assert quotedLoaded.size() == 1 : "Expected a quoted CSV record to load";
            assert quotedBooking.getPassengerName().equals(quotedLoaded.get(0).getPassengerName())
                    : "Quoted comma, quote, or newline did not roundtrip";
            System.out.println("✓ Test 1B PASSED: Quoted commas, quotes, and embedded newlines roundtrip");

            // 2. Test Binary Save & Load
            Path tempBin = Files.createTempFile("test_bookings_", ".dat");
            System.out.println("\n[TEST 2] Saving bookings to Binary Stream: " + tempBin);
            service.saveToBinary(tempBin, testBookings);

            System.out.println("[TEST 2] Loading bookings from Binary Stream...");
            List<Booking> loadedBin = service.loadFromBinary(tempBin);
            assert loadedBin.size() == 3 : "Expected 3 bookings from binary, got " + loadedBin.size();
            assert "BK-AI8K92".equals(loadedBin.get(0).getBookingId()) : "BookingID mismatch";
            assert loadedBin.get(1).getFare() == 12000.0 : "Fare mismatch";
            System.out.println("✓ Test 2 PASSED: Binary serialization roundtrip verified");

            // 3. Test Corrupt Line Resilience
            Path corruptCsv = Files.createTempFile("test_corrupt_", ".csv");
            String csvContent = "BookingID,PNR,PassengerName,FlightNumber,SeatNumber,BookingDate,Fare,Status\n" +
                                "BK-001,P001,Valid Passenger,AI101,1A,2026-10-15,5000.00,CONFIRMED\n" +
                                "INVALID_ROW_MISSING_COLUMNS,TEST\n" +
                                "BK-BAD,P003,Bad Fare,AI101,3A,2026-10-15,not-a-number,CONFIRMED\n" +
                                "BK-002,P002,Second Passenger,AI202,2B,2026-10-16,8000.00,CONFIRMED\n";
            Files.writeString(corruptCsv, csvContent);
            System.out.println("\n[TEST 3] Testing resilience against corrupt CSV rows...");
            List<Booking> recovered = service.loadFromCsv(corruptCsv);
            assert recovered.size() == 2 : "Expected 2 valid recovered records, got " + recovered.size();
            System.out.println("✓ Test 3 PASSED: Corrupt rows skipped gracefully, valid rows recovered (Count = " + recovered.size() + ")");

            invalidHeader = tempDir.resolve("invalid-header.csv");
            Files.writeString(invalidHeader, "wrong,header\n", java.nio.charset.StandardCharsets.UTF_8);
            try {
                service.loadFromCsv(invalidHeader);
                throw new AssertionError("Invalid CSV headers should be reported as I/O errors");
            } catch (IOException expected) {
                System.out.println("✓ Test 4 PASSED: Invalid file header reported explicitly");
            }

            try {
                service.loadFromCsv(tempDir);
                throw new AssertionError("Reading a directory should report an I/O error");
            } catch (IOException expected) {
                System.out.println("✓ Test 5 PASSED: File I/O failures are propagated to the caller");
            }

            try {
                service.saveToCsv(tempDir, testBookings);
                throw new AssertionError("Replacing a directory should report an I/O error");
            } catch (IOException expected) {
                System.out.println("✓ Test 6 PASSED: CSV write failures are propagated to the caller");
            }

            // Cleanup
            Files.deleteIfExists(tempCsv);
            Files.deleteIfExists(tempBin);
            Files.deleteIfExists(corruptCsv);
            Files.deleteIfExists(quotedCsv);
            Files.deleteIfExists(invalidHeader);
            Files.deleteIfExists(tempDir);

            System.out.println("\n=================================================");
            System.out.println("       ALL BOOKING FILE SERVICE TESTS PASSED     ");
            System.out.println("=================================================");

        } catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        } finally {
            try {
                if (quotedCsv != null) Files.deleteIfExists(quotedCsv);
                if (invalidHeader != null) Files.deleteIfExists(invalidHeader);
                if (tempDir != null) Files.deleteIfExists(tempDir);
            } catch (IOException cleanupError) {
                System.err.println("Could not clean up booking service test files: " + cleanupError.getMessage());
            }
        }
    }
}
