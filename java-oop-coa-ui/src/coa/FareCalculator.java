section .data
    base_fare dq 5000
    tax       dq 750
    discount  dq 500

    result    dq 0

section .text
    global _start

_start:

    ; Register mapping:
    ; RAX = Base Fare
    ; RBX = Tax
    ; RCX = Discount
    ; RDX = Final Fare

    mov rax, [base_fare]     ; RAX = 5000
    mov rbx, [tax]           ; RBX = 750
    mov rcx, [discount]      ; RCX = 500

    ; Base Fare + Tax
    add rax, rbx             ; RAX = 5750

    ; Base Fare + Tax - Discount
    sub rax, rcx             ; RAX = 5250

    ; Store final fare
    mov [result], rax

    ; Exit program
    mov rax, 60              ; Linux exit syscall
    xor rdi, rdi             ; exit status = 0
    syscall
