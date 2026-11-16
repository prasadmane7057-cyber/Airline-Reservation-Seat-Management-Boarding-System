#include "PassengerArray.h"
#include "PNRHashTable.h"
#include "SearchComparison.h"
#include "SeatMap2D.h"
#include "SortComparison.h"
#include "Waitlist.h"

#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

namespace {

std::string jsonString(const std::string& value) {
    std::ostringstream escaped;
    escaped << '"';
    for (unsigned char ch : value) {
        switch (ch) {
            case '"': escaped << "\\\""; break;
            case '\\': escaped << "\\\\"; break;
            case '\b': escaped << "\\b"; break;
            case '\f': escaped << "\\f"; break;
            case '\n': escaped << "\\n"; break;
            case '\r': escaped << "\\r"; break;
            case '\t': escaped << "\\t"; break;
            default:
                if (ch < 0x20) {
                    const char hex[] = "0123456789abcdef";
                    escaped << "\\u00" << hex[ch >> 4] << hex[ch & 0x0f];
                } else {
                    escaped << static_cast<char>(ch);
                }
        }
    }
    escaped << '"';
    return escaped.str();
}

void writePassenger(std::ostream& output, const Passenger& passenger) {
    output << "{\"pnr\":" << jsonString(passenger.pnr)
           << ",\"name\":" << jsonString(passenger.name)
           << ",\"age\":" << passenger.age
           << ",\"gender\":" << jsonString(std::string(1, passenger.gender))
           << ",\"contact\":" << jsonString(passenger.contact)
           << ",\"seatNo\":" << passenger.seatNo
           << ",\"travelClass\":" << jsonString(passenger.travelClass) << '}';
}

} // namespace

