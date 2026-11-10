#include "SearchComparison.h"
#include <algorithm>
#include <iomanip>
#include <sstream>
#include <cmath>

SearchResult SearchComparison::linearSearch(const std::vector<PassengerSearchRecord>& dataset, const std::string& targetPNR) {
    SearchResult result;
    result.algorithm = "Linear Search (Sequential Scan)";
    result.targetPNR = targetPNR;
    result.found = false;
    result.index = -1;
    result.comparisons = 0;

    auto startTime = std::chrono::high_resolution_clock::now();

    for (size_t i = 0; i < dataset.size(); ++i) {
        result.comparisons++;
        
        std::ostringstream ss;
        ss << "Index [" << i << "]: Checking PNR '" << dataset[i].pnr 
           << "' against target '" << targetPNR << "'";

        if (dataset[i].pnr == targetPNR) {
            ss << " -> MATCH FOUND!";
            result.stepTrace.push_back(ss.str());
            result.found = true;
            result.index = static_cast<int>(i);
            break;
        } else {
            ss << " -> No match (continue scan)";
            if (result.stepTrace.size() < 12 || i == dataset.size() - 1) {
                result.stepTrace.push_back(ss.str());
            } else if (result.stepTrace.size() == 12) {
                result.stepTrace.push_back("... [Intermediate sequential steps collapsed] ...");
            }
        }
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double, std::micro> elapsed = endTime - startTime;
    result.timeMicroseconds = elapsed.count();

    return result;
}

SearchResult SearchComparison::binarySearch(const std::vector<PassengerSearchRecord>& sortedDataset, const std::string& targetPNR) {
    SearchResult result;
    result.algorithm = "Binary Search (Divide & Conquer)";
    result.targetPNR = targetPNR;
    result.found = false;
    result.index = -1;
    result.comparisons = 0;

    if (sortedDataset.empty()) {
        return result;
    }

    auto startTime = std::chrono::high_resolution_clock::now();

    int low = 0;
    int high = static_cast<int>(sortedDataset.size()) - 1;
    int step = 1;

    while (low <= high) {
        int mid = low + (high - low) / 2;
        result.comparisons++;

        const std::string& currentPNR = sortedDataset[mid].pnr;
        std::ostringstream ss;
        ss << "Step " << step++ << ": Range [" << low << ".." << high 
           << "], Mid = " << mid << " ('" << currentPNR << "')";

        if (currentPNR == targetPNR) {
            ss << " == Target -> KEY FOUND!";
            result.stepTrace.push_back(ss.str());
            result.found = true;
            result.index = mid;
            break;
        } else if (currentPNR < targetPNR) {
            ss << " < Target -> Search RIGHT half [" << (mid + 1) << ".." << high << "]";
            result.stepTrace.push_back(ss.str());
            low = mid + 1;
        } else {
            ss << " > Target -> Search LEFT half [" << low << ".." << (mid - 1) << "]";
            result.stepTrace.push_back(ss.str());
            high = mid - 1;
        }
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double, std::micro> elapsed = endTime - startTime;
    result.timeMicroseconds = elapsed.count();

    return result;
}

SearchComparisonReport SearchComparison::compare(const std::vector<PassengerSearchRecord>& dataset, const std::string& targetPNR) {
    SearchComparisonReport report;
    report.datasetSize = dataset.size();

    // 1. Run Linear Search on dataset
    report.linearResult = linearSearch(dataset, targetPNR);

    // 2. Ensure dataset is sorted by PNR for Binary Search
    std::vector<PassengerSearchRecord> sortedDataset = dataset;
    std::sort(sortedDataset.begin(), sortedDataset.end(), 
              [](const PassengerSearchRecord& a, const PassengerSearchRecord& b) {
                  return a.pnr < b.pnr;
              });

    // 3. Run Binary Search on sorted dataset
    report.binaryResult = binarySearch(sortedDataset, targetPNR);

    // Theoretical metrics
    report.theoreticalLinearAvg = (dataset.size() + 1.0) / 2.0;
    report.theoreticalBinaryWorst = std::floor(std::log2(static_cast<double>(dataset.size()))) + 1.0;
    
    if (report.binaryResult.comparisons > 0) {
        report.comparisonRatio = static_cast<double>(report.linearResult.comparisons) / 
                                 static_cast<double>(report.binaryResult.comparisons);
    } else {
        report.comparisonRatio = 1.0;
    }

    return report;
}

std::vector<PassengerSearchRecord> SearchComparison::generateSampleDataset(size_t count) {
    std::vector<PassengerSearchRecord> list;
    list.reserve(count);

    const std::string names[] = {
        "Aarav Sharma", "Sneha Iyer", "Rohan Mehta", "Priya Desai",
        "Vikram Rao", "Ananya Verma", "Karan Malhotra", "Tanvi Shah",
        "Aditya Sen", "Ramesh Patel", "Neha Joshi", "Deepak Nair",
        "Siddharth Rao", "Kavita Reddy", "Manish Kapoor", "Pooja Hegde"
    };
    const std::string flights[] = { "AI101", "AI202", "AI303", "AI404", "AI505" };
    const std::string classes[] = { "Economy", "Business", "FirstClass" };

    for (size_t i = 0; i < count; ++i) {
        std::ostringstream pnrStream;
        // Deterministic alphanumeric PNR generation
        char c1 = 'A' + (i % 26);
        char c2 = 'A' + ((i / 26) % 26);
        int num = 1000 + (static_cast<int>(i) * 37) % 9000;
        pnrStream << c1 << c2 << num;

        std::string pnr = pnrStream.str();
        std::string name = names[i % 16];
        std::string flight = flights[i % 5];
        std::string seat = std::to_string((i % 30) + 1) + static_cast<char>('A' + (i % 6));
        double fare = 4000.0 + (i % 8) * 750.0;

        list.emplace_back(pnr, name, flight, seat, fare);
    }

    // Sort initially by PNR for consistent ordering
    std::sort(list.begin(), list.end(), 
              [](const PassengerSearchRecord& a, const PassengerSearchRecord& b) {
                  return a.pnr < b.pnr;
              });

    return list;
}

void SearchComparison::printReport(const SearchComparisonReport& report) {
    std::cout << "\n====================================================================\n";
    std::cout << "        AIRLINE SEARCH BENCHMARK: LINEAR VS BINARY SEARCH           \n";
    std::cout << "====================================================================\n";
    std::cout << "Dataset Records       : " << report.datasetSize << " passengers\n";
    std::cout << "Target PNR Searched   : " << report.linearResult.targetPNR << "\n\n";

    std::cout << "1. LINEAR SEARCH EXECUTION:\n";
    std::cout << "   - Status           : " << (report.linearResult.found ? "FOUND" : "NOT FOUND") << "\n";
    std::cout << "   - Index Position   : " << report.linearResult.index << "\n";
    std::cout << "   - Comparisons Made : " << report.linearResult.comparisons 
              << " (Theoretical Avg: " << report.theoreticalLinearAvg << ")\n";
    std::cout << "   - Time Elapsed     : " << std::fixed << std::setprecision(3) 
              << report.linearResult.timeMicroseconds << " microseconds\n";
    std::cout << "   - Step Trace Preview:\n";
    for (const auto& step : report.linearResult.stepTrace) {
        std::cout << "       * " << step << "\n";
    }

    std::cout << "\n2. BINARY SEARCH EXECUTION:\n";
    std::cout << "   - Status           : " << (report.binaryResult.found ? "FOUND" : "NOT FOUND") << "\n";
    std::cout << "   - Index Position   : " << report.binaryResult.index << "\n";
    std::cout << "   - Comparisons Made : " << report.binaryResult.comparisons 
              << " (Theoretical Worst: " << report.theoreticalBinaryWorst << ")\n";
    std::cout << "   - Time Elapsed     : " << std::fixed << std::setprecision(3) 
              << report.binaryResult.timeMicroseconds << " microseconds\n";
    std::cout << "   - Step-by-Step Divide & Conquer Trace:\n";
    for (const auto& step : report.binaryResult.stepTrace) {
        std::cout << "       * " << step << "\n";
    }

    std::cout << "\n3. EFFICIENCY COMPARISON SUMMARY:\n";
    std::cout << "   +---------------------+-------------------+-------------------+\n";
    std::cout << "   | Metric              | Linear Search     | Binary Search     |\n";
    std::cout << "   +---------------------+-------------------+-------------------+\n";
    std::cout << "   | Time Complexity     | O(n)              | O(log n)          |\n";
    std::cout << "   | Space Complexity    | O(1)              | O(1) iterative    |\n";
    std::cout << "   | Array Prerequisite  | Unsorted or Sorted| Strictly Sorted   |\n";
    std::cout << "   | Comparisons Count   | " << std::setw(17) << report.linearResult.comparisons 
              << " | " << std::setw(17) << report.binaryResult.comparisons << " |\n";
    std::cout << "   | Reduction Factor    | 1.0x (Baseline)   | " 
              << std::setw(15) << std::setprecision(1) << report.comparisonRatio << "x fewer  |\n";
    std::cout << "   +---------------------+-------------------+-------------------+\n";
    std::cout << "====================================================================\n\n";
}

void runSearchComparisonDemo() {
    auto dataset = SearchComparison::generateSampleDataset(32);
    
    // Test 1: Element near end of array to show drastic reduction
    std::string testPnr = dataset[28].pnr;
    auto report1 = SearchComparison::compare(dataset, testPnr);
    SearchComparison::printReport(report1);

    // Test 2: Element not found
    auto report2 = SearchComparison::compare(dataset, "ZZ9999");
    SearchComparison::printReport(report2);
}
