#include "Waitlist.h"
#include <iostream>

using namespace std;

bool Waitlist::containsPNR(const string &pnr) const {
    queue<Passenger> remaining = passengers;
    while (!remaining.empty()) {
        if (remaining.front().pnr == pnr) return true;
        remaining.pop();
    }
    return false;
}

bool Waitlist::addToWaitlist(const Passenger &passenger, const PassengerArray &bookedPassengers) {
    Passenger existing;
    if (passenger.pnr.empty() || passenger.name.empty()) {
        cout << "Waitlist entry rejected: PNR and passenger name are required.\n";
        return false;
    }
    if (bookedPassengers.getPassengerByPNR(passenger.pnr, existing) || containsPNR(passenger.pnr)) {
        cout << "Waitlist entry rejected: PNR " << passenger.pnr
             << " is already booked or waitlisted.\n";
        return false;
    }

    passengers.push(passenger);
    cout << passenger.name << " (PNR " << passenger.pnr << ") added to waitlist at position "
         << passengers.size() << ".\n";
    return true;
}

bool Waitlist::cancelBooking(const string &pnr, PassengerArray &bookedPassengers, SeatMap2D &seatMap) {
    Passenger cancelled;
    if (!bookedPassengers.getPassengerByPNR(pnr, cancelled)) {
        cout << "Cancellation failed: PNR " << pnr << " is not booked.\n";
        return false;
    }
    if (cancelled.seatRow < 0 || cancelled.seatRow >= MAX_ROWS ||
        cancelled.seatColumn < 0 || cancelled.seatColumn >= MAX_COLS ||
        seatMap.getSeatStatus(cancelled.seatRow, cancelled.seatColumn) != 1) {
        cout << "Cancellation failed: PNR " << pnr << " has no matching booked seat.\n";
        return false;
    }
    if (!bookedPassengers.deletePassenger(pnr)) return false;
    if (!seatMap.setSeatStatus(cancelled.seatRow, cancelled.seatColumn, 0)) {
        cout << "Cancellation error: the seat could not be released.\n";
        return false;
    }
    cout << "Seat " << cancelled.seatRow + 1 << char('A' + cancelled.seatColumn)
         << " released for PNR " << pnr << ".\n";

    if (passengers.empty()) {
        cout << "No waitlisted passenger to promote.\n";
        return true;
    }

    Passenger promoted = passengers.front();
    promoted.seatRow = cancelled.seatRow;
    promoted.seatColumn = cancelled.seatColumn;
    promoted.seatNo = promoted.seatRow * MAX_COLS + promoted.seatColumn + 1;

    if (!seatMap.setSeatStatus(promoted.seatRow, promoted.seatColumn, 1)) {
        cout << "Promotion failed: the released seat could not be booked.\n";
        return false;
    }
    if (!bookedPassengers.addPassenger(promoted)) {
        seatMap.setSeatStatus(promoted.seatRow, promoted.seatColumn, 0);
        cout << "Promotion failed: PNR " << promoted.pnr
             << " could not be added to the passenger list.\n";
        return false;
    }

    passengers.pop();
    cout << promoted.name << " (PNR " << promoted.pnr << ") promoted to seat "
         << promoted.seatRow + 1 << char('A' + promoted.seatColumn) << ".\n";
    return true;
}

bool Waitlist::empty() const { return passengers.empty(); }
size_t Waitlist::size() const { return passengers.size(); }

vector<Passenger> Waitlist::snapshot() const {
    vector<Passenger> records;
    queue<Passenger> remaining = passengers;
    while (!remaining.empty()) {
        records.push_back(remaining.front());
        remaining.pop();
    }
    return records;
}

void Waitlist::display() const {
    if (passengers.empty()) {
        cout << "Waitlist is empty.\n";
        return;
    }

    queue<Passenger> remaining = passengers;
    cout << "\n--- Waitlist (FIFO order) ---\n";
    for (size_t position = 1; !remaining.empty(); ++position) {
        cout << position << ". " << remaining.front().name
             << " (PNR " << remaining.front().pnr << ")\n";
        remaining.pop();
    }
}

void runWaitlistDemo() {
    cout << "\n=== Airline Waitlist Queue and Seat Promotion ===\n";
    PassengerArray booked;
    SeatMap2D seats;
    Waitlist waitlist;

    booked.addPassenger({"PNR101", "Aarav Sharma", 29, 'M', "9876543210", 1, "Economy", 0, 0});
    booked.addPassenger({"PNR102", "Isha Verma", 34, 'F', "9876500001", 7, "Business", 1, 0});
    seats.setSeatStatus(0, 0, 1);
    seats.setSeatStatus(1, 0, 1);

    waitlist.addToWaitlist(
        {"PNR201", "Rohan Mehta", 41, 'M', "9876500002", 0, "Economy"}, booked);
    waitlist.addToWaitlist(
        {"PNR202", "Sneha Iyer", 27, 'F', "9876500003", 0, "Business"}, booked);
    waitlist.display();

    waitlist.cancelBooking("PNR101", booked, seats);
    waitlist.cancelBooking("PNR102", booked, seats);

    booked.displayAll();
    waitlist.display();
    seats.printOccupiedList();
}