int main() {
    std::ostringstream courseworkOutput;
    std::streambuf* originalOutput = std::cout.rdbuf(courseworkOutput.rdbuf());
    try {
        // These are the fixed classroom fixtures from cpp-ds/src coursework demos.
        PassengerArray passengers;
        const Passenger passengerFixtures[] = {
            {"PNR001", "Aarav Sharma", 29, 'M', "9876543210", 12, "Economy"},
            {"PNR002", "Isha Verma", 34, 'F', "9876500001", 5, "Business"},
            {"PNR003", "Rohan Mehta", 41, 'M', "9876500002", 22, "Economy"},
            {"PNR004", "Sneha Iyer", 27, 'F', "9876500003", 1, "First"},
            {"PNR005", "Karan Joshi", 31, 'M', "9876500004", 15, "Economy"},
            {"PNR006", "Priya Nair", 38, 'F', "9876500005", 8, "Business"},
            {"PNR007", "Aditya Rao", 25, 'M', "9876500006", 19, "Economy"},
            {"PNR008", "Meera Pillai", 45, 'F', "9876500007", 3, "First"},
            {"PNR009", "Vivaan Kapoor", 33, 'M', "9876500008", 27, "Economy"},
            {"PNR010", "Ananya Gupta", 29, 'F', "9876500009", 11, "Economy"}
        };
        for (const Passenger& passenger : passengerFixtures) {
            if (!passengers.addPassenger(passenger)) {
                throw std::runtime_error("Could not load the passenger demo fixtures.");
            }
        }

        SeatMap2D seatMap;
        seatMap.setSeatStatus(0, 0, 1);
        seatMap.setSeatStatus(3, 2, 1);
        seatMap.setSeatStatus(15, 4, 1);
        seatMap.setSeatStatus(20, 1, 1);
        seatMap.setSeatStatus(15, 4, 0);

        PassengerArray bookedPassengers;
        bookedPassengers.addPassenger(
            {"PNR101", "Aarav Sharma", 29, 'M', "9876543210", 1, "Economy", 0, 0});
        bookedPassengers.addPassenger(
            {"PNR102", "Isha Verma", 34, 'F', "9876500001", 7, "Business", 1, 0});
        Waitlist waitlist;
        waitlist.addToWaitlist(
            {"PNR201", "Rohan Mehta", 41, 'M', "9876500002", 0, "Economy"},
            bookedPassengers);
        waitlist.addToWaitlist(
            {"PNR202", "Sneha Iyer", 27, 'F', "9876500003", 0, "Business"},
            bookedPassengers);

        PNRHashTable hashTable(7);
        const std::vector<PNRRecord> hashFixtures = {
            {"AI8K92", "Aarav Sharma", "AI101", "12A", "Economy", "CONFIRMED", 4500.0},
            {"SK7M41", "Demo Passenger", "AI202", "3B", "Business", "CONFIRMED", 11500.0},
            {"BL9X33", "Sneha Iyer", "AI303", "1A", "FirstClass", "CONFIRMED", 21000.0},
            {"DL4Q78", "Rohan Mehta", "AI101", "14C", "Economy", "CONFIRMED", 4500.0},
            {"HY5V12", "Priya Desai", "AI404", "2F", "FirstClass", "CONFIRMED", 21000.0},
            {"CC2W99", "Vikram Rao", "AI505", "8D", "Business", "CONFIRMED", 12000.0},
            {"PNR101", "Ananya Verma", "AI101", "10E", "Economy", "CONFIRMED", 4800.0},
            {"PNR102", "Karan Malhotra", "AI202", "5A", "Business", "CONFIRMED", 11800.0}
        };
        for (const PNRRecord& record : hashFixtures) {
            if (!hashTable.insert(record)) {
                throw std::runtime_error("Could not load the PNR hash demo fixtures.");
            }
        }
        const std::string hashTarget = "BL9X33";
        PNRRecord hashRecord;
        int hashSteps = 0;
        const bool hashFound = hashTable.search(hashTarget, hashRecord, hashSteps);
        if (!hashFound) throw std::runtime_error("PNR hash demo lookup failed.");

        const std::vector<PassengerSearchRecord> searchDataset =
            SearchComparison::generateSampleDataset(32);
        const std::string searchTarget = searchDataset.at(28).pnr;
        const SearchComparisonReport searchReport =
            SearchComparison::compare(searchDataset, searchTarget);

        std::ostringstream sortOutput;
        std::streambuf* beforeSortOutput = std::cout.rdbuf(sortOutput.rdbuf());
        runSortComparisonDemo();
        std::cout.rdbuf(beforeSortOutput);

        std::cout.rdbuf(originalOutput);
        std::cout << "{\"success\":true,\"source\":\"cpp-ds-native-demo\",\"data\":{";
        std::cout << "\"passengerArray\":{\"count\":" << passengers.getCount() << ",\"records\":[";
        for (int i = 0; i < passengers.getCount(); ++i) {
            Passenger passenger;
            if (!passengers.getPassengerAt(i, passenger)) {
                throw std::runtime_error("Could not read the passenger demo snapshot.");
            }
            if (i) std::cout << ',';
            writePassenger(std::cout, passenger);
        }
        std::cout << "]},\"seatMap\":{\"rows\":" << MAX_ROWS
                  << ",\"columns\":" << MAX_COLS << ",\"counts\":{";
        int counts[] = {0, 0, 0};
        std::cout << "\"available\":";
        for (int row = 0; row < MAX_ROWS; ++row) {
            for (int column = 0; column < MAX_COLS; ++column) {
                const int status = seatMap.getSeatStatusSnapshot(row, column);
                if (status < 0 || status > 2) throw std::runtime_error("Invalid seat status.");
                ++counts[status];
            }
        }
        std::cout << counts[0] << ",\"booked\":" << counts[1]
                  << ",\"blocked\":" << counts[2] << "},\"statuses\":[";
        for (int row = 0; row < MAX_ROWS; ++row) {
            if (row) std::cout << ',';
            std::cout << '[';
            for (int column = 0; column < MAX_COLS; ++column) {
                if (column) std::cout << ',';
                std::cout << seatMap.getSeatStatusSnapshot(row, column);
            }
            std::cout << ']';
        }
        std::cout << "]},\"waitlist\":{\"count\":" << waitlist.size() << ",\"records\":[";
        const std::vector<Passenger> waiting = waitlist.snapshot();
        for (std::size_t i = 0; i < waiting.size(); ++i) {
            if (i) std::cout << ',';
            std::cout << "{\"pnr\":" << jsonString(waiting[i].pnr)
                      << ",\"name\":" << jsonString(waiting[i].name) << '}';
        }
        std::cout << "]},\"pnrHash\":{\"count\":" << hashTable.getRecordCount()
                  << ",\"capacity\":" << hashTable.getCapacity()
                  << ",\"collisions\":" << hashTable.getCollisionCount()
                  << ",\"loadFactor\":" << hashTable.getLoadFactor()
                  << ",\"search\":{\"target\":" << jsonString(hashTarget)
                  << ",\"found\":true,\"record\":{\"pnr\":" << jsonString(hashRecord.pnr)
                  << ",\"passengerName\":" << jsonString(hashRecord.passengerName)
                  << ",\"flightNumber\":" << jsonString(hashRecord.flightNumber)
                  << ",\"seatNumber\":" << jsonString(hashRecord.seatNumber)
                  << ",\"travelClass\":" << jsonString(hashRecord.travelClass)
                  << ",\"status\":" << jsonString(hashRecord.status)
                  << ",\"fare\":" << hashRecord.fare << "},\"steps\":" << hashSteps << "}}";
        std::cout << ",\"searchComparison\":{\"targetPnr\":" << jsonString(searchTarget)
                  << ",\"datasetSize\":" << searchReport.datasetSize
                  << ",\"linear\":{\"found\":" << (searchReport.linearResult.found ? "true" : "false")
                  << ",\"index\":" << searchReport.linearResult.index
                  << ",\"comparisons\":" << searchReport.linearResult.comparisons << "}"
                  << ",\"binary\":{\"found\":" << (searchReport.binaryResult.found ? "true" : "false")
                  << ",\"index\":" << searchReport.binaryResult.index
                  << ",\"comparisons\":" << searchReport.binaryResult.comparisons << "}}";
        std::cout << ",\"sortDemo\":{\"text\":" << jsonString(sortOutput.str()) << "}}}\n";
        return 0;
    } catch (const std::exception& error) {
        std::cout.rdbuf(originalOutput);
        std::cerr << "Native C++ demo failed: " << error.what() << '\n';
        return 1;
    }
}
