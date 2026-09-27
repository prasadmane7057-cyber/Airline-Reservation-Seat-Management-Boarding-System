package model;

public class Business extends SeatClass {
    @Override
    public double getFare() {
        return 12000.0;
    }

    @Override
    public int getPriority() {
        return 2;
    }
}