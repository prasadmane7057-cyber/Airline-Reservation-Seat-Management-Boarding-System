/*
 * PlaneGlyph.cpp
 * -----------------------------------------------------------
 * Computer Graphics (CGL) - supporting visual for SeatMapTransform
 * Airline Reservation, Seat Management & Boarding System
 * -----------------------------------------------------------
 * Draws the TOP-DOWN AIRCRAFT OUTLINE (fuselage, wings, tail,
 * engines, doors) - modelled after the reference seat-map diagram
 * (nose on the left, tail on the right, swept wings in the
 * middle, Business Class in the forward cabin, Economy Class in
 * the rear cabin).
 *
 * IMPORTANT: this file draws NO seats. Seat icons are a separate
 * teammate's module and will be drawn on TOP of this glyph once
 * integrated - this file only provides the aircraft "shell" and
 * marks each door as a small rectangle, exactly like the red
 * door markers in the reference diagram.
 *
 * This file has NO main() and NO glutInit() - it is a pure
 * drawing module meant to be compiled together with
 * SeatMapTransform.cpp (which owns the window/event loop):
 *
 *   g++ PlaneGlyph.cpp SeatMapTransform.cpp -o SeatMapDemo -lglut -lGLU -lGL
 * -----------------------------------------------------------
 */

#include <GL/glut.h>

// ============================================================
// World coordinate system used by this glyph (and shared with
// SeatMapTransform.cpp via the extern declarations there):
//   X: 0 (nose tip) ......... 1000 (tail tip)
//   Y: 0 (bottom wingtip) ... 600 (top wingtip), fuselage
//      centerline at Y = 300
// These are declared here (not "static") so SeatMapTransform.cpp
// can read them with an "extern" declaration instead of hardcoding
// duplicate numbers that could drift out of sync.
// ============================================================
// NOTE: plain "const" at file scope has INTERNAL linkage in C++
// (unlike C), so it must be marked "extern" here too, or
// SeatMapTransform.cpp's "extern const float ..." declaration
// would not find these at link time.
extern const float PLANE_WORLD_WIDTH  = 1000.0f;
extern const float PLANE_WORLD_HEIGHT = 600.0f;

// Fuselage centerline and half-width, reused by every function below.
static const float FUSELAGE_CENTER_Y = 300.0f;
static const float FUSELAGE_HALF_WIDTH = 55.0f;          // distance from centerline to fuselage edge
static const float FUSELAGE_TOP_EDGE    = FUSELAGE_CENTER_Y + FUSELAGE_HALF_WIDTH;   // 355
static const float FUSELAGE_BOTTOM_EDGE = FUSELAGE_CENTER_Y - FUSELAGE_HALF_WIDTH;   // 245

// ---------------------------------------------------------------
// Draws the main fuselage body: a pointed nose, a straight
// mid-section, and a pointed tail - one simple filled polygon
// plus a darker outline.
// ---------------------------------------------------------------
static void drawFuselage() {
    glColor3f(0.85f, 0.87f, 0.90f);   // light grey body fill
    glBegin(GL_POLYGON);
        glVertex2f(0.0f,   FUSELAGE_CENTER_Y);      // nose tip
        glVertex2f(90.0f,  FUSELAGE_TOP_EDGE);       // nose taper -> top edge
        glVertex2f(850.0f, FUSELAGE_TOP_EDGE);       // straight top edge
        glVertex2f(1000.0f,FUSELAGE_CENTER_Y);       // tail tip
        glVertex2f(850.0f, FUSELAGE_BOTTOM_EDGE);    // straight bottom edge
        glVertex2f(90.0f,  FUSELAGE_BOTTOM_EDGE);    // tail taper -> nose taper
    glEnd();

    glColor3f(0.35f, 0.38f, 0.42f);   // darker outline
    glLineWidth(2.0f);
    glBegin(GL_LINE_LOOP);
        glVertex2f(0.0f,   FUSELAGE_CENTER_Y);
        glVertex2f(90.0f,  FUSELAGE_TOP_EDGE);
        glVertex2f(850.0f, FUSELAGE_TOP_EDGE);
        glVertex2f(1000.0f,FUSELAGE_CENTER_Y);
        glVertex2f(850.0f, FUSELAGE_BOTTOM_EDGE);
        glVertex2f(90.0f,  FUSELAGE_BOTTOM_EDGE);
    glEnd();
    glLineWidth(1.0f);
}

