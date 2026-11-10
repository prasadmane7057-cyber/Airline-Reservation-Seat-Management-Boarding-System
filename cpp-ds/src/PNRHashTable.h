#ifndef PNR_HASH_TABLE_H
#define PNR_HASH_TABLE_H

#include <string>
#include <vector>
#include <iostream>

/**
 * =====================================================================
 * Module: PNR Hash Table with Collision Handling
 * Subject: Programming Lab / Data Structures (PL / C++ DS)
 * Scenario: Constant-time O(1) average lookup for airline bookings by PNR
 * Collision Handling: Separate Chaining (Linked Lists per bucket)
 * =====================================================================
 */

struct PNRRecord {
    std::string pnr;
    std::string passengerName;
    std::string flightNumber;
    std::string seatNumber;
    std::string travelClass;
    std::string status;
    double fare;

    PNRRecord() : fare(0.0) {}
    PNRRecord(std::string p, std::string name, std::string flight, 
              std::string seat, std::string cls, std::string stat, double f)
        : pnr(p), passengerName(name), flightNumber(flight),
          seatNumber(seat), travelClass(cls), status(stat), fare(f) {}
};

// Node in collision chain
struct PNRHashNode {
    PNRRecord data;
    PNRHashNode* next;

    PNRHashNode(const PNRRecord& rec) : data(rec), next(nullptr) {}
};

class PNRHashTable {
private:
    static const int DEFAULT_CAPACITY = 17; // Prime bucket capacity for optimal modulo dispersion
    int capacity;
    int recordCount;
    int collisionCount;
    std::vector<PNRHashNode*> buckets;

    // Polynomial rolling hash function (Horner's rule, prime multiplier 31)
    int hashFunction(const std::string& key) const;

public:
    explicit PNRHashTable(int tableSize = DEFAULT_CAPACITY);
    ~PNRHashTable();

    // Prevent copies for safe memory management
    PNRHashTable(const PNRHashTable&) = delete;
    PNRHashTable& operator=(const PNRHashTable&) = delete;

    // Core Operations
    bool insert(const PNRRecord& record);
    bool search(const std::string& pnr, PNRRecord& foundRecord, int& searchSteps) const;
    bool search(const std::string& pnr, PNRRecord& foundRecord) const;
    bool remove(const std::string& pnr);
    bool contains(const std::string& pnr) const;

    // Metrics & Diagnostics
    int getRecordCount() const { return recordCount; }
    int getCapacity() const { return capacity; }
    int getCollisionCount() const { return collisionCount; }
    double getLoadFactor() const { return static_cast<double>(recordCount) / capacity; }

    // Visualization
    void displayTable() const;
    void printMetrics() const;
    void clear();
};

// Demonstration & Benchmark function
void runPNRHashTableDemo();

#endif // PNR_HASH_TABLE_H
