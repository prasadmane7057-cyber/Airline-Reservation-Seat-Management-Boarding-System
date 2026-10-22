#include "Waitlist.h"
#include <iostream>

using namespace std;

bool Waitlist::containsPNR(const string &pnr) const {
    queue<Passenger> remaining = passengers;
    while (!remaining.empty()) {
        if (remaining.front().pnr == pnr)
            return true;
        remaining.pop();
    }
    return false;
}

bool Waitlist::addToWaitlist(const Passenger &passenger, const PassengerArray &bookedPassengers) {
    Passenger existingPassenger;
    if (passenger.pnr.empty() || passenger.name.empty()) {
        cout << "Waitlist entry rejected: PNR and passenger name are required.\n";
        return false;
    }
    if (bookedPassengers.getPassengerByPNR(passenger.pnr, existingPassenger) ||
        containsPNR(passenger.pnr)) {
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
    Passenger cancelledPassenger;
    if (!bookedPassengers.getPassengerByPNR(pnr, cancelledPassenger)) {
        cout << "Cancellation failed: PNR " << pnr << " is not booked.\n";
        return false;
    }
    if (cancelledPassenger.seatRow < 0 || cancelledPassenger.seatRow >= MAX_ROWS ||
        cancelledPassenger.seatColumn < 0 || cancelledPassenger.seatColumn >= MAX_COLS ||
        seatMap.getSeatStatus(cancelledPassenger.seatRow, cancelledPassenger.seatColumn) != 1) {
        cout << "Cancellation failed: PNR " << pnr << " has no matching booked seat.\n";
        return false;
    }
    if (!bookedPassengers.deletePassenger(pnr)) return false;
    if (!seatMap.setSeatStatus(cancelledPassenger.seatRow, cancelledPassenger.seatColumn, 0)) {
        cout << "Cancellation error: the seat could not be released.\n";
        return false;
    }
    cout << "Seat " << (cancelledPassenger.seatRow + 1) << char('A' + cancelledPassenger.seatColumn)
         << " released for PNR " << pnr << ".\n";

    if (passengers.empty()) {
        cout << "No waitlisted passenger to promote.\n";
        return true;
    }

    Passenger promotedPassenger = passengers.front();
    promotedPassenger.seatRow = cancelledPassenger.seatRow;
    promotedPassenger.seatColumn = cancelledPassenger.seatColumn;
    promotedPassenger.seatNo = (promotedPassenger.seatRow * MAX_COLS) +
                                promotedPassenger.seatColumn + 1;

    if (!seatMap.setSeatStatus(promotedPassenger.seatRow, promotedPassenger.seatColumn, 1)) {
        cout << "Promotion failed: the released seat could not be booked.\n";
        return false;
    }
    if (!bookedPassengers.addPassenger(promotedPassenger)) {
        seatMap.setSeatStatus(promotedPassenger.seatRow, promotedPassenger.seatColumn, 0);
        cout << "Promotion failed: PNR " << promotedPassenger.pnr
             << " could not be added to the passenger list.\n";
        return false;
    }

    passengers.pop();
    cout << promotedPassenger.name << " (PNR " << promotedPassenger.pnr << ") promoted to seat "
         << (promotedPassenger.seatRow + 1) << char('A' + promotedPassenger.seatColumn) << ".\n";
    return true;
}

bool Waitlist::empty() const {
    return passengers.empty();
}

size_t Waitlist::size() const {
    return passengers.size();
}

void Waitlist::display() const {
    if (passengers.empty()) {
        cout << "Waitlist is empty.\n";
        return;
    }

    queue<Passenger> remaining = passengers;
    cout << "\n--- Waitlist (FIFO order) ---\n";
    size_t position = 1;
    while (!remaining.empty()) {
        cout << position++ << ". " << remaining.front().name
             << " (PNR " << remaining.front().pnr << ")\n";
        remaining.pop();
    }
}

void runWaitlistDemo() {
    cout << "\n=== Airline Waitlist Queue and Seat Promotion ===\n";
    PassengerArray bookedPassengers;
    SeatMap2D seatMap;
    Waitlist waitlist;

    Passenger firstBooking = {"PNR101", "Aarav Sharma", 29, 'M', "9876543210", 1, "Economy", 0, 0};
    Passenger secondBooking = {"PNR102", "Isha Verma", 34, 'F', "9876500001", 7, "Business", 1, 0};
    bookedPassengers.addPassenger(firstBooking);
    bookedPassengers.addPassenger(secondBooking);
    seatMap.setSeatStatus(0, 0, 1);
    seatMap.setSeatStatus(1, 0, 1);

    waitlist.addToWaitlist({"PNR201", "Rohan Mehta", 41, 'M', "9876500002", 0, "Economy"},
                           bookedPassengers);
    waitlist.addToWaitlist({"PNR202", "Sneha Iyer", 27, 'F', "9876500003", 0, "Business"},
                           bookedPassengers);
    waitlist.display();

    cout << "\n--- Cancel PNR101; promote the first passenger ---\n";
    waitlist.cancelBooking("PNR101", bookedPassengers, seatMap);
    cout << "\n--- Cancel PNR102; promote the next passenger ---\n";
    waitlist.cancelBooking("PNR102", bookedPassengers, seatMap);

    cout << "\n--- Confirm promoted passengers and remaining waitlist ---\n";
    bookedPassengers.displayAll();
    waitlist.display();
    seatMap.printOccupiedList();
}
