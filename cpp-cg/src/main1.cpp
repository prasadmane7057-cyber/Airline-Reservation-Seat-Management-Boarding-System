#include <GL/freeglut.h>

void display()
{
    glClear(GL_COLOR_BUFFER_BIT);

    glBegin(GL_LINES);

    glVertex2f(-0.8f, 0.0f);
    glVertex2f(0.8f, 0.0f);

    glEnd();

    glFlush();
}

int main(int argc, char** argv)
{
    glutInit(&argc, argv);

    glutInitDisplayMode(GLUT_SINGLE | GLUT_RGB);
    glutInitWindowSize(800, 600);
    glutInitWindowPosition(100, 100);

    glutCreateWindow("OpenGL Test");

    glutDisplayFunc(display);

    glutMainLoop();

    return 0;
}