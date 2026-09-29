package model;

public class Economy extends SeatClass {
    @Override
    public double getFare() {
        return 5000.0;
    }

    @Override
    public int getPriority() {
        return 1;
    }
}
