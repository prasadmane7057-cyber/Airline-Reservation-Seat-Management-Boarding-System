/*
 * ScanlineFill.cpp
 * -----------------------------------------------------------
 * Computer Graphics Lab (CGL) - Review 4, CO3 (2D objects via algorithms)
 * Airline Reservation, Seat Management & Boarding System
 * Author: Vaishnavi
 * -----------------------------------------------------------
 * Implements SCAN-LINE POLYGON FILL from scratch: for each
 * horizontal row (scanline) of the screen, work out exactly where
 * that row crosses the polygon's edges, and fill only the pixels
 * between those crossing points. This is what lets us correctly
 * color an irregular shape like the tapered aircraft fuselage -
 * a plain rectangle fill can't follow a shape that narrows at the
 * nose and tail.
 *
 * THE ALGORITHM (Edge Table + Active Edge List):
 *   1. EDGE TABLE (ET): for every edge of the polygon (skipping
 *      perfectly horizontal edges, which contribute no new
 *      crossings), record where it STARTS (its lower y), where it
 *      ENDS (its upper y), the x-coordinate at its lower y, and
 *      how much x changes per unit of y (its inverse slope,
 *      dx/dy). This is a one-time setup per polygon.
 *   2. ACTIVE EDGE LIST (AEL): walking from the polygon's lowest
 *      y to its highest y, one scanline at a time:
 *        - add any edge from the ET whose "start y" is this row
 *        - drop any edge whose "end y" is this row (it's finished)
 *        - sort what's left by current x
 *        - fill the row in PAIRS of x values: (1st,2nd) filled,
 *          (2nd,3rd) skipped, (3rd,4th) filled, and so on - this
 *          pairing is what correctly handles concave shapes with
 *          multiple separate filled spans on the same row
 *        - afterwards, advance every active edge's x by its
 *          inverse slope, ready for the next row up
 *
 * This file uses ONLY <GL/glut.h> for drawing (glBegin/glVertex2f
 * quads for each filled span) - no GLU is actually needed for the
 * fill itself, but the header is included for consistency with
 * the rest of the CGL module in case a teammate's build script
 * links against it.
 * -----------------------------------------------------------
 * INTEGRATION:
 * This file's drawing function, scanlineFillPolygon(), has NO
 * main() in it - compile it together with the rest of the CGL
 * module (PlaneGlyph.cpp, SeatMapTransform.cpp) and call it from
 * wherever a filled shape is needed, e.g.:
 *
 *   #include "ScanlineFill.h"
 *   scanlineFillPolygon(myPolygonPoints, 0.85f, 0.65f, 0.13f);
 *
 * A STANDALONE DEMO (its own main(), its own window) is included
 * below, guarded so it only compiles when this file is built by
 * itself:
 *
 *   g++ ScanlineFill.cpp -o ScanlineFill -lglut -lGLU -lGL
 *   ./ScanlineFill
 *
 * When this file is compiled ALONGSIDE PlaneGlyph.cpp and
 * SeatMapTransform.cpp (which already have their own main()),
 * define SCANLINE_FILL_NO_MAIN so this file's demo main() is left
 * out and there is only one main() in the final program:
 *
 *   g++ -DSCANLINE_FILL_NO_MAIN PlaneGlyph.cpp SeatMap.cpp \
 *       ScanlineFill.cpp SeatMapTransform.cpp \
 *       -o SeatMapDemo -lglut -lGLU -lGL
 * -----------------------------------------------------------
 */

#include "ScanlineFill.h"
#include <GL/glut.h>
#include <algorithm>
#include <cmath>

using namespace std;

// ---------------------------------------------------------------
// One edge of the polygon, prepared for the Edge Table.
// ---------------------------------------------------------------
struct FillEdge {
    float yStart;      // the lower y-value this edge spans
    float yEnd;         // the higher y-value this edge spans
    float xAtYStart;     // x-coordinate of the edge at yStart
    float inverseSlope;   // dx/dy - how much x changes per unit of y
};

// ---------------------------------------------------------------
// An edge currently "active" on the scanline being processed -
// just its current x position and when it should be dropped.
// ---------------------------------------------------------------
struct ActiveEdge {
    float x;
    float yEnd;
    float inverseSlope;
};

