# Airline Reservation and Boarding System

An integrated airline project combining PSOOP, programming/data structures, COA, and computer graphics. The development order below follows the Project Definition Document. Source folders remain grouped by module so Java packages and C++ build boundaries stay intact.

## Development Flow

| Phase | Focus | Files and folders |
| --- | --- | --- |
| 1. Foundation | Repository structure and shared data | Root `README.md`, `.gitignore`, and `.vscode/settings.json`; `shared-data/FORMAT.md`; `shared-data/*.csv` |
| 2. PSOOP | Domain model and validation | `java-oop-coa-ui/src/model/`; `java-oop-coa-ui/src/exceptions/`; `java-oop-coa-ui/src/util/` |
| 3. PL | Storage structures and algorithms | `cpp-ds/src/`; `java-oop-coa-ui/src/structures/` |
| 4. Business logic | Booking, seats, history, waitlist, and boarding workflows | `java-oop-coa-ui/src/model/Booking.java`; `java-oop-coa-ui/src/model/Flight.java`; `java-oop-coa-ui/src/structures/Seat.java`; `java-oop-coa-ui/src/structures/BookingHistory.java`; `java-oop-coa-ui/src/structures/SeatMap.java`; workflow screens in `java-oop-coa-ui/src/ui/` |
| 5. COA | Binary/fare calculations and pipeline concepts | `java-oop-coa-ui/src/coa/` |
| 6. CGL | Seat and route graphics | `cpp-cg/src/`; setup notes in `cpp-cg/SETUP.md` |
| 7. Integration | Shared project data and module boundaries | `shared-data/`; `java-oop-coa-ui/`; `cpp-ds/`; `cpp-cg/` |
| 8. UI assembly | Application screens and entry point | `java-oop-coa-ui/src/Main.java`; `java-oop-coa-ui/src/ui/` |
| 9. Testing | Compile checks and demonstrations | `java-oop-coa-ui/src/model/BookingDemo.java`; `java-oop-coa-ui/src/model/PolymorphismDemo.java`; `cpp-ds/src/main.cpp`; `cpp-cg/src/main.cpp`. A dedicated automated test suite is not currently organized in the repository. |
| 10. Documentation | Reports and course mapping | `report/` |
| 11. Final demo | Walkthrough and viva preparation | `report/demo-script.md`; `report/viva-prep.md` |

## Architecture Map

| Layer | Main location |
| --- | --- |
| Presentation | `java-oop-coa-ui/src/ui/`; `cpp-cg/src/` |
| Application and domain | `java-oop-coa-ui/src/model/`; `java-oop-coa-ui/src/exceptions/` |
| Data structures | `java-oop-coa-ui/src/structures/`; `cpp-ds/src/` |
| COA | `java-oop-coa-ui/src/coa/` |
| Shared files | `shared-data/` |
| Reports and demo material | `report/` |

## Module Guide

- `java-oop-coa-ui/`: Java domain model, structures, COA examples, and UI screens. Java sources are rooted at `java-oop-coa-ui/src/`.
- `cpp-ds/`: C++ data-structure implementations and demonstrations.
- `cpp-cg/`: C++ graphics algorithms, Cohen-Sutherland line clipping, UV-mapped aircraft surface textures, directional lighting/materials, seat grid, and route map.
- `shared-data/`: CSV data and its format notes for cross-module use.
- `report/`: syllabus mapping, final report, AI usage log, demo script, and viva preparation.

## Run the command-line demos

From the repository root, run:

```powershell
.\run_integrated_system.ps1
```

The script compiles into a temporary folder, runs the Java, C++, and assembly
command-line demos and checks, then removes its build files. It opens
`cpp-cg/visualization.html` in the default browser. The visualizer opens in a
combined view with the aircraft, the C++ seat-matrix layout and booked states,
material controls, and the CG algorithm demonstrations together; separate
tabs are available to focus on the aircraft or algorithm outputs.
It requires a JDK, a C++ compiler with the graphics headers, GCC, and NASM.
Linux-only assembly examples, including the PNR string-operation tool, also run
when Debian on WSL is available; otherwise, the script reports that those
examples were skipped. It does not
start the MySQL-backed web services.
