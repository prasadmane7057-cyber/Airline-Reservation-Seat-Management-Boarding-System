; ============================================================
; PNRStringOps.asm
; ------------------------------------------------------------
; COA Lab - Practical 6: string handling in 64-bit Assembly
; Airline Reservation, Seat Management & Boarding System
; Author: Vaishnavi
; ------------------------------------------------------------
; Project role (from the COA to-do list): "creates and checks PNR
; (booking) codes, and searches passenger names in the manifest."
;
; A menu-driven program (all input typed by the user):
;   1. Create PNR   - builds a code like PNR1001 from a booking
;                     number (string copy + number-to-digits).
;   2. Validate PNR - checks a typed code: not empty, exactly 7
;                     characters, starts with PNR, last 4 are
;                     digits, number is not 0000. Lowercase input
;                     is accepted (converted to uppercase first).
;   3. Search name  - finds every manifest name that CONTAINS the
;                     typed text, ignoring upper/lower case, and
;                     marks exact matches.
;   4. Exit
;
; PNR FORMAT (matches the rest of the project, e.g. PNR1001):
;   "PNR" + 4 digits, booking number 0001-9999.
;
; THE STRING ROUTINES (each is a small subroutine written from
; scratch with byte loads/stores - no library calls):
;   str_length   - counts bytes up to the 0 terminator
;   str_copy     - copies bytes including the terminator
;   to_upper     - converts 'a'-'z' to 'A'-'Z' by subtracting 32
;   str_equal    - compares two strings byte by byte
;   str_find     - naive substring search (returns index or -1)
;   parse_decimal- text -> number, rejecting anything non-numeric
;   read_line    - buffered line reader (works for both typing
;                  at a terminal and piped input)
;
; Register convention: arguments in RDI / RSI, result in RAX.
; Every routine preserves all other registers, so the main
; program can keep loop counters in R12/R13 across calls.
; ------------------------------------------------------------
; Assemble & run (Linux, NASM):
;   nasm -f elf64 PNRStringOps.asm -o PNRStringOps.o
;   ld PNRStringOps.o -o PNRStringOps
;   ./PNRStringOps
; ============================================================

MANIFEST_COUNT  equ 8
LINE_MAX        equ 128

section .data
    banner      db "===== PNR & Passenger Name String Tool =====", 10, 0
    menuText    db 10, "1. Create PNR code", 10
                db "2. Validate PNR code", 10
                db "3. Search passenger in manifest", 10
                db "4. Exit", 10
                db "Choice: ", 0

    promptBook  db "Enter booking number (1-9999): ", 0
    promptPNR   db "Enter PNR code to check: ", 0
    promptName  db "Enter name (or part of a name) to search: ", 0

    msgCreated  db "Generated PNR: ", 0
    msgValid    db "VALID PNR: ", 0
    msgBadChoice db "Invalid choice - enter 1, 2, 3 or 4.", 10, 0
    msgBadNum   db "Invalid booking number - enter a whole number from 1 to 9999.", 10, 0

    msgEmpty    db "INVALID: the code is empty.", 10, 0
    msgBadLen   db "INVALID: a PNR must be exactly 7 characters (PNR + 4 digits).", 10, 0
    msgBadPre   db "INVALID: a PNR must start with PNR.", 10, 0
    msgBadDig   db "INVALID: the last 4 characters must all be digits.", 10, 0
    msgZero     db "INVALID: the number part cannot be 0000.", 10, 0

    msgEmptyName db "Empty name - nothing to search for.", 10, 0
    msgNone     db "No passenger found.", 10, 0
    msgMatches  db "Matches found:", 10, 0
    msgOpen     db "  [", 0
    msgClose    db "] ", 0
    msgExact    db "  (exact match)", 0
    msgBye      db "Goodbye.", 10, 0

    pnrPrefix   db "PNR", 0
    zeroDigits  db "0000", 0
    newline     db 10

    ; ---- the passenger manifest (names the search runs over) ----
    name1 db "Riya Sharma", 0
    name2 db "Aman Verma", 0
    name3 db "Neha Patil", 0
    name4 db "Karan Shah", 0
    name5 db "Priya Nair", 0
    name6 db "Om Joshi", 0
    name7 db "Rohan Mehta", 0
    name8 db "Sneha Kulkarni", 0

    manifestTable dq name1, name2, name3, name4, name5, name6, name7, name8

section .bss
    inBuf     resb 256       ; raw bytes read from standard input
    inPos     resq 1         ; next unread position in inBuf
    inLen     resq 1         ; how many valid bytes inBuf holds
    lineBuf   resb 128       ; the line most recently typed
    workBuf   resb 128       ; uppercase working copy of the input
    tempBuf   resb 128       ; uppercase copy of one manifest name
    pnrOut    resb 16        ; a generated PNR
    numBuffer resb 32        ; scratch for print_number

