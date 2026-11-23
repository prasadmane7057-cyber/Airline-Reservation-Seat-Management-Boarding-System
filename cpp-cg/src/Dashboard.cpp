// =============================================================================
//  Dashboard.cpp  -  Airline Management System : Computer Graphics Dashboard
//  Subject  : Computer Graphics Lab (OpenGL / freeglut, C++)
//
//  Put this file in:  Airline/cpp-cg/src/
//  It reuses your own headers:  Bresenham.h (bresenhamLine)
//                               LineClipping.h (cohenSutherlandClip)
//
//  Build (MinGW, from Airline/cpp-cg):
//    g++ src/Dashboard.cpp -o bin/Dashboard.exe -Isrc -lfreeglut -lopengl32 -lglu32
//
//  CG concepts shown (match the lab rubric):
//    1. OpenGL primitives ........ GL_QUADS / GL_TRIANGLES / GL_TRIANGLE_FAN / GL_POINTS
//    2. Line + circle algorithms . DDA (grid), Bresenham (axes, routes), Midpoint circle (airports)
//    3. 2D transformations ....... translate + scale (card hover, growing bars),
//                                  translate + rotate (plane glyph), zoom/pan of map
//    4. Viewing / projection ..... gluOrtho2D + glViewport (letter-boxed on resize)
//    5. Clipping ................. Cohen-Sutherland clips routes to the map window
//    6. Colour / shading ......... per-vertex colour gradients, alpha blending
//
//  Controls:
//    Mouse over a card/bar ... hover effect      Click a bar ... select flight
//    + / -  ... zoom map      Arrow keys ... pan map     0 / R ... reset map
//    N ... next flight        Space ... pause plane      Esc ... quit
// =============================================================================

#include <GL/freeglut.h>

#include <algorithm>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <utility>
#include <vector>

#include "Bresenham.h"      // bresenhamLine()  (inline, header-only)
#include "LineClipping.h"   // cohenSutherlandClip()  (header-only)

typedef std::vector<std::pair<int, int> > PointList;

// ----------------------------------------------------------------------------
//  Logical canvas: everything is drawn in a 1000 x 640 coordinate system.
// ----------------------------------------------------------------------------
static const int    CANVAS_W = 1000;
static const int    CANVAS_H = 640;
static const double PI       = 3.14159265358979323846;

// ----------------------------------------------------------------------------
//  DATA  (copied from airline-backend/src/utils/airportStore.js and flightStore.js)
//  Airport x,y are positions inside the map window (screen units at zoom = 1).
// ----------------------------------------------------------------------------
struct Airport { const char* code; const char* city; double x, y; };

enum { BOM, DEL, BLR, PNQ, HYD, LTU, GOI, MAA, AIRPORT_COUNT };

static const Airport AIRPORTS[AIRPORT_COUNT] = {
    { "BOM", "Mumbai",    595, 255 },
    { "DEL", "Delhi",     765, 395 },
    { "BLR", "Bengaluru", 700, 110 },
    { "PNQ", "Pune",      650, 225 },
    { "HYD", "Hyderabad", 775, 200 },
    { "LTU", "Latur",     700, 255 },
    { "GOI", "Goa",       625, 165 },
    { "MAA", "Chennai",   850, 120 }
};

struct Flight { const char* number; int from; int to; int booked; int total; };

static const Flight FLIGHTS[] = {
    { "111",    BOM, PNQ, 12, 116 },
    { "155",    DEL, PNQ, 24, 116 },
    { "202",    DEL, LTU, 18, 116 },
    { "199",    PNQ, BOM, 35, 116 },
    { "2001",   BOM, LTU,  8, 116 },
    { "343",    HYD, PNQ, 14, 116 },
    { "AI-101", BOM, DEL, 42, 116 },
    { "AI-202", DEL, BLR, 28, 116 },
    { "AI-303", PNQ, BLR, 15, 116 },
    { "AI-404", BOM, BLR, 33, 116 }
};
static const int FLIGHT_COUNT = sizeof(FLIGHTS) / sizeof(FLIGHTS[0]);

// ----------------------------------------------------------------------------
//  LAYOUT
// ----------------------------------------------------------------------------
static const int CARD_COUNT = 4;
static const int BAR_PANEL[4] = {  30, 30, 500, 460 };   // x0, y0, x1, y1
static const int MAP_PANEL[4] = { 520, 30, 970, 460 };

