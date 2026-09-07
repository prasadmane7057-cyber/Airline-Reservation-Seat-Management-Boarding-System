#include "Bresenham.h"
#include <cmath>
#include <iostream>

using namespace std;

// ---------- Bresenham's Line Algorithm ----------
vector<pair<int, int>> bresenhamLine(int x0, int y0, int x1, int y1) {
    vector<pair<int, int>> points;

    int dx = abs(x1 - x0);
    int dy = -abs(y1 - y0);
    int sx = (x0 < x1) ? 1 : -1;
    int sy = (y0 < y1) ? 1 : -1;
    int err = dx + dy; // error value

    int x = x0, y = y0;
    while (true) {
        points.push_back(make_pair(x, y));
        if (x == x1 && y == y1) break;
        int e2 = 2 * err;
        if (e2 >= dy) { err += dy; x += sx; }
        if (e2 <= dx) { err += dx; y += sy; }
    }
    return points;
}

// ---------- Midpoint Circle Algorithm (8-way symmetry) ----------
vector<pair<int, int>> bresenhamCircle(int xc, int yc, int r) {
    vector<pair<int, int>> points;

    int x = 0, y = r;
    int d = 3 - 2 * r; // initial decision parameter

    auto plotSymmetricPoints = [&](int x, int y) {
        points.push_back(make_pair(xc + x, yc + y));
        points.push_back(make_pair(xc - x, yc + y));
        points.push_back(make_pair(xc + x, yc - y));
        points.push_back(make_pair(xc - x, yc - y));
        points.push_back(make_pair(xc + y, yc + x));
        points.push_back(make_pair(xc - y, yc + x));
        points.push_back(make_pair(xc + y, yc - x));
        points.push_back(make_pair(xc - y, yc - x));
    };

    plotSymmetricPoints(x, y);
    while (y >= x) {
        x++;
        if (d > 0) {
            y--;
            d = d + 4 * (x - y) + 10;
        } else {
            d = d + 4 * x + 6;
        }
        plotSymmetricPoints(x, y);
    }
    return points;
}

// ---------- demo/test function called from main.cpp ----------
void runBresenhamDemo() {
    cout << "=== CGL Practical 2: Bresenham Line & Circle ===\n\n";

    // Route segment between two airport coordinates (e.g. Mumbai -> Delhi, scaled to screen space)
    cout << "--- Route line from (50,50) to (200,120) ---\n";
    auto linePoints = bresenhamLine(50, 50, 200, 120);
    cout << "Total points on line: " << linePoints.size() << "\n";
    cout << "First 5 points: ";
    for (size_t i = 0; i < 5 && i < linePoints.size(); i++) {
        cout << "(" << linePoints[i].first << "," << linePoints[i].second << ") ";
    }
    cout << "\n\n";

    // Airport/gate node as a circle
    cout << "--- Airport node circle at (200,120), radius 10 ---\n";
    auto circlePoints = bresenhamCircle(200, 120, 10);
    cout << "Total points on circle: " << circlePoints.size() << "\n";
    cout << "First 5 points: ";
    for (size_t i = 0; i < 5 && i < circlePoints.size(); i++) {
        cout << "(" << circlePoints[i].first << "," << circlePoints[i].second << ") ";
    }
    cout << "\n\n";
    cout << "Pass these point lists to your OpenGL renderer (RouteMap.cpp) as GL_POINTS.\n";
}