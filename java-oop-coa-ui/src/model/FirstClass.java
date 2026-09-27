package model;

public class FirstClass extends SeatClass {

    @Override
    public double getFare() {
        return 20000;
    }

    @Override
    public int getPriority() {
        return 3;
    }
}
