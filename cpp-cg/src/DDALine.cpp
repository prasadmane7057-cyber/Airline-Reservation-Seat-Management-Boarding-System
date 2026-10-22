#include "Bresenham.h"
#include <algorithm>
#include <cmath>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

using namespace std;

vector<pair<int, int>> ddaLine(int x0, int y0, int x1, int y1) {
    bool reverseOutput = x0 > x1 || (x0 == x1 && y0 > y1);
    if (reverseOutput) {
        swap(x0, x1);
        swap(y0, y1);
    }

    double dx = static_cast<double>(x1) - x0;
    double dy = static_cast<double>(y1) - y0;
    int steps = static_cast<int>(max(abs(dx), abs(dy)));
    vector<pair<int, int>> points;

    if (steps == 0) {
        points.push_back(make_pair(x0, y0));
    } else {
        double xIncrement = dx / steps;
        double yIncrement = dy / steps;
        double x = x0;
        double y = y0;

        for (int i = 0; i <= steps; ++i) {
            points.push_back(make_pair(static_cast<int>(lround(x)),
                                       static_cast<int>(lround(y))));
            x += xIncrement;
            y += yIncrement;
        }
        points.back() = make_pair(x1, y1);
    }

    if (reverseOutput) {
        reverse(points.begin(), points.end());
    }
    return points;
}

typedef vector<pair<int, int>> (*LineAlgorithm)(int, int, int, int);

bool samePixelsBothWays(LineAlgorithm algorithm, int x0, int y0, int x1, int y1) {
    vector<pair<int, int>> forward = algorithm(x0, y0, x1, y1);
    vector<pair<int, int>> backward = algorithm(x1, y1, x0, y0);
    sort(forward.begin(), forward.end());
    sort(backward.begin(), backward.end());
    return forward == backward;
}

void checkSeatGridLine(const string &name, int x0, int y0, int x1, int y1) {
    vector<pair<int, int>> ddaPoints = ddaLine(x0, y0, x1, y1);
    vector<pair<int, int>> bresenhamPoints = bresenhamLine(x0, y0, x1, y1);
    bool ddaMatches = samePixelsBothWays(ddaLine, x0, y0, x1, y1);
    bool bresenhamMatches = samePixelsBothWays(bresenhamLine, x0, y0, x1, y1);

    cout << name << " (" << x0 << "," << y0 << ") -> ("
         << x1 << "," << y1 << ")\n"
         << "  DDA:       " << ddaPoints.size() << " pixels; reverse draw "
         << (ddaMatches ? "matches" : "DIFFERS") << "\n"
         << "  Bresenham: " << bresenhamPoints.size() << " pixels; reverse draw "
         << (bresenhamMatches ? "matches" : "DIFFERS") << "\n";
}

int main() {
    cout << "Airline seat-grid line comparison: DDA vs. Bresenham\n"
         << "Pixel sets are checked in both endpoint directions.\n\n";

    checkSeatGridLine("Seat row", 2, 4, 22, 4);
    checkSeatGridLine("Center aisle", 12, 1, 12, 13);
    checkSeatGridLine("Angled aisle marking", 3, 2, 20, 12);

    cout << "\nAccuracy: both rasterize the ideal line to integer pixels; "
         << "rounding/tie rules can select different pixels.\n"
         << "Speed: Bresenham uses integer error updates and is typically faster; "
         << "DDA is simpler but uses floating-point increments and rounding.\n";

    bool allMatch =
        samePixelsBothWays(ddaLine, 2, 4, 22, 4) &&
        samePixelsBothWays(ddaLine, 12, 1, 12, 13) &&
        samePixelsBothWays(ddaLine, 3, 2, 20, 12) &&
        samePixelsBothWays(bresenhamLine, 2, 4, 22, 4) &&
        samePixelsBothWays(bresenhamLine, 12, 1, 12, 13) &&
        samePixelsBothWays(bresenhamLine, 3, 2, 20, 12);
    return allMatch ? 0 : 1;
}
