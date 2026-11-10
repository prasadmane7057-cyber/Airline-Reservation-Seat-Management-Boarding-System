# Quick Sort and Merge Sort Comparison

`cpp-ds/src/main.cpp` calls `runSortComparisonDemo()` to benchmark the two
algorithms on three 5,000-item datasets: deterministic random values, ascending
values, and descending values. Each displayed time is the average of five
independent runs. Every run verifies that both results are sorted and equal.

- **Quick sort:** median-of-three pivot selection and three-way partitioning;
  average `O(n log n)`, worst-case `O(n^2)`, and in-place apart from recursion.
- **Merge sort:** divide-and-merge with a reusable scratch vector; `O(n log n)`
  in all cases and `O(n)` auxiliary storage.

The measured milliseconds vary by machine and load; comparison output is
informational and does not claim that one algorithm wins every distribution.
