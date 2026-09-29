//Task: Merge two sorted boarding-group manifests (Doubly
//       Linked Lists) into ONE final sorted manifest,
//        ordered by seat number.
#include <iostream>
#include <string>
#include <limits>   // for cin.ignore()
#include <cctype>   // for isdigit(), toupper()
using namespace std;


struct Node {
    string pnr;
    string passengerName;
    string seatNumber;
    string flightNumber;
    string bookingClass;
    string status;
    string groupName;
    Node* prev;
    Node* next;
};
//whenver user enters passenger details the program needs to create new node to store it 
Node* createNode(string pnr, string passengerName, string seatNumber,
                  string flightNumber, string bookingClass, string status,
                  string groupName) {
    Node* newNode = new Node();
    newNode->pnr = pnr;
    newNode->passengerName = passengerName;
    newNode->seatNumber = seatNumber;
    newNode->flightNumber = flightNumber;
    newNode->bookingClass = bookingClass;
    newNode->status = status;
    newNode->groupName = groupName;
    newNode->prev = nullptr;//initialize the pointer 
    newNode->next = nullptr;//initialize the pointer
    return newNode;
}
//comparing two seats to arrange neatly 
bool seatComesBefore(const string& seatA, const string& seatB) {
    int i = 0;
    while (i < seatA.size() && isdigit(seatA[i])) i++;//finds where the digit ends
    int rowA = stoi(seatA.substr(0, i));//it is used to extract portion of string and stoi converts string into number
    char colA = toupper(seatA[i]);//extract column letter
//same process for group B
    int j = 0;
    while (j < seatB.size() && isdigit(seatB[j])) j++;
    int rowB = stoi(seatB.substr(0, j));
    char colB = toupper(seatB[j]);

    if (rowA != rowB) return rowA < rowB;
    return colA < colB;
}
//This function inserts a new node into a doubly linked list at the correct position according to its seat number.
void insertSorted(Node*& head, Node*& tail, Node* newNode) {
    if (head == nullptr) {  //case 1 if list is empty                     
        head = newNode;
        tail = newNode;
        return;
    }

    if (seatComesBefore(newNode->seatNumber, head->seatNumber)) {
        // case 2 goes before the current head
        newNode->next = head;
        head->prev = newNode;//makes sure that head is pointing backward as well
        head = newNode;//updates the head pointer to point to newnode
        return;
    }

    // case 3 : Finds the correct position
    Node* temp = head;
    //moves through the list until we find correct position
    while (temp->next != nullptr && !seatComesBefore(newNode->seatNumber, temp->next->seatNumber)) {
        temp = temp->next;
    }

    newNode->next = temp->next;
    newNode->prev = temp;
    if (temp->next != nullptr) {//if inserted at middle 
        temp->next->prev = newNode;//makes the previous pointer point back to the added new node
    } else {
        tail = newNode;   // inserted at the end
    }
    temp->next = newNode;//This makes the previous node point forward to the new node.
}
//this function takes passenger details from the user, validates the seat number format,
// and creates a new passenger node.
Node* readPassengerFromInput(const string& groupName) {
    string pnr, passengerName, seatNumber, flightNumber, bookingClass, status;

    cout << "  PNR (e.g. PNR1001): ";
    getline(cin, pnr);

    cout << "  Passenger Name: ";
    getline(cin, passengerName);

    // validate seat number: must be digits followed by one letter (e.g. 12C)
    while (true) {
        cout << "  Seat Number (e.g. 12C): ";
        getline(cin, seatNumber);

        int k = 0;//used as index to check each character of the seat number.
        while (k < seatNumber.size() && isdigit(seatNumber[k])) k++;
        bool validFormat = (k > 0) && (k == seatNumber.size() - 1) &&
                            isalpha(seatNumber[k]);
        if (validFormat) break;
        cout << "  Invalid format. Please enter like 1A, 12C, etc.\n";
    }

    cout << "  Flight Number (e.g. AI202): ";
    getline(cin, flightNumber);

    cout << "  Booking Class (Economy / Business / FirstClass): ";
    getline(cin, bookingClass);

    cout << "  Status (Confirmed / Waitlisted / Cancelled / Boarded): ";
    getline(cin, status);

    return createNode(pnr, passengerName, seatNumber, flightNumber,
                       bookingClass, status, groupName);
}
//This function takes the number of passengers in a group, collects each passenger's details, 
//and inserts every passenger into a doubly linked list in sorted order according to their seat number.
void buildGroupFromInput(Node*& head, Node*& tail, const string& groupName) {
    int count = 0;//initialize the passenger count

    while (true) {
        cout << "\nHow many passengers in Group " << groupName << "? ";
        cin >> count;

        if (cin.fail() || count < 0) {
            cin.clear();//incase of invalid input removes the error
            cin.ignore(numeric_limits<streamsize>::max(), '\n');//used to remove the input from input buffer
            cout << "Please enter a valid non-negative number.\n";
            continue;
        }
        cin.ignore(numeric_limits<streamsize>::max(), '\n');   // clear leftover newline after valid input 
        break;
    }
//loops through all passengers in a group 
    for (int i = 1; i <= count; i++) {
        cout << "\nGroup " << groupName << " - Passenger " << i << ":\n";
        Node* newNode = readPassengerFromInput(groupName);//Read passenger details and create a node
        insertSorted(head, tail, newNode);//Insert the passenger into the sorted list
    }
}
//this function two already sorted doubly linked lists into one sorted doubly linked list.
Node* mergeManifests(Node* headA, Node* headB) {
    if (headA == nullptr) return headB;
    if (headB == nullptr) return headA;
//pointer creation for merged list
    Node* mergedHead = nullptr;
    Node* mergedTail = nullptr;
//pointers created to traverse through both lists
    Node* a = headA;
    Node* b = headB;

    while (a != nullptr && b != nullptr) {
        Node* chosen;//This pointer stores the address of the node we select from either Group A or Group B.

        if (seatComesBefore(a->seatNumber, b->seatNumber) ||
            a->seatNumber == b->seatNumber) {   // tie -> Group A goes first
            chosen = a;
            a = a->next;//moves the pointer to the next node in Group A.

        } else {
            chosen = b;
            b = b->next;//moves the pointer to the next node in Group B.
        }
//Disconnect the selected node from its old links
        chosen->prev = nullptr;
        chosen->next = nullptr;
//Check whether the merged list is empty
        if (mergedHead == nullptr) {
            mergedHead = chosen;
            mergedTail = chosen;
        } else {
            mergedTail->next = chosen;//Makes the current last node point forward to the selected node.
            chosen->prev = mergedTail;//Makes the selected node point backward to the previous last node.
            mergedTail = chosen;//Updates the tail pointer so it points to the new last node.
        }
    }

   //Handle the remaining nodes
   //as one of the list is already added in the mergerdlist so new we add the second list at the tail of mergerdlist
    Node* remaining = (a != nullptr) ? a : b;//checks which list is not null
    while (remaining != nullptr) {//traversing the remaining nodes
        Node* next = remaining->next;//Stores the address of the next node in a temporary pointer named next.
        remaining->prev = nullptr;
        remaining->next = nullptr;

        mergedTail->next = remaining;
        remaining->prev = mergedTail;
        mergedTail = remaining;

        remaining = next;
    }

    return mergedHead;//returns the pointer to the first node of the merged list
}
//print the column headings of the passenger manifest in a properly aligned table format.
void printHeader() {
    cout.width(10); cout << left << "PNR";
    cout.width(16); cout << left << "Passenger";
    cout.width(8);  cout << left << "Seat";
    cout.width(10); cout << left << "Flight";
    cout.width(12); cout << left << "Class";
    cout.width(12); cout << left << "Status";
    cout.width(8);  cout << left << "Group";
    cout << "\n";
    cout << string(76, '-') << "\n";//Print the separator line
}
//function is used to print the details of one passenger in a single row of the passenger manifest table.
void printRow(Node* n) {
    cout.width(10); cout << left << n->pnr;
    cout.width(16); cout << left << n->passengerName;
    cout.width(8);  cout << left << n->seatNumber;
    cout.width(10); cout << left << n->flightNumber;
    cout.width(12); cout << left << n->bookingClass;
    cout.width(12); cout << left << n->status;
    cout.width(8);  cout << left << n->groupName;
    cout << "\n";
}
//display all the passenger details 
void display(Node* head, const string& title) {
    cout << "\n" << title << " (FORWARD order):\n";
    if (head == nullptr) {
        cout << "(manifest is empty)\n";
        return;
    }
    printHeader();//used to print column headings 
    Node* temp = head;
    while (temp != nullptr) {
        printRow(temp);//prints current passenger details 
        temp = temp->next;
    }
}

//function is used to delete all nodes of a doubly linked list and free the memory occupied by them.

void freeList(Node* head) {
    Node* temp = head;
    while (temp != nullptr) {
        Node* next = temp->next;
        delete temp;
        temp = next;
    }
}

int main() {
    cout << "===== Boarding Manifest Merge (Doubly Linked List) =====\n";
    cout << "Enter passengers for Group A and Group B.\n";
    cout << "Each group will be kept sorted by seat number automatically.\n";

    // ---- Build Group A from user input ----
    Node* headA = nullptr;
    Node* tailA = nullptr;
    buildGroupFromInput(headA, tailA, "A");

    // ---- Build Group B from user input ----
    Node* headB = nullptr;
    Node* tailB = nullptr;
    buildGroupFromInput(headB, tailB, "B");

    display(headA, "Group A (sorted)");
    display(headB, "Group B (sorted)");

    // ---- Merge them ----
    Node* mergedHead = mergeManifests(headA, headB);

    // ---- Display the result both ways ----
    display(mergedHead, "Final Merged Manifest");
    

    // ---- Cleanup ----
    freeList(mergedHead);   // headA/headB nodes are now PART of mergedHead, so one free is enough

    return 0;
}
