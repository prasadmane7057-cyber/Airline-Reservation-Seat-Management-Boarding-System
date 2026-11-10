#include "../src/AircraftProjectionViewing.h"

#include <cmath>
#include <iostream>
#include <stdexcept>

namespace {

void expectNear(float actual, float expected, float tolerance, const char* message) {
    if (std::abs(actual - expected) > tolerance) {
        throw std::runtime_error(message);
    }
}

void expectInvalidArgument(void (*operation)(), const char* message) {
    try {
        operation();
    } catch (const std::invalid_argument&) {
        return;
    }
    throw std::runtime_error(message);
}

void invalidPerspective() {
    float matrix[16];
    AircraftProjectionViewing::computePerspectiveMatrix(180.0f, 1.0f, 0.1f, 100.0f, matrix);
}

void invalidViewVolume() {
    float matrix[16];
    AircraftProjectionViewing::computeOrthographicMatrix(ViewVolume(2, 1, -1, 1, 0.1f, 10), matrix);
}

} // namespace

int main() {
    constexpr float tolerance = 0.0001f;
    float identity[16] = {1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1};
    float orthographic[16];
    AircraftProjectionViewing::computeOrthographicMatrix(
        ViewVolume(-2, 2, -1, 1, 1, 9), orthographic);
    expectNear(orthographic[0], 0.5f, tolerance, "Orthographic X scale is inaccurate.");
    expectNear(orthographic[5], 1.0f, tolerance, "Orthographic Y scale is inaccurate.");

    const Vec3 orthoCorner = AircraftProjectionViewing::projectToScreen(
        Vec3(-2, -1, -1), identity, orthographic, 800, 600);
    expectNear(orthoCorner.x, 0.0f, tolerance, "Orthographic left edge is misprojected.");
    expectNear(orthoCorner.y, 600.0f, tolerance, "Orthographic bottom edge is misprojected.");
    expectNear(orthoCorner.z, -1.0f, tolerance, "Orthographic near depth is inaccurate.");

    float perspective[16];
    AircraftProjectionViewing::computePerspectiveMatrix(60, 2, 1, 10, perspective);
    const Vec3 center = AircraftProjectionViewing::projectToScreen(
        Vec3(0, 0, -2), identity, perspective, 800, 600);
    expectNear(center.x, 400.0f, tolerance, "Perspective center X is misprojected.");
    expectNear(center.y, 300.0f, tolerance, "Perspective center Y is misprojected.");
    const Vec3 offset = AircraftProjectionViewing::projectToScreen(
        Vec3(1, 0, -2), identity, perspective, 800, 600);
    expectNear(offset.x, 573.205f, 0.001f, "Perspective horizontal scale is inaccurate.");

    float view[16];
    AircraftProjectionViewing::computeLookAtMatrix(
        Vec3(0, 0, 5), Vec3(0, 0, 0), Vec3(0, 1, 0), view);
    expectNear(view[14], -5.0f, tolerance, "Look-at translation is inaccurate.");
    expectInvalidArgument(invalidPerspective, "Invalid perspective parameters were accepted.");
    expectInvalidArgument(invalidViewVolume, "Invalid orthographic bounds were accepted.");

    std::cout << "Aircraft projection precision checks passed (tolerance 1e-4).\n";
    return 0;
}
