#ifndef BRESENHAM_H
#define BRESENHAM_H

#include <cstdlib>
#include <utility>
#include <vector>

// CGL Practical 2 - Bresenham's Line and Circle
// Returns lists of (x, y) points so any renderer (OpenGL, console, etc.)
// can plot them without this file depending on a graphics context.

// Draws a straight route segment between two airport coordinates
inline std::vector<std::pair<int, int>> bresenhamLine(int x0, int y0, int x1, int y1) {
    std::vector<std::pair<int, int>> points;

    int dx = std::abs(x1 - x0);
    int dy = -std::abs(y1 - y0);
    int sx = (x0 < x1) ? 1 : -1;
    int sy = (y0 < y1) ? 1 : -1;
    int error = dx + dy;
    int x = x0;
    int y = y0;

    while (true) {
        points.push_back(std::make_pair(x, y));
        if (x == x1 && y == y1) break;
        int doubledError = 2 * error;
        if (doubledError >= dy) { error += dy; x += sx; }
        if (doubledError <= dx) { error += dx; y += sy; }
    }
    return points;
}

// Draws an airport/gate node as a circle outline (midpoint circle algorithm,
// 8-way symmetry) centered at (xc, yc) with radius r
std::vector<std::pair<int, int>> bresenhamCircle(int xc, int yc, int r);

// Demo/test entry point, called from main.cpp
void runBresenhamDemo();

std::vector<std::pair<int, int>> bresenhamCircle(
    int xc, int yc, int radius
);

#endif
