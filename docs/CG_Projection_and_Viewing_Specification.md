# Computer Graphics (CG / CGL) Specification: Projection & Viewing Pipeline

## 1. Overview
This module implements the complete 3D projection and viewing pipeline for the Airline Management System's aircraft model. It provides mathematical models, OpenGL pipeline integration, and multi-view orthographic architectural projections alongside perspective viewing.

---

## 2. The 3D Viewing Pipeline

$$\mathbf{P}_{\text{world}} \xrightarrow{\mathbf{M}_{\text{model}}} \mathbf{P}_{\text{world}} \xrightarrow{\mathbf{M}_{\text{view}}} \mathbf{P}_{\text{eye}} \xrightarrow{\mathbf{M}_{\text{proj}}} \mathbf{P}_{\text{clip}} \xrightarrow{\text{Divide by } w} \mathbf{P}_{\text{NDC}} \xrightarrow{\text{Viewport}} \mathbf{P}_{\text{screen}}$$

1. **Object / Model Space**: Local 3D geometric coordinates defining fuselage cylinders, wing cubes, and nose sphere.
2. **World Space**: Coordinates positioned and oriented in the 3D scene.
3. **Eye / Camera Space**: Transformed relative to the observer's camera position (`gluLookAt`).
4. **Clip Space**: Multiplied by the projection matrix (`glOrtho` or `gluPerspective`). Homogeneous coordinates $(x_c, y_c, z_c, w_c)$.
5. **Normalized Device Coordinates (NDC)**: Result of perspective division $\left(\frac{x_c}{w_c}, \frac{y_c}{w_c}, \frac{z_c}{w_c}\right)$ bound within $[-1, 1]^3$.
6. **Screen / Viewport Space**: Scaled to window pixel dimensions $[0 \le x \le \text{width}, 0 \le y \le \text{height}]$.

---

## 3. Projection Matrices Mathematical Formulation

### A. Orthographic Projection Matrix
Orthographic projection projects points along parallel lines perpendicular to the projection plane. Parallel lines in 3D remain parallel in the 2D image, preserving exact ratios, lengths, and angles without perspective foreshortening.

Given view volume bounds $[l, r]$ along X, $[b, t]$ along Y, and $[n, f]$ along Z:

$$\mathbf{M}_{\text{ortho}} = \begin{bmatrix}
\frac{2}{r - l} & 0 & 0 & -\frac{r + l}{r - l} \\
0 & \frac{2}{t - b} & 0 & -\frac{t + b}{t - b} \\
0 & 0 & -\frac{2}{f - n} & -\frac{f + n}{f - n} \\
0 & 0 & 0 & 1
\end{bmatrix}$$

### B. Perspective Projection Matrix
Perspective projection converges rays to a center of projection (the eye), simulating human vision where distant aircraft parts appear smaller:

Given field-of-view angle $\theta$, aspect ratio $a = \frac{W}{H}$, near plane $n$, and far plane $f$, with $k = \cot\left(\frac{\theta}{2}\right)$:

$$\mathbf{M}_{\text{persp}} = \begin{bmatrix}
\frac{k}{a} & 0 & 0 & 0 \\
0 & k & 0 & 0 \\
0 & 0 & \frac{f + n}{n - f} & \frac{2fn}{n - f} \\
0 & 0 & -1 & 0
\end{bmatrix}$$

---

## 4. Multi-View Orthographic Camera Presets

Architectural and aeronautical engineering requires orthogonal projections of standard reference planes:

| Preset | Name | Eye Position $(E_x, E_y, E_z)$ | Up Vector $(U_x, U_y, U_z)$ | Aeronautical Purpose |
|:------:|:-----|:------------------------------:|:---------------------------:|:---------------------|
| **1** | **Top / Plan View** | $(0, d, 0)$ | $(1, 0, 0)$ | Direct overhead view of fuselage, wings, and cabin seating matrix |
| **2** | **Front Elevation** | $(d, 0, 0)$ | $(0, 1, 0)$ | Head-on view of nose cone, dihedral wing angle, and engine nacelles |
| **3** | **Side Profile** | $(0, 0, d)$ | $(0, 1, 0)$ | Side elevation showing fuselage length, window line, and vertical stabilizer |
| **4** | **Isometric (Axonometric)** | $(d/\sqrt{3}, d/\sqrt{3}, d/\sqrt{3})$ | $(0, 1, 0)$ | Equal-angle technical drawing view displaying all three spatial dimensions |
| **0** | **Free Orbit** | Spherical $(r, \theta, \phi)$ | $(0, 1, 0)$ | Interactive pitch, yaw, roll rotation with mouse/keys |

---

## 5. Source Files
- **Header**: `cpp-cg/src/AircraftProjectionViewing.h`
- **Implementation**: `cpp-cg/src/AircraftProjectionViewing.cpp`
- **OpenGL Integration**: `cpp-cg/src/Aircraft3D.cpp`
- **Dashboard Interactive Visualizer**: Tab 5 (Computer Graphics).

## 6. Numerical Validation and Dashboard Seat Coordinates

`cpp-cg/tests/AircraftProjectionViewingTest.cpp` checks the orthographic and
perspective matrix entries, viewport corner/center projections, and camera
translation using a `1e-4` float tolerance (with `1e-3` for the perspective
offset). Invalid frusta and view volumes are rejected instead of producing
non-finite matrices.

The Dashboard's SVG seat overlay starts from the same world coordinates used by
`cpp-cg/src/Seats.cpp`. `frontend/src/utils/aircraftCoordinates.js` owns the
world-to-SVG conversion: `svgX = 112 + worldX * 1.035` and
`svgY = 610 - worldY - seatHeight`; seat width uses the same horizontal scale.
`frontend/tests/aircraftCoordinates.test.js` checks the first-class anchor and
economy tail bounds so layout edits cannot silently shift the overlay.
