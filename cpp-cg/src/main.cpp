#include <GL/freeglut.h>
#include <iostream>
#include "RouteMap.h"

// Display callback for OpenGL rendering
void display() {
    glClear(GL_COLOR_BUFFER_BIT);
    glPointSize(2.0f);

    // Render Bresenham flight trajectory line & airport beacon circle
    drawRoute(50, 50, 200, 120);       // Flight Path (Blue)
    drawAirportNode(200, 120, 10);     // Airport Terminal Node (Orange)

    glFlush();
}

void init() {
    glClearColor(0.05f, 0.05f, 0.08f, 1.0f);
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    gluOrtho2D(0, 400, 0, 300);
}

int main(int argc, char** argv) {
    std::cout << "========================================================\n";
    std::cout << " AIRLINE CG: ROUTE MAP & BRESENHAM RASTERIZER           \n";
    std::cout << "========================================================\n";
    std::cout << "[CG-ROUTE] Initializing OpenGL Window (400x300)...\n";
    std::cout << "[CG-ROUTE] Drawing Bresenham Line: (50, 50) -> (200, 120) [Flight Path]\n";
    std::cout << "[CG-ROUTE] Drawing Bresenham Midpoint Circle: Center (200, 120), R=10 [Airport Node]\n";
    std::cout << "========================================================\n";

    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_SINGLE | GLUT_RGB);
    glutInitWindowSize(400, 300);
    glutCreateWindow("CGL Practical 2 - Route Map & Airport Node");

    init();
    glutDisplayFunc(display);
    glutMainLoop();
    return 0;
}