section .text
    global _start

; ============================================================
; MAIN PROGRAM
; ============================================================
_start:
    mov rsi, banner
    call print_string

.menu:
    mov rsi, menuText
    call print_string

    mov rdi, lineBuf
    mov rsi, LINE_MAX
    call read_line
    cmp rax, -1
    je .eof_exit                    ; input ended

    movzx rax, byte [lineBuf]       ; first typed character is the choice
    cmp al, '1'
    je .do_create
    cmp al, '2'
    je .do_validate
    cmp al, '3'
    je .do_search
    cmp al, '4'
    je .exit

    mov rsi, msgBadChoice
    call print_string
    jmp .menu

; ------------------------------------------------------------
; OPTION 1: create a PNR from a booking number
; ------------------------------------------------------------
.do_create:
    mov rsi, promptBook
    call print_string
    mov rdi, lineBuf
    mov rsi, LINE_MAX
    call read_line
    cmp rax, -1
    je .eof_exit

    mov rsi, lineBuf
    call parse_decimal              ; RAX = number, or -1 if not a plain number
    cmp rax, 1
    jl .bad_number
    cmp rax, 9999
    jg .bad_number

    mov rsi, rax                    ; RSI = booking number
    mov rdi, pnrOut                 ; RDI = where to build the code
    call build_pnr

    mov rsi, msgCreated
    call print_string
    mov rsi, pnrOut
    call print_string
    call print_newline
    jmp .menu

.bad_number:
    mov rsi, msgBadNum
    call print_string
    jmp .menu

; ------------------------------------------------------------
; OPTION 2: validate a typed PNR
; ------------------------------------------------------------
.do_validate:
    mov rsi, promptPNR
    call print_string
    mov rdi, lineBuf
    mov rsi, LINE_MAX
    call read_line
    cmp rax, -1
    je .eof_exit

    ; work on an uppercase copy so "pnr1001" is accepted
    mov rdi, workBuf
    mov rsi, lineBuf
    call str_copy
    mov rdi, workBuf
    call to_upper

    mov rdi, workBuf
    call str_length                 ; RAX = length
    cmp rax, 0
    je .v_empty
    cmp rax, 7
    jne .v_badlen

    cmp byte [workBuf],   'P'
    jne .v_badpre
    cmp byte [workBuf+1], 'N'
    jne .v_badpre
    cmp byte [workBuf+2], 'R'
    jne .v_badpre

    mov rcx, 3                      ; check characters 3..6 are digits
.v_digit_loop:
    movzx rax, byte [workBuf + rcx]
    cmp al, '0'
    jl .v_baddig
    cmp al, '9'
    jg .v_baddig
    inc rcx
    cmp rcx, 7
    jl .v_digit_loop

    mov rdi, workBuf + 3            ; the four digit characters
    mov rsi, zeroDigits
    call str_equal
    cmp rax, 1
    je .v_zero

    mov rsi, msgValid
    call print_string
    mov rsi, workBuf
    call print_string
    call print_newline
    jmp .menu

.v_empty:
    mov rsi, msgEmpty
    jmp .v_report
.v_badlen:
    mov rsi, msgBadLen
    jmp .v_report
.v_badpre:
    mov rsi, msgBadPre
    jmp .v_report
.v_baddig:
    mov rsi, msgBadDig
    jmp .v_report
.v_zero:
    mov rsi, msgZero
.v_report:
    call print_string
    jmp .menu

; ------------------------------------------------------------
; OPTION 3: search the manifest for a name (or part of one)
; ------------------------------------------------------------
.do_search:
    mov rsi, promptName
    call print_string
    mov rdi, lineBuf
    mov rsi, LINE_MAX
    call read_line
    cmp rax, -1
    je .eof_exit
    cmp rax, 0
    je .s_empty

    mov rdi, workBuf                ; uppercase copy of the query
    mov rsi, lineBuf
    call str_copy
    mov rdi, workBuf
    call to_upper

    xor r12, r12                    ; r12 = index into the manifest
    xor r13, r13                    ; r13 = number of matches

.s_loop:
    cmp r12, MANIFEST_COUNT
    jge .s_done

    mov rsi, [manifestTable + r12*8]   ; uppercase copy of this name
    mov rdi, tempBuf
    call str_copy
    mov rdi, tempBuf
    call to_upper

    mov rdi, tempBuf                ; haystack = the name
    mov rsi, workBuf                ; needle   = what the user typed
    call str_find
    cmp rax, -1
    je .s_next

    inc r13
    cmp r13, 1
    jne .s_print
    mov rsi, msgMatches             ; print the heading before the first hit
    call print_string