// Plot area of the bar chart
static const int   PLOT_X0 = 75, PLOT_Y0 = 85, PLOT_W = 400, PLOT_H = 300;
static const int   BAR_MAX = 50;      // y-axis maximum (seats booked)

// Map window = the clipping window for Cohen-Sutherland
static const ClipWindow MAP_WINDOW = { 530.0, 60.0, 960.0, 425.0 };

// ----------------------------------------------------------------------------
//  STATE
// ----------------------------------------------------------------------------
static int    winW = CANVAS_W, winH = CANVAS_H;       // real window size
static int    vpX = 0, vpY = 0, vpW = CANVAS_W, vpH = CANVAS_H;
static double mouseX = -1, mouseY = -1;               // mouse in canvas units

static int    hoverCard = -1, hoverBar = -1;
static double cardScale[CARD_COUNT] = { 1, 1, 1, 1 };

static double growT = 0.0;                            // bar grow animation 0..1
static int    activeFlight = 6;                       // flight whose route is animated
static double planeT = 0.0;                           // 0..1 along the route
static bool   paused = false;

static double zoom = 1.0, panX = 0.0, panY = 0.0;     // map view transform
static int    routesVisible = 0;                      // result of clipping each frame

// KPI numbers (computed once)
static int    totalBooked = 0, totalSeats = 0;

// ----------------------------------------------------------------------------
//  SMALL DRAWING HELPERS
// ----------------------------------------------------------------------------
static void setColor(float r, float g, float b, float a = 1.0f) { glColor4f(r, g, b, a); }

// Solid rectangle
static void fillRect(float x0, float y0, float x1, float y1) {
    glBegin(GL_QUADS);
    glVertex2f(x0, y0); glVertex2f(x1, y0); glVertex2f(x1, y1); glVertex2f(x0, y1);
    glEnd();
}

// Rectangle with a vertical colour gradient (per-vertex colours = Gouraud shading)
static void fillRectGradient(float x0, float y0, float x1, float y1,
                             const float* bottom, const float* top) {
    glBegin(GL_QUADS);
    glColor3fv(bottom); glVertex2f(x0, y0); glVertex2f(x1, y0);
    glColor3fv(top);    glVertex2f(x1, y1); glVertex2f(x0, y1);
    glEnd();
}

// Plot a list of pixels (output of a line / circle algorithm)
static void plotPoints(const PointList& pts) {
    glBegin(GL_POINTS);
    for (size_t i = 0; i < pts.size(); ++i) glVertex2i(pts[i].first, pts[i].second);
    glEnd();
}

// DDA line algorithm (used for the dashed grid lines)
static PointList ddaLine(int x0, int y0, int x1, int y1) {
    PointList pts;
    int dx = x1 - x0, dy = y1 - y0;
    int steps = std::max(std::abs(dx), std::abs(dy));
    if (steps == 0) { pts.push_back(std::make_pair(x0, y0)); return pts; }
    double xInc = dx / (double)steps, yInc = dy / (double)steps;
    double x = x0, y = y0;
    for (int i = 0; i <= steps; ++i) {
        pts.push_back(std::make_pair((int)std::lround(x), (int)std::lround(y)));
        x += xInc; y += yInc;
    }
    return pts;
}

// Midpoint circle algorithm (8-way symmetry) - used for airport rings
static PointList midpointCircle(int xc, int yc, int r) {
    PointList pts;
    int x = 0, y = r, d = 1 - r;
    for (;;) {
        pts.push_back(std::make_pair(xc + x, yc + y)); pts.push_back(std::make_pair(xc - x, yc + y));
        pts.push_back(std::make_pair(xc + x, yc - y)); pts.push_back(std::make_pair(xc - x, yc - y));
        pts.push_back(std::make_pair(xc + y, yc + x)); pts.push_back(std::make_pair(xc - y, yc + x));
        pts.push_back(std::make_pair(xc + y, yc - x)); pts.push_back(std::make_pair(xc - y, yc - x));
        if (x >= y) break;
        ++x;
        if (d < 0) d += 2 * x + 1;
        else { --y; d += 2 * (x - y) + 1; }
    }
    return pts;
}

