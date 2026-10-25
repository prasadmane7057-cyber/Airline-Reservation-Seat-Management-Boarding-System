import model.Economy;
import model.Business;
import model.FirstClass;
import model.SeatClass;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Scanner;
import java.util.Set;

public final class BookingSystem {
    private BookingSystem() {}

    public static final class BookingRecord {
        private final String pnr;
        private final String passengerName;
        private final String flightNumber;
        private final String seatNumber;
        private final SeatClass bookingClass;
        private String status;

        public BookingRecord(String pnr, String passengerName, String flightNumber,
                             String seatNumber, SeatClass bookingClass, String status) {
            this.pnr = pnr;
            this.passengerName = passengerName;
            this.flightNumber = flightNumber;
            this.seatNumber = seatNumber;
            this.bookingClass = bookingClass;
            this.status = status;
        }

        public String getPnr() { return pnr; }
        public String getSeatNumber() { return seatNumber; }
        public SeatClass getBookingClass() { return bookingClass; }

        @Override
        public String toString() {
            return pnr + " | " + passengerName + " | " + flightNumber + " | "
                    + seatNumber + " | " + bookingClass.getClassName() + " | " + status;
        }
    }

    public static final class BookingStore {
        private final Set<String> flights = new HashSet<>();
        private final List<BookingRecord> bookings = new ArrayList<>();

        public boolean addFlight(String flightNumber) {
            return flightNumber != null && !flightNumber.trim().isEmpty()
                    && flights.add(flightNumber.trim().toUpperCase(Locale.ROOT));
        }

        public boolean addBooking(BookingRecord booking) {
            if (booking == null || booking.pnr == null || booking.seatNumber == null
                    || booking.flightNumber == null || booking.bookingClass == null
                    || booking.status == null || booking.passengerName == null
                    || !flights.contains(normalize(booking.flightNumber))) return false;

            for (BookingRecord existing : bookings) {
                if (existing.status.equalsIgnoreCase("Cancelled")) continue;
                if (existing.pnr.equalsIgnoreCase(booking.pnr)) return false;
                if (existing.flightNumber.equalsIgnoreCase(booking.flightNumber)
                        && existing.seatNumber.equalsIgnoreCase(booking.seatNumber)) return false;
            }
            bookings.add(booking);
            return true;
        }

        public int totalBookings() {
            return bookings.size();
        }

        public BookingRecord findByPnr(String pnr) {
            for (BookingRecord booking : bookings) {
                if (booking.pnr.equalsIgnoreCase(pnr)
                        && !booking.status.equalsIgnoreCase("Cancelled")) return booking;
            }
            return null;
        }

        public boolean cancelBooking(String pnr) {
            BookingRecord booking = findByPnr(pnr);
            if (booking == null) return false;
            booking.status = "Cancelled";
            return true;
        }

        public ArrayList<BookingRecord> getActiveBookingsForFlight(String flightNumber) {
            ArrayList<BookingRecord> active = new ArrayList<>();
            for (BookingRecord booking : bookings) {
                if (booking.flightNumber.equalsIgnoreCase(flightNumber)
                        && !booking.status.equalsIgnoreCase("Cancelled")) active.add(booking);
            }
            return active;
        }

        private static String normalize(String value) {
            return value.trim().toUpperCase(Locale.ROOT);
        }
    }

    public static final class PassengerSorter {
        private PassengerSorter() {}

        public static void sortForBoarding(List<BookingRecord> bookings) {
            bookings.sort(Comparator
                    .comparingInt((BookingRecord booking) -> booking.bookingClass.getPriority())
                    .thenComparingInt(booking -> rowOf(booking.seatNumber))
                    .thenComparingInt(booking -> letterOf(booking.seatNumber)));
        }

        public static int rowOf(String seat) {
            int end = 0;
            while (end < seat.length() && Character.isDigit(seat.charAt(end))) end++;
            return end == 0 ? Integer.MAX_VALUE : Integer.parseInt(seat.substring(0, end));
        }

        public static char letterOf(String seat) {
            return seat.isEmpty() ? Character.MAX_VALUE
                    : Character.toUpperCase(seat.charAt(seat.length() - 1));
        }
    }

    public static final class ConsoleInput {
        private static final Scanner INPUT = new Scanner(System.in);

        private ConsoleInput() {}

        public static String text(String prompt) {
            System.out.print(prompt);
            return INPUT.nextLine().trim();
        }

        public static int number(String prompt, int min, int max) {
            while (true) {
                try {
                    int value = Integer.parseInt(text(prompt));
                    if (value >= min && value <= max) return value;
                } catch (NumberFormatException ignored) {
                    // Ask again when the input is not a number.
                }
                System.out.println("Enter a number from " + min + " to " + max + ".");
            }
        }

        public static String seat() {
            while (true) {
                String seat = text("  Seat (e.g. 12A): ").toUpperCase(Locale.ROOT);
                if (seat.matches("[1-9][0-9]*[A-F]")) return seat;
                System.out.println("Enter a seat like 12A.");
            }
        }

        public static SeatClass bookingClass() {
            while (true) {
                String choice = text("  Class (1 Economy, 2 Business, 3 FirstClass): ")
                        .toLowerCase(Locale.ROOT);
                if (choice.equals("business") || choice.equals("2")) return new Business();
                if (choice.equals("firstclass") || choice.equals("first") || choice.equals("3")) {
                    return new FirstClass();
                }
                if (choice.equals("economy") || choice.equals("1")) return new Economy();
                System.out.println("Choose Economy, Business, or FirstClass.");
            }
        }
    }
}
