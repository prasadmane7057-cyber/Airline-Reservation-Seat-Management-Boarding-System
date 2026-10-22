default rel

section .data
    prompt          db "Enter a 64-bit hexadecimal booking number: ", 0
    input_format    db "%llx", 0
    result_format   db "Input: 0x%016llX -> decimal: %s", 10, 0
    bcd_format      db "Packed BCD (hex): %s", 10, 0
    invalid_message db "Invalid hexadecimal input.", 10, 0
    hex_digits      db "0123456789ABCDEF"

section .bss
    input_value     resq 1
    bcd_digits      resb 20
    decimal_text    resb 21
    packed_bcd_hex  resb 21

section .text
    global main
    extern printf
    extern scanf

main:
    ; Reserve shadow space and keep the stack aligned for Windows x64 calls.
    sub rsp, 40

    lea rcx, [rel prompt]
    call printf

    lea rcx, [rel input_format]
    lea rdx, [rel input_value]
    call scanf
    cmp eax, 1
    jne .invalid_input

    ; Repeatedly divide by 10. Each remainder is one unpacked BCD digit.
    mov rax, [rel input_value]
    lea r8, [rel bcd_digits + 20]
    xor r9d, r9d
    mov r10d, 10
.convert_digits:
    xor edx, edx
    div r10
    dec r8
    mov [r8], dl
    inc r9
    test rax, rax
    jnz .convert_digits

    ; Convert the BCD nibbles into printable decimal characters.
    lea r11, [rel decimal_text]
    xor r10d, r10d
.make_decimal:
    cmp r10, r9
    jae .decimal_done
    movzx eax, byte [r8 + r10]
    add al, '0'
    mov [r11 + r10], al
    inc r10
    jmp .make_decimal
.decimal_done:
    mov byte [r11 + r9], 0

    ; Pack adjacent digits into BCD bytes and build their hexadecimal display.
    lea r11, [rel packed_bcd_hex]
    xor r10d, r10d
    test r9b, 1
    jz .pack_pairs

    ; An odd digit count gets a leading zero nibble.
    mov byte [r11], '0'
    inc r11
    movzx eax, byte [r8]
    lea rdx, [rel hex_digits]
    mov al, [rdx + rax]
    mov [r11], al
    inc r11
    mov r10d, 1

.pack_pairs:
    cmp r10, r9
    jae .packed_done
    movzx eax, byte [r8 + r10]
    shl eax, 4
    movzx ecx, byte [r8 + r10 + 1]
    or eax, ecx
    mov [rsp + 32], al

    lea rdx, [rel hex_digits]
    movzx eax, byte [rsp + 32]
    mov ecx, eax
    shr ecx, 4
    mov al, [rdx + rcx]
    mov [r11], al
    inc r11
    movzx eax, byte [rsp + 32]
    and eax, 0Fh
    mov al, [rdx + rax]
    mov [r11], al
    inc r11
    add r10, 2
    jmp .pack_pairs
.packed_done:
    mov byte [r11], 0

    lea rcx, [rel result_format]
    mov rdx, [rel input_value]
    lea r8, [rel decimal_text]
    call printf

    lea rcx, [rel bcd_format]
    lea rdx, [rel packed_bcd_hex]
    call printf

    xor eax, eax
    add rsp, 40
    ret

.invalid_input:
    lea rcx, [rel invalid_message]
    call printf
    mov eax, 1
    add rsp, 40
    ret
