#include "RouteMap.h"
#include "Bresenham.h"

#include <GL/freeglut.h>

// Draw route between two airports
void drawRoute(int x0, int y0, int x1, int y1)
{
    std::vector<std::pair<int, int>> points =
        bresenhamLine(x0, y0, x1, y1);

    // Route color
    glColor3f(0.2f, 0.6f, 1.0f);

    glBegin(GL_POINTS);

    for (const auto& p : points)
    {
        glVertex2i(p.first, p.second);
    }

    glEnd();
}

// Draw airport node
void drawAirportNode(int xc, int yc, int radius)
{
    std::vector<std::pair<int, int>> points =
        bresenhamCircle(xc, yc, radius);

    // Airport node color
    glColor3f(1.0f, 0.5f, 0.0f);

    glBegin(GL_POINTS);

    for (const auto& p : points)
    {
        glVertex2i(p.first, p.second);
    }

    glEnd();
}