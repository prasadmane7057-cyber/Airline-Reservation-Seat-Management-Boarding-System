// Aircraft3D.cpp
// CGL Review 4 - Simple 3D aircraft model that rotates using OpenGL transformations
// Owner: Varad
// CO3 (2310218L.CO.3): Develop 2D and 3D objects using various algorithms.
//
// WHAT IT SHOWS
//   * 3D primitives : cylinder (fuselage, engines), sphere (nose, windows),
//                     disc (tail cap), scaled cubes (wings, tail fin, stabilisers)
//   * Transformations: glTranslatef / glRotatef / glScalef inside
//                     glPushMatrix / glPopMatrix (the model-view matrix stack)
//   * Depth test     : GL_DEPTH_TEST so nearer parts hide farther parts
//   * Keyboard control of rotation (see the on-screen help)
//
// Build (Linux / WSL):
//   g++ Aircraft3D.cpp -o Aircraft3D -lGL -lGLU -lglut
// Build (macOS):
//   g++ Aircraft3D.cpp -o Aircraft3D -framework OpenGL -framework GLUT
// Build (Windows, MinGW + freeglut):
//   g++ Aircraft3D.cpp -o Aircraft3D -lfreeglut -lopengl32 -lglu32
//
// CONTROLS
//   W / S  or  Up / Down    : rotate about the X axis (pitch)
//   A / D  or  Left / Right : rotate about the Y axis (yaw)
//   Q / E                   : rotate about the Z axis (roll)
//   SPACE                   : start / stop automatic rotation
//   + / -                   : zoom in / out
//   R                       : reset view
//   ESC                     : quit

#ifdef __APPLE__
  #include <GLUT/glut.h>
#else
  #include <GL/glut.h>
#endif
#include <cstdlib>
#include <cmath>

// ---------------- Rotation / camera state ----------------
static float angleX = 15.0f;     // pitch
static float angleY = -30.0f;    // yaw
static float angleZ = 0.0f;      // roll
static float camDist = 9.0f;     // distance of camera from the model
static bool  autoRotate = true;
static const float STEP = 5.0f;  // degrees per key press

static GLUquadric* quad = nullptr;
static int winW = 900, winH = 600;

// ---------------- Small helpers ----------------
static void setColor(float r, float g, float b) {
    glColor3f(r, g, b);          // GL_COLOR_MATERIAL makes this the material colour
}

// A flat slab (scaled cube) - used for wings, fin and stabilisers
static void slab(float sx, float sy, float sz) {
    glPushMatrix();
        glScalef(sx, sy, sz);
        glutSolidCube(1.0);
    glPopMatrix();
}

// Cylinder lying along the X axis, starting at x = 0 and running to x = len
static void cylinderAlongX(float r1, float r2, float len) {
    glPushMatrix();
        glRotatef(90.0f, 0, 1, 0);          // turn the quadric's Z axis into +X
        gluCylinder(quad, r1, r2, len, 32, 1);
    glPopMatrix();
}

// ---------------- Aircraft parts ----------------
// The aircraft's nose points along +X, "up" is +Y and the wings extend along +/-Z.

static void drawFuselage() {
    const float R = 0.35f;

    // main body: x from -2 to +2
    setColor(0.95f, 0.95f, 0.97f);
    glPushMatrix();
        glTranslatef(-2.0f, 0, 0);
        cylinderAlongX(R, R, 4.0f);
    glPopMatrix();

    // nose: a sphere stretched along X to look rounded
    glPushMatrix();
        glTranslatef(2.0f, 0, 0);
        glScalef(1.6f, 1.0f, 1.0f);
        gluSphere(quad, R, 32, 16);
    glPopMatrix();

    // tail cone: narrows from R to 0.12 between x = -2 and x = -3.6
    glPushMatrix();
        glTranslatef(-3.6f, 0, 0);
        cylinderAlongX(0.12f, R, 1.6f);
    glPopMatrix();

    // flat cap at the very back of the tail
    glPushMatrix();
        glTranslatef(-3.6f, 0, 0);
        glRotatef(-90.0f, 0, 1, 0);
        gluDisk(quad, 0.0, 0.12, 24, 1);
    glPopMatrix();

    // coloured stripe (slightly larger radius so it sits on top of the body)
    setColor(0.12f, 0.25f, 0.55f);
    glPushMatrix();
        glTranslatef(-1.6f, 0, 0);
        cylinderAlongX(R + 0.006f, R + 0.006f, 0.35f);
    glPopMatrix();
    glPushMatrix();
        glTranslatef(0.2f, 0, 0);
        cylinderAlongX(R + 0.006f, R + 0.006f, 0.35f);
    glPopMatrix();
}

