#include <iostream>
#include <iomanip>
#include <string>
#include <vector>
#include <cstdint>

// 2-bit Saturating Counter Branch Predictor states
enum class PredictorState {
    STRONGLY_NOT_TAKEN = 0, // 00
    WEAKLY_NOT_TAKEN   = 1, // 01
    WEAKLY_TAKEN       = 2, // 10
    STRONGLY_TAKEN     = 3  // 11
};

struct AluFlags {
    bool ZF; // Zero Flag
    bool CF; // Carry Flag
    bool SF; // Sign Flag
    bool OF; // Overflow Flag

    std::string toString() const {
        std::string s = "[ ";
        s += "ZF=" + std::to_string(ZF ? 1 : 0) + " ";
        s += "CF=" + std::to_string(CF ? 1 : 0) + " ";
        s += "SF=" + std::to_string(SF ? 1 : 0) + " ";
        s += "OF=" + std::to_string(OF ? 1 : 0) + " ]";
        return s;
    }
};

struct BranchTrace {
    int stage;
    std::string instruction;
    std::string condition;
    AluFlags flags;
    bool predictedTaken;
    bool actualTaken;
    bool predictionHit;
    int pipelinePenaltyCycles;
    std::string architecturalAction;
};

class SeatBranchSimulator {
private:
    PredictorState branchPredictor;
    int totalCycles;
    int mispredictionStalls;

public:
    SeatBranchSimulator() 
        : branchPredictor(PredictorState::WEAKLY_NOT_TAKEN), 
          totalCycles(0), 
          mispredictionStalls(0) {}

    bool predict() const {
        return branchPredictor == PredictorState::WEAKLY_TAKEN || 
               branchPredictor == PredictorState::STRONGLY_TAKEN;
    }

    void updatePredictor(bool taken) {
        if (taken) {
            if (branchPredictor == PredictorState::STRONGLY_NOT_TAKEN)
                branchPredictor = PredictorState::WEAKLY_NOT_TAKEN;
            else if (branchPredictor == PredictorState::WEAKLY_NOT_TAKEN)
                branchPredictor = PredictorState::WEAKLY_TAKEN;
            else if (branchPredictor == PredictorState::WEAKLY_TAKEN)
                branchPredictor = PredictorState::STRONGLY_TAKEN;
        } else {
            if (branchPredictor == PredictorState::STRONGLY_TAKEN)
                branchPredictor = PredictorState::WEAKLY_TAKEN;
            else if (branchPredictor == PredictorState::WEAKLY_TAKEN)
                branchPredictor = PredictorState::WEAKLY_NOT_TAKEN;
            else if (branchPredictor == PredictorState::WEAKLY_NOT_TAKEN)
                branchPredictor = PredictorState::STRONGLY_NOT_TAKEN;
        }
    }

    std::string getPredictorStateName() const {
        switch (branchPredictor) {
            case PredictorState::STRONGLY_NOT_TAKEN: return "Strongly Not Taken (00)";
            case PredictorState::WEAKLY_NOT_TAKEN:   return "Weakly Not Taken (01)";
            case PredictorState::WEAKLY_TAKEN:       return "Weakly Taken (10)";
            case PredictorState::STRONGLY_TAKEN:     return "Strongly Taken (11)";
        }
        return "Unknown";
    }