// Filled circle (triangle fan) - small airport dot
static void fillCircle(float cx, float cy, float r) {
    glBegin(GL_TRIANGLE_FAN);
    glVertex2f(cx, cy);
    for (int i = 0; i <= 24; ++i) {
        double a = 2.0 * PI * i / 24.0;
        glVertex2f(cx + (float)(r * std::cos(a)), cy + (float)(r * std::sin(a)));
    }
    glEnd();
}

// Straight line through Bresenham (project's own function from Bresenham.h)
static void bLine(int x0, int y0, int x1, int y1) { plotPoints(bresenhamLine(x0, y0, x1, y1)); }

// Rectangle outline made of 4 Bresenham lines
static void bRect(int x0, int y0, int x1, int y1) {
    bLine(x0, y0, x1, y0); bLine(x1, y0, x1, y1); bLine(x1, y1, x0, y1); bLine(x0, y1, x0, y0);
}

// Text helpers (plain bitmap fonts, work with GLUT and freeglut)
static void drawText(float x, float y, void* font, const char* s) {
    glRasterPos2f(x, y);
    for (; *s; ++s) glutBitmapCharacter(font, *s);
}
static float textWidth(void* font, const char* s) {
    float w = 0; for (; *s; ++s) w += (float)glutBitmapWidth(font, *s); return w;
}
static void drawTextCentered(float cx, float y, void* font, const char* s) {
    drawText(cx - textWidth(font, s) / 2.0f, y, font, s);
}

// ----------------------------------------------------------------------------
//  PANELS
// ----------------------------------------------------------------------------
static void drawPanel(const int r[4], const char* title) {
    // soft drop shadow (alpha blending)
    setColor(0, 0, 0, 0.35f);
    fillRect((float)r[0] + 4, (float)r[1] - 4, (float)r[2] + 4, (float)r[3] - 4);
    // body gradient
    const float bot[3] = { 0.09f, 0.11f, 0.18f }, top[3] = { 0.13f, 0.16f, 0.26f };
    fillRectGradient((float)r[0], (float)r[1], (float)r[2], (float)r[3], bot, top);
    // border (Bresenham)
    glPointSize(1.0f);
    setColor(0.28f, 0.36f, 0.52f);
    bRect(r[0], r[1], r[2], r[3]);
    // title
    setColor(0.92f, 0.95f, 1.0f);
    drawText((float)r[0] + 14, (float)r[3] - 24, GLUT_BITMAP_HELVETICA_18, title);
}

static void drawBackground() {
    const float bot[3] = { 0.04f, 0.05f, 0.09f }, top[3] = { 0.07f, 0.09f, 0.16f };
    fillRectGradient(0, 0, CANVAS_W, CANVAS_H, bot, top);
}

static void drawHeader() {
    const float bot[3] = { 0.05f, 0.30f, 0.62f }, top[3] = { 0.10f, 0.50f, 0.85f };
    fillRectGradient(0, 585, CANVAS_W, CANVAS_H, bot, top);
    setColor(1, 1, 1);
    drawText(30, 605, GLUT_BITMAP_TIMES_ROMAN_24, "SKYWINGS AIRLINE  |  OPERATIONS DASHBOARD");
    setColor(0.85f, 0.93f, 1.0f);
    const char* sub = "Computer Graphics Module";
    drawText(CANVAS_W - 30 - textWidth(GLUT_BITMAP_HELVETICA_12, sub), 608, GLUT_BITMAP_HELVETICA_12, sub);
}

// ----------------------------------------------------------------------------
//  KPI CARDS  (hover = translate -> scale -> translate back)
// ----------------------------------------------------------------------------
static void cardRect(int i, float& x0, float& y0, float& x1, float& y1) {
    x0 = 30.0f + i * 240.0f; x1 = x0 + 220.0f; y0 = 480.0f; y1 = 570.0f;
}

