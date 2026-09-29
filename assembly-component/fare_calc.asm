; =============================================================================
; AIRLINE RESERVATION SYSTEM - COA / NASM 64-BIT ASSEMBLY PRACTICAL
; Program: Fare Calculation using 64-bit x86-64 Registers
; Formula: Total Fare = Base Fare + Tax - Discount
;
; Example Calculation:
;   Base Fare  : ₹5000  (Stored in RAX)
;   Tax (18%)  : ₹900   (Stored in RBX)
;   Discount   : ₹500   (Stored in RCX)
;   Total Fare : ₹5400  (Calculated into RAX)
; =============================================================================

global main
extern printf

section .data
    msg_title     db "==================================================", 10
                  db "  AIRLINE FARE CALCULATION - 64-BIT NASM ASSEMBLY", 10
                  db "  Formula: Total Fare = Base Fare + Tax - Discount", 10
                  db "==================================================", 10, 0

    fmt_base      db "Base Fare       : Rs. %lld", 10, 0
    fmt_tax       db "Aviation Tax    : Rs. %lld", 10, 0
    fmt_discount  db "Promo Discount  : Rs. %lld", 10, 0
    fmt_total     db "--------------------------------------------------", 10
                  db "FINAL TOTAL FARE: Rs. %lld", 10
                  db "==================================================", 10, 0

    ; Default Input Values
    base_fare     dq 5000     ; 64-bit integer Base Fare (₹5000)
    tax_amount    dq 900      ; 64-bit integer Tax (₹900)
    discount      dq 500      ; 64-bit integer Discount (₹500)

section .bss
    total_fare    resq 1      ; Reserve 8 bytes (64 bits) for Total Fare

section .text
main:
    ; Function Prologue (align stack to 16-byte boundary for C runtime / printf)
    push    rbp
    mov     rbp, rsp
    sub     rsp, 32

    ; 1. Display Program Header
    lea     rdi, [rel msg_title]
    xor     eax, eax
    call    printf

    ; 2. Load and Display Base Fare
    mov     rsi, [rel base_fare]
    lea     rdi, [rel fmt_base]
    xor     eax, eax
    call    printf

    ; 3. Load and Display Aviation Tax
    mov     rsi, [rel tax_amount]
    lea     rdi, [rel fmt_tax]
    xor     eax, eax
    call    printf

    ; 4. Load and Display Promotional Discount
    mov     rsi, [rel discount]
    lea     rdi, [rel fmt_discount]
    xor     eax, eax
    call    printf

    ; 5. Perform Register Arithmetic Calculation
    ; -------------------------------------------------------------
    mov     rax, [rel base_fare]    ; RAX = 5000 (Base Fare)
    mov     rbx, [rel tax_amount]   ; RBX = 900  (Tax)
    mov     rcx, [rel discount]     ; RCX = 500  (Discount)

    add     rax, rbx                ; RAX = RAX + RBX (5000 + 900 = 5900)
    sub     rax, rcx                ; RAX = RAX - RCX (5900 - 500 = 5400)

    mov     [rel total_fare], rax   ; Store final result into memory
    ; -------------------------------------------------------------

    ; 6. Display Calculated Total Fare
    mov     rsi, [rel total_fare]
    lea     rdi, [rel fmt_total]
    xor     eax, eax
    call    printf

    ; Function Epilogue
    mov     eax, 0                  ; Return code 0 (Success)
    add     rsp, 32
    pop     rbp
    ret
