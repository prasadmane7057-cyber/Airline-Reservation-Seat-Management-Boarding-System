#include <iostream>
#include "PassengerArray.h"
#include "SeatMap2D.h"
#include "Waitlist.h"
#include "PNRHashTable.h"
#include "SearchComparison.h"
#include "SortComparison.h"

int main() {
    std::cout << "Airline DS module\n";
    runPassengerArrayDemo();
    runSeatMap2DDemo();
    runWaitlistDemo();
    runPNRHashTableDemo();
    runSearchComparisonDemo();
    runSortComparisonDemo();
    return 0;
}
