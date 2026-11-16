package service;

import model.Booking;
import util.BookingFileManager;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

/**
 * Enterprise File Service for Airline Bookings.
 * Supports:
 *  - RFC 4180 Standard CSV Save & Load
 *  - Java Binary Object Serialization (.dat / .bin)
 *  - Legacy Tab-Separated Encoded format (BookingFileManager)
 *  - Atomic CSV file replacement
 */
public class BookingFileService {

    private static final String CSV_HEADER = "BookingID,PNR,PassengerName,FlightNumber,SeatNumber,BookingDate,Fare,Status";

    /**
     * Saves a list of Booking entities to a standard CSV file with atomic write semantics.
     *
     * @param filePath destination path
     * @param bookings list of bookings to write
     * @throws IOException on I/O error
     */
    public void saveToCsv(Path filePath, List<Booking> bookings) throws IOException {
        Objects.requireNonNull(filePath, "filePath must not be null");
        Objects.requireNonNull(bookings, "bookings must not be null");

        Path parent = filePath.toAbsolutePath().getParent();
        if (parent != null) {
            Files.createDirectories(parent);
        }

        Path tempFile = Files.createTempFile(parent, "bookings_", ".tmp");
        try {
            try (BufferedWriter writer = Files.newBufferedWriter(tempFile, StandardCharsets.UTF_8)) {
                writer.write(CSV_HEADER);
                writer.newLine();

                for (Booking booking : bookings) {
                    if (booking != null) {
                        writer.write(formatCsvRow(booking));
                        writer.newLine();
                    }
                }
            }

            try {
                Files.move(tempFile, filePath, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException e) {
                Files.move(tempFile, filePath, StandardCopyOption.REPLACE_EXISTING);
            }
        } finally {
            Files.deleteIfExists(tempFile);
        }
    }

    /**
     * Loads a list of Booking entities from a CSV file.
     *
     * @param filePath CSV file to read
     * @return list of parsed Booking entities
     * @throws IOException on read error or file not found
     */
    public List<Booking> loadFromCsv(Path filePath) throws IOException {
        Objects.requireNonNull(filePath, "filePath must not be null");

        if (!Files.exists(filePath)) {
            throw new FileNotFoundException("Bookings CSV file not found: " + filePath.toAbsolutePath());
        }

        StringBuilder contents = new StringBuilder();
        try (BufferedReader reader = Files.newBufferedReader(filePath, StandardCharsets.UTF_8)) {
            char[] buffer = new char[4096];
            int count;
            while ((count = reader.read(buffer)) != -1) {
                contents.append(buffer, 0, count);
            }
        }

        List<List<String>> records = parseCsvRecords(contents.toString());
        if (records.isEmpty()) return new ArrayList<>();
        if (!records.get(0).equals(Arrays.asList(CSV_HEADER.split(",", -1)))) {
            throw new IOException("Invalid bookings CSV header in " + filePath.toAbsolutePath());
        }

        List<Booking> bookings = new ArrayList<>();
        for (int i = 1; i < records.size(); i++) {
            List<String> record = records.get(i);
            if (record.size() == 1 && record.get(0).trim().isEmpty()) continue;
            try {
                bookings.add(parseCsvRow(record));
            } catch (IllegalArgumentException e) {
                System.out.println("[WARN] Skipping malformed CSV record " + (i + 1)
                        + " in " + filePath + ": " + e.getMessage());
            }
        }
        return bookings;
    }

    private List<List<String>> parseCsvRecords(String csv) throws IOException {
        List<List<String>> records = new ArrayList<>();
        List<String> fields = new ArrayList<>();
        StringBuilder field = new StringBuilder();
        boolean quoted = false;

        for (int i = 0; i < csv.length(); i++) {
            char current = csv.charAt(i);
            if (quoted) {
                if (current == '"') {
                    if (i + 1 < csv.length() && csv.charAt(i + 1) == '"') {
                        field.append('"');
                        i++;
                    } else {
                        quoted = false;
                    }
                } else {
                    field.append(current);
                }
            } else if (current == '"') {
                if (field.length() != 0) throw new IOException("Unexpected quote in CSV record.");
                quoted = true;
            } else if (current == ',') {
                fields.add(field.toString());
                field.setLength(0);
            } else if (current == '\n' || current == '\r') {
                fields.add(field.toString());
                field.setLength(0);
                records.add(fields);
                fields = new ArrayList<>();
                if (current == '\r' && i + 1 < csv.length() && csv.charAt(i + 1) == '\n') i++;
            } else {
                field.append(current);
            }
        }

        if (quoted) throw new IOException("Unterminated quoted CSV field.");
        if (!fields.isEmpty() || field.length() > 0) {
            fields.add(field.toString());
            records.add(fields);
        }
        return records;
    }

    /**
     * Serializes bookings to a binary object stream (.dat).
     */
    public void saveToBinary(Path filePath, List<Booking> bookings) throws IOException {
        Objects.requireNonNull(filePath, "filePath must not be null");
        Objects.requireNonNull(bookings, "bookings must not be null");

        Path parent = filePath.toAbsolutePath().getParent();
        if (parent != null) {
            Files.createDirectories(parent);
        }

        try (ObjectOutputStream oos = new ObjectOutputStream(
                new BufferedOutputStream(Files.newOutputStream(filePath)))) {
            oos.writeInt(bookings.size());
            for (Booking b : bookings) {
                oos.writeObject(b);
            }
        }
    }

    /**
     * Deserializes bookings from a binary object stream.
     */
    public List<Booking> loadFromBinary(Path filePath) throws IOException, ClassNotFoundException {
        Objects.requireNonNull(filePath, "filePath must not be null");

        if (!Files.exists(filePath)) {
            throw new FileNotFoundException("Binary bookings file not found: " + filePath.toAbsolutePath());
        }

        List<Booking> bookings = new ArrayList<>();

        try (ObjectInputStream ois = new ObjectInputStream(
                new BufferedInputStream(Files.newInputStream(filePath)))) {
            int count = ois.readInt();
            for (int i = 0; i < count; i++) {
                Booking b = (Booking) ois.readObject();
                bookings.add(b);
            }
        }

        return bookings;
    }

    /**
     * Saves using the legacy Base64 tab-encoded format (via BookingFileManager).
     */
    public void saveToTabEncoded(Path filePath, List<Booking> bookings) throws IOException {
        BookingFileManager.saveBookings(filePath, bookings);
    }

    /**
     * Loads using the legacy Base64 tab-encoded format (via BookingFileManager).
     */
    public List<Booking> loadFromTabEncoded(Path filePath) throws IOException {
        return BookingFileManager.loadBookings(filePath);
    }

    // --- Helper Formatting & Parsing Methods ---

    private String formatCsvRow(Booking b) {
        return String.join(",",
                escapeCsv(b.getBookingId() != null ? b.getBookingId() : ""),
                escapeCsv(b.getPnr() != null ? b.getPnr() : ""),
                escapeCsv(b.getPassengerName() != null ? b.getPassengerName() : ""),
                escapeCsv(b.getFlightNumber() != null ? b.getFlightNumber() : ""),
                escapeCsv(b.getSeatNumber() != null ? b.getSeatNumber() : ""),
                escapeCsv(b.getBookingDate() != null ? b.getBookingDate() : ""),
                String.format(Locale.ROOT, "%.2f", b.getFare()),
                escapeCsv(b.getStatus() != null ? b.getStatus() : "CONFIRMED")
        );
    }

    private Booking parseCsvRow(List<String> parts) {
        if (parts.size() != 8) {
            throw new IllegalArgumentException("Expected 8 CSV columns, found " + parts.size());
        }

        String bookingId = parts.get(0).trim();
        String pnr = parts.get(1).trim();
        String name = parts.get(2).trim();
        String flight = parts.get(3).trim();
        String seat = parts.get(4).trim();
        String date = parts.get(5).trim();
        double fare = Double.parseDouble(parts.get(6).trim());
        String status = parts.get(7).trim();
        if (!Double.isFinite(fare) || fare < 0) {
            throw new IllegalArgumentException("fare must be a finite non-negative number");
        }

        Booking b = new Booking(name, flight, seat, date);
        b.setBookingId(bookingId);
        b.setPnr(pnr);
        b.setFare(fare);
        b.setStatus(status.isEmpty() ? "CONFIRMED" : status);
        return b;
    }

    private String escapeCsv(String field) {
        if (field.contains(",") || field.contains("\"") || field.contains("\n") || field.contains("\r")) {
            return "\"" + field.replace("\"", "\"\"") + "\"";
        }
        return field;
    }

}