.s_print:
    mov rsi, msgOpen
    call print_string
    lea rax, [r12 + 1]              ; show position 1-based
    call print_number
    mov rsi, msgClose
    call print_string
    mov rsi, [manifestTable + r12*8]
    call print_string

    mov rdi, tempBuf                ; exact match = same text, same length
    mov rsi, workBuf
    call str_equal
    cmp rax, 1
    jne .s_endline
    mov rsi, msgExact
    call print_string
.s_endline:
    call print_newline

.s_next:
    inc r12
    jmp .s_loop

.s_done:
    cmp r13, 0
    jne .menu
    mov rsi, msgNone
    call print_string
    jmp .menu

.s_empty:
    mov rsi, msgEmptyName
    call print_string
    jmp .menu

.eof_exit:
    call print_newline
.exit:
    mov rsi, msgBye
    call print_string
    mov rax, 60                     ; syscall: exit
    xor rdi, rdi
    syscall


; ============================================================
; build_pnr: builds "PNR" + 4 zero-padded digits.
;   RDI = destination buffer (at least 8 bytes)
;   RSI = booking number (1-9999)
; Example: 7 -> "PNR0007"
; ============================================================
build_pnr:
    push rax
    push rbx
    push rcx
    push rdx
    push rsi
    push rdi

    mov rax, rsi                    ; keep the number in RAX
    mov rsi, pnrPrefix              ; copy "PNR" into the buffer
    call str_copy

    mov rbx, 10
    mov rcx, 6                      ; fill digits from the right: index 6,5,4,3
.digit_loop:
    xor rdx, rdx
    div rbx                         ; RAX = RAX / 10, RDX = last digit
    add dl, '0'
    mov [rdi + rcx], dl
    dec rcx
    cmp rcx, 3
    jge .digit_loop
    mov byte [rdi + 7], 0           ; terminator

    pop rdi
    pop rsi
    pop rdx
    pop rcx
    pop rbx
    pop rax
    ret


; ============================================================
; STRING ROUTINES
; ============================================================

; str_length: RDI = string  ->  RAX = number of characters
str_length:
    push rdi
    xor rax, rax
.loop:
    cmp byte [rdi + rax], 0
    je .done
    inc rax
    jmp .loop
.done:
    pop rdi
    ret

; str_copy: RDI = destination, RSI = source (copies the 0 too)
str_copy:
    push rax
    push rsi
    push rdi
.loop:
    mov al, [rsi]
    mov [rdi], al
    inc rsi
    inc rdi
    test al, al
    jnz .loop
    pop rdi
    pop rsi
    pop rax
    ret

; to_upper: RDI = string, converted in place ('a'-'z' -> 'A'-'Z')
to_upper:
    push rax
    push rdi
.loop:
    mov al, [rdi]
    test al, al
    jz .done
    cmp al, 'a'
    jl .next
    cmp al, 'z'
    jg .next
    sub al, 32                      ; lowercase and uppercase letters differ by 32
    mov [rdi], al
.next:
    inc rdi
    jmp .loop
.done:
    pop rdi
    pop rax
    ret

; str_equal: RDI, RSI = two strings  ->  RAX = 1 if identical, else 0
str_equal:
    push rbx
    push rcx
    xor rcx, rcx
.loop:
    movzx rax, byte [rdi + rcx]
    movzx rbx, byte [rsi + rcx]
    cmp rax, rbx
    jne .different
    test rax, rax
    jz .same                        ; both ended together -> identical
    inc rcx
    jmp .loop
.same:
    mov rax, 1
    jmp .out
.different:
    xor rax, rax
.out:
    pop rcx
    pop rbx
    ret

; str_find: RDI = haystack, RSI = needle
;   -> RAX = index where needle first appears, or -1 if absent.
; Tries every starting position in the haystack and compares the
; needle against it one character at a time.
str_find:
    push rbx
    push rcx
    push rdx
    push r8
    push r9

    mov r8, rdi
    mov r9, rsi
    xor rax, rax
    cmp byte [r9], 0
    je .out                         ; empty needle matches at position 0

    xor rcx, rcx                    ; rcx = starting position in haystack
.outer:
    cmp byte [r8 + rcx], 0
    je .not_found                   ; ran out of haystack
    lea rbx, [r8 + rcx]             ; rbx = haystack address of this starting position
    xor rdx, rdx                    ; rdx = position inside the needle
.inner:
    mov al, [r9 + rdx]
    test al, al
    je .found                       ; reached the needle's end -> every character matched
    cmp al, [rbx + rdx]
    jne .advance
    inc rdx
    jmp .inner
.advance:
    inc rcx
    jmp .outer
.found:
    mov rax, rcx
    jmp .out
