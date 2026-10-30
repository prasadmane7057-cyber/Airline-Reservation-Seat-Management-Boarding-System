#ifndef LINE_CLIPPING_H
#define LINE_CLIPPING_H

#include <cmath>

struct ClipWindow {
    double xmin;
    double ymin;
    double xmax;
    double ymax;
};

struct ClipLine {
    double x1;
    double y1;
    double x2;
    double y2;
};

enum class ClipStatus {
    Accepted,
    Rejected,
    InvalidInput,
    NoConvergence
};

struct ClipResult {
    ClipStatus status;
    ClipLine line;
    int iterations;
};

namespace line_clipping_detail {

constexpr int INSIDE = 0;
constexpr int LEFT = 1;
constexpr int RIGHT = 2;
constexpr int BOTTOM = 4;
constexpr int TOP = 8;

inline int computeOutCode(double x, double y, const ClipWindow& window) {
    int code = INSIDE;
    if (x < window.xmin) code |= LEFT;
    else if (x > window.xmax) code |= RIGHT;
    if (y < window.ymin) code |= BOTTOM;
    else if (y > window.ymax) code |= TOP;
    return code;
}

} // namespace line_clipping_detail

inline ClipResult cohenSutherlandClip(const ClipLine& input, const ClipWindow& window) {
    const ClipResult invalid = {ClipStatus::InvalidInput, input, 0};
    if (!std::isfinite(window.xmin) || !std::isfinite(window.ymin) ||
        !std::isfinite(window.xmax) || !std::isfinite(window.ymax) ||
        window.xmin > window.xmax || window.ymin > window.ymax ||
        !std::isfinite(input.x1) || !std::isfinite(input.y1) ||
        !std::isfinite(input.x2) || !std::isfinite(input.y2)) {
        return invalid;
    }

    ClipLine line = input;
    int iterations = 0;
    constexpr int MAX_ITERATIONS = 16;

    while (iterations < MAX_ITERATIONS) {
        const int code1 = line_clipping_detail::computeOutCode(line.x1, line.y1, window);
        const int code2 = line_clipping_detail::computeOutCode(line.x2, line.y2, window);

        if ((code1 | code2) == 0) {
            return {ClipStatus::Accepted, line, iterations};
        }
        if ((code1 & code2) != 0) {
            return {ClipStatus::Rejected, line, iterations};
        }

        const int outside = code1 != 0 ? code1 : code2;
        double x = 0.0;
        double y = 0.0;

        if ((outside & line_clipping_detail::TOP) != 0) {
            const double dy = line.y2 - line.y1;
            if (dy == 0.0) return invalid;
            x = line.x1 + (line.x2 - line.x1) * (window.ymax - line.y1) / dy;
            y = window.ymax;
        } else if ((outside & line_clipping_detail::BOTTOM) != 0) {
            const double dy = line.y2 - line.y1;
            if (dy == 0.0) return invalid;
            x = line.x1 + (line.x2 - line.x1) * (window.ymin - line.y1) / dy;
            y = window.ymin;
        } else if ((outside & line_clipping_detail::RIGHT) != 0) {
            const double dx = line.x2 - line.x1;
            if (dx == 0.0) return invalid;
            y = line.y1 + (line.y2 - line.y1) * (window.xmax - line.x1) / dx;
            x = window.xmax;
        } else {
            const double dx = line.x2 - line.x1;
            if (dx == 0.0) return invalid;
            y = line.y1 + (line.y2 - line.y1) * (window.xmin - line.x1) / dx;
            x = window.xmin;
        }

        if (!std::isfinite(x) || !std::isfinite(y)) return invalid;

        if (outside == code1) {
            line.x1 = x;
            line.y1 = y;
        } else {
            line.x2 = x;
            line.y2 = y;
        }
        ++iterations;
    }

    return {ClipStatus::NoConvergence, line, iterations};
}

#endif
