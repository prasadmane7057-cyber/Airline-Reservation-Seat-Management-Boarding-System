; MulSuccessiveAdd.asm | COA Lab | CO3: processor level details of arithmetic operations
; Syllabus link: Practical 5 - multiply two 64-bit hexadecimal numbers using SUCCESSIVE ADDITION.
; Idea: A x B = A + A + A ... (B times).  Result = 0; repeat B times: Result = Result + A.
; Scenario: excess baggage charge = weight x rate.
; Input : two hexadecimal numbers typed by the user (up to 16 hex digits each).
; Output: product in hexadecimal.  If the product does not fit in 64 bits, a message is shown.
; Build : nasm -f elf64 MulSuccessiveAdd.asm -o MulSuccessiveAdd.o && ld MulSuccessiveAdd.o -o MulSuccessiveAdd
; Note  : the loop runs B times, so use a small second number (e.g. 5, A, 64) for a quick run.

section .data
    msg1      db "Enter first number  (hex, e.g. 1F4): ", 0
    msg1_len  equ $ - msg1 - 1
    msg2      db "Enter second number (hex, e.g. A)  : ", 0
    msg2_len  equ $ - msg2 - 1
    msgres    db "Product (hex) = ", 0
    msgres_len equ $ - msgres - 1
    msgbad    db "Invalid hex digit. Use 0-9 and A-F only.", 10, 0
    msgbad_len equ $ - msgbad - 1
    msgovf    db "Overflow: product does not fit in 64 bits.", 10, 0
    msgovf_len equ $ - msgovf - 1
    newline   db 10
    hexchars  db "0123456789ABCDEF"

section .bss
    chbuf     resb 1           ; one typed character
    outbuf    resb 16          ; 16 hex digits of result
    num1      resq 1           ; first number  (multiplicand)
    num2      resq 1           ; second number (multiplier = how many times to add)

section .text
    global _start

; ---- print(rsi = address, rdx = length) ----
print:
    mov rax, 1                 ; sys_write
    mov rdi, 1                 ; stdout
    syscall
    ret

; ---- read_hex: reads one line a character at a time and converts hex text to a number in rax.
;      CF = 1 if the line was empty, too long (> 16 digits) or had a non-hex character.
;      If the input ends (no more data), the program exits.
read_hex:
    xor rbx, rbx               ; rbx = number being built
    xor r8, r8                 ; r8  = digits read so far
    xor r9, r9                 ; r9  = 1 if a bad character was seen
.rd:
    mov rax, 0                 ; sys_read, 1 character
    mov rdi, 0
    mov rsi, chbuf
    mov rdx, 1
    syscall
    cmp rax, 1
    jne .eof                   ; nothing more to read -> quit
    movzx rdx, byte [chbuf]
    cmp dl, 10                 ; Enter key ends the line
    je .end
    cmp dl, 13                 ; ignore carriage return (Windows line ends)
    je .rd
    cmp dl, '0'
    jb .badc
    cmp dl, '9'
    jbe .dig
    and dl, 0xDF               ; small letter -> capital letter
    cmp dl, 'A'
    jb .badc
    cmp dl, 'F'
    ja .badc
    sub dl, 'A' - 10
    jmp .acc
.dig:
    sub dl, '0'
.acc:
    shl rbx, 4                 ; make room for 4 bits
    or  rbx, rdx               ; put the digit in
    inc r8
    jmp .rd
.badc:
    mov r9, 1
    jmp .rd
.end:
    test r9, r9
    jnz .bad
    test r8, r8
    jz .bad                    ; empty line
    cmp r8, 16
    jg .bad                    ; more than 16 digits does not fit in 64 bits
    mov rax, rbx
    clc
    ret
.bad:
    stc
    ret
.eof:
    mov rax, 60                ; sys_exit
    xor rdi, rdi
    syscall

_start:
    ; ---- get first number ----
.ask1:
    mov rsi, msg1
    mov rdx, msg1_len
    call print
    call read_hex
    jnc .ok1
    mov rsi, msgbad
    mov rdx, msgbad_len
    call print
    jmp .ask1
.ok1:
    mov [num1], rax

    ; ---- get second number ----
.ask2:
    mov rsi, msg2
    mov rdx, msg2_len
    call print
    call read_hex
    jnc .ok2
    mov rsi, msgbad
    mov rdx, msgbad_len
    call print
    jmp .ask2
.ok2:
    mov [num2], rax

    ; ---- successive addition ----
    mov rax, [num1]            ; rax = number to add each time
    mov rcx, [num2]            ; rcx = counter (how many times)
    xor rbx, rbx               ; rbx = result = 0
    test rcx, rcx
    jz .show                   ; multiplier 0 -> product is 0
.loop:
    add rbx, rax               ; result = result + number
    jc  .overflow              ; carry out of 64 bits -> product too big
    dec rcx                    ; counter = counter - 1
    jnz .loop                  ; repeat until counter is 0
.show:
    ; ---- convert rbx to 16 hex digits ----
    mov rcx, 16
    mov rdi, outbuf + 15
.conv:
    mov rdx, rbx
    and rdx, 0xF               ; lowest 4 bits
    mov dl, [hexchars + rdx]
    mov [rdi], dl
    dec rdi
    shr rbx, 4
    dec rcx
    jnz .conv

    mov rsi, msgres
    mov rdx, msgres_len
    call print
    mov rsi, outbuf
    mov rdx, 16
    call print
    mov rsi, newline
    mov rdx, 1
    call print
    jmp .exit

.overflow:
    mov rsi, msgovf
    mov rdx, msgovf_len
    call print

.exit:
    mov rax, 60                ; sys_exit
    xor rdi, rdi
    syscall
