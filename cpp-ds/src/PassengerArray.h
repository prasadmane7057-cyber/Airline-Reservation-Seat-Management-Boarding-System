#ifndef PASSENGER_ARRAY_H
#define PASSENGER_ARRAY_H

#include <string>

// PL Practical 1 - Arrays
// Passenger Management module: add, edit, delete, search, view
const int MAX_PASSENGERS = 50;

struct Passenger {
    std::string pnr;
    std::string name;
    int age;
    char gender;
    std::string contact;
    int seatNo;
    std::string travelClass;
};

class PassengerArray {
private:
    Passenger passengers[MAX_PASSENGERS];
    int passengerCount;
    int findIndexByPNR(const std::string &pnr);

public:
    PassengerArray();
    bool addPassenger(const Passenger &p);
    void displayAll();
    bool updatePassenger(const std::string &pnr, const std::string &field, const std::string &newValue);
    bool deletePassenger(const std::string &pnr);
    void searchPassenger(const std::string &key);
    int getCount() const;
};

// Called from main.cpp to demo/test this module
void runPassengerArrayDemo();

#endif