static void drawCards() {
    const char* titles[CARD_COUNT] = { "TOTAL FLIGHTS", "SEATS BOOKED", "SEATS AVAILABLE", "OCCUPANCY" };
    const float accents[CARD_COUNT][3] = {
        { 0.20f, 0.65f, 1.00f }, { 1.00f, 0.55f, 0.15f }, { 0.25f, 0.85f, 0.55f }, { 0.75f, 0.45f, 1.00f }
    };
    char value[32];
    for (int i = 0; i < CARD_COUNT; ++i) {
        float x0, y0, y1, x1;
        cardRect(i, x0, y0, x1, y1);
        float cx = (x0 + x1) / 2.0f, cy = (y0 + y1) / 2.0f;

        switch (i) {
            case 0: std::snprintf(value, sizeof(value), "%d", FLIGHT_COUNT); break;
            case 1: std::snprintf(value, sizeof(value), "%d", totalBooked); break;
            case 2: std::snprintf(value, sizeof(value), "%d", totalSeats - totalBooked); break;
            default: std::snprintf(value, sizeof(value), "%.1f %%", 100.0 * totalBooked / totalSeats); break;
        }

        glPushMatrix();
        glTranslatef(cx, cy, 0);                              // move pivot to card centre
        glScalef((float)cardScale[i], (float)cardScale[i], 1); // scale about the centre
        glTranslatef(-cx, -cy, 0);                            // move back

        setColor(0, 0, 0, 0.35f);                             // shadow
        fillRect(x0 + 4, y0 - 4, x1 + 4, y1 - 4);
        const float bot[3] = { 0.10f, 0.13f, 0.21f }, top[3] = { 0.17f, 0.21f, 0.33f };
        fillRectGradient(x0, y0, x1, y1, bot, top);           // body
        setColor(accents[i][0], accents[i][1], accents[i][2]);
        fillRect(x0, y0, x0 + 7, y1);                         // accent strip

        setColor(0.70f, 0.78f, 0.92f);
        drawText(x0 + 22, y1 - 26, GLUT_BITMAP_HELVETICA_12, titles[i]);
        setColor(1, 1, 1);
        drawText(x0 + 22, y0 + 22, GLUT_BITMAP_TIMES_ROMAN_24, value);
        glPopMatrix();
    }
}

// ----------------------------------------------------------------------------
//  BAR CHART  (axes = Bresenham, grid = DDA, bars grow with glScalef)
// ----------------------------------------------------------------------------
static void barRect(int i, float& x0, float& x1) {
    float slot = PLOT_W / (float)FLIGHT_COUNT;
    x0 = PLOT_X0 + i * slot + 7.0f;
    x1 = x0 + slot - 14.0f;
}

static void drawBarChart() {
    drawPanel(BAR_PANEL, "Seats Booked per Flight");
    char buf[96];

    // dashed horizontal grid lines with DDA + y labels
    glPointSize(1.0f);
    for (int v = 0; v <= BAR_MAX; v += 10) {
        int y = PLOT_Y0 + (int)(PLOT_H * v / (double)BAR_MAX);
        setColor(0.28f, 0.34f, 0.48f);
        PointList pts = ddaLine(PLOT_X0, y, PLOT_X0 + PLOT_W, y);
        glBegin(GL_POINTS);
        for (size_t k = 0; k < pts.size(); ++k)
            if ((k / 4) % 2 == 0) glVertex2i(pts[k].first, pts[k].second);   // dashes
        glEnd();
        std::snprintf(buf, sizeof(buf), "%d", v);
        setColor(0.70f, 0.78f, 0.92f);
        drawText(PLOT_X0 - 8 - textWidth(GLUT_BITMAP_HELVETICA_10, buf), (float)y - 4, GLUT_BITMAP_HELVETICA_10, buf);
    }

    // bars
    double ease = 1.0 - std::pow(1.0 - growT, 3.0);
    for (int i = 0; i < FLIGHT_COUNT; ++i) {
        float x0, x1;
        barRect(i, x0, x1);
        float fullH = (float)(PLOT_H * FLIGHTS[i].booked / (double)BAR_MAX);

        bool hot = (i == hoverBar), sel = (i == activeFlight);
        const float lowC[3]  = { 0.08f, 0.40f, 0.85f }, highC[3]  = { 0.30f, 0.80f, 1.00f };
        const float hotLow[3] = { 1.00f, 0.40f, 0.10f }, hotHigh[3] = { 1.00f, 0.78f, 0.30f };
        const bool orange = hot || sel;

        glPushMatrix();
        glTranslatef(0, (float)PLOT_Y0, 0);          // move to the baseline
        glScalef(1.0f, (float)ease, 1.0f);           // grow upward from the baseline
        fillRectGradient(x0, 0, x1, fullH, orange ? hotLow : lowC, orange ? hotHigh : highC);
        glPopMatrix();

        // flight number under the axis, value above the bar
        setColor(0.85f, 0.90f, 1.0f);
        drawTextCentered((x0 + x1) / 2.0f, PLOT_Y0 - 16, GLUT_BITMAP_HELVETICA_10, FLIGHTS[i].number);
        std::snprintf(buf, sizeof(buf), "%d", FLIGHTS[i].booked);
        setColor(1, 1, 1);
        drawTextCentered((x0 + x1) / 2.0f, PLOT_Y0 + (float)(fullH * ease) + 6, GLUT_BITMAP_HELVETICA_12, buf);
    }

    // axes (Bresenham)
    glPointSize(2.0f);
    setColor(0.90f, 0.93f, 1.0f);
    bLine(PLOT_X0, PLOT_Y0, PLOT_X0 + PLOT_W, PLOT_Y0);
    bLine(PLOT_X0, PLOT_Y0, PLOT_X0, PLOT_Y0 + PLOT_H);
    glPointSize(1.0f);

    // info line for hovered / selected bar
    int f = (hoverBar >= 0) ? hoverBar : activeFlight;
    std::snprintf(buf, sizeof(buf), "Flight %s : %s -> %s   |   %d / %d seats booked (%.0f%%)",
                  FLIGHTS[f].number, AIRPORTS[FLIGHTS[f].from].code, AIRPORTS[FLIGHTS[f].to].code,
                  FLIGHTS[f].booked, FLIGHTS[f].total, 100.0 * FLIGHTS[f].booked / FLIGHTS[f].total);
    setColor(1.0f, 0.80f, 0.40f);
    drawText(PLOT_X0, BAR_PANEL[3] - 55, GLUT_BITMAP_HELVETICA_12, buf);
}

