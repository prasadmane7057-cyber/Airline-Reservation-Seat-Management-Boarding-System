#include "SortComparison.h"

#include <algorithm>
#include <chrono>
#include <cstddef>
#include <iomanip>
#include <iostream>
#include <random>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

namespace {

using Clock = std::chrono::steady_clock;
constexpr int BENCHMARK_RUNS = 5;

int medianOfThree(int first, int middle, int last) {
    if (first < middle) {
        if (middle < last) return middle;
        return first < last ? last : first;
    }
    if (first < last) return first;
    return middle < last ? last : middle;
}

void quickSort(std::vector<int>& values, std::ptrdiff_t low, std::ptrdiff_t high) {
    while (low < high) {
        const auto middle = low + (high - low) / 2;
        const int pivot = medianOfThree(values[low], values[middle], values[high]);
        std::ptrdiff_t less = low;
        std::ptrdiff_t current = low;
        std::ptrdiff_t greater = high;

        while (current <= greater) {
            if (values[current] < pivot) {
                std::swap(values[less++], values[current++]);
            } else if (values[current] > pivot) {
                std::swap(values[current], values[greater--]);
            } else {
                ++current;
            }
        }

        if (less - low < high - greater) {
            quickSort(values, low, less - 1);
            low = greater + 1;
        } else {
            quickSort(values, greater + 1, high);
            high = less - 1;
        }
    }
}

void mergeSort(std::vector<int>& values, std::vector<int>& scratch,
               std::size_t begin, std::size_t end) {
    if (end - begin < 2) return;

    const std::size_t middle = begin + (end - begin) / 2;
    mergeSort(values, scratch, begin, middle);
    mergeSort(values, scratch, middle, end);

    std::size_t left = begin;
    std::size_t right = middle;
    std::size_t output = begin;
    while (left < middle && right < end) {
        scratch[output++] = values[left] <= values[right]
            ? values[left++] : values[right++];
    }
    while (left < middle) scratch[output++] = values[left++];
    while (right < end) scratch[output++] = values[right++];
    std::copy(scratch.begin() + static_cast<std::ptrdiff_t>(begin),
              scratch.begin() + static_cast<std::ptrdiff_t>(end),
              values.begin() + static_cast<std::ptrdiff_t>(begin));
}

struct Dataset {
    std::string name;
    std::vector<int> values;
};

struct BenchmarkResult {
    double quickSortMilliseconds;
    double mergeSortMilliseconds;
    bool quickSortCorrect;
    bool mergeSortCorrect;
};

BenchmarkResult benchmark(const std::vector<int>& input) {
    double quickSortTotal = 0.0;
    double mergeSortTotal = 0.0;
    bool quickSortCorrect = true;
    bool mergeSortCorrect = true;

    for (int run = 0; run < BENCHMARK_RUNS; ++run) {
        std::vector<int> quickValues = input;
        auto start = Clock::now();
        if (!quickValues.empty()) {
            quickSort(quickValues, 0, static_cast<std::ptrdiff_t>(quickValues.size() - 1));
        }
        quickSortTotal += std::chrono::duration<double, std::milli>(Clock::now() - start).count();
        quickSortCorrect = quickSortCorrect && std::is_sorted(quickValues.begin(), quickValues.end());

        std::vector<int> mergeValues = input;
        std::vector<int> scratch(mergeValues.size());
        start = Clock::now();
        mergeSort(mergeValues, scratch, 0, mergeValues.size());
        mergeSortTotal += std::chrono::duration<double, std::milli>(Clock::now() - start).count();
        mergeSortCorrect = mergeSortCorrect && std::is_sorted(mergeValues.begin(), mergeValues.end());
        quickSortCorrect = quickSortCorrect && quickValues == mergeValues;
    }

    return {
        quickSortTotal / BENCHMARK_RUNS,
        mergeSortTotal / BENCHMARK_RUNS,
        quickSortCorrect,
        mergeSortCorrect
    };
}

} // namespace

void runSortComparisonDemo() {
    constexpr std::size_t DATASET_SIZE = 5000;
    std::mt19937 generator(20261109);
    std::uniform_int_distribution<int> distribution(0, 100000);
    std::vector<int> randomValues(DATASET_SIZE);
    for (int& value : randomValues) value = distribution(generator);

    std::vector<int> sortedValues(DATASET_SIZE);
    for (std::size_t i = 0; i < DATASET_SIZE; ++i) {
        sortedValues[i] = static_cast<int>(i);
    }
    std::vector<int> reverseValues(sortedValues.rbegin(), sortedValues.rend());

    const std::vector<Dataset> datasets = {
        {"Random data", std::move(randomValues)},
        {"Already sorted", std::move(sortedValues)},
        {"Reverse sorted", std::move(reverseValues)}
    };

    std::cout << "\n============================================================\n"
              << "         QUICK SORT VS MERGE SORT (5-RUN AVERAGES)\n"
              << "============================================================\n"
              << std::left << std::setw(18) << "Dataset"
              << std::right << std::setw(10) << "Items"
              << std::setw(18) << "Quick sort (ms)"
              << std::setw(18) << "Merge sort (ms)"
              << "  Correct\n";

    for (const Dataset& dataset : datasets) {
        const BenchmarkResult result = benchmark(dataset.values);
        std::cout << std::left << std::setw(18) << dataset.name
                  << std::right << std::setw(10) << dataset.values.size()
                  << std::setw(18) << std::fixed << std::setprecision(3)
                  << result.quickSortMilliseconds
                  << std::setw(18) << result.mergeSortMilliseconds
                  << "  " << (result.quickSortCorrect && result.mergeSortCorrect ? "yes" : "NO")
                  << '\n';
        if (!result.quickSortCorrect || !result.mergeSortCorrect) {
            throw std::runtime_error("Sort comparison failed to produce matching sorted datasets.");
        }
    }
    std::cout << "============================================================\n";
}
