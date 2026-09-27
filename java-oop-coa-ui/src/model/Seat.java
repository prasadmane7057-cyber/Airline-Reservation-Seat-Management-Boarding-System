package model;

/**
 * Class: Seat (Model package)
 * Encapsulates seat numbering, cabin travel class, and live occupancy status
 */
public class Seat {
    private String seatNumber;
    private String seatClass;
    private String status; // "AVAILABLE", "SELECTED", "OCCUPIED", "BLOCKED"

    public Seat(String seatNumber, String seatClass, String status) {
        this.seatNumber = seatNumber;
        this.seatClass = seatClass;
        this.status = status;
    }

    public String getSeatNumber() { return seatNumber; }
    public void setSeatNumber(String seatNumber) { this.seatNumber = seatNumber; }

    public String getSeatClass() { return seatClass; }
    public void setSeatClass(String seatClass) { this.seatClass = seatClass; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    @Override
    public String toString() {
        return "Seat " + seatNumber + " [" + seatClass + " - " + status + "]";
    }
}
