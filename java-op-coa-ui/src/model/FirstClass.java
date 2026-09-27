package model;
public class FirstClass implements BookingClass {

   
    
    public double getFare(double baseFare) {
        return baseFare * 2.5;
    }


    
    public int getPriority() {
        return 1;
    }

    
    public String getBenefits() {
        return "First boarding priority, 3 checked bags (32kg each), private lounge, gourmet meal, flat-bed seat";
    }

    
    public String getClassName() {
        return "FirstClass";
    }
}
