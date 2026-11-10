#ifndef SEAT_MAP_TEXTURE_COLOR_H
#define SEAT_MAP_TEXTURE_COLOR_H

#ifdef __APPLE__
  #include <GLUT/glut.h>
#else
  #include <GL/glut.h>
#endif

#include <string>

/**
 * =============================================================================
 * Module: Seat Map Texture & Colour Finalization Specification
 * Subject: Computer Graphics (CGL / C++)
 * Purpose: Defines finalized color palettes, material reflectance, procedural
 *          woven fabric / leather textures, and rendering shaders for cabin seats.
 * =============================================================================
 */

enum SeatClassType {
    CLASS_FIRST,
    CLASS_BUSINESS,
    CLASS_ECONOMY,
    CLASS_PILOT,
    CLASS_CREW,
    CLASS_BLOCKED_EXIT
};

enum SeatStatusState {
    STATUS_AVAILABLE,
    STATUS_SELECTED,
    STATUS_BOOKED,
    STATUS_BLOCKED
};

struct RGBAColor {
    float r, g, b, a;
    RGBAColor(float red = 1.0f, float green = 1.0f, float blue = 1.0f, float alpha = 1.0f)
        : r(red), g(green), b(blue), a(alpha) {}
};

namespace SeatPalette {
    // 1. First Class: Royal Plum Purple & Champagne Gold
    const RGBAColor FIRST_AVAILABLE(0.486f, 0.227f, 0.929f, 1.0f);     // #7C3AED
    const RGBAColor FIRST_BORDER(0.961f, 0.773f, 0.188f, 1.0f);        // #F5C530 Gold Accent

    // 2. Business Class: Deep Sapphire Indigo
    const RGBAColor BUSINESS_AVAILABLE(0.145f, 0.388f, 0.921f, 1.0f);  // #2563EB
    const RGBAColor BUSINESS_BORDER(0.576f, 0.773f, 0.992f, 1.0f);     // #93C5FD

    // 3. Economy Class: Fresh Emerald Teal
    const RGBAColor ECONOMY_AVAILABLE(0.020f, 0.588f, 0.412f, 1.0f);   // #059669
    const RGBAColor ECONOMY_BORDER(0.431f, 0.906f, 0.718f, 1.0f);      // #6EE7B7

    // 4. Interactive States
    const RGBAColor SEAT_SELECTED(0.984f, 0.749f, 0.141f, 1.0f);       // #FBBF24 Amber Gold
    const RGBAColor SEAT_BOOKED(0.862f, 0.149f, 0.149f, 1.0f);         // #DC2626 Crimson Red
    const RGBAColor SEAT_BLOCKED(0.294f, 0.333f, 0.388f, 1.0f);        // #4B5563 Slate Gray

    // 5. Cockpit & Crew
    const RGBAColor PILOT_COCKPIT(0.118f, 0.251f, 0.686f, 1.0f);       // #1E40AF Royal Blue
    const RGBAColor CREW_STATION(0.918f, 0.345f, 0.047f, 1.0f);        // #EA580C Safety Orange
}

// Procedural texture IDs
extern GLuint g_seatFabricTextureId;
extern GLuint g_seatLeatherTextureId;
extern bool g_seatTexturesInitialized;

// Initialization & Material Setup
void initializeSeatTextures();
void applySeatMaterialLighting(SeatClassType cls, SeatStatusState state);
RGBAColor getFinalSeatColor(SeatClassType cls, SeatStatusState state);

// Primary Textured Seat Drawing Function
void drawTexturedCabinSeat(
    float x, float y, float width, float height,
    SeatClassType cls, SeatStatusState state,
    bool enableTexture = true,
    bool enableLighting = true
);

#endif // SEAT_MAP_TEXTURE_COLOR_H
