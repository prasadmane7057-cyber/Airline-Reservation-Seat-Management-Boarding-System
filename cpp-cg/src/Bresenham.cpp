#include <iostream>
#include <vector>
#include <utility>
#include <cmath>

using namespace std;

// =====================================================
// Bresenham Line Algorithm
// =====================================================
vector<pair<int, int>> bresenhamLine(
    int x0, int y0, int x1, int y1)
{
    vector<pair<int, int>> points;

    int dx = abs(x1 - x0);
    int dy = abs(y1 - y0);

    int sx = (x0 < x1) ? 1 : -1;
    int sy = (y0 < y1) ? 1 : -1;

    int err = dx - dy;

    int x = x0;
    int y = y0;

    while (true)
    {
        points.push_back({x, y});

        if (x == x1 && y == y1)
            break;

        int e2 = 2 * err;

        if (e2 > -dy)
        {
            err -= dy;
            x += sx;
        }

        if (e2 < dx)
        {
            err += dx;
            y += sy;
        }
    }

    return points;
}


// =====================================================
// Bresenham Circle Algorithm
// =====================================================
vector<pair<int, int>> bresenhamCircle(
    int xc, int yc, int r)
{
    vector<pair<int, int>> points;

    int x = 0;
    int y = r;

    int d = 3 - 2 * r;

    while (y >= x)
    {
        // 8-way symmetry

        points.push_back({xc + x, yc + y});
        points.push_back({xc - x, yc + y});
        points.push_back({xc + x, yc - y});
        points.push_back({xc - x, yc - y});

        points.push_back({xc + y, yc + x});
        points.push_back({xc - y, yc + x});
        points.push_back({xc + y, yc - x});
        points.push_back({xc - y, yc - x});

        x++;

        if (d > 0)
        {
            y--;
            d = d + 4 * (x - y) + 10;
        }
        else
        {
            d = d + 4 * x + 6;
        }
    }

    return points;
}


// =====================================================
// Main Function
// =====================================================
int main()
{
    cout << "========================================\n";
    cout << " CGL PRACTICAL 2\n";
    cout << " Bresenham Line and Circle Algorithm\n";
    cout << "========================================\n\n";


    // =================================================
    // LINE
    // =================================================

    cout << "--- Bresenham Line ---\n";

    cout << "Start Point : (50, 50)\n";
    cout << "End Point   : (200, 120)\n";

    vector<pair<int, int>> linePoints =
        bresenhamLine(50, 50, 200, 120);

    cout << "Total Points: "
         << linePoints.size() << "\n";

    cout << "First 5 Points: ";

    for (int i = 0;
         i < 5 && i < (int)linePoints.size();
         i++)
    {
        cout << "("
             << linePoints[i].first
             << ","
             << linePoints[i].second
             << ") ";
    }

    cout << "\n\n";


    // =================================================
    // CIRCLE
    // =================================================

    cout << "--- Bresenham Circle ---\n";

    cout << "Center : (200, 120)\n";
    cout << "Radius : 10\n";

    vector<pair<int, int>> circlePoints =
        bresenhamCircle(200, 120, 10);

    cout << "Total Points: "
         << circlePoints.size() << "\n";

    cout << "First 5 Points: ";

    for (int i = 0;
         i < 5 && i < (int)circlePoints.size();
         i++)
    {
        cout << "("
             << circlePoints[i].first
             << ","
             << circlePoints[i].second
             << ") ";
    }

    cout << "\n\n";


    // =================================================
    // DISPLAY ALL LINE POINTS
    // =================================================

    cout << "--- All Line Points ---\n";

    for (auto point : linePoints)
    {
        cout << "("
             << point.first
             << ","
             << point.second
             << ") ";
    }

    cout << "\n\n";


    // =================================================
    // DISPLAY ALL CIRCLE POINTS
    // =================================================

    cout << "--- Circle Points ---\n";

    for (auto point : circlePoints)
    {
        cout << "("
             << point.first
             << ","
             << point.second
             << ") ";
    }

    cout << "\n\n";

    cout << "========================================\n";
    cout << " Bresenham algorithms executed successfully.\n";
    cout << "========================================\n";

    return 0;
}