static void drawWindows() {
    setColor(0.1f, 0.15f, 0.25f);
    // row of passenger windows on both sides
    for (int i = 0; i < 10; i++) {
        float x = -1.5f + i * 0.28f;
        for (int side = -1; side <= 1; side += 2) {
            glPushMatrix();
                glTranslatef(x, 0.12f, side * 0.335f);
                glutSolidSphere(0.045, 10, 10);
            glPopMatrix();
        }
    }
    // cockpit window
    glPushMatrix();
        glTranslatef(2.25f, 0.13f, 0);
        glScalef(0.5f, 0.6f, 1.6f);
        glutSolidSphere(0.18, 16, 16);
    glPopMatrix();
}

static void drawWings() {
    setColor(0.75f, 0.78f, 0.82f);
    for (int side = -1; side <= 1; side += 2) {      // -1 = left wing, +1 = right wing
        glPushMatrix();
            glTranslatef(-0.3f, -0.12f, side * 1.5f);
            glRotatef(side * -25.0f, 0, 1, 0);        // sweep the wing backwards
            glRotatef(side * 4.0f, 1, 0, 0);          // slight upward tilt (dihedral)
            slab(0.9f, 0.07f, 2.8f);
        glPopMatrix();

        // jet engine under each wing
        setColor(0.45f, 0.47f, 0.5f);
        glPushMatrix();
            glTranslatef(-0.1f, -0.42f, side * 1.1f);
            cylinderAlongX(0.17f, 0.17f, 0.75f);
        glPopMatrix();
        // dark intake at the front of the engine
        setColor(0.08f, 0.08f, 0.1f);
        glPushMatrix();
            glTranslatef(0.65f, -0.42f, side * 1.1f);
            glRotatef(90.0f, 0, 1, 0);
            gluDisk(quad, 0.0, 0.17, 20, 1);
        glPopMatrix();
        setColor(0.75f, 0.78f, 0.82f);
    }
}

static void drawTail() {
    // vertical fin, leaning backwards
    setColor(0.75f, 0.12f, 0.15f);
    glPushMatrix();
        glTranslatef(-3.0f, 0.55f, 0);
        glRotatef(20.0f, 0, 0, 1);
        slab(0.65f, 0.8f, 0.06f);
    glPopMatrix();

    // horizontal stabilisers
    setColor(0.75f, 0.78f, 0.82f);
    for (int side = -1; side <= 1; side += 2) {
        glPushMatrix();
            glTranslatef(-3.2f, 0.05f, side * 0.55f);
            glRotatef(side * -25.0f, 0, 1, 0);
            slab(0.5f, 0.05f, 1.2f);
        glPopMatrix();
    }
}

static void drawAircraft() {
    drawFuselage();
    drawWindows();
    drawWings();
    drawTail();
}

// ---------------- On-screen help text (2D overlay) ----------------
static void drawText(float x, float y, const char* s) {
    glRasterPos2f(x, y);
    while (*s) {
        glutBitmapCharacter(GLUT_BITMAP_HELVETICA_12, *s);
        ++s;
    }
}

static void drawOverlay() {
    glDisable(GL_LIGHTING);
    glDisable(GL_DEPTH_TEST);
    glMatrixMode(GL_PROJECTION);
    glPushMatrix();
        glLoadIdentity();
        gluOrtho2D(0, winW, 0, winH);
        glMatrixMode(GL_MODELVIEW);
        glPushMatrix();
            glLoadIdentity();
            glColor3f(1, 1, 1);
            drawText(12, winH - 20, "3D Aircraft - Airline Reservation System (CGL)");
            glColor3f(0.8f, 0.9f, 1.0f);
            drawText(12, winH - 40, "W/S or Up/Down : pitch (X)    A/D or Left/Right : yaw (Y)    Q/E : roll (Z)");
            drawText(12, winH - 56, "SPACE : auto-rotate on/off    + / - : zoom    R : reset    ESC : quit");
        glPopMatrix();
        glMatrixMode(GL_PROJECTION);
    glPopMatrix();
    glMatrixMode(GL_MODELVIEW);
    glEnable(GL_DEPTH_TEST);
    glEnable(GL_LIGHTING);
}

