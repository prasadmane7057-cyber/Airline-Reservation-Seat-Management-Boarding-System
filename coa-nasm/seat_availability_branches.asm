; ==============================================================================
; SEAT AVAILABILITY CONTROL FLOW & BRANCH EVALUATION (x86-64 NASM)
; Subject : Computer Organization and Architecture (COA)
; Purpose : Demonstrates conditional branching, ALU flags (ZF, CF, SF, OF),
;           threshold comparisons, and branch prediction mechanics in CPU pipelines.
; ==============================================================================

global main
extern printf, exit

section .data
    ; Configuration constants
    TOTAL_SEATS         equ 116
    THRESHOLD_FULL      equ 90          ; 90% occupancy threshold
    THRESHOLD_LOW       equ 75          ; 75% occupancy threshold

    ; Sample runtime inputs
    current_booked      dd 88           ; 88 booked out of 116 = 75.8% (RUNNING LOW)
    current_blocked     dd 6            ; 6 emergency exit / maintenance seats

    ; Console string formatting
    fmt_header          db "==================================================", 10
                        db "   COA CONTROL-FLOW & BRANCH EVALUATION HARNESS   ", 10
                        db "==================================================", 10, 0
    fmt_input           db "Total Capacity : %d seats", 10
                        db "Booked Seats   : %d seats", 10
                        db "Blocked Seats  : %d seats", 10, 0
    fmt_avail           db "Available Seats: %d seats", 10
                        db "Occupancy Rate : %d%%", 10, 0
    fmt_eval            db 10, "--- Branch Evaluation Trace ---", 10, 0
    fmt_branch_test1    db "[BRANCH 1] CMP Available, 0", 10, 0
    fmt_branch_test2    db "[BRANCH 2] CMP Occupancy, 90%%", 10, 0
    fmt_branch_test3    db "[BRANCH 3] CMP Occupancy, 75%%", 10, 0
    fmt_status_full     db "-> TARGET TAKEN: [FULL] (ZF=1 / JGE taken) - Booking Closed!", 10, 0
    fmt_status_low      db "-> TARGET TAKEN: [RUNNING LOW] (JGE taken) - Fares Escalate!", 10, 0
    fmt_status_open     db "-> FALLTHROUGH : [OPEN] (All branch conditions false) - Standard Booking", 10, 0
    fmt_seat_query      db 10, "[BRANCH 4] BT (Bit Test) on Seat Register Mask (Seat #%d):", 10, 0
    fmt_seat_booked     db "-> CARRY FLAG (CF=1): Seat is BOOKED / OCCUPIED", 10, 0
    fmt_seat_avail      db "-> CARRY FLAG (CF=0): Seat is AVAILABLE FOR ASSIGNMENT", 10, 0
    fmt_pipeline_info   db 10, "--- Pipeline & Branch Predictor Analysis ---", 10
                        db "Static Prediction: Forward branches predicted NOT TAKEN.", 10
                        db "Dynamic Prediction: 2-bit Saturating Counter state updated.", 10
                        db "Branch Misprediction Penalty: 3 pipeline clock cycles flushed.", 10
                        db "==================================================", 10, 0

    ; 64-bit seat occupancy bitmask: bit 0..63 represents seat allocation status
    seat_bitmask_low    dq 0x0000000000000005   ; seats 0 and 2 are booked (bits 0 and 2 set)

section .bss
    available_seats     resd 1
    occupancy_percent   resd 1
    status_code         resd 1          ; 0 = OPEN, 1 = RUNNING LOW, 2 = FULL

section .text
main:
    push rbp
    mov rbp, rsp
    sub rsp, 48                         ; Align stack for Windows/x86-64 ABI calls

    ; Print header
    lea rcx, [rel fmt_header]
    call printf

    ; Print inputs
    lea rcx, [rel fmt_input]
    mov edx, TOTAL_SEATS
    mov r8d, dword [rel current_booked]
    mov r9d, dword [rel current_blocked]
    call printf

    ; --------------------------------------------------------------------------
    ; 1. Calculate Available Seats: Available = Total - (Booked + Blocked)
    ; --------------------------------------------------------------------------
    mov eax, TOTAL_SEATS
    mov ebx, dword [rel current_booked]
    add ebx, dword [rel current_blocked]
    sub eax, ebx
    mov dword [rel available_seats], eax

    ; --------------------------------------------------------------------------
    ; 2. Calculate Occupancy Percentage: (Booked * 100) / Total
    ; --------------------------------------------------------------------------
    mov eax, dword [rel current_booked]
    imul eax, 100                       ; EAX = Booked * 100
    cdq                                 ; Sign-extend EAX into EDX:EAX
    mov ecx, TOTAL_SEATS
    idiv ecx                            ; EAX = Quotient, EDX = Remainder
    mov dword [rel occupancy_percent], eax

    ; Print calculated occupancy
    lea rcx, [rel fmt_avail]
    mov edx, dword [rel available_seats]
    mov r8d, dword [rel occupancy_percent]
    call printf

    lea rcx, [rel fmt_eval]
    call printf

    ; --------------------------------------------------------------------------
    ; 3. CONTROL FLOW EVALUATION (Conditional Branching & Condition Codes)
    ; --------------------------------------------------------------------------
    
    ; Test Condition 1: Check if Available <= 0
    lea rcx, [rel fmt_branch_test1]
    call printf
    cmp dword [rel available_seats], 0   ; Performs (Available - 0) -> updates ZF, SF
    jle .branch_is_full                 ; If Available <= 0, jump to FULL

    ; Test Condition 2: Check if Occupancy >= 90%
    lea rcx, [rel fmt_branch_test2]
    call printf
    cmp dword [rel occupancy_percent], THRESHOLD_FULL ; Compare with 90
    jge .branch_is_full                 ; If Occupancy >= 90%, jump to FULL

    ; Test Condition 3: Check if Occupancy >= 75%
    lea rcx, [rel fmt_branch_test3]
    call printf
    cmp dword [rel occupancy_percent], THRESHOLD_LOW  ; Compare with 75
    jge .branch_is_running_low          ; If Occupancy >= 75%, jump to RUNNING LOW

    ; --------------------------------------------------------------------------
    ; Fallthrough: Status is OPEN
    ; --------------------------------------------------------------------------
    mov dword [rel status_code], 0
    lea rcx, [rel fmt_status_open]
    call printf
    jmp .branch_end

.branch_is_running_low:
    mov dword [rel status_code], 1
    lea rcx, [rel fmt_status_low]
    call printf
    jmp .branch_end

.branch_is_full:
    mov dword [rel status_code], 2
    lea rcx, [rel fmt_status_full]
    call printf

.branch_end:

    ; --------------------------------------------------------------------------
    ; 4. INDIVIDUAL SEAT BIT TESTING (Hardware Bitmask Query)
    ; --------------------------------------------------------------------------
    ; Test seat index 2 (which is bit 2 of seat_bitmask_low)
    mov edx, 2                          ; Query Seat #2
    lea rcx, [rel fmt_seat_query]
    call printf

    mov rax, qword [rel seat_bitmask_low]
    bt rax, 2                           ; BT (Bit Test): Copies bit 2 into Carry Flag (CF)
    jc .seat_is_booked                  ; If CF=1, branch taken: seat is booked

    lea rcx, [rel fmt_seat_avail]
    call printf
    jmp .seat_query_end

.seat_is_booked:
    lea rcx, [rel fmt_seat_booked]
    call printf

.seat_query_end:

    ; Print pipeline summary
    lea rcx, [rel fmt_pipeline_info]
    call printf

    xor eax, eax
    add rsp, 48
    pop rbp
    ret
