package model;
public class Economy implements BookingClass {

    
    public double getFare(double baseFare) {
        return baseFare;
    }


    
    public int getPriority() {
        return 3;
    }

    
    public String getBenefits() {
        return "Standard seating, 1 checked bag (15kg), meal available for purchase";
    }

    
    public String getClassName() {
        return "Economy";
    }
}
