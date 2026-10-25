/*
 * ScanlineFill.h
 * -----------------------------------------------------------
 * Computer Graphics Lab (CGL) - Review 4, CO3 (2D objects via algorithms)
 * Airline Reservation, Seat Management & Boarding System
 * -----------------------------------------------------------
 * Declares the scan-line polygon fill function so it can be
 * reused by other files in the project (e.g. SeatMapTransform.cpp,
 * or later code that colors individual seat icons by state).
 * -----------------------------------------------------------
 */

#ifndef SCANLINE_FILL_H
#define SCANLINE_FILL_H

#include <vector>
#include <utility>

// ============================================================
// Fills an arbitrary simple polygon (convex OR non-convex, any
// number of vertices, listed in order around the shape) using
// the classic scan-line algorithm: an Edge Table built once, then
// an Active Edge List walked one scanline at a time. This fills
// correctly even for a shape that is NOT a rectangle - such as
// the tapered fuselage outline - which a plain rectangle fill
// (e.g. glRectf or four glVertex2f calls) cannot do correctly.
//
//   polygon : the vertices of the shape, in order, as (x, y) pairs
//   r, g, b : fill color, each in the 0.0-1.0 range
// ============================================================
void scanlineFillPolygon(const std::vector<std::pair<float, float>>& polygon,
                          float r, float g, float b);

#endif
