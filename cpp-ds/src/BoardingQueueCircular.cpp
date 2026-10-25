/*
 * BoardingQueueCircular.cpp
 * -----------------------------------------------------------
 * Programming Lab (PL) - Review 4, CO3 (stack/queue scenario)
 * Airline Reservation, Seat Management & Boarding System
 * Author: Vaishnavi
 * -----------------------------------------------------------
 * A CIRCULAR QUEUE for the boarding gate. Passengers join by
 * boarding group and are called in strict FIFO order. The
 * "circular" part means the underlying array never shifts its
 * elements - when the front slot empties, that array index is
 * simply reused the next time someone enqueues, instead of the
 * whole array moving left one step (which a plain array-based
 * queue would need to do, and which gets slow for a busy gate).
 *
 * front/rear both wrap around using modulo arithmetic:
 *   rear = (rear + 1) % capacity
 *   front = (front + 1) % capacity
 * -----------------------------------------------------------
 * Build & run:
 *   g++ BoardingQueueCircular.cpp -o BoardingQueueCircular
 *   ./BoardingQueueCircular
 * -----------------------------------------------------------
 */

#include <iostream>
#include <string>
using namespace std;

// ---------------------------------------------------------------
// One passenger waiting to board.
// ---------------------------------------------------------------
struct BoardingPassenger {
    string pnr;
    string name;
    int boardingGroup;
};

// ---------------------------------------------------------------
// The circular queue itself, implemented on a fixed-size array.
// -----------------------------------------------------------
// WHY A COUNT FIELD INSTEAD OF JUST front/rear:
// With only front and rear, "front == rear" is ambiguous - it
// could mean the queue is completely EMPTY or completely FULL
// (after wrapping around). Keeping an explicit count removes that
// ambiguity entirely, at the cost of one extra integer - a simple,
// standard fix for this classic circular-queue pitfall.
// ---------------------------------------------------------------
class BoardingQueueCircular {
private:
    BoardingPassenger* data;
    int capacity;
    int front;   // index of the passenger at the front of the line
    int rear;    // index where the NEXT passenger will be inserted
    int count;   // how many passengers are currently in the queue

public:
    BoardingQueueCircular(int cap) {
        capacity = cap;
        data = new BoardingPassenger[capacity];
        front = 0;
        rear = 0;
        count = 0;
    }

    ~BoardingQueueCircular() {
        delete[] data;
    }

    bool isEmpty() const {
        return count == 0;
    }

    bool isFull() const {
        return count == capacity;
    }

    int size() const {
        return count;
    }

    // -------------------------------------------------------
    // enqueue(): a passenger joins the boarding line at the
    // gate. Rejected if the queue is already full (the physical
    // gate-side holding area has a maximum capacity).
    // -------------------------------------------------------
    bool enqueue(const BoardingPassenger& passenger) {
        if (isFull()) {
            cout << "  [REJECTED] Queue is full - cannot add "
                 << passenger.name << " (PNR " << passenger.pnr << ")\n";
            return false;
        }

        data[rear] = passenger;
        rear = (rear + 1) % capacity;   // wrap around instead of growing the array
        count++;

        cout << "  [ENQUEUED] " << passenger.name
             << " (PNR " << passenger.pnr << ", Group " << passenger.boardingGroup << ")\n";
        return true;
    }

    // -------------------------------------------------------
    // dequeue(): the passenger at the front is called to board
    // and leaves the queue. Returns false (and leaves 'result'
    // untouched) if the queue is empty.
    // -------------------------------------------------------
    bool dequeue(BoardingPassenger& result) {
        if (isEmpty()) {
            cout << "  [REJECTED] Queue is empty - no one to call for boarding.\n";
            return false;
        }

        result = data[front];
        front = (front + 1) % capacity;   // the freed slot will be reused by a future enqueue
        count--;

        cout << "  [BOARDED]  " << result.name
             << " (PNR " << result.pnr << ", Group " << result.boardingGroup << ")\n";
        return true;
    }

    // -------------------------------------------------------
    // peekFront(): look at who's next without removing them.
    // -------------------------------------------------------
    bool peekFront(BoardingPassenger& result) const {
        if (isEmpty()) {
            return false;
        }
        result = data[front];
        return true;
    }

    // -------------------------------------------------------
    // display(): prints every passenger currently in the queue,
    // in boarding order, walking from 'front' and wrapping with
    // modulo exactly like enqueue/dequeue do.
    // -------------------------------------------------------
    void display() const {
        if (isEmpty()) {
            cout << "  Queue is empty.\n";
            return;
        }

        cout << "  Current queue (front -> rear): ";
        int index = front;
        for (int i = 0; i < count; i++) {
            cout << data[index].name << "(G" << data[index].boardingGroup << ")";
            if (i != count - 1) cout << " -> ";
            index = (index + 1) % capacity;
        }
        cout << "\n";
    }
};

// ---------------------------------------------------------------
// Demo: capacity is deliberately small (5) so the wrap-around
// behaviour is actually exercised in this short demo, not just
// theoretically possible.
// ---------------------------------------------------------------
int main() {
    cout << "===== Boarding Gate Circular Queue Demo (capacity = 5) =====\n\n";

    BoardingQueueCircular gate(5);

    cout << "-- Step 1: board the first wave (Group 1, priority) --\n";
    gate.enqueue({"PNR1001", "Riya Sharma",  1});
    gate.enqueue({"PNR1002", "Aman Verma",   1});
    gate.enqueue({"PNR1003", "Neha Patil",   1});
    gate.display();
    cout << "\n";

    cout << "-- Step 2: call 2 passengers to board (dequeue) --\n";
    BoardingPassenger boarded;
    gate.dequeue(boarded);
    gate.dequeue(boarded);
    gate.display();
    cout << "  (front has now moved past index 0 and 1 - those array slots are free again)\n\n";

    cout << "-- Step 3: Group 2 arrives and joins - this is where wrap-around happens --\n";
    gate.enqueue({"PNR1004", "Karan Shah",  2});
    gate.enqueue({"PNR1005", "Priya Nair",  2});
    gate.enqueue({"PNR1006", "Om Joshi",    2});   // this one reuses the slot index 0 vacated in Step 2
    gate.display();
    cout << "  (the queue now holds 4 passengers using array slots that wrap past the end)\n\n";

    cout << "-- Step 4: try to overfill the queue (boundary test) --\n";
    gate.enqueue({"PNR1007", "Extra Passenger", 2});   // queue has room for 1 more (capacity 5, has 4)
    gate.enqueue({"PNR1008", "One Too Many",    2});   // this one should be rejected - queue full
    gate.display();
    cout << "\n";

    cout << "-- Step 5: board everyone remaining, then try to dequeue from empty (boundary test) --\n";
    while (!gate.isEmpty()) {
        gate.dequeue(boarded);
    }
    gate.dequeue(boarded);   // queue is now empty - this should be rejected, not crash
    gate.display();

    return 0;
}
