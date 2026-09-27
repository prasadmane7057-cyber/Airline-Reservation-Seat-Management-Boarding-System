default rel

section .data
    fmt_in      db "%llu", 0
    fmt_fare    db "Total Fare (Rs): %llu", 10, 0
    fmt_avail   db "Seats Available: %llu", 10, 0

    prompt1     db "Enter base fare: ", 0
    prompt2     db "Enter passenger count: ", 0
    prompt3     db "Enter tax: ", 0
    prompt4     db "Enter discount: ", 0
    prompt5     db "Enter total seats: ", 0
    prompt6     db "Enter booked seats: ", 0

    fmt_full    db "Status: FLIGHT FULL - waitlist only", 10, 0
    fmt_low     db "Status: SEATS RUNNING LOW", 10, 0
    fmt_open    db "Status: SEATS OPEN", 10, 0

    low_seat_thresh dq 20

section .bss
    base_fare       resq 1
    passenger_count resq 1
    tax             resq 1
    discount        resq 1
    total_seats     resq 1
    booked_seats    resq 1
    seat_avail      resq 1

section .text
    global main
    extern printf
    extern scanf

main:
    ; 32-byte shadow space + alignment
    sub rsp, 40

    ; Input: Base Fare
    lea rcx, [rel prompt1]
    call printf

    lea rcx, [rel fmt_in]
    lea rdx, [rel base_fare]
    call scanf

    ; Input: Passenger Count
    lea rcx, [rel prompt2]
    call printf

    lea rcx, [rel fmt_in]
    lea rdx, [rel passenger_count]
    call scanf

    ; Input: Tax
    lea rcx, [rel prompt3]
    call printf

    lea rcx, [rel fmt_in]
    lea rdx, [rel tax]
    call scanf

    ; Input: Discount
    lea rcx, [rel prompt4]
    call printf

    lea rcx, [rel fmt_in]
    lea rdx, [rel discount]
    call scanf

    ; Input: Total Seats
    lea rcx, [rel prompt5]
    call printf

    lea rcx, [rel fmt_in]
    lea rdx, [rel total_seats]
    call scanf

    ; Input: Booked Seats
    lea rcx, [rel prompt6]
    call printf

    lea rcx, [rel fmt_in]
    lea rdx, [rel booked_seats]
    call scanf

    ; ----------------------------------
    ; Operation 1: Total Fare
    ; (BaseFare * PassengerCount) + Tax - Discount
    ; ----------------------------------

    mov rax, [rel base_fare]
    imul rax, [rel passenger_count]
    add rax, [rel tax]
    sub rax, [rel discount]

    ; Print total fare
    lea rcx, [rel fmt_fare]
    mov rdx, rax
    call printf

    ; ----------------------------------
    ; Operation 2: Seat Availability
    ; TotalSeats - BookedSeats
    ; ----------------------------------

    mov rax, [rel total_seats]
    sub rax, [rel booked_seats]

    mov [rel seat_avail], rax

    ; Print available seats
    lea rcx, [rel fmt_avail]
    mov rdx, rax
    call printf

    ; ----------------------------------
    ; CMP + Conditional Branching
    ; ----------------------------------

    mov rax, [rel seat_avail]

    cmp rax, 0
    jle .flight_full

    cmp rax, [rel low_seat_thresh]
    jle .seats_low

    jmp .seats_open

.flight_full:
    lea rcx, [rel fmt_full]
    call printf
    jmp .done

.seats_low:
    lea rcx, [rel fmt_low]
    call printf
    jmp .done

.seats_open:
    lea rcx, [rel fmt_open]
    call printf

.done:
    xor eax, eax
    add rsp, 40
    ret