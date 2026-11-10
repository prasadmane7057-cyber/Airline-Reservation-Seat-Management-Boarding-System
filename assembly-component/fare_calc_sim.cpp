/**
 * =============================================================================
 * AIRLINE RESERVATION SYSTEM - COA 64-BIT REGISTER SIMULATOR (C++)
 * Simulates x86-64 NASM registers (RAX, RBX, RCX) without requiring NASM.exe
 * =============================================================================
 */

#include <cstdint>
#include <iostream>

int main() {
    std::cout << "==================================================" << std::endl;
    std::cout << "  AIRLINE FARE CALCULATION - 64-BIT REGISTER SIM" << std::endl;
    std::cout << "  Formula: Base Fare * Passengers + Tax - Discount" << std::endl;
    std::cout << "==================================================" << std::endl;

    uint64_t baseFare = 0;
    uint64_t passengerCount = 0;
    uint64_t tax = 0;
    uint64_t discount = 0;
    uint64_t totalSeats = 0;
    uint64_t bookedSeats = 0;
    if (!(std::cin >> baseFare >> passengerCount >> tax >> discount
                  >> totalSeats >> bookedSeats)) {
        std::cerr << "Expected: base fare, passenger count, tax, discount, "
                     "total seats, booked seats.\n";
        return 1;
    }
    if (passengerCount != 0 && baseFare > UINT64_MAX / passengerCount) {
        std::cerr << "Fare multiplication exceeds the 64-bit register range.\n";
        return 1;
    }
    uint64_t RAX = baseFare * passengerCount;
    const uint64_t RBX = tax;
    const uint64_t RCX = discount;
    if (RAX > UINT64_MAX - RBX || RAX + RBX < RCX) {
        std::cerr << "Fare addition overflow or discount exceeds the subtotal.\n";
        return 1;
    }
    RAX += RBX;
    RAX -= RCX;

    if (bookedSeats > totalSeats) {
        std::cerr << "Booked seats cannot exceed total seats.\n";
        return 1;
    }
    const uint64_t availableSeats = totalSeats - bookedSeats;
    const char* status = availableSeats == 0 ? "FLIGHT FULL - waitlist only"
        : availableSeats <= 20 ? "SEATS RUNNING LOW" : "SEATS OPEN";

    std::cout << "MOV RAX, base_fare; IMUL passenger_count -> " << baseFare
              << " x " << passengerCount << " = " << baseFare * passengerCount << '\n'
              << "ADD RAX, RBX (tax=" << RBX << "), SUB RAX, RCX (discount="
              << RCX << ") -> " << RAX << '\n'
              << "Total Fare (Rs): " << RAX << '\n'
              << "Seats Available: " << availableSeats << '\n'
              << "Status: " << status << '\n';
    return 0;
}
