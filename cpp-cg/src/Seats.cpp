#include <GL/freeglut.h>

// 0 = Available, 1 = Booked
int seats[6][6] =
{
    {0, 1, 0, 0, 1, 0},
    {0, 0, 0, 1, 0, 0},
    {1, 0, 0, 0, 0, 1},
    {0, 0, 1, 0, 0, 0},
    {0, 1, 0, 0, 1, 0},
    {0, 0, 0, 0, 0, 0}
};

const int rows = 6;
const int cols = 6;

// --------------------------------------------------
// Passenger seat
// --------------------------------------------------
void drawPassengerSeat(float x, float y, int row, int col, bool business)
{
    float width = 20.0f;
    float height = 12.0f;

    // Red = booked, purple = business, green = economy
    if (seats[row][col] == 1)
        glColor3f(0.90f, 0.15f, 0.15f);
    else if (business)
        glColor3f(0.65f, 0.30f, 0.90f);
    else
        glColor3f(0.20f, 0.75f, 0.30f);

    glBegin(GL_QUADS);
        glVertex2f(x, y);
        glVertex2f(x + width, y);
        glVertex2f(x + width, y + height);
        glVertex2f(x, y + height);
    glEnd();

    glColor3f(0.05f, 0.05f, 0.05f);

    glBegin(GL_LINE_LOOP);
        glVertex2f(x, y);
        glVertex2f(x + width, y);
        glVertex2f(x + width, y + height);
        glVertex2f(x, y + height);
    glEnd();
}

// --------------------------------------------------
// Pilot seat - dark blue
// --------------------------------------------------
void drawPilotSeat(float x, float y)
{
    float width = 22.0f;
    float height = 16.0f;

    glColor3f(0.10f, 0.25f, 0.75f);

    glBegin(GL_QUADS);
        glVertex2f(x, y);
        glVertex2f(x + width, y);
        glVertex2f(x + width, y + height);
        glVertex2f(x, y + height);
    glEnd();

    glColor3f(1.0f, 1.0f, 1.0f);

    glBegin(GL_LINE_LOOP);
        glVertex2f(x, y);
        glVertex2f(x + width, y);
        glVertex2f(x + width, y + height);
        glVertex2f(x, y + height);
    glEnd();
}

// --------------------------------------------------
// Crew / emergency jump seat - orange
// --------------------------------------------------
void drawCrewSeat(float x, float y)
{
    float width = 18.0f;
    float height = 12.0f;

    glColor3f(1.0f, 0.55f, 0.05f);

    glBegin(GL_QUADS);
        glVertex2f(x, y);
        glVertex2f(x + width, y);
        glVertex2f(x + width, y + height);
        glVertex2f(x, y + height);
    glEnd();

    glColor3f(0.05f, 0.05f, 0.05f);

    glBegin(GL_LINE_LOOP);
        glVertex2f(x, y);
        glVertex2f(x + width, y);
        glVertex2f(x + width, y + height);
        glVertex2f(x, y + height);
    glEnd();
}

// --------------------------------------------------
// Complete airplane seat map
// --------------------------------------------------
void drawSeats()
{
    // ==================================================
    // 1. PILOT / COCKPIT - front/nose of aircraft
    // ==================================================
    drawPilotSeat(55.0f, 315.0f);
    drawPilotSeat(55.0f, 270.0f);

    // ==================================================
    // 2. BUSINESS CLASS - 2 + 2
    // ==================================================
    float businessStartX = 125.0f;

    for (int row = 0; row < 4; row++)
    {
        float x = businessStartX + row * 48.0f;
        int matrixRow = row % rows;

        // Left side
        drawPassengerSeat(x, 320.0f, matrixRow, 0, true);
        drawPassengerSeat(x, 300.0f, matrixRow, 1, true);

        // Aisle

        // Right side
        drawPassengerSeat(x, 275.0f, matrixRow, 2, true);
        drawPassengerSeat(x, 255.0f, matrixRow, 3, true);
    }

    // ==================================================
    // 3. ECONOMY CLASS - 3 + 3 across the long fuselage
    // ==================================================
    float economyStartX = 390.0f;

    for (int row = 0; row < 9; row++)
    {
        float x = economyStartX + row * 48.0f;
        int matrixRow = row % rows;

        // Left side of aisle
        drawPassengerSeat(x, 327.0f, matrixRow, 0, false);
        drawPassengerSeat(x, 312.0f, matrixRow, 1, false);
        drawPassengerSeat(x, 297.0f, matrixRow, 2, false);

        // Right side of aisle
        drawPassengerSeat(x, 282.0f, matrixRow, 3, false);
        drawPassengerSeat(x, 267.0f, matrixRow, 4, false);
        drawPassengerSeat(x, 252.0f, matrixRow, 5, false);
    }

    // ==================================================
    // 4. CREW / EMERGENCY JUMP SEATS
    // ==================================================
    drawCrewSeat(350.0f, 320.0f);
    drawCrewSeat(350.0f, 255.0f);

    drawCrewSeat(825.0f, 320.0f);
    drawCrewSeat(825.0f, 255.0f);

    // ==================================================
    // 5. AISLES
    // ==================================================
    glColor3f(0.75f, 0.75f, 0.75f);

    // Business aisle
    glBegin(GL_LINES);
        glVertex2f(120.0f, 289.0f);
        glVertex2f(330.0f, 289.0f);
    glEnd();

    // Economy aisle
    glBegin(GL_LINES);
        glVertex2f(385.0f, 289.0f);
        glVertex2f(815.0f, 289.0f);
    glEnd();
}
