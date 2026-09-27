default rel

section .data
    fmt_in          db "%llu", 0
    fmt_fuel        db "Total Fuel Required (L): %llu", 10, 0
    fmt_remain      db "Fuel Remaining (L): %llu", 10, 0
    prompt1         db "Enter distance (km): ", 0
    prompt2         db "Enter fuel rate per km (L): ", 0
    prompt3         db "Enter reserve fuel (L): ", 0
    prompt4         db "Enter tank capacity (L): ", 0
    fmt_critical    db "Status: FUEL CRITICAL - REFUEL IMMEDIATELY", 10, 0
    fmt_low         db "Status: FUEL LOW - MONITOR CLOSELY", 10, 0
    fmt_ok          db "Status: FUEL SUFFICIENT", 10, 0
    safety_margin   dq 500

section .bss
    distance        resq 1
    fuel_rate       resq 1
    reserve_fuel    resq 1
    tank_capacity   resq 1
    total_fuel      resq 1
    fuel_remaining  resq 1

section .text
    global main
    extern printf
    extern scanf

main:
    ; 32-byte shadow space + alignment
    sub rsp, 40

    ; Input: Distance
    lea rcx, [rel prompt1]
    call printf

    lea rcx, [rel fmt_in]
    lea rdx, [rel distance]
    call scanf

    ; Input: Fuel Rate per KM
    lea rcx, [rel prompt2]
    call printf

    lea rcx, [rel fmt_in]
    lea rdx, [rel fuel_rate]
    call scanf

    ; Input: Reserve Fuel
    lea rcx, [rel prompt3]
    call printf

    lea rcx, [rel fmt_in]
    lea rdx, [rel reserve_fuel]
    call scanf

    ; Input: Tank Capacity
    lea rcx, [rel prompt4]
    call printf

    lea rcx, [rel fmt_in]
    lea rdx, [rel tank_capacity]
    call scanf

    ; ----------------------------------
    ; Operation 1: Total Fuel Required
    ; (Distance * FuelRatePerKm) + ReserveFuel
    ; ----------------------------------

    mov rax, [rel distance]
    imul rax, [rel fuel_rate]
    add rax, [rel reserve_fuel]

    mov [rel total_fuel], rax

    ; Print total fuel required
    lea rcx, [rel fmt_fuel]
    mov rdx, rax
    call printf

    ; ----------------------------------
    ; Operation 2: Fuel Remaining
    ; TankCapacity - TotalFuelRequired
    ; ----------------------------------

    mov rax, [rel tank_capacity]
    sub rax, [rel total_fuel]

    mov [rel fuel_remaining], rax

    ; Print fuel remaining
    lea rcx, [rel fmt_remain]
    mov rdx, rax
    call printf

    ; ----------------------------------
    ; CMP + Conditional Branching
    ; ----------------------------------

    mov rax, [rel fuel_remaining]

    cmp rax, 0
    jle .fuel_critical

    cmp rax, [rel safety_margin]
    jle .fuel_low
    jmp .fuel_ok

.fuel_critical:
    lea rcx, [rel fmt_critical]
    call printf
    jmp .done

.fuel_low:
    lea rcx, [rel fmt_low]
    call printf
    jmp .done

.fuel_ok:
    lea rcx, [rel fmt_ok]
    call printf

.done:
    xor eax, eax
    add rsp, 40
    ret