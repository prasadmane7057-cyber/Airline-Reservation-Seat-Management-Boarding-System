package model;

// PSOOP Practical 3 - Class, Object, Methods, Constructors
// Seat: Java-side representation of a seat, paired with PL's C++ SeatMap2D
public class Seat {
    public static final int AVAILABLE = 0;
    public static final int BOOKED = 1;
    public static final int BLOCKED = 2;

    private int row;
    private char column;
    private String seatClass; // Economy / Business / First
    private int status;       // AVAILABLE / BOOKED / BLOCKED

    public Seat() {
        this(1, 'A', "Economy", AVAILABLE);
    }

    public Seat(int row, char column, String seatClass, int status) {
        this.row = row;
        this.column = column;
        this.seatClass = seatClass;
        this.status = status;
    }

    public int getRow() { return row; }
    public char getColumn() { return column; }
    public String getSeatClass() { return seatClass; }
    public int getStatus() { return status; }

    public void setStatus(int status) { this.status = status; }
    public void setSeatClass(String seatClass) { this.seatClass = seatClass; }

    public String getSeatCode() {
        return row + String.valueOf(Character.toUpperCase(column));
    }

    public String getStatusLabel() {
        switch (status) {
            case AVAILABLE: return "Available";
            case BOOKED: return "Booked";
            case BLOCKED: return "Blocked";
            default: return "Unknown";
        }
    }

    @Override
    public String toString() {
        return String.format("Seat %-4s | %-8s | %s", getSeatCode(), seatClass, getStatusLabel());
    }

    public static void main(String[] args) {
        System.out.println("=== Seat Demo ===");
        Seat s1 = new Seat(1, 'A', "First", Seat.AVAILABLE);
        Seat s2 = new Seat(12, 'C', "Economy", Seat.BOOKED);
        Seat s3 = new Seat(11, 'B', "Economy", Seat.BLOCKED);
        System.out.println(s1);
        System.out.println(s2);
        System.out.println(s3);
    }
}