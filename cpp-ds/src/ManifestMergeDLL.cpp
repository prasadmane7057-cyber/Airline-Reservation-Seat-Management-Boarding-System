#include <iostream>
#include <string>
using namespace std;

// Node of Doubly Linked List
struct Node {
    int passengerId;
    string name;
    Node* prev;
    Node* next;

    Node(int id, string n) {
        passengerId = id;
        name = n;
        prev = nullptr;
        next = nullptr;
    }
};

// Insert passenger in sorted order
void insertSorted(Node*& head, int id, string name) {
    Node* newNode = new Node(id, name);

    // Empty list
    if (head == nullptr) {
        head = newNode;
        return;
    }

    // Insert at beginning
    if (id < head->passengerId) {
        newNode->next = head;
        head->prev = newNode;
        head = newNode;
        return;
    }

    // Find correct position
    Node* current = head;

    while (current->next != nullptr &&
           current->next->passengerId < id) {
        current = current->next;
    }

    newNode->next = current->next;
    newNode->prev = current;

    if (current->next != nullptr) {
        current->next->prev = newNode;
    }

    current->next = newNode;
}

// Merge two sorted doubly linked lists
Node* mergeLists(Node* head1, Node* head2) {

    Node dummy(0, "");
    Node* tail = &dummy;

    while (head1 != nullptr && head2 != nullptr) {

        if (head1->passengerId <= head2->passengerId) {
            tail->next = head1;
            head1->prev = tail;
            head1 = head1->next;
        }
        else {
            tail->next = head2;
            head2->prev = tail;
            head2 = head2->next;
        }

        tail = tail->next;
    }

    // Add remaining nodes
    if (head1 != nullptr) {
        tail->next = head1;
        head1->prev = tail;
    }
    else {
        tail->next = head2;

        if (head2 != nullptr)
            head2->prev = tail;
    }

    Node* head = dummy.next;

    // Remove dummy node relationship
    if (head != nullptr)
        head->prev = nullptr;

    return head;
}

// Forward traversal
void displayForward(Node* head) {
    cout << "\nForward Traversal:\n";

    Node* current = head;

    while (current != nullptr) {
        cout << current->passengerId
             << " - " << current->name << endl;

        current = current->next;
    }
}

// Backward traversal
void displayBackward(Node* head) {
    if (head == nullptr)
        return;

    Node* current = head;

    // Go to last node
    while (current->next != nullptr) {
        current = current->next;
    }

    cout << "\nBackward Traversal:\n";

    while (current != nullptr) {
        cout << current->passengerId
             << " - " << current->name << endl;

        current = current->prev;
    }
}

int main() {

    Node* groupA = nullptr;
    Node* groupB = nullptr;

    // Boarding Group A
    insertSorted(groupA, 101, "Prasad");
    insertSorted(groupA, 105, "Rahul");
    insertSorted(groupA, 109, "Amit");

    // Boarding Group B
    insertSorted(groupB, 102, "Vighnesh");
    insertSorted(groupB, 104, "Varad");
    insertSorted(groupB, 110, "Siddhi");

    cout << "Boarding Group A:";
    displayForward(groupA);

    cout << "\nBoarding Group B:";
    displayForward(groupB);

    // Merge both lists
    Node* finalManifest = mergeLists(groupA, groupB);

    cout << "\n===== FINAL MANIFEST =====";

    // Verify forward traversal
    displayForward(finalManifest);

    // Verify backward traversal
    displayBackward(finalManifest);

    return 0;
}
