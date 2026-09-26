#include <GL/freeglut.h>
#include <iostream>
#include <string>

using namespace std;

// Seat matrix
// 0 = Available
// 1 = Booked
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
// Draw text
// --------------------------------------------------
void drawText(float x, float y, string text)
{
    glRasterPos2f(x, y);

    for (char c : text)
    {
        glutBitmapCharacter(GLUT_BITMAP_HELVETICA_18, c);
    }
}

// --------------------------------------------------
// Draw one seat
// --------------------------------------------------
void drawSeat(float x, float y, int row, int col)
{
    float width = 55;
    float height = 40;

    // Available = green
    // Booked = red
    if (seats[row][col] == 0)
        glColor3f(0.2f, 0.8f, 0.2f);
    else
        glColor3f(0.9f, 0.2f, 0.2f);

    // Seat rectangle
    glBegin(GL_QUADS);

    glVertex2f(x, y);
    glVertex2f(x + width, y);
    glVertex2f(x + width, y + height);
    glVertex2f(x, y + height);

    glEnd();

    // Black border
    glColor3f(0.0f, 0.0f, 0.0f);

    glLineWidth(2);

    glBegin(GL_LINE_LOOP);

    glVertex2f(x, y);
    glVertex2f(x + width, y);
    glVertex2f(x + width, y + height);
    glVertex2f(x, y + height);

    glEnd();

    // Seat number
    string seatNumber;

    seatNumber += char('A' + row);
    seatNumber += char('1' + col);

    glColor3f(0.0f, 0.0f, 0.0f);

    drawText(x + 18, y + 13, seatNumber);
}

// --------------------------------------------------
// Display
// --------------------------------------------------
void display()
{
    glClear(GL_COLOR_BUFFER_BIT);

    // Title
    glColor3f(0.0f, 0.0f, 0.0f);

    drawText(180, 460, "AIRLINE SEAT MATRIX");

    // Starting position
    float startX = 80;
    float startY = 350;

    float gapX = 75;
    float gapY = 60;

    // Draw seats
    for (int i = 0; i < rows; i++)
    {
        for (int j = 0; j < cols; j++)
        {
            float x = startX + j * gapX;
            float y = startY - i * gapY;

            drawSeat(x, y, i, j);
        }
    }

    // Row labels
    for (int i = 0; i < rows; i++)
    {
        string label;
        label += char('A' + i);

        glColor3f(0.0f, 0.0f, 0.0f);

        drawText(45, startY + 12 - i * gapY, label);
    }

    // Column labels
    for (int j = 0; j < cols; j++)
    {
        string label;
        label += char('1' + j);

        glColor3f(0.0f, 0.0f, 0.0f);

        drawText(
            startX + 23 + j * gapX,
            385,
            label
        );
    }

    // Legend
    glColor3f(0.2f, 0.8f, 0.2f);

    glBegin(GL_QUADS);

    glVertex2f(100, 50);
    glVertex2f(130, 50);
    glVertex2f(130, 75);
    glVertex2f(100, 75);

    glEnd();

    glColor3f(0.0f, 0.0f, 0.0f);

    drawText(140, 55, "Available");

    glColor3f(0.9f, 0.2f, 0.2f);

    glBegin(GL_QUADS);

    glVertex2f(280, 50);
    glVertex2f(310, 50);
    glVertex2f(310, 75);
    glVertex2f(280, 75);

    glEnd();

    glColor3f(0.0f, 0.0f, 0.0f);

    drawText(320, 55, "Booked");

    glFlush();
}

// --------------------------------------------------
// Initialization
// --------------------------------------------------
void init()
{
    glClearColor(
        1.0f,
        1.0f,
        1.0f,
        1.0f
    );

    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();

    gluOrtho2D(
        0,
        600,
        0,
        500
    );

    glMatrixMode(GL_MODELVIEW);
    glLoadIdentity();
}

// --------------------------------------------------
// Main
// --------------------------------------------------
int main(int argc, char** argv)
{
    glutInit(&argc, argv);

    glutInitDisplayMode(
        GLUT_SINGLE | GLUT_RGB
    );

    glutInitWindowSize(
        600,
        500
    );

    glutInitWindowPosition(
        100,
        100
    );

    glutCreateWindow(
        "Airline Reservation - Seat Matrix"
    );

    init();

    glutDisplayFunc(display);

    glutMainLoop();

    return 0;
}
