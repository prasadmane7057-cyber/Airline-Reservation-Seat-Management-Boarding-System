#include <GL/freeglut.h>
#include "RouteMap.h"

// This is the "display callback" � you write it, but never call it yourself
void display() {
    glClear(GL_COLOR_BUFFER_BIT);
    glPointSize(2.0f);

    drawRoute(50, 50, 200, 120);       // <-- calling it HERE, inside the callback
    drawAirportNode(200, 120, 10);     // <-- and HERE

    glFlush();
}

void init() {
    glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    gluOrtho2D(0, 400, 0, 300);
}

int main(int argc, char** argv) {
    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_SINGLE | GLUT_RGB);
    glutInitWindowSize(400, 300);
    glutCreateWindow("CGL Practical 2 - Route Map");

    init();
    glutDisplayFunc(display);   // <-- THIS line is "registering" display as the callback
                                 //     it tells OpenGL "call this function whenever you redraw"
    glutMainLoop();              // hands control to OpenGL � it runs forever, calling display() as needed
    return 0;
}
