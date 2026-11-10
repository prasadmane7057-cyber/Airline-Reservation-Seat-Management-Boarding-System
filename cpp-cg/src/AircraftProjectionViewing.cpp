#include "AircraftProjectionViewing.h"
#include <cmath>
#include <cstring>
#include <stdexcept>

static const float PI = 3.14159265358979323846f;

void AircraftProjectionViewing::computeOrthographicMatrix(const ViewVolume& vol, float m[16]) {
    if (!std::isfinite(vol.left) || !std::isfinite(vol.right)
            || !std::isfinite(vol.bottom) || !std::isfinite(vol.top)
            || !std::isfinite(vol.nearVal) || !std::isfinite(vol.farVal)
            || vol.right <= vol.left || vol.top <= vol.bottom
            || vol.farVal <= vol.nearVal) {
        throw std::invalid_argument("Orthographic view volume must have finite, increasing bounds.");
    }

    // Column-major order:
    // [ 2/(r-l)       0           0       -(r+l)/(r-l) ]
    // [   0        2/(t-b)        0       -(t+b)/(t-b) ]
    // [   0           0       -2/(f-n)    -(f+n)/(f-n) ]
    // [   0           0           0             1      ]
    std::memset(m, 0, 16 * sizeof(float));

    float rl = vol.right - vol.left;
    float tb = vol.top - vol.bottom;
    float fn = vol.farVal - vol.nearVal;

    m[0]  = 2.0f / rl;
    m[5]  = 2.0f / tb;
    m[10] = -2.0f / fn;
    m[12] = -(vol.right + vol.left) / rl;
    m[13] = -(vol.top + vol.bottom) / tb;
    m[14] = -(vol.farVal + vol.nearVal) / fn;
    m[15] = 1.0f;
}

void AircraftProjectionViewing::computePerspectiveMatrix(float fovYDegrees, float aspect, float zNear, float zFar, float m[16]) {
    if (!std::isfinite(fovYDegrees) || !std::isfinite(aspect)
            || !std::isfinite(zNear) || !std::isfinite(zFar)
            || fovYDegrees <= 0.0f || fovYDegrees >= 180.0f
            || aspect <= 0.0f || zNear <= 0.0f || zFar <= zNear) {
        throw std::invalid_argument("Perspective parameters must be finite and define a valid frustum.");
    }

    std::memset(m, 0, 16 * sizeof(float));

    float rad = (fovYDegrees * 0.5f) * (PI / 180.0f);
    float tanHalfFov = std::tan(rad);
    float f = 1.0f / tanHalfFov;

    m[0]  = f / aspect;
    m[5]  = f;
    m[10] = (zFar + zNear) / (zNear - zFar);
    m[11] = -1.0f;
    m[14] = (2.0f * zFar * zNear) / (zNear - zFar);
}

void AircraftProjectionViewing::computeLookAtMatrix(const Vec3& eye, const Vec3& center, const Vec3& up, float m[16]) {
    if (!std::isfinite(eye.x) || !std::isfinite(eye.y) || !std::isfinite(eye.z)
            || !std::isfinite(center.x) || !std::isfinite(center.y) || !std::isfinite(center.z)
            || !std::isfinite(up.x) || !std::isfinite(up.y) || !std::isfinite(up.z)) {
        throw std::invalid_argument("Look-at vectors must contain finite coordinates.");
    }

    // Forward = normalize(center - eye)
    float fx = center.x - eye.x;
    float fy = center.y - eye.y;
    float fz = center.z - eye.z;
    float flen = std::sqrt(fx * fx + fy * fy + fz * fz);
    if (flen <= 0.0001f) {
        throw std::invalid_argument("Look-at eye and target must not coincide.");
    }
    fx /= flen; fy /= flen; fz /= flen;

    // Side = normalize(cross(Forward, up))
    float sx = fy * up.z - fz * up.y;
    float sy = fz * up.x - fx * up.z;
    float sz = fx * up.y - fy * up.x;
    float slen = std::sqrt(sx * sx + sy * sy + sz * sz);
    if (slen <= 0.0001f) {
        throw std::invalid_argument("Look-at up vector must not be parallel to the viewing direction.");
    }
    sx /= slen; sy /= slen; sz /= slen;

    // Up' = cross(Side, Forward)
    float ux = sy * fz - sz * fy;
    float uy = sz * fx - sx * fz;
    float uz = sx * fy - sy * fx;

    // Load rotation and translation (column-major)
    m[0] = sx;  m[4] = sy;  m[8]  = sz;  m[12] = -(sx * eye.x + sy * eye.y + sz * eye.z);
    m[1] = ux;  m[5] = uy;  m[9]  = uz;  m[13] = -(ux * eye.x + uy * eye.y + uz * eye.z);
    m[2] = -fx; m[6] = -fy; m[10] = -fz; m[14] =  (fx * eye.x + fy * eye.y + fz * eye.z);
    m[3] = 0;   m[7] = 0;   m[11] = 0;   m[15] = 1.0f;
}

