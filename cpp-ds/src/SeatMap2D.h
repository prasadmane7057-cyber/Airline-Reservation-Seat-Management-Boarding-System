#ifndef SEAT_MAP_2D_H
#define SEAT_MAP_2D_H

#include <vector>
#include <tuple>
#include <string>

// PL Practical 2 - 2D Arrays: Seat Map
// Status codes: 0 = available, 1 = booked, 2 = blocked/emergency
const int MAX_ROWS = 30;
const int MAX_COLS = 6; // seats A-F

class SeatMap2D {
private:
    int seatMap[MAX_ROWS][MAX_COLS];
    // Sparse-matrix style tracking: only non-available seats are logged here
    // for fast lookup, per the practical's "treat it like a sparse matrix" note.
    std::vector<std::tuple<int, int, int>> occupiedList; // (row, col, status)

    void updateOccupiedList(int row, int col, int status);

public:
    SeatMap2D();
    void initializeSeatMap();
    int getSeatStatus(int row, int col);          // -1 if out of bounds
    bool setSeatStatus(int row, int col, int status);
    std::string getSeatClass(int row);
    void printSeatMap();
    void printOccupiedList(); // sparse view: only booked/blocked seats
};

// Called from main.cpp to demo/test this module
void runSeatMap2DDemo();

#endif