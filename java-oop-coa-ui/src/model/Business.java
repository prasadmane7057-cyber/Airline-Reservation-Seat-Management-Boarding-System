package model;

public class Business extends SeatClass {

    @Override
    public double getFare() {
        return 10000;
    }

    @Override
    public int getPriority() {
        return 2;
    }
}
