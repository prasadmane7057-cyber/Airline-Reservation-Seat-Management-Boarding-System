#ifndef AIRCRAFT_PROJECTION_VIEWING_H
#define AIRCRAFT_PROJECTION_VIEWING_H

#include <string>
#include <vector>

// Projection modes supported by the aircraft viewer
enum class ProjectionMode {
    PERSPECTIVE,    // Converging projection rays with depth foreshortening (gluPerspective)
    ORTHOGRAPHIC    // Parallel projection rays preserving true scale & proportions (glOrtho)
};

// Standard multi-view architectural camera presets
enum class CameraPreset {
    FREE_ORBIT,         // User controlled free 3D rotation
    TOP_PLAN,           // Looking straight down (-Y) at fuselage and cabin seating layout
    FRONT_ELEVATION,    // Looking straight at the aircraft nose (+X) to view wingspan
    SIDE_PROFILE,       // Looking at the fuselage side (+Z) to view length and vertical tail
    ISOMETRIC           // Axonometric engineering isometric projection (equal angles)
};

// Orthographic view volume bounds
struct ViewVolume {
    float left;
    float right;
    float bottom;
    float top;
    float nearVal;
    float farVal;

    ViewVolume(float l = -6.0f, float r = 6.0f, float b = -4.0f, float t = 4.0f, float n = 0.1f, float f = 100.0f)
        : left(l), right(r), bottom(b), top(t), nearVal(n), farVal(f) {}
};

// 3D Vector for camera positioning and ray transformations
struct Vec3 {
    float x, y, z;
    Vec3(float _x = 0, float _y = 0, float _z = 0) : x(_x), y(_y), z(_z) {}
};

class AircraftProjectionViewing {
public:
    // Calculates standard 4x4 Orthographic Projection Matrix (column-major)
    static void computeOrthographicMatrix(const ViewVolume& vol, float m[16]);

    // Calculates standard 4x4 Perspective Projection Matrix (column-major)
    static void computePerspectiveMatrix(float fovYDegrees, float aspect, float zNear, float zFar, float m[16]);

    // Calculates LookAt View Matrix
    static void computeLookAtMatrix(const Vec3& eye, const Vec3& center, const Vec3& up, float m[16]);

    // Transforms a 3D world coordinate through ModelView, Projection, and Viewport matrices
    static Vec3 projectToScreen(const Vec3& worldPoint, const float modelView[16], const float projection[16], int winW, int winH);

    // Returns camera coordinates for the selected preset
    static void getCameraForPreset(CameraPreset preset, float distance, Vec3& eye, Vec3& target, Vec3& up);

    // Helper text descriptions
    static std::string getProjectionModeName(ProjectionMode mode);
    static std::string getCameraPresetName(CameraPreset preset);
};

#endif // AIRCRAFT_PROJECTION_VIEWING_H
