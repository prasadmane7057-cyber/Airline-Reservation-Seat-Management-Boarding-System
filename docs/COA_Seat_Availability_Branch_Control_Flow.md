# COA Specification: Seat-Availability Conditional Branching & Control Flow

## Overview
This specification details the machine-level control-flow architecture implemented in the Airline Management System for real-time seat availability classification and dynamic fare escalation. It maps high-level business rules to x86-64 conditional jump instructions, ALU status flags (`EFLAGS`), pipeline execution cycles, and dynamic branch prediction.

---

## 1. High-Level Seat Availability Logic
The system evaluates aircraft cabin occupancy through three threshold tiers:

$$\text{AvailableSeats} = \text{TotalSeats} - (\text{BookedSeats} + \text{BlockedSeats})$$

$$\text{OccupancyPercentage} = \left\lfloor \frac{\text{BookedSeats} \times 100}{\text{TotalSeats}} \right\rfloor$$

```
               +---------------------------+
               |  Start: Calculate Status  |
               +---------------------------+
                             |
             [Available <= 0 || Occupancy >= 90%]
                   /                       \
                YES                         NO
                /                             \
     +-------------------+         [Occupancy >= 75%]
     |   Status: FULL    |               /         \
     | (Booking Locked)  |             YES          NO
     +-------------------+             /             \
                        +----------------------+  +---------------------+
                        | Status: RUNNING LOW  |  |    Status: OPEN     |
                        | (Surge Multiplier)   |  | (Standard Booking)  |
                        +----------------------+  +---------------------+
```

---

## 2. Assembly Instruction Mapping & Flag State Machine

| Stage | Operation | Assembly Instruction | Primary CPU Component | Flags Updated | Branch Condition | Action |
|:-----:|:----------|:---------------------|:----------------------|:--------------|:-----------------|:-------|
| **01** | Check Zero Availability | `CMP [available], 0` | ALU Subtractor & Comparator | `ZF`, `SF`, `OF` | `JLE .status_full` | Jump if $Z=1$ or $S \neq O$ |
| **02** | Check Critical Occupancy | `CMP [occupancy], 90` | ALU Comparator | `ZF`, `SF`, `CF` | `JGE .status_full` | Jump if $S = O$ (Greater/Equal) |
| **03** | Check Warning Threshold | `CMP [occupancy], 75` | ALU Comparator | `ZF`, `SF`, `CF` | `JGE .status_low` | Jump if $S = O$ (Surge Trigger) |
| **04** | Default Fallthrough | `MOV [status], 0` | Bus Interface / Latch | None | `JMP .done` | Unconditional Jump |
| **05** | Bitmask Seat Query | `BT [seat_mask], RCX` | Bit-Test Logic Unit | `CF` | `JC .seat_booked` | Test specific seat bit into Carry |

---

## 3. Branch Prediction Mechanics in Superscalar Pipelines

In modern superscalar processors (e.g., Intel Core / AMD Zen), instructions are prefetched and pipelined across multiple stages:
1. **Instruction Fetch (IF)**
2. **Instruction Decode (ID)**
3. **Rename / Dispatch**
4. **Execute (EX - ALU)**
5. **Memory Access (MEM)**
6. **Writeback (WB)**

When a conditional branch is fetched, the actual result of the condition is unknown until the **Execute** stage completes.

### Dynamic 2-Bit Saturating Counter
To avoid stalling the pipeline on every branch, the processor employs a 2-bit branch history table:

```
               Taken (T)                   Taken (T)
       +-----------------------+   +-----------------------+
       |                       |   |                       |
       v                       |   v                       |
  [ 00: Strongly ] --------> [ 01: Weakly ] --------> [ 10: Weakly ] --------> [ 11: Strongly ]
  [  Not Taken   ] <-------- [  Not Taken ] <-------- [   Taken    ] <-------- [   Taken    ]
                       ^                       |   ^                       |
                       |                       |   |                       |
                       +-----------------------+   +-----------------------+
                             Not Taken (NT)              Not Taken (NT)
```

* **Prediction Hit**: 0 penalty cycles (instructions executed speculatively without interruption).
* **Prediction Miss**: 3 to 15 clock cycles penalty (pipeline flush of speculative instructions, register rollback, and fetch redirection to the correct branch target).

---

## 4. Verification Harness
- **NASM Source**: `coa-nasm/seat_availability_branches.asm`
- **Simulation Runner**: `coa-nasm/SeatControlFlowDemo.cpp`
- **Interactive UI**: Demonstrated live in Dashboard Tab 4 (COA).