.not_found:
    mov rax, -1
.out:
    pop r9
    pop r8
    pop rdx
    pop rcx
    pop rbx
    ret

; parse_decimal: RSI = string  ->  RAX = value, or -1 if the text is
; empty, contains a non-digit, or is longer than 9 digits.
parse_decimal:
    push rbx
    push rcx
    push rsi
    xor rax, rax
    xor rcx, rcx                    ; digits seen so far
    cmp byte [rsi], 0
    je .bad
.loop:
    movzx rbx, byte [rsi]
    test rbx, rbx
    jz .out
    cmp rbx, '0'
    jl .bad
    cmp rbx, '9'
    jg .bad
    cmp rcx, 9
    jge .bad
    imul rax, rax, 10
    sub rbx, '0'
    add rax, rbx
    inc rcx
    inc rsi
    jmp .loop
.bad:
    mov rax, -1
.out:
    pop rsi
    pop rcx
    pop rbx
    ret


; ============================================================
; INPUT / OUTPUT
; ============================================================

; read_line: reads one line from standard input.
;   RDI = destination buffer, RSI = buffer size
;   -> RAX = number of characters stored (newline removed),
;      or -1 if the input has ended and nothing was read.
; Bytes are taken from a small buffer that is refilled with the
; read system call only when empty, so two lines arriving in one
; read() (as happens with piped input) are still handled one at a
; time. Characters beyond the buffer size are dropped.
read_line:
    push rbx
    push rcx
    push rdx
    push r8
    push r9
    push r11

    xor r8, r8                      ; characters stored
    mov r9, rsi
    dec r9                          ; leave room for the terminator
    xor rbx, rbx                    ; 1 once any byte has been consumed

.next_byte:
    mov rax, [inPos]
    cmp rax, [inLen]
    jl .have_byte

    push rdi                        ; buffer empty -> refill it
    push rsi
    mov rax, 0                      ; syscall: read
    mov rdi, 0                      ; fd 0 = standard input
    mov rsi, inBuf
    mov rdx, 256
    syscall
    pop rsi
    pop rdi
    cmp rax, 0
    jle .end_of_input
    mov [inLen], rax
    mov qword [inPos], 0

.have_byte:
    mov rax, [inPos]
    movzx rcx, byte [inBuf + rax]
    inc rax
    mov [inPos], rax
    mov rbx, 1
    cmp rcx, 10
    je .line_done                   ; newline ends the line
    cmp rcx, 13
    je .next_byte                   ; ignore carriage returns
    cmp r8, r9
    jge .next_byte                  ; line too long: drop the extra character
    mov [rdi + r8], cl
    inc r8
    jmp .next_byte

.end_of_input:
    test rbx, rbx
    jnz .line_done                  ; last line had no newline - still return it
    mov byte [rdi], 0
    mov rax, -1
    jmp .out

.line_done:
    mov byte [rdi + r8], 0
    mov rax, r8

.out:
    pop r11
    pop r9
    pop r8
    pop rdx
    pop rcx
    pop rbx
    ret

; print_string: RSI = null-terminated string
print_string:
    push rax
    push rdi
    push rdx
    push rsi
    push rcx
    push r11

    mov rdi, rsi
    call str_length
    mov rdx, rax                    ; length
    mov rax, 1                      ; syscall: write
    mov rdi, 1                      ; fd 1 = standard output
    syscall

    pop r11
    pop rcx
    pop rsi
    pop rdx
    pop rdi
    pop rax
    ret

; print_number: prints the unsigned number in RAX
print_number:
    push rax
    push rbx
    push rcx
    push rdx
    push rsi
    push rdi
    push r11

    mov rdi, numBuffer
    add rdi, 31
    mov byte [rdi], 0
    xor rcx, rcx

    test rax, rax
    jnz .convert
    dec rdi
    mov byte [rdi], '0'
    inc rcx
    jmp .emit

.convert:
    test rax, rax
    jz .emit
    mov rbx, 10
    xor rdx, rdx
    div rbx
    add dl, '0'
    dec rdi
    mov [rdi], dl
    inc rcx
    jmp .convert

.emit:
    mov rsi, rdi
    mov rdx, rcx
    mov rax, 1
    mov rdi, 1
    syscall

    pop r11
    pop rdi
    pop rsi
    pop rdx
    pop rcx
    pop rbx
    pop rax
    ret

; print_newline: prints one line-feed
print_newline:
    push rax
    push rdi
    push rsi
    push rdx
    push rcx
    push r11

    mov rax, 1
    mov rdi, 1
    mov rsi, newline
    mov rdx, 1
    syscall

    pop r11
    pop rcx
    pop rdx
    pop rsi
    pop rdi
    pop rax
    ret