// ============================================================
// STEP 1: build the Edge Table from the polygon's vertex list.
// Walks every consecutive pair of vertices (wrapping from the
// last point back to the first), skips horizontal edges (they
// have no y-range to contribute), and always stores yStart as
// the SMALLER of the two endpoint y-values so later comparisons
// don't need to worry about edge direction.
// ============================================================
static vector<FillEdge> buildEdgeTable(const vector<pair<float, float>>& polygon) {
    vector<FillEdge> edgeTable;
    int n = (int)polygon.size();

    for (int i = 0; i < n; i++) {
        float x1 = polygon[i].first;
        float y1 = polygon[i].second;
        float x2 = polygon[(i + 1) % n].first;
        float y2 = polygon[(i + 1) % n].second;

        if (y1 == y2) {
            continue;   // horizontal edge - contributes nothing to any scanline crossing
        }

        FillEdge edge;
        if (y1 < y2) {
            edge.yStart = y1;
            edge.yEnd = y2;
            edge.xAtYStart = x1;
            edge.inverseSlope = (x2 - x1) / (y2 - y1);
        } else {
            edge.yStart = y2;
            edge.yEnd = y1;
            edge.xAtYStart = x2;
            edge.inverseSlope = (x1 - x2) / (y1 - y2);
        }

        edgeTable.push_back(edge);
    }

    return edgeTable;
}

// ============================================================
// scanlineFillPolygon(): the function declared in ScanlineFill.h.
// Runs the full Edge-Table + Active-Edge-List algorithm described
// at the top of this file and draws each filled span as a thin
// quad (one world-unit tall) so the fill has no gaps between rows.
// ============================================================
void scanlineFillPolygon(const vector<pair<float, float>>& polygon, float r, float g, float b) {
    if (polygon.size() < 3) {
        return;   // not a real polygon
    }

    vector<FillEdge> edgeTable = buildEdgeTable(polygon);
    if (edgeTable.empty()) {
        return;   // degenerate shape (e.g. every edge was horizontal)
    }

    // Find the overall Y range of the polygon.
    float yMin = polygon[0].second;
    float yMax = polygon[0].second;
    for (const auto& p : polygon) {
        if (p.second < yMin) yMin = p.second;
        if (p.second > yMax) yMax = p.second;
    }

    vector<ActiveEdge> activeEdges;

    glColor3f(r, g, b);

    // Walk one scanline (one world-unit row) at a time from the
    // bottom of the shape to the top.
    for (float y = floor(yMin); y < yMax; y += 1.0f) {

        // ---- add edges that start on this row (yStart falls in [y, y+1)) ----
        for (const auto& edge : edgeTable) {
            if (edge.yStart >= y && edge.yStart < y + 1.0f) {
                ActiveEdge ae;
                ae.x = edge.xAtYStart + (y - edge.yStart) * edge.inverseSlope;
                ae.yEnd = edge.yEnd;
                ae.inverseSlope = edge.inverseSlope;
                activeEdges.push_back(ae);
            }
        }

        // ---- drop edges that have ended by this row ----
        activeEdges.erase(
            remove_if(activeEdges.begin(), activeEdges.end(),
                      [y](const ActiveEdge& ae) { return ae.yEnd <= y; }),
            activeEdges.end()
        );

        // ---- sort remaining active edges left-to-right by current x ----
        sort(activeEdges.begin(), activeEdges.end(),
             [](const ActiveEdge& a, const ActiveEdge& b) { return a.x < b.x; });

        // ---- fill in PAIRS: (1st,2nd) filled, (2nd,3rd) gap, (3rd,4th) filled... ----
        for (size_t i = 0; i + 1 < activeEdges.size(); i += 2) {
            float xStart = activeEdges[i].x;
            float xEnd = activeEdges[i + 1].x;

            glBegin(GL_QUADS);
                glVertex2f(xStart, y);
                glVertex2f(xEnd,   y);
                glVertex2f(xEnd,   y + 1.0f);
                glVertex2f(xStart, y + 1.0f);
            glEnd();
        }

        // ---- advance every active edge's x ready for the next row ----
        for (auto& ae : activeEdges) {
            ae.x += ae.inverseSlope;
        }
    }
}


// ============================================================================
// STANDALONE DEMO - only compiled when this file is built by itself (i.e. when
// SCANLINE_FILL_NO_MAIN is NOT defined). Shows the technique on the actual
// aircraft fuselage shape used elsewhere in this project: the fuselage
// silhouette is a tapered hexagon (NOT a rectangle), filled here with
// scanlineFillPolygon() instead of glBegin(GL_POLYGON) - and the three cabin
// zones (First/Business/Economy) are filled on top of it, using the same
// zone X-ranges as SeatMapTransform.cpp so colors line up with the real
// layout once integrated.
// ============================================================================
#ifndef SCANLINE_FILL_NO_MAIN

