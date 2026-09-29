/**
 * =========================================================================
 * AIRLINE RESERVATION & SEAT MANAGEMENT SYSTEM
 * Computer Graphics Component: Cabin Seat Matrix & Bresenham Line Rendering
 * Compatible with Code::Blocks, FreeGLUT, and OpenGL
 * =========================================================================
 */

#include <iostream>
#include <vector>
#include <cmath>

#ifdef __APPLE__
#include <GLUT/glut.h>
#else
#include <GL/glut.h>
#endif

// Seat Status Constants
enum SeatStatus { AVAILABLE, SELECTED, OCCUPIED, BLOCKED };

struct SeatVisual {
    std::string seatNum;
    int row;
    int col;
    SeatStatus status;
    float x, y, width, height;
};

std::vector<SeatVisual> cabinSeats;
int selectedCount = 0;

/**
 * Bresenham's Integer Line Drawing Algorithm
 * Draws smooth pixelated line between (x0, y0) and (x1, y1)
 */
void drawBresenhamLine(int x0, int y0, int x1, int y1) {
    glBegin(GL_POINTS);
    int dx = std::abs(x1 - x0);
    int dy = std::abs(y1 - y0);
    int sx = (x0 < x1) ? 1 : -1;
    int sy = (y0 < y1) ? 1 : -1;
    int err = dx - dy;

    while (true) {
        glVertex2i(x0, y0);
        if (x0 == x1 && y0 == y1) break;
        int e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
    }
    glEnd();
}

/**
 * Draw Text string using GLUT Bitmap Fonts
 */
void drawString(float x, float y, const std::string& text) {
    glRasterPos2f(x, y);
    for (char c : text) {
        glutBitmapCharacter(GLUT_BITMAP_HELVETICA_12, c);
    }
}

/**
 * Initialize Aircraft Cabin Seat Matrix Layout
 */
void initCabinLayout() {
    cabinSeats.clear();
    float startX = 140.0f;
    float startY = 500.0f;
    float seatW = 34.0f;
    float seatH = 34.0f;
    float gap = 8.0f;
    float aisleGap = 30.0f;

    // Generate Rows 1 to 10 for demonstration
    for (int r = 1; r <= 10; r++) {
        float curY = startY - (r - 1) * (seatH + gap);

        // Left 3 seats (A, B, C)
        for (int c = 0; c < 3; c++) {
            float curX = startX + c * (seatW + gap);
            char colLetter = 'A' + c;
            std::string num = std::to_string(r) + colLetter;
            
            SeatStatus st = AVAILABLE;
            if (r == 1 && c == 0) st = OCCUPIED;
            if (r == 3 && c == 1) st = BLOCKED;
            if (r == 6 && c == 0) st = SELECTED;

            cabinSeats.push_back({ num, r, c, st, curX, curY, seatW, seatH });
        }

        // Right 3 seats (D, E, F)
        for (int c = 3; c < 6; c++) {
            float curX = startX + 3 * (seatW + gap) + aisleGap + (c - 3) * (seatW + gap);
            char colLetter = 'A' + c;
            std::string num = std::to_string(r) + colLetter;

            SeatStatus st = AVAILABLE;
            if (r == 2 && c == 4) st = OCCUPIED;
            if (r == 4 && c == 5) st = OCCUPIED;

            cabinSeats.push_back({ num, r, c, st, curX, curY, seatW, seatH });
        }
    }
}

/**
 * OpenGL Display Callback
 */
