#include <GL/glut.h>
#include <cstdio>
#include <algorithm>

// ---- Provided by PlaneGlyph.cpp and Seats.cpp (compiled and linked together) ----
extern const float PLANE_WORLD_WIDTH;    // 1000 - world X extent of the aircraft glyph
extern const float PLANE_WORLD_HEIGHT;   // 600  - world Y extent of the aircraft glyph
void drawPlaneGlyph();                   // draws fuselage + wings + tail + engines + doors
void drawSeats();                        // draws cockpit, business, economy, crew seats & aisles

// ---------------------------------------------------------------
// Window size. The extra 100px of height above the aircraft's own
// 600 world units is reserved for the on-screen instruction text,
// so the text never overlaps the wingtips.
// ---------------------------------------------------------------
const int WINDOW_WIDTH  = 1000;
const int WINDOW_HEIGHT = 700;
const float TEXT_BAND_HEIGHT = 100.0f;   // reserved strip at the TOP of the window, in world units

// The aircraft content is drawn inside the BOTTOM (WINDOW_HEIGHT -
// TEXT_BAND_HEIGHT) of the window; this is also the camera's
// re-projection center, and the box glScissor uses for clipping.
const float CONTENT_CENTER_X = PLANE_WORLD_WIDTH  / 2.0f;         // 500
const float CONTENT_CENTER_Y = PLANE_WORLD_HEIGHT / 2.0f;         // 300

// ============================================================
// Which class the user can zoom into. Kept separate from any
// seat data on purpose - the transform module only needs to know
// class IDENTITY, not seat contents.
//
// CHANGE: added FIRST_ZONE. It sits in front of BUSINESS_ZONE,
// so the front-to-back reading order of the enum now matches the
// front-to-back layout of the cabin (nose -> tail).
// ============================================================
enum SeatClassZone {
    FIRST_ZONE,
    BUSINESS_ZONE,
    ECONOMY_ZONE
};

// ============================================================
// INTEGRATION POINT - see the big comment at the top of this file.
// Returns the on-screen rectangle a class's seats occupy, using
// PLACEHOLDER numbers until the teammate's seat module is merged in.
//
// CHANGE: the old Business block (95 -> 375) is now split into two
// blocks - First (95 -> 200) and Business (210 -> 375) - with a
// 10-unit gap between them for a visible cabin divider. Economy is
// unchanged: it still starts just past the overwing exit door at
// X = 380, matching PlaneGlyph.cpp's OVERWING_DOOR_X.
// ============================================================
void getClassPanelBounds(SeatClassZone zone, float& minX, float& minY, float& maxX, float& maxY) {
    // vertical range = inside the fuselage walls (same for every class)
    minY = 245.0f + 8.0f;    // a little inside the fuselage's bottom edge
    maxY = 355.0f - 8.0f;    // a little inside the fuselage's top edge

    if (zone == FIRST_ZONE) {
        minX = 95.0f;     // just behind the nose taper
        maxX = 200.0f;    // small front cabin, ends with a gap before Business
    } else if (zone == BUSINESS_ZONE) {
        minX = 210.0f;    // starts just past the First/Business divider
        maxX = 375.0f;    // up to the overwing exit door
    } else {   // ECONOMY_ZONE
        minX = 385.0f;    // just past the overwing exit door
        maxX = 845.0f;    // up to the tail taper
    }
}

const char* zoneToString(SeatClassZone zone) {
    switch (zone) {
        case FIRST_ZONE:    return "First Class";
        case BUSINESS_ZONE: return "Business Class";
        default:             return "Economy Class";
    }
}

// ---------------------------------------------------------------
// TEMPORARY STAND-IN for the teammate's seat-drawing function.
// Draws a light, semi-transparent panel with a label over the
// class's bounds, so the demo is visually complete before the
// real seat grid is merged in. DELETE this function (and its calls
// in display()) once the real seat module is plugged in.
// ---------------------------------------------------------------
void drawPlaceholderSeatPanel(SeatClassZone zone) {
    float minX, minY, maxX, maxY;
    getClassPanelBounds(zone, minX, minY, maxX, maxY);

    glColor4f(0.40f, 0.70f, 0.95f, 0.35f);
    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    glBegin(GL_QUADS);
        glVertex2f(minX, minY);
        glVertex2f(maxX, minY);
        glVertex2f(maxX, maxY);
        glVertex2f(minX, maxY);
    glEnd();
    glDisable(GL_BLEND);

    glColor3f(0.15f, 0.35f, 0.55f);
    glBegin(GL_LINE_LOOP);
        glVertex2f(minX, minY);
        glVertex2f(maxX, minY);
        glVertex2f(maxX, maxY);
        glVertex2f(minX, maxY);
    glEnd();
}

// ---------------------------------------------------------------
// Camera state - same "current moves towards target" animation
// pattern as before, so the zoom is a smooth slide, not a jump.
// ---------------------------------------------------------------
float currentCamX = CONTENT_CENTER_X;
float currentCamY = CONTENT_CENTER_Y;
float currentZoom = 1.0f;