// ----------------------------------------------------------------------------
//  ROUTE MAP  (zoom/pan -> Cohen-Sutherland clip -> Bresenham -> plane glyph)
// ----------------------------------------------------------------------------
static void toScreen(const Airport& a, double& sx, double& sy) {
    double cx = (MAP_WINDOW.xmin + MAP_WINDOW.xmax) / 2.0;
    double cy = (MAP_WINDOW.ymin + MAP_WINDOW.ymax) / 2.0;
    sx = cx + (a.x - cx) * zoom + panX;
    sy = cy + (a.y - cy) * zoom + panY;
}

static bool insideWindow(double x, double y, double margin) {
    return x >= MAP_WINDOW.xmin + margin && x <= MAP_WINDOW.xmax - margin &&
           y >= MAP_WINDOW.ymin + margin && y <= MAP_WINDOW.ymax - margin;
}

// Clip one segment to the map window, then rasterise the visible part with Bresenham
static bool drawClippedSegment(double x1, double y1, double x2, double y2) {
    ClipLine in = { x1, y1, x2, y2 };
    ClipResult r = cohenSutherlandClip(in, MAP_WINDOW);
    if (r.status != ClipStatus::Accepted) return false;
    bLine((int)std::lround(r.line.x1), (int)std::lround(r.line.y1),
          (int)std::lround(r.line.x2), (int)std::lround(r.line.y2));
    return true;
}

// Plane silhouette made of convex triangles, nose pointing along +x
static void drawPlaneGlyph() {
    glBegin(GL_TRIANGLES);
    glVertex2f(14, 0);  glVertex2f(-14, 3);  glVertex2f(-14, -3);   // fuselage
    glVertex2f(3, 2);   glVertex2f(-8, 13);  glVertex2f(-4, 2);     // left wing
    glVertex2f(3, -2);  glVertex2f(-8, -13); glVertex2f(-4, -2);    // right wing
    glVertex2f(-10, 2); glVertex2f(-16, 8);  glVertex2f(-14, 2);    // left tail
    glVertex2f(-10, -2); glVertex2f(-16, -8); glVertex2f(-14, -2);  // right tail
    glEnd();
}