const float DEMO_WORLD_WIDTH  = 1000.0f;
const float DEMO_WORLD_HEIGHT = 600.0f;

const float DEMO_FUSELAGE_CENTER_Y = 300.0f;
const float DEMO_FUSELAGE_TOP_EDGE = 355.0f;
const float DEMO_FUSELAGE_BOTTOM_EDGE = 245.0f;

void demoDisplay() {
    glClear(GL_COLOR_BUFFER_BIT);
    glLoadIdentity();

    // ---- the full fuselage silhouette: an irregular, tapered hexagon ----
    vector<pair<float, float>> fuselage = {
        {0.0f,    DEMO_FUSELAGE_CENTER_Y},        // nose tip
        {90.0f,   DEMO_FUSELAGE_TOP_EDGE},         // nose taper -> top edge
        {850.0f,  DEMO_FUSELAGE_TOP_EDGE},         // straight top edge
        {1000.0f, DEMO_FUSELAGE_CENTER_Y},         // tail tip
        {850.0f,  DEMO_FUSELAGE_BOTTOM_EDGE},      // straight bottom edge
        {90.0f,   DEMO_FUSELAGE_BOTTOM_EDGE}       // tail taper -> nose taper
    };
    scanlineFillPolygon(fuselage, 0.85f, 0.87f, 0.90f);   // light grey body

    // ---- outline, drawn normally, just so the shape edge is crisp ----
    glColor3f(0.35f, 0.38f, 0.42f);
    glBegin(GL_LINE_LOOP);
        for (auto& p : fuselage) glVertex2f(p.first, p.second);
    glEnd();

    // ---- the three cabin zones, same X-ranges as SeatMapTransform.cpp ----
    float zoneMinY = 253.0f;
    float zoneMaxY = 347.0f;

    vector<pair<float, float>> firstZone    = {{95.0f, zoneMinY}, {200.0f, zoneMinY}, {200.0f, zoneMaxY}, {95.0f, zoneMaxY}};
    vector<pair<float, float>> businessZone = {{210.0f, zoneMinY}, {375.0f, zoneMinY}, {375.0f, zoneMaxY}, {210.0f, zoneMaxY}};
    vector<pair<float, float>> economyZone  = {{385.0f, zoneMinY}, {845.0f, zoneMinY}, {845.0f, zoneMaxY}, {385.0f, zoneMaxY}};

    scanlineFillPolygon(firstZone,    0.75f, 0.20f, 0.75f);   // purple = First
    scanlineFillPolygon(businessZone, 0.85f, 0.65f, 0.13f);   // gold   = Business
    scanlineFillPolygon(economyZone,  0.40f, 0.70f, 0.95f);   // blue   = Economy

    // ---- zone outlines for clarity ----
    glColor3f(0.15f, 0.15f, 0.15f);
    for (auto* zone : {&firstZone, &businessZone, &economyZone}) {
        glBegin(GL_LINE_LOOP);
            for (auto& p : *zone) glVertex2f(p.first, p.second);
        glEnd();
    }

    // ---- label ----
    glColor3f(1.0f, 1.0f, 1.0f);
    glRasterPos2f(20, DEMO_WORLD_HEIGHT - 25);
    const char* label = "Scan-line Polygon Fill: fuselage (irregular hexagon) + 3 cabin zones";
    for (const char* c = label; *c != '\0'; c++) {
        glutBitmapCharacter(GLUT_BITMAP_HELVETICA_18, *c);
    }

    glutSwapBuffers();
}

void demoReshape(int w, int h) {
    glViewport(0, 0, w, h);
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    gluOrtho2D(0, DEMO_WORLD_WIDTH, 0, DEMO_WORLD_HEIGHT);
    glMatrixMode(GL_MODELVIEW);
}

int main(int argc, char** argv) {
    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB);
    glutInitWindowSize(1000, 600);
    glutCreateWindow("CGL Practical - Scan-line Polygon Fill Demo");

    glClearColor(0.08f, 0.08f, 0.10f, 1.0f);
    demoReshape(1000, 600);

    glutDisplayFunc(demoDisplay);
    glutReshapeFunc(demoReshape);

    glutMainLoop();
    return 0;
}

#endif // SCANLINE_FILL_NO_MAIN
