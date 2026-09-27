package model;

public class Business implements BookingClass {


    
    public double getFare(double baseFare) {
        return baseFare * 1.5;
    }


    
    public int getPriority() {
        return 2;
    }

    
    public String getBenefits() {
        return "Priority boarding, 2 checked bags (25kg each), lounge access, free meal";
    }

    
    public String getClassName() {
        return "Business";
    }
}
