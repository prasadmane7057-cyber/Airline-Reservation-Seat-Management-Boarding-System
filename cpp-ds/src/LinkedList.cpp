#include <iostream>
#include <string>
using namespace std;
 
// ---------- Node definition ----------
struct BookingNode {
    string pnr;
    string passengerName;
    string flightNumber;
    string bookingDate;
    BookingNode* next;
 
    BookingNode(string p, string name, string flight, string date) {
        pnr = p;
        passengerName = name;
        flightNumber = flight;
        bookingDate = date;
        next = nullptr;
    }
};
 
// ---------- Linked list class ----------
class BookingHistoryList {
private:
    BookingNode* head;
 
public:
    BookingHistoryList() {
        head = nullptr;
    }
 
    // Insert a new booking at the end of the list
    void insertBooking(string pnr, string passengerName, string flightNumber, string bookingDate) {
        BookingNode* newNode = new BookingNode(pnr, passengerName, flightNumber, bookingDate);
 
        if (head == nullptr) {
            head = newNode;
            return;
        }
 
        BookingNode* temp = head;
        while (temp->next != nullptr) {
            temp = temp->next;
        }
        temp->next = newNode;
 
        cout << "Booking inserted -> PNR: " << pnr << ", Passenger: " << passengerName << endl;
    }
 
    // Search a booking by PNR. Returns true and prints details if found.
    bool searchBooking(string pnr) {
        BookingNode* temp = head;
        while (temp != nullptr) {
            if (temp->pnr == pnr) {
                cout << "\nBooking Found:" << endl;
                cout << "  PNR            : " << temp->pnr << endl;
                cout << "  Passenger Name : " << temp->passengerName << endl;
                cout << "  Flight Number  : " << temp->flightNumber << endl;
                cout << "  Booking Date   : " << temp->bookingDate << endl;
                return true;
            }
            temp = temp->next;
        }
        cout << "\nNo booking found with PNR: " << pnr << endl;
        return false;
    }
 
    // Show every booking currently stored (useful for testing/demo)
    void displayAll() {
        if (head == nullptr) {
            cout << "\nNo bookings in history yet." << endl;
            return;
        }
 
        cout << "\n--- Booking History ---" << endl;
        BookingNode* temp = head;
        int count = 1;
        while (temp != nullptr) {
            cout << count << ". PNR: " << temp->pnr
                 << " | Passenger: " << temp->passengerName
                 << " | Flight: " << temp->flightNumber
                 << " | Date: " << temp->bookingDate << endl;
            temp = temp->next;
            count++;
        }
    }
 
    // Frees all nodes so the program doesn't leak memory
    ~BookingHistoryList() {
        BookingNode* temp = head;
        while (temp != nullptr) {
            BookingNode* toDelete = temp;
            temp = temp->next;
            delete toDelete;
        }
    }
};
 
// ---------- Demo / test driver ----------
// This is what you run and show in the Review 2 demo.
// Prasad will extend this test data with 5+ bookings for one passenger.
int main() {
    BookingHistoryList history;
 
    // Insert sample bookings
    history.insertBooking("PNR1001", "Rahul Sharma", "AI-202", "2026-09-10");
    history.insertBooking("PNR1002", "Neha Verma", "AI-303", "2026-09-11");
    history.insertBooking("PNR1003", "Rahul Sharma", "AI-404", "2026-09-15");
 
    // Show everything
    history.displayAll();
 
    // Search test cases
    history.searchBooking("PNR1002");   // should be found
    history.searchBooking("PNR9999");   // should NOT be found
 
    return 0;
}
 

