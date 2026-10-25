// FloodFill.cpp | CGL (Computer Graphics Lab) | CO3: Develop 2D objects using various algorithms
// Syllabus link: Practical 3 "fill the polygon" - further practice: flood fill algorithm.
// Scenario: seat icons of the aircraft. A seat is filled with a colour showing its state:
//           Available = green, Selected = yellow, Booked = red.
// How to use: press 1 / 2 / 3 to choose the state, then LEFT-CLICK a seat to fill it.
//             R = reset all seats to Available, ESC = quit.
// Build: g++ FloodFill.cpp -o FloodFill -lglut -lGLU -lGL
#include <GL/glut.h>
#include <cstdio>
#include <cstdlib>
#include <stack>
using namespace std;

const int WIDTH  = 360;
const int HEIGHT = 240;

// ---------- Colours ----------
struct Color { unsigned char r, g, b; };
const Color BACKGROUND = {255, 255, 255};   // white
const Color BOUNDARY   = {  0,   0,   0};   // black outline of every seat
const Color AVAILABLE  = { 80, 200,  80};   // green
const Color SELECTED   = {250, 210,  40};   // yellow
const Color BOOKED     = {220,  60,  60};   // red

Color canvas[HEIGHT][WIDTH];                // our own picture; (0,0) is the bottom-left pixel
Color currentColor = SELECTED;
const char* currentName = "SELECTED";

bool same(Color a, Color b) { return a.r == b.r && a.g == b.g && a.b == b.b; }

// ---------- Drawing the seat outlines ----------
void clearCanvas() {
    for (int y = 0; y < HEIGHT; y++)
        for (int x = 0; x < WIDTH; x++)
            canvas[y][x] = BACKGROUND;
}

// Draws only the 4 edges of a rectangle in the boundary colour.
void drawSeatOutline(int x, int y, int w, int h) {
    for (int i = 0; i < w; i++) { canvas[y][x + i] = BOUNDARY; canvas[y + h - 1][x + i] = BOUNDARY; }
    for (int j = 0; j < h; j++) { canvas[y + j][x] = BOUNDARY; canvas[y + j][x + w - 1] = BOUNDARY; }
}

// ---------- Flood fill (4-connected, uses a stack instead of recursion) ----------
// Starts at the seed pixel and spreads to up/down/left/right neighbours that still
// have the OLD colour. It stops at the boundary because the boundary has a different colour.
void floodFill(int seedX, int seedY, Color newColor) {
    Color oldColor = canvas[seedY][seedX];
    if (same(oldColor, newColor)) return;          // already this colour, nothing to do
    if (same(oldColor, BOUNDARY))  return;         // the seed is on an outline, never fill the outline

    stack< pair<int,int> > st;
    st.push(make_pair(seedX, seedY));
    while (!st.empty()) {
        pair<int,int> p = st.top();
        st.pop();
        int x = p.first, y = p.second;
        if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) continue;   // outside the picture
        if (!same(canvas[y][x], oldColor)) continue;                 // boundary or already filled
        canvas[y][x] = newColor;
        st.push(make_pair(x + 1, y));
        st.push(make_pair(x - 1, y));
        st.push(make_pair(x, y + 1));
        st.push(make_pair(x, y - 1));
    }
}

// ---------- Seat layout: 4 rows x (3 + aisle + 3) seats ----------
const int SEAT = 40, GAP = 12, AISLE = 40, LEFT = 16, BOTTOM = 14;
const int ROWS = 4, COLS = 6;

int seatX(int col) {                        // columns 0-2 are left of the aisle, 3-5 are right of it
    int x = LEFT + col * (SEAT + GAP);
    if (col >= 3) x += AISLE - GAP;
    return x;
}
int seatY(int row) { return BOTTOM + row * (SEAT + GAP); }

void buildSeats() {
    clearCanvas();
    for (int r = 0; r < ROWS; r++)
        for (int c = 0; c < COLS; c++)
            drawSeatOutline(seatX(c), seatY(r), SEAT, SEAT);
    // start with every seat Available: flood fill from the centre of each seat
    for (int r = 0; r < ROWS; r++)
        for (int c = 0; c < COLS; c++)
            floodFill(seatX(c) + SEAT / 2, seatY(r) + SEAT / 2, AVAILABLE);
}

// Called when the user clicks. The seats are always filled with a colour, so a click that
// lands on white (the aisle or outside the plane) or on an outline is ignored.
void fillAt(int x, int y, Color newColor) {
    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
    if (same(canvas[y][x], BACKGROUND) || same(canvas[y][x], BOUNDARY)) return;
    floodFill(x, y, newColor);
}

// ---------- OpenGL part ----------
void showTitle() {
    char title[120];
    sprintf(title, "Flood Fill Seats | state: %s | 1=Available 2=Selected 3=Booked R=Reset", currentName);
    glutSetWindowTitle(title);
}

void display() {
    glClear(GL_COLOR_BUFFER_BIT);
    glRasterPos2i(0, 0);
    glDrawPixels(WIDTH, HEIGHT, GL_RGB, GL_UNSIGNED_BYTE, canvas);

    // legend text at the top
    glColor3f(0, 0, 0);
    const char* text = "1 Available   2 Selected   3 Booked   R Reset";
    glRasterPos2i(8, HEIGHT - 16);
    for (const char* c = text; *c; c++) glutBitmapCharacter(GLUT_BITMAP_HELVETICA_12, *c);
    glFlush();
}

void mouse(int button, int state, int x, int y) {
    if (button == GLUT_LEFT_BUTTON && state == GLUT_DOWN) {
        int px = x;
        int py = HEIGHT - 1 - y;            // mouse y counts from the top, our canvas from the bottom
        fillAt(px, py, currentColor);
        glutPostRedisplay();
    }
}

void keyboard(unsigned char key, int, int) {
    if (key == '1') { currentColor = AVAILABLE; currentName = "AVAILABLE"; }
    else if (key == '2') { currentColor = SELECTED; currentName = "SELECTED"; }
    else if (key == '3') { currentColor = BOOKED; currentName = "BOOKED"; }
    else if (key == 'r' || key == 'R') { buildSeats(); }
    else if (key == 27) { exit(0); }
    showTitle();
    glutPostRedisplay();
}

void reshape(int, int) { glutReshapeWindow(WIDTH, HEIGHT); }   // keep the window the same size as the picture

int main(int argc, char** argv) {
    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_SINGLE | GLUT_RGB);
    glutInitWindowSize(WIDTH, HEIGHT);
    glutCreateWindow("Flood Fill Seats");

    glClearColor(1, 1, 1, 1);
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    gluOrtho2D(0, WIDTH, 0, HEIGHT);

    buildSeats();
    showTitle();

    glutDisplayFunc(display);
    glutMouseFunc(mouse);
    glutKeyboardFunc(keyboard);
    glutReshapeFunc(reshape);
    glutMainLoop();
    return 0;
}