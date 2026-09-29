/**
 * =============================================================================
 * AIRLINE RESERVATION SYSTEM - COA 64-BIT REGISTER SIMULATOR (C++)
 * Simulates x86-64 NASM registers (RAX, RBX, RCX) without requiring NASM.exe
 * =============================================================================
 */

#include <iostream>
#include <iomanip>
#include <cstdint>

int main() {
    std::cout << "==================================================" << std::endl;
    std::cout << "  AIRLINE FARE CALCULATION - 64-BIT REGISTER SIM" << std::endl;
    std::cout << "  Formula: Total Fare = Base Fare + Tax - Discount" << std::endl;
    std::cout << "==================================================" << std::endl;

    // Simulate 64-bit hardware registers (uint64_t)
    uint64_t RAX = 0; // Accumulator / Base Fare & Final Result
    uint64_t RBX = 0; // Base Register / Tax
    uint64_t RCX = 0; // Counter Register / Discount

    // 1. MOV RAX, 5000 (Load Base Fare)
    RAX = 5000;
    std::cout << "MOV RAX, 5000   -> Base Fare      : Rs. " << RAX << std::endl;

    // 2. MOV RBX, 900 (Load Aviation Tax)
    RBX = 900;
    std::cout << "MOV RBX, 900    -> Aviation Tax   : Rs. " << RBX << std::endl;

    // 3. MOV RCX, 500 (Load Promo Discount)
    RCX = 500;
    std::cout << "MOV RCX, 500    -> Promo Discount : Rs. " << RCX << std::endl;

    std::cout << "--------------------------------------------------" << std::endl;
    std::cout << "Executing ALU Instructions:" << std::endl;

    // 4. ADD RAX, RBX (RAX = 5000 + 900 = 5900)
    RAX = RAX + RBX;
    std::cout << "ADD RAX, RBX    -> Intermediate   : Rs. " << RAX << std::endl;

    // 5. SUB RAX, RCX (RAX = 5900 - 500 = 5400)
    RAX = RAX - RCX;
    std::cout << "SUB RAX, RCX    -> Final in RAX   : Rs. " << RAX << std::endl;

    std::cout << "--------------------------------------------------" << std::endl;
    std::cout << "FINAL TOTAL FARE (RAX Register)   : Rs. " << RAX << std::endl;
    std::cout << "==================================================" << std::endl;

    return 0;
}