float targetCamX = CONTENT_CENTER_X;
float targetCamY = CONTENT_CENTER_Y;
float targetZoom = 1.0f;

const char* currentModeLabel = "Full Aircraft View";

void drawText(float x, float y, const char* text) {
    glRasterPos2f(x, y);
    for (const char* c = text; *c != '\0'; c++) {
        glutBitmapCharacter(GLUT_BITMAP_HELVETICA_18, *c);
    }
}

// ---------------------------------------------------------------
// GLUT display callback.
// ---------------------------------------------------------------
void display() {
    glClear(GL_COLOR_BUFFER_BIT);

    // ============================================================
    // CLIPPING: restrict all drawing below to a fixed rectangular
    // VIEWING WINDOW - the content area under the instruction text -
    // using glScissor. Anything drawn outside this pixel rectangle
    // simply does not appear, no matter what the camera transform
    // below does. This is real pixel-level clipping, not just
    // "drawing smaller".
    //
    // NOTE: this clip rectangle is the same for every class - it is
    // the whole content band, not a per-zone box. First Class gets
    // clipped exactly the same way Business and Economy already do:
    // when you zoom into it, anything the zoom pushes outside this
    // band (e.g. past the top/bottom of the window) is cut off here,
    // not specially handled per class.
    //
    // glScissor coordinates are in actual window PIXELS, measured
    // from the bottom-left, so we query the current window size
    // (in case it was resized) and compute the content band from it.
    // ============================================================
    int winW = glutGet(GLUT_WINDOW_WIDTH);
    int winH = glutGet(GLUT_WINDOW_HEIGHT);

    int textBandPixels = (int)(TEXT_BAND_HEIGHT / (PLANE_WORLD_HEIGHT + TEXT_BAND_HEIGHT) * winH);
    int clipX = 0;
    int clipY = 0;
    int clipW = winW;
    int clipH = winH - textBandPixels;   // everything BELOW the reserved text band

    glEnable(GL_SCISSOR_TEST);
    glScissor(clipX, clipY, clipW, clipH);

    // -----------------------------------------------------
    // TRANSFORMATION: translate + scale, applied in this order
    // (read bottom-to-top, since OpenGL applies the LAST call to
    // the geometry FIRST):
    //   1. glTranslatef(-currentCamX, -currentCamY) moves the
    //      selected class's panel center to the origin.
    //   2. glScalef(currentZoom, currentZoom) SCALES everything
    //      around that origin - bigger seats/plane when zoomed in.
    //   3. glTranslatef(CONTENT_CENTER_X, CONTENT_CENTER_Y) moves
    //      the origin back to the middle of the content area, so
    //      the zoomed section stays centered instead of drifting
    //      off-screen.
    //
    // This is the SAME transform pipeline used for Business and
    // Economy - First Class doesn't need its own transform code,
    // it just needs currentCamX/currentCamY/currentZoom to be
    // pointed at its bounds, which keyboard() below now does.
    // -----------------------------------------------------
    glLoadIdentity();
    glTranslatef(CONTENT_CENTER_X, CONTENT_CENTER_Y, 0.0f);
    glScalef(currentZoom, currentZoom, 1.0f);
    glTranslatef(-currentCamX, -currentCamY, 0.0f);

    drawPlaneGlyph();
    drawSeats();
    drawPlaceholderSeatPanel(FIRST_ZONE);
    drawPlaceholderSeatPanel(BUSINESS_ZONE);
    drawPlaceholderSeatPanel(ECONOMY_ZONE);

    // -----------------------------------------------------
    // Draw a white outline showing exactly where the clip window
    // is, so the boundary is visible in the demo (the scissor test
    // itself is invisible - this line is just so a viewer/examiner
    // can SEE the "defined viewing area" the clipping enforces).
    // Drawn with identity transform (not the zoomed camera) so it
    // always traces the true window edge.
    // -----------------------------------------------------
    glLoadIdentity();
    glColor3f(1.0f, 1.0f, 1.0f);
    glBegin(GL_LINE_LOOP);
        glVertex2f(2.0f,                         2.0f);
        glVertex2f(PLANE_WORLD_WIDTH - 2.0f,      2.0f);
        glVertex2f(PLANE_WORLD_WIDTH - 2.0f,      PLANE_WORLD_HEIGHT - 2.0f);
        glVertex2f(2.0f,                          PLANE_WORLD_HEIGHT - 2.0f);
    glEnd();

    // Text is drawn OUTSIDE the scissor rectangle (in the reserved
    // top band), so turn clipping off before drawing it.
    glDisable(GL_SCISSOR_TEST);

    glColor3f(1.0f, 1.0f, 1.0f);
    drawText(20, PLANE_WORLD_HEIGHT + 55, "Press 1 = Zoom First Class | 2 = Zoom Business | 3 = Zoom Economy | 0 = Reset | ESC = Quit");

    char modeText[120];
    snprintf(modeText, sizeof(modeText), "Current view: %s  (zoom x%.2f)  |  white box = clip window",
             currentModeLabel, currentZoom);
    drawText(20, PLANE_WORLD_HEIGHT + 25, modeText);

    glutSwapBuffers();
}

