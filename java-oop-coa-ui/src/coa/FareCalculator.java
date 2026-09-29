package coa;
public class FareCalculator {
    public static double calculateFare(double baseFare, int passengerCount, String cabinClass) {
        double multiplier = switch (cabinClass.toLowerCase()) {
            case "economy" -> 1.0;
            case "business" -> 1.8;
            case "first" -> 2.8;
            default -> 1.0;
        };

        double surcharge = passengerCount > 2 ? (passengerCount - 2) * 250.0 : 0.0;
        return baseFare * multiplier + surcharge;
    }

    public static void main(String[] args) {
        System.out.println("Airline Fare Calculator");
        System.out.println("Economy fare: Rs. " + calculateFare(4500, 2, "economy"));
        System.out.println("Business fare: Rs. " + calculateFare(4500, 2, "business"));
        System.out.println("First class fare: Rs. " + calculateFare(4500, 2, "first"));
    }
}
