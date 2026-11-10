#include "SeatMapTextureColor.h"
#include <vector>
#include <cmath>
#include <algorithm>

GLuint g_seatFabricTextureId = 0;
GLuint g_seatLeatherTextureId = 0;
bool g_seatTexturesInitialized = false;

// Generates procedural cross-hatch micro-woven fabric texture
static GLuint generateWovenFabricTexture(int width = 64, int height = 64) {
    std::vector<unsigned char> data(width * height * 4);

    for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
            // Warp and weft pattern
            int warp = (x % 4 < 2) ? 220 : 180;
            int weft = (y % 4 < 2) ? 220 : 180;
            int weave = (warp + weft) / 2;

            // Micro-stipple variation
            int noise = ((x * 17 + y * 31) % 13) - 6;
            int val = std::max(0, std::min(255, weave + noise));

            int idx = (y * width + x) * 4;
            data[idx]     = static_cast<unsigned char>(val);
            data[idx + 1] = static_cast<unsigned char>(val);
            data[idx + 2] = static_cast<unsigned char>(val);
            data[idx + 3] = 255;
        }
    }

    GLuint texId = 0;
    glGenTextures(1, &texId);
    glBindTexture(GL_TEXTURE_2D, texId);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, data.data());

    return texId;
}

// Generates procedural luxury leather grain texture for premium seats
static GLuint generateLeatherTexture(int width = 64, int height = 64) {
    std::vector<unsigned char> data(width * height * 4);

    for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
            // Voronoi-like cellular leather pore simulation
            float fx = static_cast<float>(x) / 8.0f;
            float fy = static_cast<float>(y) / 8.0f;
            int cellX = static_cast<int>(std::floor(fx));
            int cellY = static_cast<int>(std::floor(fy));

            float minDist = 1.0f;
            for (int dy = -1; dy <= 1; ++dy) {
                for (int dx = -1; dx <= 1; ++dx) {
                    int nx = cellX + dx;
                    int ny = cellY + dy;
                    float randX = static_cast<float>((nx * 37 + ny * 19) % 100) / 100.0f;
                    float randY = static_cast<float>((nx * 53 + ny * 71) % 100) / 100.0f;
                    float dist = std::sqrt((fx - (nx + randX)) * (fx - (nx + randX)) +
                                           (fy - (ny + randY)) * (fy - (ny + randY)));
                    if (dist < minDist) minDist = dist;
                }
            }

            int intensity = static_cast<int>(240.0f - minDist * 45.0f);
            intensity = std::max(120, std::min(255, intensity));

            int idx = (y * width + x) * 4;
            data[idx]     = static_cast<unsigned char>(intensity);
            data[idx + 1] = static_cast<unsigned char>(intensity);
            data[idx + 2] = static_cast<unsigned char>(intensity);
            data[idx + 3] = 255;
        }
    }

    GLuint texId = 0;
    glGenTextures(1, &texId);
    glBindTexture(GL_TEXTURE_2D, texId);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, data.data());

    return texId;
}

void initializeSeatTextures() {
    if (g_seatTexturesInitialized) return;
    g_seatFabricTextureId = generateWovenFabricTexture();
    g_seatLeatherTextureId = generateLeatherTexture();
    g_seatTexturesInitialized = true;
}

RGBAColor getFinalSeatColor(SeatClassType cls, SeatStatusState state) {
    if (state == STATUS_BOOKED) return SeatPalette::SEAT_BOOKED;
    if (state == STATUS_SELECTED) return SeatPalette::SEAT_SELECTED;
    if (state == STATUS_BLOCKED) return SeatPalette::SEAT_BLOCKED;

    switch (cls) {
        case CLASS_FIRST:        return SeatPalette::FIRST_AVAILABLE;
        case CLASS_BUSINESS:     return SeatPalette::BUSINESS_AVAILABLE;
        case CLASS_ECONOMY:      return SeatPalette::ECONOMY_AVAILABLE;
        case CLASS_PILOT:        return SeatPalette::PILOT_COCKPIT;
        case CLASS_CREW:         return SeatPalette::CREW_STATION;
        case CLASS_BLOCKED_EXIT: return SeatPalette::SEAT_BLOCKED;
        default:                 return SeatPalette::ECONOMY_AVAILABLE;
    }
}