// ---------------------------------------------------------------
// Smoothly animates the camera towards its target every ~16ms.
// ---------------------------------------------------------------
void animate(int value) {
    const float speed = 0.12f;
    currentCamX += (targetCamX - currentCamX) * speed;
    currentCamY += (targetCamY - currentCamY) * speed;
    currentZoom += (targetZoom - currentZoom) * speed;

    glutPostRedisplay();
    glutTimerFunc(16, animate, 0);
}

// ---------------------------------------------------------------
// Computes a zoom level that fits a block comfortably inside the
// content area (85% of it, leaving a margin), capped between 1.0x
// and 4.0x.
// ---------------------------------------------------------------
float computeZoomToFit(float blockWidth, float blockHeight) {
    float zoomForWidth  = (PLANE_WORLD_WIDTH  * 0.85f) / blockWidth;
    float zoomForHeight = (PLANE_WORLD_HEIGHT * 0.85f) / blockHeight;
    float zoom = std::min(zoomForWidth, zoomForHeight);
    if (zoom < 1.0f) zoom = 1.0f;
    if (zoom > 4.0f) zoom = 4.0f;
    return zoom;
}

// ---------------------------------------------------------------
// GLUT keyboard callback.
// ---------------------------------------------------------------
void keyboard(unsigned char key, int x, int y) {
    SeatClassZone zone;
    bool zoneSelected = false;

    if (key == '1') { zone = FIRST_ZONE;    zoneSelected = true; }
    if (key == '2') { zone = BUSINESS_ZONE; zoneSelected = true; }
    if (key == '3') { zone = ECONOMY_ZONE;  zoneSelected = true; }

    if (zoneSelected) {
        float minX, minY, maxX, maxY;
        getClassPanelBounds(zone, minX, minY, maxX, maxY);

        targetCamX = (minX + maxX) / 2.0f;
        targetCamY = (minY + maxY) / 2.0f;
        targetZoom = computeZoomToFit(maxX - minX, maxY - minY);
        currentModeLabel = zoneToString(zone);
        printf("[CG-TRANSFORM] Key '%c' Pressed -> Focused on %s | Target Cam: (%.1f, %.1f) | Target Zoom: %.2fx | glScissor Active\n",
               key, currentModeLabel, targetCamX, targetCamY, targetZoom);
        return;
    }

    switch (key) {
        case '0':
            targetCamX = CONTENT_CENTER_X;
            targetCamY = CONTENT_CENTER_Y;
            targetZoom = 1.0f;
            currentModeLabel = "Full Aircraft View";
            printf("[CG-TRANSFORM] Key '0' Pressed -> Reset to Full Aircraft View (1.0x Zoom)\n");
            break;
        case 27:   // ESC
            printf("[CG-TRANSFORM] ESC Pressed -> Exiting Plane Glyph + Seat Transform Visualizer.\n");
            exit(0);
            break;
    }
}

void reshape(int w, int h) {
    glViewport(0, 0, w, h);
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    gluOrtho2D(0, PLANE_WORLD_WIDTH, 0, PLANE_WORLD_HEIGHT + TEXT_BAND_HEIGHT);
    glMatrixMode(GL_MODELVIEW);
}

int main(int argc, char** argv) {
    printf("====================================================================\n");
    printf("  AIRLINE CG: AIRCRAFT GLYPH + REAL SEAT MATRIX + 2D CAMERA ZOOM    \n");
    printf("====================================================================\n");
    printf("[CG-INIT] Initializing FreeGLUT Window (1000x700)...\n");
    printf("[CG-INIT] Plane Glyph: Fuselage, Swept Wings, Jet Engines, Stabilizer, 6 Doors\n");
    printf("[CG-INIT] Cabin Seats: Pilot Seats (Blue), Business (Purple), Economy (Green), Crew (Orange)\n");
    printf("[CG-INIT] 2D Transformation Pipeline: glScalef() + glTranslatef()\n");
    printf("[CG-INIT] Viewport Clipping: glScissor() bounding box\n");
    printf("--------------------------------------------------------------------\n");
    printf("Controls:\n");
    printf("  [1] Zoom to First Class Cabin\n");
    printf("  [2] Zoom to Business Class Cabin\n");
    printf("  [3] Zoom to Economy Class Cabin\n");
    printf("  [0] Reset to Full Aircraft Overview\n");
    printf("  [ESC] Close Window and Exit\n");
    printf("====================================================================\n");

    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB);
    glutInitWindowSize(WINDOW_WIDTH, WINDOW_HEIGHT);
    glutCreateWindow("Airline Seat Map - Plane Glyph + Real Seats + Transform/Clip Engine");

    glClearColor(0.08f, 0.08f, 0.10f, 1.0f);
    reshape(WINDOW_WIDTH, WINDOW_HEIGHT);

    glutDisplayFunc(display);
    glutReshapeFunc(reshape);
    glutKeyboardFunc(keyboard);
    glutTimerFunc(16, animate, 0);

    glutMainLoop();
    return 0;
}
