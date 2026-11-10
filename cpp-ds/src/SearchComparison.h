#ifndef SEARCH_COMPARISON_H
#define SEARCH_COMPARISON_H

#include <string>
#include <vector>
#include <chrono>
#include <iostream>

// Struct representing a passenger record for search benchmarks
struct PassengerSearchRecord {
    std::string pnr;
    std::string name;
    std::string flightNumber;
    std::string seatNumber;
    double fare;

    PassengerSearchRecord() : fare(0.0) {}
    PassengerSearchRecord(std::string p, std::string n, std::string f, std::string s, double fr)
        : pnr(p), name(n), flightNumber(f), seatNumber(s), fare(fr) {}
};

// Result structure capturing search performance metrics
struct SearchResult {
    bool found;
    int index;
    int comparisons;
    double timeMicroseconds;
    std::string targetPNR;
    std::string algorithm;
    std::vector<std::string> stepTrace;

    SearchResult() : found(false), index(-1), comparisons(0), timeMicroseconds(0.0) {}
};

// Comparison benchmark between Linear Search and Binary Search
struct SearchComparisonReport {
    SearchResult linearResult;
    SearchResult binaryResult;
    size_t datasetSize;
    double theoreticalLinearAvg;
    double theoreticalBinaryWorst;
    double comparisonRatio; // linearComparisons / binaryComparisons
};

class SearchComparison {
public:
    // Linear Search: O(n) sequential scan
    static SearchResult linearSearch(const std::vector<PassengerSearchRecord>& dataset, const std::string& targetPNR);

    // Binary Search: O(log n) divide and conquer on sorted dataset
    static SearchResult binarySearch(const std::vector<PassengerSearchRecord>& sortedDataset, const std::string& targetPNR);

    // Run side-by-side comparison on identical records
    static SearchComparisonReport compare(const std::vector<PassengerSearchRecord>& dataset, const std::string& targetPNR);

    // Helper to generate a pre-populated dataset sorted by PNR
    static std::vector<PassengerSearchRecord> generateSampleDataset(size_t count);

    // Print detailed comparison report to console
    static void printReport(const SearchComparisonReport& report);
};

// Standalone runner called by main.cpp
void runSearchComparisonDemo();

#endif // SEARCH_COMPARISON_H