// ---------------------------------------------------------------
// Draws one swept-back wing as a quadrilateral, mirrored to make
// the top wing (isTop = true) or the bottom wing (isTop = false).
// Sweeping backward means the wingtip sits further toward the
// tail (higher X) than the wing root, matching a real airliner's
// plan-view silhouette.
// ---------------------------------------------------------------
static void drawWing(bool isTop) {
    float rootLeadingX  = 420.0f;
    float rootTrailingX = 520.0f;
    float tipLeadingX   = 560.0f;
    float tipTrailingX  = 610.0f;
    float rootY = isTop ? FUSELAGE_TOP_EDGE : FUSELAGE_BOTTOM_EDGE;
    float tipY  = isTop ? 580.0f : 20.0f;

    glColor3f(0.78f, 0.80f, 0.84f);
    glBegin(GL_POLYGON);
        glVertex2f(rootLeadingX,  rootY);
        glVertex2f(tipLeadingX,   tipY);
        glVertex2f(tipTrailingX,  tipY);
        glVertex2f(rootTrailingX, rootY);
    glEnd();

    glColor3f(0.35f, 0.38f, 0.42f);
    glBegin(GL_LINE_LOOP);
        glVertex2f(rootLeadingX,  rootY);
        glVertex2f(tipLeadingX,   tipY);
        glVertex2f(tipTrailingX,  tipY);
        glVertex2f(rootTrailingX, rootY);
    glEnd();
}

// ---------------------------------------------------------------
// Draws one engine nacelle (a small rounded rectangle, approximated
// here as a plain rectangle for simplicity) positioned partway
// along the wing span.
// ---------------------------------------------------------------
static void drawEngine(bool isTop) {
    float centerX = 520.0f;
    float centerY = isTop ? 470.0f : 130.0f;
    float halfW = 35.0f;
    float halfH = 15.0f;

    glColor3f(0.30f, 0.32f, 0.35f);
    glBegin(GL_POLYGON);
        glVertex2f(centerX - halfW, centerY - halfH);
        glVertex2f(centerX + halfW, centerY - halfH);
        glVertex2f(centerX + halfW, centerY + halfH);
        glVertex2f(centerX - halfW, centerY + halfH);
    glEnd();
}

// ---------------------------------------------------------------
// Draws the small horizontal stabilizer ("mini wing") near the
// tail, plus a small triangular bump representing the base of the
// vertical fin (a full side-on fin doesn't really apply to a
// top-down view, so this is a simplified stylised marker).
// ---------------------------------------------------------------
static void drawTailSurfaces() {
    glColor3f(0.78f, 0.80f, 0.84f);

    // horizontal stabilizer - top
    glBegin(GL_POLYGON);
        glVertex2f(860.0f, FUSELAGE_TOP_EDGE);
        glVertex2f(905.0f, 430.0f);
        glVertex2f(925.0f, 430.0f);
        glVertex2f(900.0f, FUSELAGE_TOP_EDGE);
    glEnd();

    // horizontal stabilizer - bottom (mirrored)
    glBegin(GL_POLYGON);
        glVertex2f(860.0f, FUSELAGE_BOTTOM_EDGE);
        glVertex2f(905.0f, 170.0f);
        glVertex2f(925.0f, 170.0f);
        glVertex2f(900.0f, FUSELAGE_BOTTOM_EDGE);
    glEnd();

    // vertical fin footprint (small triangle straddling the centerline)
    glBegin(GL_TRIANGLES);
        glVertex2f(890.0f, FUSELAGE_TOP_EDGE);
        glVertex2f(950.0f, FUSELAGE_TOP_EDGE);
        glVertex2f(915.0f, 390.0f);
    glEnd();

    glColor3f(0.35f, 0.38f, 0.42f);
    glBegin(GL_LINE_LOOP);
        glVertex2f(860.0f, FUSELAGE_TOP_EDGE);
        glVertex2f(905.0f, 430.0f);
        glVertex2f(925.0f, 430.0f);
        glVertex2f(900.0f, FUSELAGE_TOP_EDGE);
    glEnd();
    glBegin(GL_LINE_LOOP);
        glVertex2f(860.0f, FUSELAGE_BOTTOM_EDGE);
        glVertex2f(905.0f, 170.0f);
        glVertex2f(925.0f, 170.0f);
        glVertex2f(900.0f, FUSELAGE_BOTTOM_EDGE);
    glEnd();
}

