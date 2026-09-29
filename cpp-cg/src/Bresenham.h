#ifndef BRESENHAM_H
#define BRESENHAM_H

#include <vector>
#include <utility>

// CGL Practical 2 - Bresenham's Line and Circle
// Returns lists of (x, y) points so any renderer (OpenGL, console, etc.)
// can plot them without this file depending on a graphics context.

// Draws a straight route segment between two airport coordinates
std::vector<std::pair<int, int>> bresenhamLine(int x0, int y0, int x1, int y1);

// Draws an airport/gate node as a circle outline (midpoint circle algorithm,
// 8-way symmetry) centered at (xc, yc) with radius r
std::vector<std::pair<int, int>> bresenhamCircle(int xc, int yc, int r);

// Demo/test entry point, called from main.cpp
void runBresenhamDemo();


std::vector<std::pair<int, int>> bresenhamLine(
    int x0, int y0, int x1, int y1
);

std::vector<std::pair<int, int>> bresenhamCircle(
    int xc, int yc, int radius
);

#endif
