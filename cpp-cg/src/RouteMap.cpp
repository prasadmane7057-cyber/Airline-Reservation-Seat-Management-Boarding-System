#include "RouteMap.h"
#include "Bresenham.h"
#include <GL/freeglut.h>

void drawRoute(int x0, int y0, int x1, int y1) {
    auto points = bresenhamLine(x0, y0, x1, y1);
    glColor3f(0.2f, 0.6f, 1.0f);
    glBegin(GL_POINTS);
    for (auto &p : points) {
        glVertex2i(p.first, p.second);
    }
    glEnd();
}

void drawAirportNode(int xc, int yc, int radius) {
    auto points = bresenhamCircle(xc, yc, radius);
    glColor3f(1.0f, 0.5f, 0.0f);
    glBegin(GL_POINTS);
    for (auto &p : points) {
        glVertex2i(p.first, p.second);
    }
    glEnd();
}
