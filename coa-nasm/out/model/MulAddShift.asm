; ============================================================
; MulAddShift.asm
; ------------------------------------------------------------
; COA Lab - Review 4, CO3 (processor-level arithmetic)
; Airline Reservation, Seat Management & Boarding System
; Author: Vaishnavi
; ------------------------------------------------------------
; Multiplies two 64-bit numbers using the ADD-AND-SHIFT method -
; the way a processor's ALU actually performs multiplication at
; the hardware level (bit by bit), instead of using the "mul"
; instruction as a black box the way FareCalc.asm did.
;
; Framed for this project as: fare x number of passengers
; (e.g. a group booking where one fare must be multiplied by a
; passenger count).
;
; THE ALGORITHM (binary long multiplication, done with shifts):
;   result = 0
;   while multiplier != 0:
;       if (multiplier & 1) == 1:       ; look at the lowest bit
;           result = result + multiplicand
;       multiplicand = multiplicand << 1   ; shift left for the next bit's place value
;       multiplier   = multiplier   >> 1   ; move to the next bit
;
; This is exactly long multiplication in binary: for every '1'
; bit in the multiplier, you add the (shifted) multiplicand at
; that bit's position - exactly like adding a shifted row of
; digits in grade-school long multiplication, just in base 2.
;
; Takes BOTH numbers as user input (typed at the terminal) and
; prints the computed product.
; ------------------------------------------------------------
; Assemble & run (Linux, NASM):
;   nasm -f elf64 MulAddShift.asm -o MulAddShift.o
;   ld MulAddShift.o -o MulAddShift
;   ./MulAddShift
; ============================================================

section .data
    promptA   db "Enter first number  (multiplicand): ", 0
    promptB   db "Enter second number (multiplier)  : ", 0
    resultMsg db "Product (computed via Add-and-Shift) = ", 0
    newline   db 10

section .bss
    inputBuffer   resb 32      ; raw text typed by the user
    numBuffer     resb 32      ; scratch space for building the printed digits
    multiplicand  resq 1
    multiplier    resq 1
    result        resq 1

section .text
    global _start

_start:

    ; ------------------------------------------------------
    ; STEP 1: read both numbers from the user.
    ; ------------------------------------------------------
    mov rsi, promptA
    call print_string
    call read_number
    mov [multiplicand], rax

    mov rsi, promptB
    call print_string
    call read_number
    mov [multiplier], rax

    ; ------------------------------------------------------
    ; STEP 2: multiply using add-and-shift.
    ;   RAX holds the multiplicand (gets shifted LEFT each loop)
    ;   RBX holds the multiplier   (gets shifted RIGHT each loop,
    ;                                and its lowest bit is tested)
    ; ------------------------------------------------------
    mov qword [result], 0
    mov rax, [multiplicand]
    mov rbx, [multiplier]

.mul_loop:
    cmp rbx, 0
    je .mul_done                 ; multiplier is now 0 -> every bit has been processed

    test rbx, 1                  ; check the lowest bit of the multiplier
    jz .skip_add                 ; bit is 0 -> this shifted multiplicand contributes nothing

    add [result], rax            ; bit is 1 -> add the (already-shifted) multiplicand

.skip_add:
    shl rax, 1                   ; multiplicand <<= 1  (moves it one binary place to the left)
    shr rbx, 1                   ; multiplier   >>= 1  (moves to the next bit, discarding the one just used)
    jmp .mul_loop

.mul_done:

    ; ------------------------------------------------------
    ; STEP 3: print the result.
    ; ------------------------------------------------------
    mov rsi, resultMsg
    call print_string
    mov rax, [result]
    call print_number
    call print_newline

    mov rax, 60                  ; syscall: exit
    xor rdi, rdi
    syscall


; ============================================================
; read_number: reads one line of digits from standard input and
; returns its value as an unsigned integer in RAX.
;
; Does not handle a '-' sign or non-digit characters beyond the
; terminating newline - the project only ever multiplies positive
; fares/passenger counts, so this keeps the parser simple, the
; same way FareCalc.asm kept its arithmetic simple.
; ============================================================
read_number:
    push rbx
    push rcx
    push rdx
    push rsi
    push rdi

    ; read(fd=0, buf=inputBuffer, count=32)
    mov rax, 0
    mov rdi, 0
    mov rsi, inputBuffer
    mov rdx, 32
    syscall                      ; RAX now holds how many bytes were actually typed

    mov rcx, rax                 ; RCX = number of characters read
    mov rsi, inputBuffer
    xor rax, rax                 ; RAX = running total, starts at 0
    xor rdi, rdi                 ; RDI = index into the buffer

.parse_loop:
    cmp rdi, rcx
    jge .parse_done               ; reached the end of what was typed

    movzx rbx, byte [rsi + rdi]
    cmp rbx, '0'
    jl .parse_done                ; not a digit (e.g. the newline) -> stop here
    cmp rbx, '9'
    jg .parse_done

    imul rax, rax, 10              ; shift the accumulated value one decimal place left
    sub rbx, '0'                    ; convert ASCII character to its numeric value (0-9)
    add rax, rbx

    inc rdi
    jmp .parse_loop

.parse_done:
    pop rdi
    pop rsi
    pop rdx
    pop rcx
    pop rbx
    ret


; ============================================================
; print_string: prints a null-terminated string.
;   Input: RSI = address of the string
; ============================================================
print_string:
    push rax
    push rdi
    push rdx
    push rsi

    mov rdi, rsi
    xor rdx, rdx
.strlen_loop:
    cmp byte [rdi], 0
    je .strlen_done
    inc rdi
    inc rdx
    jmp .strlen_loop
.strlen_done:

    mov rax, 1
    mov rdi, 1
    syscall

    pop rsi
    pop rdx
    pop rdi
    pop rax
    ret


; ============================================================
; print_number: prints the unsigned integer currently in RAX.
; ============================================================
print_number:
    push rax
    push rbx
    push rcx
    push rdx
    push rdi

    mov rdi, numBuffer
    add rdi, 31
    mov byte [rdi], 0
    mov rcx, 0

    cmp rax, 0
    jne .convert_loop
    dec rdi
    mov byte [rdi], '0'
    inc rcx
    jmp .print_digits

.convert_loop:
    cmp rax, 0
    je .print_digits

    mov rbx, 10
    xor rdx, rdx
    div rbx

    add dl, '0'
    dec rdi
    mov [rdi], dl
    inc rcx

    jmp .convert_loop

.print_digits:
    mov rsi, rdi
    mov rdx, rcx
    mov rax, 1
    mov rdi, 1
    syscall

    pop rdi
    pop rdx
    pop rcx
    pop rbx
    pop rax
    ret


; ============================================================
; print_newline: prints a single line-feed character.
; ============================================================
print_newline:
    push rax
    push rdi
    push rsi
    push rdx

    mov rax, 1
    mov rdi, 1
    mov rsi, newline
    mov rdx, 1
    syscall

    pop rdx
    pop rsi
    pop rdi
    pop rax
    ret