// ---------------------------------------------------------------
// Draws ONE door as an unfilled RECTANGLE with a red outline,
// sitting on the fuselage edge - exactly matching the red door
// markers in the reference seat-map diagram. Reused for every
// door position so the door "shape" is defined in exactly one
// place.
//   centerX  : X position along the fuselage where the door sits
//   onTopEdge: true = door sits on the top fuselage edge,
//              false = door sits on the bottom fuselage edge
// ---------------------------------------------------------------
static void drawDoor(float centerX, bool onTopEdge) {
    float doorWidth = 26.0f;
    float doorDepth = 16.0f;   // how far the rectangle sticks out from the fuselage edge
    float x0 = centerX - doorWidth / 2.0f;
    float x1 = centerX + doorWidth / 2.0f;
    float edgeY = onTopEdge ? FUSELAGE_TOP_EDGE : FUSELAGE_BOTTOM_EDGE;
    float y0 = onTopEdge ? edgeY - 3.0f : edgeY - doorDepth + 3.0f;
    float y1 = onTopEdge ? edgeY + doorDepth - 3.0f : edgeY + 3.0f;

    glColor3f(0.85f, 0.15f, 0.15f);   // red, matching the reference diagram's door markers
    glLineWidth(2.0f);
    glBegin(GL_LINE_LOOP);
        glVertex2f(x0, y0);
        glVertex2f(x1, y0);
        glVertex2f(x1, y1);
        glVertex2f(x0, y1);
    glEnd();
    glLineWidth(1.0f);
}

// ---------------------------------------------------------------
// Draws every door on the aircraft: front doors (boarding doors,
// just ahead of Business Class), overwing exits (at the
// Business/Economy boundary), and rear doors (behind Economy
// Class) - three pairs, six doors total, same layout as the
// reference diagram.
// ---------------------------------------------------------------
static void drawDoors() {
    const float FRONT_DOOR_X   = 150.0f;
    const float OVERWING_DOOR_X = 380.0f;
    const float REAR_DOOR_X    = 830.0f;

    drawDoor(FRONT_DOOR_X,    true);
    drawDoor(FRONT_DOOR_X,    false);
    drawDoor(OVERWING_DOOR_X, true);
    drawDoor(OVERWING_DOOR_X, false);
    drawDoor(REAR_DOOR_X,     true);
    drawDoor(REAR_DOOR_X,     false);
}

// ============================================================
// drawPlaneGlyph(): the single entry point SeatMapTransform.cpp
// calls. Draws the whole aircraft shell in back-to-front order
// (wings/tail behind the fuselage outline, doors on top of
// everything so they're always visible).
// ============================================================
void drawPlaneGlyph() {
    drawWing(true);
    drawWing(false);
    drawEngine(true);
    drawEngine(false);
    drawTailSurfaces();
    drawFuselage();
    drawDoors();
}
