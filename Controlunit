// ControlUnit.cpp
// COA Practical 2 - Control Unit
// Shared owners: Varad + Prasad (both must be able to explain this in review)
//
// This simulates the Control Unit's job: FETCH an instruction, DECODE what
// it means, then EXECUTE it by calling the ALU. Review 2 scope is to
// sequence at least 3 dummy instructions correctly.
//
// NOTE: Siddhi + Vaishnavi are building the "real" ALU class separately.
// This file includes a small stand-in ALU (see the ALU_Stub class below)
// so the Control Unit can be tested on its own right now. Once their ALU
// file is ready, swap ALU_Stub for their class - the function calls
// (add/sub/mul/div) should match, so it's a quick swap, not a rewrite.
 
#include <iostream>
#include <vector>
#include <string>
using namespace std;
 
// ---------- Temporary stand-in for the real ALU (Siddhi + Vaishnavi's file) ----------
class ALU_Stub {
public:
    int add(int a, int b) { return a + b; }
    int sub(int a, int b) { return a - b; }
    int mul(int a, int b) { return a * b; }
};
 
// ---------- One instruction: an opcode + two operands ----------
struct Instruction {
    string opcode;   // "ADD", "SUB", "MUL"
    int operand1;
    int operand2;
};
 
// ---------- The Control Unit itself ----------
class ControlUnit {
private:
    vector<Instruction> program;
    ALU_Stub alu;
 
public:
    // Load a program (a list of instructions) into the Control Unit
    void loadProgram(vector<Instruction> instructions) {
        program = instructions;
    }
 
    // Runs FETCH -> DECODE -> EXECUTE for every instruction in order
    void run() {
        cout << "--- Control Unit: starting execution ---" << endl;
        for (size_t i = 0; i < program.size(); i++) {
            Instruction current = fetch(i);
            execute(current);
        }
        cout << "--- Control Unit: execution finished ---" << endl;
    }
 
private:
    // FETCH: grabs the next instruction from the program list
    Instruction fetch(size_t index) {
        cout << "\n[FETCH]   Instruction " << (index + 1) << ": "
             << program[index].opcode << " "
             << program[index].operand1 << ", "
             << program[index].operand2 << endl;
        return program[index];
    }
 
    // DECODE + EXECUTE: figures out which ALU operation to call, then calls it
    void execute(Instruction instr) {
        cout << "[DECODE]  Opcode is " << instr.opcode << endl;
 
        int result = 0;
        if (instr.opcode == "ADD") {
            result = alu.add(instr.operand1, instr.operand2);
        } else if (instr.opcode == "SUB") {
            result = alu.sub(instr.operand1, instr.operand2);
        } else if (instr.opcode == "MUL") {
            result = alu.mul(instr.operand1, instr.operand2);
        } else {
            cout << "[EXECUTE] Unknown opcode - skipping." << endl;
            return;
        }
 
        cout << "[EXECUTE] Result = " << result << endl;
    }
};
 
// ---------- Demo / test driver ----------
// This is what you run and show in the Review 2 demo: 3 dummy instructions.
int main() {
    ControlUnit cu;
 
    vector<Instruction> dummyProgram = {
        {"ADD", 10, 5},   // 10 + 5
        {"SUB", 20, 8},   // 20 - 8
        {"MUL", 4, 6}     // 4 * 6
    };
 
    cu.loadProgram(dummyProgram);
    cu.run();
 
    return 0;
}
 
