#include "PassengerArray.h"
#include <iostream>
using namespace std;

PassengerArray::PassengerArray() : passengerCount(0) {}

int PassengerArray::findIndexByPNR(const string &pnr) {
    for (int i = 0; i < passengerCount; i++) {
        if (passengers[i].pnr == pnr) return i;
    }
    return -1;
}

bool PassengerArray::addPassenger(const Passenger &p) {
    if (passengerCount >= MAX_PASSENGERS) {
        cout << "Cannot add passenger: array is full.\n";
        return false;
    }
    if (findIndexByPNR(p.pnr) != -1) {
        cout << "Cannot add passenger: PNR " << p.pnr << " already exists.\n";
        return false;
    }
    passengers[passengerCount] = p;
    passengerCount++;
    cout << "Passenger " << p.name << " (PNR " << p.pnr << ") added.\n";
    return true;
}

void PassengerArray::displayAll() {
    if (passengerCount == 0) {
        cout << "No passengers to display.\n";
        return;
    }
    cout << "\nPNR       | Name             | Age | Gender | Contact      | Seat | Class\n";
    cout << "-------------------------------------------------------------------------\n";
    for (int i = 0; i < passengerCount; i++) {
        Passenger &p = passengers[i];
        cout << left << p.pnr << "   | " << p.name;
        for (size_t s = p.name.length(); s < 16; s++) cout << " ";
        cout << "| " << p.age << "  | " << p.gender << "      | " << p.contact
             << "  | " << p.seatNo << "   | " << p.travelClass << "\n";
    }
    cout << "-------------------------------------------------------------------------\n";
    cout << "Total passengers: " << passengerCount << "\n\n";
}

bool PassengerArray::updatePassenger(const string &pnr, const string &field, const string &newValue) {
    int idx = findIndexByPNR(pnr);
    if (idx == -1) {
        cout << "Update failed: PNR " << pnr << " not found.\n";
        return false;
    }
    if (field == "name") passengers[idx].name = newValue;
    else if (field == "age") passengers[idx].age = stoi(newValue);
    else if (field == "gender") passengers[idx].gender = newValue[0];
    else if (field == "contact") passengers[idx].contact = newValue;
    else if (field == "seatNo") passengers[idx].seatNo = stoi(newValue);
    else if (field == "travelClass") passengers[idx].travelClass = newValue;
    else {
        cout << "Update failed: unknown field '" << field << "'.\n";
        return false;
    }
    cout << "PNR " << pnr << " updated: " << field << " -> " << newValue << "\n";
    return true;
}

bool PassengerArray::deletePassenger(const string &pnr) {
    int idx = findIndexByPNR(pnr);
    if (idx == -1) {
        cout << "Delete failed: PNR " << pnr << " not found.\n";
        return false;
    }
    for (int i = idx; i < passengerCount - 1; i++) {
        passengers[i] = passengers[i + 1];
    }
    passengerCount--;
    cout << "PNR " << pnr << " deleted.\n";
    return true;
}

void PassengerArray::searchPassenger(const string &key) {
    bool found = false;
    for (int i = 0; i < passengerCount; i++) {
        if (passengers[i].pnr == key || passengers[i].name == key) {
            Passenger &p = passengers[i];
            cout << "Found -> PNR: " << p.pnr << ", Name: " << p.name
                 << ", Age: " << p.age << ", Seat: " << p.seatNo
                 << ", Class: " << p.travelClass << "\n";
            found = true;
        }
    }
    if (!found) cout << "No passenger found matching '" << key << "'.\n";
}

int PassengerArray::getCount() const { return passengerCount; }

// ---------- demo/test function called from main.cpp ----------
void runPassengerArrayDemo() {
    cout << "=== PL Practical 1: Passenger Management (Airline Reservation) ===\n\n";
    PassengerArray pa;

    pa.addPassenger({"PNR001", "Aarav Sharma", 29, 'M', "9876543210", 12, "Economy"});
    pa.addPassenger({"PNR002", "Isha Verma", 34, 'F', "9876500001", 5, "Business"});
    pa.addPassenger({"PNR003", "Rohan Mehta", 41, 'M', "9876500002", 22, "Economy"});
    pa.addPassenger({"PNR004", "Sneha Iyer", 27, 'F', "9876500003", 1, "First"});
    pa.addPassenger({"PNR005", "Karan Joshi", 31, 'M', "9876500004", 15, "Economy"});
    pa.addPassenger({"PNR006", "Priya Nair", 38, 'F', "9876500005", 8, "Business"});
    pa.addPassenger({"PNR007", "Aditya Rao", 25, 'M', "9876500006", 19, "Economy"});
    pa.addPassenger({"PNR008", "Meera Pillai", 45, 'F', "9876500007", 3, "First"});
    pa.addPassenger({"PNR009", "Vivaan Kapoor", 33, 'M', "9876500008", 27, "Economy"});
    pa.addPassenger({"PNR010", "Ananya Gupta", 29, 'F', "9876500009", 11, "Economy"});
    pa.addPassenger({"PNR001", "Duplicate Test", 30, 'M', "0000000000", 99, "Economy"}); // should reject

    cout << "\n--- Display All ---\n";
    pa.displayAll();

    cout << "--- Search by PNR (PNR004) ---\n";
    pa.searchPassenger("PNR004");

    cout << "\n--- Search by Name (Rohan Mehta) ---\n";
    pa.searchPassenger("Rohan Mehta");

    cout << "\n--- Update PNR003: seatNo -> 30 ---\n";
    pa.updatePassenger("PNR003", "seatNo", "30");

    cout << "\n--- Delete PNR006 ---\n";
    pa.deletePassenger("PNR006");

    cout << "\n--- Display All (after update + delete) ---\n";
    pa.displayAll();
}