void applySeatMaterialLighting(SeatClassType cls, SeatStatusState state) {
    RGBAColor c = getFinalSeatColor(cls, state);

    GLfloat matAmbient[]  = { c.r * 0.35f, c.g * 0.35f, c.b * 0.35f, 1.0f };
    GLfloat matDiffuse[]  = { c.r * 0.85f, c.g * 0.85f, c.b * 0.85f, 1.0f };
    GLfloat matSpecular[] = { 0.40f, 0.40f, 0.40f, 1.0f };
    GLfloat shininess     = (cls == CLASS_FIRST || cls == CLASS_BUSINESS) ? 32.0f : 12.0f;

    glMaterialfv(GL_FRONT_AND_BACK, GL_AMBIENT, matAmbient);
    glMaterialfv(GL_FRONT_AND_BACK, GL_DIFFUSE, matDiffuse);
    glMaterialfv(GL_FRONT_AND_BACK, GL_SPECULAR, matSpecular);
    glMaterialf(GL_FRONT_AND_BACK, GL_SHININESS, shininess);
}

void drawTexturedCabinSeat(
    float x, float y, float width, float height,
    SeatClassType cls, SeatStatusState state,
    bool enableTexture,
    bool enableLighting
) {
    RGBAColor col = getFinalSeatColor(cls, state);

    // 1. Soft Drop Shadow
    glColor4f(0.0f, 0.0f, 0.0f, 0.30f);
    glBegin(GL_QUADS);
        glVertex2f(x + 1.5f, y - 1.5f);
        glVertex2f(x + width + 1.5f, y - 1.5f);
        glVertex2f(x + width + 1.5f, y + height - 1.5f);
        glVertex2f(x + 1.5f, y + height - 1.5f);
    glEnd();

    // 2. Texture Binding
    GLuint activeTex = (cls == CLASS_FIRST || cls == CLASS_BUSINESS) 
                        ? g_seatLeatherTextureId 
                        : g_seatFabricTextureId;

    if (enableTexture && activeTex != 0) {
        glEnable(GL_TEXTURE_2D);
        glBindTexture(GL_TEXTURE_2D, activeTex);
        glTexEnvi(GL_TEXTURE_ENV, GL_TEXTURE_ENV_MODE, GL_MODULATE);
    }

    if (enableLighting) {
        applySeatMaterialLighting(cls, state);
    }

    glColor4f(col.r, col.g, col.b, col.a);

    // 3. Main Seat Cushion Quad
    glBegin(GL_QUADS);
        glTexCoord2f(0.0f, 0.0f); glVertex2f(x, y);
        glTexCoord2f(1.0f, 0.0f); glVertex2f(x + width, y);
        glTexCoord2f(1.0f, 1.0f); glVertex2f(x + width, y + height);
        glTexCoord2f(0.0f, 1.0f); glVertex2f(x, y + height);
    glEnd();

    if (enableTexture && activeTex != 0) {
        glDisable(GL_TEXTURE_2D);
    }

    // 4. Headrest Accent
    float headrestHeight = height * 0.28f;
    float headrestY = y + height - headrestHeight;
    float headrestInset = width * 0.12f;

    // Darker headrest tone
    glColor4f(col.r * 0.80f, col.g * 0.80f, col.b * 0.80f, 1.0f);
    glBegin(GL_QUADS);
        glVertex2f(x + headrestInset, headrestY);
        glVertex2f(x + width - headrestInset, headrestY);
        glVertex2f(x + width - headrestInset, y + height);
        glVertex2f(x + headrestInset, y + height);
    glEnd();

    // 5. High-Contrast Border Contour & Stitching
    if (state == STATUS_SELECTED) {
        // High visibility glowing outline for selected seat
        glColor3f(1.0f, 1.0f, 1.0f);
        glLineWidth(2.5f);
    } else if (cls == CLASS_FIRST) {
        glColor3f(SeatPalette::FIRST_BORDER.r, SeatPalette::FIRST_BORDER.g, SeatPalette::FIRST_BORDER.b);
        glLineWidth(1.8f);
    } else {
        glColor3f(0.08f, 0.12f, 0.18f);
        glLineWidth(1.2f);
    }

    glBegin(GL_LINE_LOOP);
        glVertex2f(x, y);
        glVertex2f(x + width, y);
        glVertex2f(x + width, y + height);
        glVertex2f(x, y + height);
    glEnd();

    // Reset line width
    glLineWidth(1.0f);
}
