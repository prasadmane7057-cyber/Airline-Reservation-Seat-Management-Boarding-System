# Fare Parity and Control-Flow Demonstration

## Shared-input run

Run `coa-nasm/run_fare_parity_demo.ps1` from the repository root, or run the
complete suite with `run_integrated_system.ps1`. The script compiles both
implementations, supplies the same six values, and checks that their fare and
seat-availability outputs match:

| Input | Value |
|---|---:|
| Base fare | Rs. 5,000 |
| Passenger count | 3 |
| Tax | Rs. 900 |
| Discount | Rs. 500 |
| Total seats | 180 |
| Booked seats | 120 |

Expected results: `5000 * 3 + 900 - 500 = Rs. 15,400`; `180 - 120 = 60`
available seats. Both programs use the same low-seat threshold of 20.

## Data path and control signals

1. `MOV` loads the base fare, passenger count, tax, and discount from input
   memory/registers. `MOV` does not update arithmetic condition flags.
2. `IMUL` multiplies the base fare by passenger count into `RAX`. The result
   feeds the ALU's adder input.
3. `ADD RAX, RBX` adds the tax. The control unit selects the ALU add function
   and enables `RAX` writeback.
4. `SUB RAX, RCX` subtracts the discount. The ALU's subtract control is
   asserted, and condition flags describe the result.
5. `SUB` computes available seats. `CMP` performs a subtract-style comparison
   without writing the result; `JLE` selects FULL when availability is zero,
   otherwise a second compare selects LOW (20 or fewer) or OPEN.

The simulator traces equivalent register-level operations; the NASM version
executes the arithmetic and branches. The runner compares machine-visible
results, rather than relying on a visual inspection of the traces.
