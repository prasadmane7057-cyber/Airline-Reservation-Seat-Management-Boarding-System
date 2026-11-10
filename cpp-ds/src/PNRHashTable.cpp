#include "PNRHashTable.h"
#include <iomanip>
#include <cmath>

/**
 * =====================================================================
 * PNR Hash Table Implementation (Separate Chaining)
 * =====================================================================
 */

PNRHashTable::PNRHashTable(int tableSize)
    : capacity(tableSize > 0 ? tableSize : DEFAULT_CAPACITY),
      recordCount(0),
      collisionCount(0) {
    buckets.resize(capacity, nullptr);
}

PNRHashTable::~PNRHashTable() {
    clear();
}

void PNRHashTable::clear() {
    for (int i = 0; i < capacity; ++i) {
        PNRHashNode* current = buckets[i];
        while (current != nullptr) {
            PNRHashNode* toDelete = current;
            current = current->next;
            delete toDelete;
        }
        buckets[i] = nullptr;
    }
    recordCount = 0;
    collisionCount = 0;
}

// Polynomial rolling hash using prime multiplier 31
int PNRHashTable::hashFunction(const std::string& key) const {
    unsigned long long hash = 0;
    const unsigned int prime = 31;
    for (char ch : key) {
        hash = (hash * prime + static_cast<unsigned char>(ch)) % capacity;
    }
    return static_cast<int>(hash);
}

bool PNRHashTable::insert(const PNRRecord& record) {
    if (record.pnr.empty()) {
        std::cerr << "  [ERROR] Cannot insert record with empty PNR.\n";
        return false;
    }

    int index = hashFunction(record.pnr);
    PNRHashNode* head = buckets[index];

    // Check for duplicate key update
    PNRHashNode* curr = head;
    while (curr != nullptr) {
        if (curr->data.pnr == record.pnr) {
            curr->data = record; // Update existing
            return true;
        }
        curr = curr->next;
    }

    // New node insertion
    PNRHashNode* newNode = new PNRHashNode(record);
    if (head != nullptr) {
        // Collision occurred! Chaining to head of list
        collisionCount++;
        newNode->next = head;
        buckets[index] = newNode;
    } else {
        // Direct bucket placement
        buckets[index] = newNode;
    }

    recordCount++;
    return true;
}

bool PNRHashTable::search(const std::string& pnr, PNRRecord& foundRecord, int& searchSteps) const {
    searchSteps = 0;
    if (pnr.empty()) return false;

    int index = hashFunction(pnr);
    PNRHashNode* curr = buckets[index];

    while (curr != nullptr) {
        searchSteps++;
        if (curr->data.pnr == pnr) {
            foundRecord = curr->data;
            return true;
        }
        curr = curr->next;
    }

    return false;
}

bool PNRHashTable::search(const std::string& pnr, PNRRecord& foundRecord) const {
    int dummySteps = 0;
    return search(pnr, foundRecord, dummySteps);
}

bool PNRHashTable::contains(const std::string& pnr) const {
    PNRRecord temp;
    return search(pnr, temp);
}

bool PNRHashTable::remove(const std::string& pnr) {
    if (pnr.empty()) return false;

    int index = hashFunction(pnr);
    PNRHashNode* curr = buckets[index];
    PNRHashNode* prev = nullptr;

    while (curr != nullptr) {
        if (curr->data.pnr == pnr) {
            if (prev == nullptr) {
                buckets[index] = curr->next;
            } else {
                prev->next = curr->next;
            }
            delete curr;
            recordCount--;
            return true;
        }
        prev = curr;
        curr = curr->next;
    }

    return false;
}

