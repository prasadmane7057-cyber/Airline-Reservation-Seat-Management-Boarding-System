
#include "SortComparison.h"
#include <iostream>
#include <vector>
#include <algorithm>
#include <chrono>
#include <random>
#include <iomanip>
using namespace std;

// Quick Sort
void quickSort(vector<int>& a, int low, int high) {
    if (low >= high) return;

    int pivot = a[high];
    int i = low - 1;

    for (int j = low; j < high; j++) {
        if (a[j] < pivot) {
            i++;
            swap(a[i], a[j]);
        }
    }

    swap(a[i + 1], a[high]);

    int p = i + 1;
    quickSort(a, low, p - 1);
    quickSort(a, p + 1, high);
}

// Merge Sort
void merge(vector<int>& a, int low, int mid, int high) {
    vector<int> temp;
    int i = low, j = mid + 1;

    while (i <= mid && j <= high) {
        if (a[i] < a[j])
            temp.push_back(a[i++]);
        else
            temp.push_back(a[j++]);
    }

    while (i <= mid)
        temp.push_back(a[i++]);

    while (j <= high)
        temp.push_back(a[j++]);

    for (int k = 0; k < temp.size(); k++)
        a[low + k] = temp[k];
}

void mergeSort(vector<int>& a, int low, int high) {
    if (low >= high) return;

    int mid = (low + high) / 2;

    mergeSort(a, low, mid);
    mergeSort(a, mid + 1, high);
    merge(a, low, mid, high);
}

// Function to calculate execution time
double calculateTime(vector<int> a, int choice) {
    auto start = chrono::high_resolution_clock::now();

    if (choice == 1)
        quickSort(a, 0, a.size() - 1);
    else
        mergeSort(a, 0, a.size() - 1);

    auto end = chrono::high_resolution_clock::now();

    return chrono::duration<double, milli>(end - start).count();
}

// Main comparison function
void runSortComparisonDemo() {
    int n = 5000;
    vector<int> randomData(n);

    mt19937 gen(100);
    uniform_int_distribution<int> dist(0, 100000);

    for (int i = 0; i < n; i++)
        randomData[i] = dist(gen);

    vector<int> sortedData = randomData;
    sort(sortedData.begin(), sortedData.end());

    vector<int> reverseData = sortedData;
    reverse(reverseData.begin(), reverseData.end());

    vector<vector<int>> datasets = {
        randomData, sortedData, reverseData
    };

    string names[] = {
        "Random Data",
        "Sorted Data",
        "Reverse Data"
    };

    cout << "\nQUICK SORT VS MERGE SORT\n";
    cout << "---------------------------------------------------------\n";
    cout << left << setw(18) << "Dataset"
         << setw(18) << "Quick Sort(ms)"
         << setw(18) << "Merge Sort(ms)" << endl;

    for (int i = 0; i < 3; i++) {
        double qTime = calculateTime(datasets[i], 1);
        double mTime = calculateTime(datasets[i], 2);

        cout << left << setw(18) << names[i]
             << setw(18) << fixed << setprecision(3) << qTime
             << setw(18) << mTime << endl;
    }

    cout << "---------------------------------------------------------\n";
}
