// UndoStack.cpp | PL (Programming Lab) | CO3: Build scenario based applications using stack and queue
// Syllabus link: Practical 6 (Stack), stack implemented using an ARRAY.
// Scenario: passenger selects / cancels seats; UNDO reverses the last action using a stack.
#include <iostream>
using namespace std;

const int MAX_SEATS   = 30;   // seats numbered 1..30
const int STACK_SIZE  = 50;   // maximum actions that can be remembered

// One remembered action: which seat, and what was done to it ('S' = selected, 'C' = cancelled)
struct Action {
    int  seat;
    char type;
};

// ---------- Stack (array implementation) ----------
Action stackArr[STACK_SIZE];
int top = -1;                 // -1 means the stack is empty

bool isEmpty() { return top == -1; }
bool isFull()  { return top == STACK_SIZE - 1; }

void push(Action a) {
    if (isFull()) { cout << "  Stack is full. Cannot remember more actions.\n"; return; }
    stackArr[++top] = a;
}

Action pop() {
    return stackArr[top--];   // caller must check isEmpty() first
}

Action peek() {
    return stackArr[top];
}

// ---------- Seat data ----------
bool booked[MAX_SEATS + 1];   // booked[5] == true means seat 5 is selected

int readNumber(const char* prompt, int low, int high) {
    int n;
    while (true) {
        cout << prompt;
        if (cin >> n && n >= low && n <= high) return n;
        if (cin.eof()) exit(0);
        cin.clear();
        cin.ignore(1000, '\n');
        cout << "  Enter a number from " << low << " to " << high << ".\n";
    }
}

void selectSeat() {
    int s = readNumber("  Seat number to select (1-30): ", 1, MAX_SEATS);
    if (booked[s]) { cout << "  Seat " << s << " is already selected.\n"; return; }
    booked[s] = true;
    push({s, 'S'});
    cout << "  Seat " << s << " selected.\n";
}

void cancelSeat() {
    int s = readNumber("  Seat number to cancel (1-30): ", 1, MAX_SEATS);
    if (!booked[s]) { cout << "  Seat " << s << " is not selected, nothing to cancel.\n"; return; }
    booked[s] = false;
    push({s, 'C'});
    cout << "  Seat " << s << " cancelled.\n";
}

void undo() {
    if (isEmpty()) { cout << "  Nothing to undo.\n"; return; }   // empty-stack case
    Action a = pop();
    if (a.type == 'S') {                // last action was a selection -> unselect it
        booked[a.seat] = false;
        cout << "  Undo: selection of seat " << a.seat << " reversed.\n";
    } else {                            // last action was a cancel -> select it again
        booked[a.seat] = true;
        cout << "  Undo: cancellation of seat " << a.seat << " reversed.\n";
    }
}

void showSeats() {
    cout << "  Selected seats: ";
    bool any = false;
    for (int i = 1; i <= MAX_SEATS; i++)
        if (booked[i]) { cout << i << " "; any = true; }
    if (!any) cout << "none";
    cout << "\n  Actions that can be undone: " << top + 1;
    if (!isEmpty()) cout << "   (last: " << (peek().type == 'S' ? "select" : "cancel")
                         << " seat " << peek().seat << ")";
    cout << "\n";
}

int main() {
    int choice;
    do {
        cout << "\n===== Seat Selection with Undo (Stack) =====\n"
             << "1. Select seat\n2. Cancel seat\n3. Undo last action\n4. Show seats\n0. Exit\n";
        choice = readNumber("Choose: ", 0, 4);
        switch (choice) {
            case 1: selectSeat(); break;
            case 2: cancelSeat(); break;
            case 3: undo();       break;
            case 4: showSeats();  break;
        }
    } while (choice != 0);
    cout << "Bye!\n";
    return 0;
}