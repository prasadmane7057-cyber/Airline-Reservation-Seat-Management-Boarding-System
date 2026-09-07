#include "SeatMap2D.h"
#include <iostream>
#include <algorithm>
using namespace std;

SeatMap2D::SeatMap2D() {
    initializeSeatMap();
}

// rows 0-1 => First, rows 2-6 => Business, rows 7-29 => Economy
string SeatMap2D::getSeatClass(int row) {
    if (row < 0 || row >= MAX_ROWS) return "Invalid";
    if (row <= 1) return "First";
    if (row <= 6) return "Business";
    return "Economy";
}

void SeatMap2D::initializeSeatMap() {
    for (int r = 0; r < MAX_ROWS; r++)
        for (int c = 0; c < MAX_COLS; c++)
            seatMap[r][c] = 0; // available

    occupiedList.clear();

    // Block emergency exit row seats (row 10, all columns) by default
    for (int c = 0; c < MAX_COLS; c++) {
        setSeatStatus(10, c, 2);
    }
    cout << "Seat map initialized: " << MAX_ROWS << " rows x " << MAX_COLS << " cols.\n";
}

int SeatMap2D::getSeatStatus(int row, int col) {
    if (row < 0 || row >= MAX_ROWS || col < 0 || col >= MAX_COLS) {
        cout << "getSeatStatus: (" << row << "," << col << ") out of bounds.\n";
        return -1;
    }
    return seatMap[row][col];
}

void SeatMap2D::updateOccupiedList(int row, int col, int status) {
    // remove any existing entry for this seat
    occupiedList.erase(
        remove_if(occupiedList.begin(), occupiedList.end(),
                  [row, col](const tuple<int, int, int> &t) {
                      return get<0>(t) == row && get<1>(t) == col;
                  }),
        occupiedList.end());
    // only track non-available seats (sparse-matrix style)
    if (status != 0) {
        occupiedList.push_back(make_tuple(row, col, status));
    }
}

bool SeatMap2D::setSeatStatus(int row, int col, int status) {
    if (row < 0 || row >= MAX_ROWS || col < 0 || col >= MAX_COLS) {
        cout << "setSeatStatus: (" << row << "," << col << ") out of bounds.\n";
        return false;
    }
    if (status < 0 || status > 2) {
        cout << "setSeatStatus: invalid status code " << status << ".\n";
        return false;
    }
    seatMap[row][col] = status;
    updateOccupiedList(row, col, status);
    return true;
}

void SeatMap2D::printSeatMap() {
    cout << "\n     A   B   C   D   E   F\n";
    for (int r = 0; r < MAX_ROWS; r++) {
        cout.width(3);
        cout << (r + 1) << " ";
        for (int c = 0; c < MAX_COLS; c++) {
            char symbol = '.';
            if (seatMap[r][c] == 1) symbol = 'X'; // booked
            else if (seatMap[r][c] == 2) symbol = 'B'; // blocked
            cout << "  " << symbol << " ";
        }
        cout << " [" << getSeatClass(r) << "]\n";
    }
    cout << "Legend: . = available, X = booked, B = blocked/emergency\n\n";
}

void SeatMap2D::printOccupiedList() {
    cout << "\n--- Sparse view: non-available seats only (" << occupiedList.size() << ") ---\n";
    for (auto &t : occupiedList) {
        int row = get<0>(t), col = get<1>(t), status = get<2>(t);
        cout << "Row " << (row + 1) << ", Col " << char('A' + col)
             << " -> " << (status == 1 ? "BOOKED" : "BLOCKED") << "\n";
    }
    cout << "\n";
}

// ---------- demo/test function called from main.cpp ----------
void runSeatMap2DDemo() {
    cout << "=== PL Practical 2: Seat Map (Airline Reservation) ===\n";
    SeatMap2D seatMap;

    cout << "\n--- Book a mix of seats across classes ---\n";
    seatMap.setSeatStatus(0, 0, 1);   // First class 1A
    seatMap.setSeatStatus(3, 2, 1);   // Business 4C
    seatMap.setSeatStatus(15, 4, 1);  // Economy 16E
    seatMap.setSeatStatus(20, 1, 1);  // Economy 21B

    cout << "\n--- Cancel one booked seat (16E) ---\n";
    seatMap.setSeatStatus(15, 4, 0);

    cout << "\n--- Attempt out-of-bounds access ---\n";
    seatMap.getSeatStatus(99, 9);
    seatMap.setSeatStatus(-1, 0, 1);

    seatMap.printSeatMap();
    seatMap.printOccupiedList();
}