void display() {
    glClear(GL_COLOR_BUFFER_BIT);

    // 1. Draw Fuselage Outer Border using Bresenham Lines
    glColor3f(0.2f, 0.3f, 0.4f);
    glPointSize(2.0f);
    // Left boundary
    drawBresenhamLine(100, 60, 100, 560);
    // Right boundary
    drawBresenhamLine(480, 60, 480, 560);
    // Cockpit nose curve lines
    drawBresenhamLine(100, 560, 290, 640);
    drawBresenhamLine(480, 560, 290, 640);
    // Tail bottom
    drawBresenhamLine(100, 60, 480, 60);

    // 2. Title & Headers
    glColor3f(0.05f, 0.15f, 0.3f);
    drawString(170, 650, "SKYWINGS AIRLINES - CABIN SEAT MAP");
    drawString(220, 600, "✈ COCKPIT / FRONT");

    // 3. Draw Seats
    for (const auto& seat : cabinSeats) {
        // Set Color according to status
        if (seat.status == AVAILABLE) {
            glColor3f(0.55f, 0.9f, 0.65f); // Soft Green
        } else if (seat.status == SELECTED) {
            glColor3f(0.96f, 0.62f, 0.04f); // Amber / Gold
        } else if (seat.status == OCCUPIED) {
            glColor3f(0.78f, 0.82f, 0.86f); // Slate Gray
        } else {
            glColor3f(0.95f, 0.45f, 0.45f); // Red Blocked
        }

        // Draw Filled Seat Rectangle
        glBegin(GL_QUADS);
        glVertex2f(seat.x, seat.y);
        glVertex2f(seat.x + seat.width, seat.y);
        glVertex2f(seat.x + seat.width, seat.y + seat.height);
        glVertex2f(seat.x, seat.y + seat.height);
        glEnd();

        // Draw Seat Border
        glColor3f(0.2f, 0.2f, 0.2f);
        glLineWidth(1.5f);
        glBegin(GL_LINE_LOOP);
        glVertex2f(seat.x, seat.y);
        glVertex2f(seat.x + seat.width, seat.y);
        glVertex2f(seat.x + seat.width, seat.y + seat.height);
        glVertex2f(seat.x, seat.y + seat.height);
        glEnd();

        // Draw Seat Number Text
        glColor3f(0.1f, 0.1f, 0.1f);
        drawString(seat.x + 8.0f, seat.y + 12.0f, seat.seatNum);
    }

    // 4. Draw Legend Box at bottom
    glColor3f(0.1f, 0.1f, 0.1f);
    drawString(110, 30, "LEGEND:  [Green: Available]   [Gold: Selected]   [Gray: Occupied]   [Red: Blocked]");

    glFlush();
}

/**
 * Mouse Click Interaction Callback (Toggles Seat Selection)
 */
void mouseClick(int button, int state, int x, int y) {
    if (button == GLUT_LEFT_BUTTON && state == GLUT_DOWN) {
        // Convert window coords to OpenGL coords (Invert Y)
        float glX = (float)x;
        float glY = (float)(700 - y);

        for (auto& seat : cabinSeats) {
            if (glX >= seat.x && glX <= seat.x + seat.width &&
                glY >= seat.y && glY <= seat.y + seat.height) {
                if (seat.status == AVAILABLE) {
                    seat.status = SELECTED;
                    std::cout << "Selected Seat: " << seat.seatNum << std::endl;
                } else if (seat.status == SELECTED) {
                    seat.status = AVAILABLE;
                    std::cout << "Deselected Seat: " << seat.seatNum << std::endl;
                } else {
                    std::cout << "Seat " << seat.seatNum << " cannot be selected (Occupied/Blocked)" << std::endl;
                }
                glutPostRedisplay();
                break;
            }
        }
    }
}

/**
 * Setup 2D Orthographic Projection
 */
void initGL() {
    glClearColor(0.96f, 0.98f, 1.0f, 1.0f); // Light blue background
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    gluOrtho2D(0.0, 600.0, 0.0, 700.0);
}

int main(int argc, char** argv) {
    std::cout << "=======================================================" << std::endl;
    std::cout << "   AIRLINE CABIN SEAT MAP - OPENGL / FREEGLUT CG DEMO" << std::endl;
    std::cout << "=======================================================" << std::endl;
    std::cout << "Controls: Left-click on any available seat to toggle selection." << std::endl;

    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_SINGLE | GLUT_RGB);
    glutInitWindowSize(600, 700);
    glutInitWindowPosition(150, 100);
    glutCreateWindow("Airline Cabin Seat Matrix & Bresenham Algorithm - CG Academic Practical");

    initGL();
    initCabinLayout();

    glutDisplayFunc(display);
    glutMouseFunc(mouseClick);

    // Run GLUT Main Event Loop
    glutMainLoop(); // Keeps the interactive OpenGL window open
    return 0;
}
