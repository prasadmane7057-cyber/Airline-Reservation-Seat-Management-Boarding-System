package coa;

// COA Practical 1 (ALU) applied to the project:
// Simulates ALU-style operations (add, subtract, multiply) on fares,
// working through binary representation to mirror how a real ALU computes.
public class FareCalculator {

    // Convert a decimal amount to its binary string form (simulates the ALU's input stage)
    public static String toBinary(int decimal) {
        return Integer.toBinaryString(decimal);
    }

    // Convert a binary string back to decimal (simulates the ALU's output stage)
    public static int toDecimal(String binary) {
        return Integer.parseInt(binary, 2);
    }

    // ALU-style binary addition: fare + tax
    public static int aluAdd(int fare, int tax) {
        String binFare = toBinary(fare);
        String binTax = toBinary(tax);
        int result = toDecimal(binFare) + toDecimal(binTax); // relies on Java int add,
        // but the binary conversion above is what demonstrates the ALU's representation step
        System.out.println("ALU ADD: " + fare + " (" + binFare + ") + " + tax + " (" + binTax + ")");
        return result;
    }

    // ALU-style subtraction: fare - discount, using two's complement logic
    public static int aluSubtract(int fare, int discount) {
        int negDiscount = ~discount + 1; // two's complement of discount
        int result = fare + negDiscount;
        System.out.println("ALU SUB (via two's complement): " + fare + " - " + discount + " = " + result);
        return result;
    }

    // ALU-style multiplication via repeated addition (matches Practical 5's add-and-shift idea)
    public static int aluMultiply(int fare, int passengerCount) {
        int result = 0;
        for (int i = 0; i < passengerCount; i++) {
            result = aluAddQuiet(result, fare);
        }
        System.out.println("ALU MUL (repeated addition): " + fare + " x " + passengerCount + " = " + result);
        return result;
    }

    private static int aluAddQuiet(int a, int b) {
        return a + b;
    }

    // Final total: (fare x passengers) + tax - discount
    public static int computeTotalFare(int baseFare, int passengerCount, int tax, int discount) {
        int subtotal = aluMultiply(baseFare, passengerCount);
        int withTax = aluAdd(subtotal, tax);
        int total = aluSubtract(withTax, discount);
        return total;
    }

    public static void main(String[] args) {
        System.out.println("=== COA: Fare Calculator (ALU simulation) ===\n");
        int baseFare = 4500;
        int passengers = 3;
        int tax = 850;
        int discount = 500;

        int total = computeTotalFare(baseFare, passengers, tax, discount);
        System.out.println("\nFinal Total Fare: Rs. " + total);
    }
}