void PNRHashTable::displayTable() const {
    std::cout << "\n========================================================================\n";
    std::cout << "                  AIRLINE PNR HASH TABLE (SEPARATE CHAINING)            \n";
    std::cout << "========================================================================\n";
    std::cout << " Bucket | Collision Chain Nodes [PNR -> Passenger -> Flight]\n";
    std::cout << "------------------------------------------------------------------------\n";

    for (int i = 0; i < capacity; ++i) {
        std::cout << " [" << std::setw(2) << std::right << i << "]   ";
        PNRHashNode* curr = buckets[i];
        if (curr == nullptr) {
            std::cout << "--- (empty)\n";
        } else {
            bool first = true;
            while (curr != nullptr) {
                if (!first) std::cout << " --> ";
                std::cout << "[" << curr->data.pnr << ": " << curr->data.passengerName 
                          << " (" << curr->data.flightNumber << " " << curr->data.seatNumber << ")]";
                first = false;
                curr = curr->next;
            }
            std::cout << " --> NULL\n";
        }
    }
    std::cout << "========================================================================\n";
}

void PNRHashTable::printMetrics() const {
    std::cout << "\n[HASH TABLE METRICS]\n";
    std::cout << "  Table Capacity   : " << capacity << " buckets (prime)\n";
    std::cout << "  Total Records    : " << recordCount << "\n";
    std::cout << "  Collision Events : " << collisionCount << "\n";
    std::cout << "  Load Factor (λ)  : " << std::fixed << std::setprecision(2) << getLoadFactor() << "\n";
    std::cout << "  Average Search   : O(1 + λ) ≈ " << std::fixed << std::setprecision(2) << (1.0 + getLoadFactor()) << " memory probes\n";
}

void runPNRHashTableDemo() {
    std::cout << "\n====================================================================\n";
    std::cout << "  DATA STRUCTURES DEMO: PNR HASH TABLE WITH COLLISION RESOLUTION    \n";
    std::cout << "====================================================================\n";

    // Use capacity 7 to clearly demonstrate and inspect collision chains
    PNRHashTable table(7);

    std::vector<PNRRecord> sampleBookings = {
        {"AI8K92", "Aarav Sharma", "AI101", "12A", "Economy", "CONFIRMED", 4500.0},
        {"SK7M41", "Demo Passenger", "AI202", "3B", "Business", "CONFIRMED", 11500.0},
        {"BL9X33", "Sneha Iyer", "AI303", "1A", "FirstClass", "CONFIRMED", 21000.0},
        {"DL4Q78", "Rohan Mehta", "AI101", "14C", "Economy", "CONFIRMED", 4500.0},
        {"HY5V12", "Priya Desai", "AI404", "2F", "FirstClass", "CONFIRMED", 21000.0},
        {"CC2W99", "Vikram Rao", "AI505", "8D", "Business", "CONFIRMED", 12000.0},
        {"PNR101", "Ananya Verma", "AI101", "10E", "Economy", "CONFIRMED", 4800.0},
        {"PNR102", "Karan Malhotra", "AI202", "5A", "Business", "CONFIRMED", 11800.0}
    };

    std::cout << "1. Inserting " << sampleBookings.size() << " booking records into Hash Table (Capacity = 7)...\n";
    for (const auto& rec : sampleBookings) {
        table.insert(rec);
    }

    table.displayTable();
    table.printMetrics();

    // 2. Lookup Demonstration with probe counting
    std::cout << "\n2. Performing O(1) Fast PNR Lookups:\n";
    std::string testKeys[] = {"BL9X33", "PNR101", "NONEXISTENT", "DL4Q78"};

    for (const auto& key : testKeys) {
        PNRRecord found;
        int steps = 0;
        if (table.search(key, found, steps)) {
            std::cout << "  [FOUND] PNR: " << key << " -> Passenger: " << found.passengerName 
                      << ", Flight: " << found.flightNumber << ", Seat: " << found.seatNumber 
                      << " (Probes: " << steps << ")\n";
        } else {
            std::cout << "  [NOT FOUND] PNR: " << key << " (Probes: " << steps << ")\n";
        }
    }

    // 3. Deletion test
    std::cout << "\n3. Testing Cancellation / Deletion for PNR 'SK7M41'...\n";
    if (table.remove("SK7M41")) {
        std::cout << "  Successfully removed PNR 'SK7M41'.\n";
    }
    table.displayTable();
}

#ifdef STANDALONE_PNR_HASH
int main() {
    runPNRHashTableDemo();
    return 0;
}
#endif
