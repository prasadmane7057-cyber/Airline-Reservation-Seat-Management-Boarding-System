#ifndef WAITLIST_H
#define WAITLIST_H

#include "PassengerArray.h"
#include "SeatMap2D.h"
#include <cstddef>
#include <queue>
#include <string>

class Waitlist {
private:
    std::queue<Passenger> passengers;
    bool containsPNR(const std::string &pnr) const;

public:
    bool addToWaitlist(const Passenger &passenger, const PassengerArray &bookedPassengers);
    bool cancelBooking(const std::string &pnr, PassengerArray &bookedPassengers, SeatMap2D &seatMap);
    bool empty() const;
    std::size_t size() const;
    void display() const;
};

void runWaitlistDemo();

#endif
