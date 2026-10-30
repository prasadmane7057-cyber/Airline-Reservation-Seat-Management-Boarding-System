#include "LineClipping.h"

#include <cmath>
#include <iostream>
#include <string>

namespace {

const ClipWindow WINDOW = {0.0, 0.0, 10.0, 10.0};
const double EPSILON = 1e-9;

bool near(double actual, double expected) {
    return std::abs(actual - expected) <= EPSILON;
}

bool checkAccepted(const std::string& name, const ClipLine& input,
                   const ClipLine& expected, int expectedIterations) {
    const ClipResult result = cohenSutherlandClip(input, WINDOW);
    const bool passed = result.status == ClipStatus::Accepted &&
        near(result.line.x1, expected.x1) && near(result.line.y1, expected.y1) &&
        near(result.line.x2, expected.x2) && near(result.line.y2, expected.y2) &&
        result.iterations == expectedIterations;

    std::cout << (passed ? "[PASS] " : "[FAIL] ") << name;
    if (result.status == ClipStatus::Accepted) {
        std::cout << " -> (" << result.line.x1 << ", " << result.line.y1
                  << ") to (" << result.line.x2 << ", " << result.line.y2
                  << "), clips=" << result.iterations;
    }
    std::cout << '\n';
    return passed;
}

bool checkRejected(const std::string& name, const ClipLine& input) {
    const ClipResult result = cohenSutherlandClip(input, WINDOW);
    const bool passed = result.status == ClipStatus::Rejected;
    std::cout << (passed ? "[PASS] " : "[FAIL] ") << name
              << " -> " << (passed ? "trivially rejected" : "not rejected") << '\n';
    return passed;
}

bool checkInvalidWindow() {
    const ClipWindow invalidWindow = {10.0, 0.0, 0.0, 10.0};
    const ClipResult result = cohenSutherlandClip({1.0, 1.0, 9.0, 9.0}, invalidWindow);
    const bool passed = result.status == ClipStatus::InvalidInput;
    std::cout << (passed ? "[PASS] " : "[FAIL] ")
              << "rejects an invalid clipping window\n";
    return passed;
}

} // namespace

int main() {
    std::cout << "CGL Practical: Cohen-Sutherland Line Clipping\n"
              << "Clipping window: x=[0, 10], y=[0, 10]\n";

    int passed = 0;
    passed += checkAccepted("crossing route",
        {-5.0, 5.0, 15.0, 5.0}, {0.0, 5.0, 10.0, 5.0}, 2);
    passed += checkAccepted("diagonal through all four boundaries",
        {-5.0, -5.0, 15.0, 15.0}, {0.0, 0.0, 10.0, 10.0}, 2);
    passed += checkAccepted("line already inside",
        {2.0, 3.0, 8.0, 7.0}, {2.0, 3.0, 8.0, 7.0}, 0);
    passed += checkAccepted("vertical crossing route",
        {4.0, -3.0, 4.0, 13.0}, {4.0, 0.0, 4.0, 10.0}, 2);
    passed += checkAccepted("line on clipping boundary",
        {0.0, -2.0, 0.0, 12.0}, {0.0, 0.0, 0.0, 10.0}, 2);
    passed += checkRejected("segment outside the window",
        {-5.0, 12.0, 15.0, 14.0});
    passed += checkInvalidWindow();

    std::cout << passed << "/7 clipping checks passed.\n";
    return passed == 7 ? 0 : 1;
}