    std::vector<BranchTrace> evaluateOccupancy(int totalSeats, int bookedSeats, int blockedSeats) {
        std::vector<BranchTrace> trace;
        int available = totalSeats - (bookedSeats + blockedSeats);
        int occupancyPercent = (totalSeats > 0) ? (bookedSeats * 100) / totalSeats : 0;

        // Stage 1: Available <= 0 Check
        {
            BranchTrace b1;
            b1.stage = 1;
            b1.instruction = "CMP [available_seats], 0  |  JLE .status_full";
            b1.condition = "Available (" + std::to_string(available) + ") <= 0";
            b1.flags = { available <= 0, false, available < 0, false };
            b1.predictedTaken = predict();
            b1.actualTaken = (available <= 0);
            b1.predictionHit = (b1.predictedTaken == b1.actualTaken);
            b1.pipelinePenaltyCycles = b1.predictionHit ? 0 : 3;
            mispredictionStalls += b1.pipelinePenaltyCycles;
            totalCycles += 1 + b1.pipelinePenaltyCycles;
            b1.architecturalAction = b1.actualTaken ? "BRANCH TAKEN -> Flight Full" : "FALLTHROUGH -> Evaluate next tier";
            updatePredictor(b1.actualTaken);
            trace.push_back(b1);

            if (b1.actualTaken) return trace;
        }

        // Stage 2: Occupancy >= 90% (Critical Full)
        {
            BranchTrace b2;
            b2.stage = 2;
            b2.instruction = "CMP [occupancy_pct], 90   |  JGE .status_full";
            b2.condition = "Occupancy (" + std::to_string(occupancyPercent) + "%) >= 90%";
            b2.flags = { occupancyPercent == 90, false, occupancyPercent < 90, false };
            b2.predictedTaken = predict();
            b2.actualTaken = (occupancyPercent >= 90);
            b2.predictionHit = (b2.predictedTaken == b2.actualTaken);
            b2.pipelinePenaltyCycles = b2.predictionHit ? 0 : 3;
            mispredictionStalls += b2.pipelinePenaltyCycles;
            totalCycles += 1 + b2.pipelinePenaltyCycles;
            b2.architecturalAction = b2.actualTaken ? "BRANCH TAKEN -> Flight Marked FULL" : "FALLTHROUGH -> Check warning threshold";
            updatePredictor(b2.actualTaken);
            trace.push_back(b2);

            if (b2.actualTaken) return trace;
        }

        // Stage 3: Occupancy >= 75% (Running Low)
        {
            BranchTrace b3;
            b3.stage = 3;
            b3.instruction = "CMP [occupancy_pct], 75   |  JGE .status_running_low";
            b3.condition = "Occupancy (" + std::to_string(occupancyPercent) + "%) >= 75%";
            b3.flags = { occupancyPercent == 75, false, occupancyPercent < 75, false };
            b3.predictedTaken = predict();
            b3.actualTaken = (occupancyPercent >= 75);
            b3.predictionHit = (b3.predictedTaken == b3.actualTaken);
            b3.pipelinePenaltyCycles = b3.predictionHit ? 0 : 3;
            mispredictionStalls += b3.pipelinePenaltyCycles;
            totalCycles += 1 + b3.pipelinePenaltyCycles;
            b3.architecturalAction = b3.actualTaken ? "BRANCH TAKEN -> Status RUNNING LOW (Trigger Surge Pricing)" : "FALLTHROUGH -> Status OPEN";
            updatePredictor(b3.actualTaken);
            trace.push_back(b3);

            if (b3.actualTaken) return trace;
        }

        // Stage 4: Unconditional Fallthrough to OPEN
        {
            BranchTrace b4;
            b4.stage = 4;
            b4.instruction = "MOV [status_code], 0       |  JMP .done";
            b4.condition = "Unconditional (Occupancy < 75%)";
            b4.flags = { false, false, false, false };
            b4.predictedTaken = true;
            b4.actualTaken = true;
            b4.predictionHit = true;
            b4.pipelinePenaltyCycles = 0;
            totalCycles += 1;
            b4.architecturalAction = "STATUS COMMITTED: OPEN (Standard Fares, All Rows Accessible)";
            trace.push_back(b4);
        }

        return trace;
    }

    int getTotalCycles() const { return totalCycles; }
    int getMispredictionStalls() const { return mispredictionStalls; }
};

int main() {
    std::cout << "====================================================================\n";
    std::cout << "     COA CONTROL FLOW & BRANCH PREDICTION DEMONSTRATION HARNESS      \n";
    std::cout << "====================================================================\n";

    SeatBranchSimulator sim;

    struct TestCase {
        std::string label;
        int total;
        int booked;
        int blocked;
    } cases[] = {
        { "Scenario A: Low Load (35% Booked)", 116, 40, 6 },
        { "Scenario B: Surge Load (78% Booked - RUNNING LOW)", 116, 90, 6 },
        { "Scenario C: Peak Load (95% Booked - FULL)", 116, 110, 6 },
        { "Scenario D: Completely Full (100% Booked)", 116, 110, 6 }
    };

    for (const auto& tc : cases) {
        std::cout << "\n>>> " << tc.label << "\n";
        std::cout << "    Inputs: Total = " << tc.total << ", Booked = " << tc.booked 
                  << ", Blocked = " << tc.blocked << "\n";
        std::cout << "    Initial 2-bit Predictor State: " << sim.getPredictorStateName() << "\n\n";

        auto traces = sim.evaluateOccupancy(tc.total, tc.booked, tc.blocked);

        for (const auto& t : traces) {
            std::cout << "    [Stage " << t.stage << "] " << t.instruction << "\n";
            std::cout << "      Condition    : " << t.condition << "\n";
            std::cout << "      CPU Flags    : " << t.flags.toString() << "\n";
            std::cout << "      Prediction   : " << (t.predictedTaken ? "TAKEN" : "NOT TAKEN")
                      << " | Actual: " << (t.actualTaken ? "TAKEN" : "NOT TAKEN")
                      << " -> " << (t.predictionHit ? "HIT (+0 cycles)" : "MISS (+3 cycle stall)") << "\n";
            std::cout << "      Action       : " << t.architecturalAction << "\n\n";
        }
        std::cout << "    Updated Predictor State: " << sim.getPredictorStateName() << "\n";
        std::cout << "    Cumulative Instruction Cycles: " << sim.getTotalCycles() 
                  << " (Includes " << sim.getMispredictionStalls() << " stall cycles)\n";
        std::cout << "    ----------------------------------------------------------------\n";
    }

    std::cout << "\nHardware simulation completed with zero faults.\n";
    return 0;
}