// ---------------- GLUT callbacks ----------------
static void display() {
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    glMatrixMode(GL_MODELVIEW);
    glLoadIdentity();
    gluLookAt(0.0, 1.5, camDist,     // camera position
              0.0, 0.0, 0.0,         // looking at the origin
              0.0, 1.0, 0.0);        // up direction

    // keep the light fixed in the world (set after the camera transform)
    GLfloat lightPos[] = { 4.0f, 6.0f, 6.0f, 1.0f };
    glLightfv(GL_LIGHT0, GL_POSITION, lightPos);

    // ---- model transformation: this is the rotation the keyboard controls ----
    glPushMatrix();
        glRotatef(angleX, 1, 0, 0);
        glRotatef(angleY, 0, 1, 0);
        glRotatef(angleZ, 0, 0, 1);
        drawAircraft();
    glPopMatrix();

    drawOverlay();
    glutSwapBuffers();
}

static void reshape(int w, int h) {
    if (h == 0) h = 1;
    winW = w;
    winH = h;
    glViewport(0, 0, w, h);
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    gluPerspective(45.0, (double)w / h, 0.1, 100.0);
    glMatrixMode(GL_MODELVIEW);
}

static void timer(int) {
    if (autoRotate) {
        angleY += 1.0f;
        if (angleY >= 360.0f) angleY -= 360.0f;
        glutPostRedisplay();
    }
    glutTimerFunc(16, timer, 0);      // about 60 frames per second
}

static void resetView() {
    angleX = 15.0f;
    angleY = -30.0f;
    angleZ = 0.0f;
    camDist = 9.0f;
}

static void keyboard(unsigned char key, int, int) {
    switch (key) {
        case 'w': case 'W': angleX += STEP; break;
        case 's': case 'S': angleX -= STEP; break;
        case 'a': case 'A': angleY -= STEP; break;
        case 'd': case 'D': angleY += STEP; break;
        case 'q': case 'Q': angleZ += STEP; break;
        case 'e': case 'E': angleZ -= STEP; break;
        case '+': case '=': camDist -= 0.5f; if (camDist < 3.0f) camDist = 3.0f; break;
        case '-': case '_': camDist += 0.5f; if (camDist > 25.0f) camDist = 25.0f; break;
        case ' ': autoRotate = !autoRotate; break;
        case 'r': case 'R': resetView(); break;
        case 27:  exit(0);
    }
    glutPostRedisplay();
}

static void specialKeys(int key, int, int) {
    switch (key) {
        case GLUT_KEY_UP:    angleX += STEP; break;
        case GLUT_KEY_DOWN:  angleX -= STEP; break;
        case GLUT_KEY_LEFT:  angleY -= STEP; break;
        case GLUT_KEY_RIGHT: angleY += STEP; break;
    }
    glutPostRedisplay();
}

static void initGL() {
    glClearColor(0.05f, 0.10f, 0.20f, 1.0f);   // night-sky blue
    glEnable(GL_DEPTH_TEST);                    // hidden-surface removal
    glEnable(GL_NORMALIZE);                     // keep normals valid after glScalef
    glShadeModel(GL_SMOOTH);

    glEnable(GL_LIGHTING);
    glEnable(GL_LIGHT0);
    GLfloat ambient[] = { 0.30f, 0.30f, 0.30f, 1.0f };
    GLfloat diffuse[] = { 0.90f, 0.90f, 0.90f, 1.0f };
    GLfloat specular[] = { 0.5f, 0.5f, 0.5f, 1.0f };
    glLightfv(GL_LIGHT0, GL_AMBIENT,  ambient);
    glLightfv(GL_LIGHT0, GL_DIFFUSE,  diffuse);
    glLightfv(GL_LIGHT0, GL_SPECULAR, specular);

    glEnable(GL_COLOR_MATERIAL);
    glColorMaterial(GL_FRONT_AND_BACK, GL_AMBIENT_AND_DIFFUSE);

    quad = gluNewQuadric();
    gluQuadricNormals(quad, GLU_SMOOTH);
}

int main(int argc, char** argv) {
    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB | GLUT_DEPTH);   // GLUT_DEPTH = depth buffer
    glutInitWindowSize(winW, winH);
    glutCreateWindow("Aircraft3D - Airline Reservation System");

    initGL();
    glutDisplayFunc(display);
    glutReshapeFunc(reshape);
    glutKeyboardFunc(keyboard);
    glutSpecialFunc(specialKeys);
    glutTimerFunc(16, timer, 0);

    glutMainLoop();
    return 0;
}
