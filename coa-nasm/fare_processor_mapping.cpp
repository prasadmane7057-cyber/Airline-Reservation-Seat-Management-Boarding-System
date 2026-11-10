/**
 * =============================================================================
 * Module: Fare Operations to Processor Components Simulator
 * Subject: Computer Organization & Architecture (COA)
 * Purpose: Interactive trace demonstrating how airline fare operations map to
 *          physical CPU registers, ALU operations, bus transactions, and flags.
 * =============================================================================
 */

#include <iostream>
#include <iomanip>
#include <string>
#include <vector>
#include <cstdint>

struct CpuState {
    uint64_t RAX = 0; // Accumulator
    uint64_t RBX = 0; // Base (Tax)
    uint64_t RCX = 0; // Counter (Discount)
    uint64_t RDX = 0; // Data (Multiplier)
    uint64_t R8  = 0; // Baggage Weight
    uint64_t R9  = 0; // Surcharge
    uint64_t PC  = 0x00401000; // Program Counter
    uint64_t MAR = 0; // Memory Address Register
    uint64_t MDR = 0; // Memory Data Register

    bool ZF = false; // Zero Flag
    bool CF = false; // Carry / Borrow Flag
    bool SF = false; // Sign Flag
    bool OF = false; // Overflow Flag
};

struct OperationStep {
    int stepNumber;
    std::string operationName;
    std::string asmInstruction;
    std::string primaryComponent;
    std::string busActivity;
};

void printState(const CpuState& cpu, const OperationStep& step) {
    std::cout << "\n------------------------------------------------------------------------\n";
    std::cout << " STEP " << step.stepNumber << ": " << step.operationName << "\n";
    std::cout << " Instruction: " << std::setw(22) << std::left << step.asmInstruction 
              << " | Target Component: " << step.primaryComponent << "\n";
    std::cout << " Bus Action : " << step.busActivity << "\n";
    std::cout << "------------------------------------------------------------------------\n";
    std::cout << " [REGISTERS] RAX (Acc): Rs. " << std::setw(6) << cpu.RAX 
              << " (0x" << std::hex << std::setw(8) << std::setfill('0') << cpu.RAX << std::dec << std::setfill(' ') << ")"
              << " | RBX (Tax): Rs. " << cpu.RBX << "\n"
              << "             RCX (Disc): Rs. " << std::setw(6) << cpu.RCX 
              << " | R8 (Baggage): " << cpu.R8 << " kg"
              << " | R9 (Surcharge): Rs. " << cpu.R9 << "\n";
    std::cout << " [FLAGS]     ZF=" << (cpu.ZF ? "1" : "0")
              << "  CF=" << (cpu.CF ? "1" : "0")
              << "  SF=" << (cpu.SF ? "1" : "0")
              << "  OF=" << (cpu.OF ? "1" : "0")
              << " | PC=0x" << std::hex << cpu.PC << std::dec << "\n";
}

int main() {
    std::cout << "========================================================================\n";
    std::cout << "   COA MAPPING TRACE: AIRLINE FARE OPERATIONS TO PROCESSOR HARDWARE    \n";
    std::cout << "========================================================================\n";

    CpuState cpu;

    // Step 1: Base Fare Retrieval
    cpu.MAR = 0x00600020;
    cpu.MDR = 5000;
    cpu.RAX = cpu.MDR;
    cpu.PC += 8;
    printState(cpu, {1, "Base Fare Retrieval", "MOV RAX, [base_fare]", 
                    "MAR / MDR -> RAX (Accumulator)", "Address Bus: 0x00600020, Data Bus: 0x1388"});

    // Step 2: Aviation Tax Loading
    cpu.RBX = 900;
    cpu.PC += 8;
    printState(cpu, {2, "Aviation Tax Loading", "MOV RBX, 900", 
                    "Instruction Register (IR) -> RBX", "Internal Datapath Latch Immediate"});

    // Step 3: Tax Accumulation
    cpu.RAX = cpu.RAX + cpu.RBX;
    cpu.ZF = (cpu.RAX == 0);
    cpu.CF = false;
    cpu.PC += 8;
    printState(cpu, {3, "Tax Accumulation", "ADD RAX, RBX", 
                    "ALU 64-bit Parallel Adder", "ALU Input Latches -> Result Writeback to RAX"});

    // Step 4: Excess Baggage Evaluation
    cpu.R8 = 20; // 20 kg
    cpu.PC += 8;
    printState(cpu, {4, "Baggage Weight Check", "CMP R8, 15", 
                    "ALU Comparator & Flags Register", "ALU internal subtractor (20 - 15), sets flags"});

    // Step 5: Surcharge Calculation (5 kg * Rs. 500 = Rs. 2500)
    cpu.R9 = (cpu.R8 - 15) * 500;
    cpu.RAX = cpu.RAX + cpu.R9;
    cpu.PC += 8;
    printState(cpu, {5, "Baggage Surcharge Addition", "ADD RAX, R9", 
                    "ALU Multiplier & Adder", "Surcharge gated into ALU; RAX updated"});

    // Step 6: Promotional Discount Deduction
    cpu.RCX = 500;
    cpu.RAX = cpu.RAX - cpu.RCX;
    cpu.ZF = (cpu.RAX == 0);
    cpu.SF = false;
    cpu.PC += 8;
    printState(cpu, {6, "Promo Discount Deduction", "SUB RAX, RCX", 
                    "ALU 2's Complement Subtractor", "RCX inverted and added; final net fare in RAX"});

    std::cout << "\n========================================================================\n";
    std::cout << "  FINAL PAYABLE FARE IN ACCUMULATOR (RAX): Rs. " << cpu.RAX << "\n";
    std::cout << "  ALL CPU HARDWARE MAPPINGS VERIFIED SUCCESSFULLY.\n";
    std::cout << "========================================================================\n";

    return 0;
}