static void drawRouteMap() {
    drawPanel(MAP_PANEL, "Live Route Map");

    // map window background
    const float bot[3] = { 0.05f, 0.08f, 0.15f }, top[3] = { 0.08f, 0.13f, 0.24f };
    fillRectGradient((float)MAP_WINDOW.xmin, (float)MAP_WINDOW.ymin,
                     (float)MAP_WINDOW.xmax, (float)MAP_WINDOW.ymax, bot, top);

    glPointSize(2.0f);
    routesVisible = 0;

    // 1) every route, clipped to the window; the selected one is orange
    for (int i = 0; i < FLIGHT_COUNT; ++i) {
        double ax, ay, bx, by;
        toScreen(AIRPORTS[FLIGHTS[i].from], ax, ay);
        toScreen(AIRPORTS[FLIGHTS[i].to],   bx, by);
        if (i == activeFlight) setColor(1.0f, 0.60f, 0.20f);
        else                   setColor(0.20f, 0.50f, 0.90f, 1.0f);
        if (drawClippedSegment(ax, ay, bx, by)) ++routesVisible;
    }

    // 2) airports: midpoint-circle ring + filled dot + label (point clipping)
    for (int i = 0; i < AIRPORT_COUNT; ++i) {
        double sx, sy;
        toScreen(AIRPORTS[i], sx, sy);
        if (!insideWindow(sx, sy, 12)) continue;
        setColor(1.0f, 0.78f, 0.25f);
        plotPoints(midpointCircle((int)std::lround(sx), (int)std::lround(sy), 9));
        setColor(1.0f, 0.55f, 0.10f);
        fillCircle((float)sx, (float)sy, 4.0f);
        setColor(0.92f, 0.95f, 1.0f);
        drawText((float)sx + 13, (float)sy - 4, GLUT_BITMAP_HELVETICA_12, AIRPORTS[i].code);
    }

    // 3) travelled part of the active route + the plane (translate + rotate)
    const Flight& f = FLIGHTS[activeFlight];
    double ax, ay, bx, by;
    toScreen(AIRPORTS[f.from], ax, ay);
    toScreen(AIRPORTS[f.to],   bx, by);
    double px = ax + (bx - ax) * planeT, py = ay + (by - ay) * planeT;
    double angle = std::atan2(by - ay, bx - ax) * 180.0 / PI;

    setColor(1.0f, 0.95f, 0.55f);
    drawClippedSegment(ax, ay, px, py);

    if (insideWindow(px, py, 18)) {
        glPushMatrix();
        glTranslatef((float)px, (float)py, 0);   // move origin to the plane position
        glRotatef((float)angle, 0, 0, 1);        // turn the nose toward the destination
        setColor(1.0f, 1.0f, 1.0f);
        drawPlaneGlyph();
        glPopMatrix();
    }

    // window border + status line
    glPointSize(1.0f);
    setColor(0.35f, 0.45f, 0.65f);
    bRect((int)MAP_WINDOW.xmin, (int)MAP_WINDOW.ymin, (int)MAP_WINDOW.xmax, (int)MAP_WINDOW.ymax);

    char buf[128];
    std::snprintf(buf, sizeof(buf), "Flight %s  %s -> %s   |   zoom %.1fx   |   routes in window: %d / %d (rest clipped)",
                  f.number, AIRPORTS[f.from].code, AIRPORTS[f.to].code, zoom, routesVisible, FLIGHT_COUNT);
    setColor(0.80f, 0.88f, 1.0f);
    drawText((float)MAP_PANEL[0] + 14, (float)MAP_PANEL[1] + 14, GLUT_BITMAP_HELVETICA_12, buf);
}

static void drawFooter() {
    setColor(0.55f, 0.62f, 0.78f);
    drawTextCentered(CANVAS_W / 2.0f, 10, GLUT_BITMAP_HELVETICA_12,
        "Click bar: select flight   |   + / - : zoom   |   Arrows: pan   |   N: next   |   Space: pause   |   R: reset   |   Esc: quit");
}

// ----------------------------------------------------------------------------
//  GLUT CALLBACKS
// ----------------------------------------------------------------------------
static void display() {
    glClear(GL_COLOR_BUFFER_BIT);
    glLoadIdentity();
    drawBackground();
    drawHeader();
    drawCards();
    drawBarChart();
    drawRouteMap();
    drawFooter();
    glutSwapBuffers();
}