Vec3 AircraftProjectionViewing::projectToScreen(const Vec3& worldPoint, const float modelView[16], const float projection[16], int winW, int winH) {
    if (winW <= 0 || winH <= 0) {
        throw std::invalid_argument("Viewport dimensions must be positive.");
    }

    // 1. Multiply by ModelView: V_eye = M_view * V_world
    float ex = modelView[0] * worldPoint.x + modelView[4] * worldPoint.y + modelView[8]  * worldPoint.z + modelView[12];
    float ey = modelView[1] * worldPoint.x + modelView[5] * worldPoint.y + modelView[9]  * worldPoint.z + modelView[13];
    float ez = modelView[2] * worldPoint.x + modelView[6] * worldPoint.y + modelView[10] * worldPoint.z + modelView[14];
    float ew = modelView[3] * worldPoint.x + modelView[7] * worldPoint.y + modelView[11] * worldPoint.z + modelView[15];

    // 2. Multiply by Projection: V_clip = M_proj * V_eye
    float cx = projection[0] * ex + projection[4] * ey + projection[8]  * ez + projection[12] * ew;
    float cy = projection[1] * ex + projection[5] * ey + projection[9]  * ez + projection[13] * ew;
    float cz = projection[2] * ex + projection[6] * ey + projection[10] * ez + projection[14] * ew;
    float cw = projection[3] * ex + projection[7] * ey + projection[11] * ez + projection[15] * ew;

    // 3. Perspective divide to NDC [-1, 1]
    if (!std::isfinite(cw) || std::abs(cw) < 0.00001f) {
        throw std::invalid_argument("Projected point has an invalid homogeneous coordinate.");
    }
    float ndcX = cx / cw;
    float ndcY = cy / cw;
    float ndcZ = cz / cw;

    // 4. Viewport mapping to screen coordinates
    float screenX = (ndcX + 1.0f) * 0.5f * winW;
    float screenY = (1.0f - (ndcY + 1.0f) * 0.5f) * winH; // Invert Y for window coordinates

    return Vec3(screenX, screenY, ndcZ);
}

void AircraftProjectionViewing::getCameraForPreset(CameraPreset preset, float distance, Vec3& eye, Vec3& target, Vec3& up) {
    target = Vec3(0.0f, 0.0f, 0.0f);

    switch (preset) {
        case CameraPreset::TOP_PLAN:
            // Top view: Looking down from +Y axis onto fuselage & cabin seating
            eye = Vec3(0.0f, distance, 0.0f);
            up = Vec3(1.0f, 0.0f, 0.0f); // Nose is along +X
            break;

        case CameraPreset::FRONT_ELEVATION:
            // Front view: Looking at nose along +X axis
            eye = Vec3(distance, 0.0f, 0.0f);
            up = Vec3(0.0f, 1.0f, 0.0f); // Vertical is +Y
            break;

        case CameraPreset::SIDE_PROFILE:
            // Side view: Looking along +Z axis
            eye = Vec3(0.0f, 0.0f, distance);
            up = Vec3(0.0f, 1.0f, 0.0f);
            break;

        case CameraPreset::ISOMETRIC:
            // Axonometric isometric view: equal component offsets
            {
                float isoD = distance / std::sqrt(3.0f);
                eye = Vec3(isoD, isoD, isoD);
                up = Vec3(0.0f, 1.0f, 0.0f);
            }
            break;

        case CameraPreset::FREE_ORBIT:
        default:
            eye = Vec3(0.0f, 1.5f, distance);
            up = Vec3(0.0f, 1.0f, 0.0f);
            break;
    }
}

std::string AircraftProjectionViewing::getProjectionModeName(ProjectionMode mode) {
    switch (mode) {
        case ProjectionMode::PERSPECTIVE:  return "Perspective (Converging Rays, Depth Foreshortening)";
        case ProjectionMode::ORTHOGRAPHIC: return "Orthographic (Parallel Rays, True Metric Scale)";
    }
    return "Unknown";
}

std::string AircraftProjectionViewing::getCameraPresetName(CameraPreset preset) {
    switch (preset) {
        case CameraPreset::FREE_ORBIT:      return "Free 3D Orbit (Interactive Pitch/Yaw/Roll)";
        case CameraPreset::TOP_PLAN:        return "Top View / Plan (Fuselage & Cabin Seating Layout)";
        case CameraPreset::FRONT_ELEVATION: return "Front Elevation (Aircraft Nose & Wingspan)";
        case CameraPreset::SIDE_PROFILE:    return "Side Profile (Fuselage Length & Vertical Rudder)";
        case CameraPreset::ISOMETRIC:       return "Axonometric Isometric View (Engineering Drawing)";
    }
    return "Unknown";
}
