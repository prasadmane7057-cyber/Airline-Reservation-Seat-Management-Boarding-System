# 64-bit NASM Assembly Fare Calculation Practical

This component implements register-level airline fare calculation using **x86-64 NASM Assembly**.

## Formula
$$\text{Total Fare} = \text{Base Fare} + \text{Aviation Tax} - \text{Promotional Discount}$$

## Register Allocation Strategy
- `RAX`: Holds Base Fare ($\text{₹}5000$) and accumulates final Total Fare ($\text{₹}5400$).
- `RBX`: Holds Aviation Tax ($\text{₹}900$) added via `ADD RAX, RBX`.
- `RCX`: Holds Promotional Discount ($\text{₹}500$) subtracted via `SUB RAX, RCX`.
- `RDI` / `RSI`: ABI parameter registers passed to C `printf` library function.

---

## How to Assemble and Run

### On Linux / WSL (64-bit ELF):
```bash
# 1. Assemble NASM to 64-bit object file
nasm -f elf64 fare_calc.asm -o fare_calc.o

# 2. Link using GCC
gcc -no-pie fare_calc.o -o fare_calc

# 3. Execute
./fare_calc
```

### On Windows (MSYS2 / MinGW-w64):
```bash
# 1. Assemble NASM to Win64 object file
nasm -f win64 fare_calc.asm -o fare_calc.obj

# 2. Link using GCC
gcc fare_calc.obj -o fare_calc.exe

# 3. Execute
./fare_calc.exe
```

---

## Expected Output
```text
==================================================
  AIRLINE FARE CALCULATION - 64-BIT NASM ASSEMBLY
  Formula: Total Fare = Base Fare + Tax - Discount
==================================================
Base Fare       : Rs. 5000
Aviation Tax    : Rs. 900
Promo Discount  : Rs. 500
--------------------------------------------------
FINAL TOTAL FARE: Rs. 5400
==================================================
```