// Keep the 1000x640 canvas undistorted: letter-box the viewport
static void reshape(int w, int h) {
    if (h == 0) h = 1;
    winW = w; winH = h;
    double scale = std::min(w / (double)CANVAS_W, h / (double)CANVAS_H);
    vpW = (int)(CANVAS_W * scale);
    vpH = (int)(CANVAS_H * scale);
    vpX = (w - vpW) / 2;
    vpY = (h - vpH) / 2;
    glViewport(vpX, vpY, vpW, vpH);

    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    gluOrtho2D(0, CANVAS_W, 0, CANVAS_H);        // orthographic projection
    glMatrixMode(GL_MODELVIEW);
    glLoadIdentity();
}

static void updateHover() {
    hoverCard = -1; hoverBar = -1;
    for (int i = 0; i < CARD_COUNT; ++i) {
        float x0, y0, x1, y1;
        cardRect(i, x0, y0, x1, y1);
        if (mouseX >= x0 && mouseX <= x1 && mouseY >= y0 && mouseY <= y1) hoverCard = i;
    }
    for (int i = 0; i < FLIGHT_COUNT; ++i) {
        float x0, x1;
        barRect(i, x0, x1);
        double h = PLOT_H * FLIGHTS[i].booked / (double)BAR_MAX;
        if (mouseX >= x0 && mouseX <= x1 && mouseY >= PLOT_Y0 && mouseY <= PLOT_Y0 + h) hoverBar = i;
    }
}

static void onMouseMove(int px, int py) {
    mouseX = (px - vpX) * CANVAS_W / (double)vpW;
    mouseY = (winH - py - vpY) * CANVAS_H / (double)vpH;
    updateHover();
}

static void onMouseButton(int button, int state, int px, int py) {
    if (button == GLUT_LEFT_BUTTON && state == GLUT_DOWN) {
        onMouseMove(px, py);
        if (hoverBar >= 0) { activeFlight = hoverBar; planeT = 0.0; }
    }
}

static void resetMap() { zoom = 1.0; panX = 0.0; panY = 0.0; }

static void onKey(unsigned char key, int, int) {
    switch (key) {
        case 27:  std::exit(0); break;
        case '+': case '=': zoom = std::min(3.0, zoom * 1.15); break;
        case '-': case '_': zoom = std::max(0.6, zoom / 1.15); break;
        case '0': case 'r': case 'R': resetMap(); break;
        case 'n': case 'N': activeFlight = (activeFlight + 1) % FLIGHT_COUNT; planeT = 0.0; break;
        case ' ': paused = !paused; break;
    }
}

static void onSpecialKey(int key, int, int) {
    const double step = 20.0;
    switch (key) {
        case GLUT_KEY_LEFT:  panX += step; break;   // content moves with the arrow direction
        case GLUT_KEY_RIGHT: panX -= step; break;
        case GLUT_KEY_UP:    panY -= step; break;
        case GLUT_KEY_DOWN:  panY += step; break;
    }
}

static void onTimer(int) {
    if (growT < 1.0) growT = std::min(1.0, growT + 0.02);

    for (int i = 0; i < CARD_COUNT; ++i) {
        double target = (i == hoverCard) ? 1.07 : 1.0;
        cardScale[i] += (target - cardScale[i]) * 0.25;
    }

    if (!paused) {
        planeT += 0.004;
        if (planeT >= 1.0) { planeT = 0.0; activeFlight = (activeFlight + 1) % FLIGHT_COUNT; }
    }
    glutPostRedisplay();
    glutTimerFunc(16, onTimer, 0);
}

static void initGL() {
    glClearColor(0.03f, 0.04f, 0.07f, 1.0f);
    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
}

int main(int argc, char** argv) {
    for (int i = 0; i < FLIGHT_COUNT; ++i) { totalBooked += FLIGHTS[i].booked; totalSeats += FLIGHTS[i].total; }

    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB);
    glutInitWindowSize(CANVAS_W, CANVAS_H);
    glutCreateWindow("Airline Dashboard - Computer Graphics");

    initGL();
    glutDisplayFunc(display);
    glutReshapeFunc(reshape);
    glutKeyboardFunc(onKey);
    glutSpecialFunc(onSpecialKey);
    glutMouseFunc(onMouseButton);
    glutPassiveMotionFunc(onMouseMove);
    glutMotionFunc(onMouseMove);
    glutTimerFunc(16, onTimer, 0);

    glutMainLoop();
    return 0;
}