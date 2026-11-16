# Airline Reservation and Boarding System

An integrated airline reservation application and interactive learning dashboard covering Java OOP, C++ data structures and algorithms, computer organization and assembly, computer graphics, and Supabase-backed web services. Source folders remain grouped by module so Java packages and C++ build boundaries stay intact.

## Integrated web application

The public web app combines the airline booking experience with the interactive course dashboard. The dashboard is available from **Project Dashboard** in the navigation or at `/project-dashboard` and includes:

- **Java OOP:** fare-method overloading, booking and boarding priority, Swing/JDBC workflow simulation, generic repositories, and CSV/binary file-I/O demonstrations.
- **Data structures and algorithms:** circular boarding queues, priority deques, linked structures, undo stacks, PNR hashing with collision chains, and linear-versus-binary search.
- **COA and assembly:** seat occupancy thresholds, register/ALU operations, hexadecimal-to-BCD conversion, instruction-cycle stages, processor mapping, and branch-prediction traces.
- **Computer graphics:** interactive aircraft/seat visualizations and line/shape rasterization demonstrations.
- **Integration:** live Supabase flight data and reservation APIs. Reservation APIs require the reviewed additive migration and real seat inventory; airport and aircraft details are not invented when those tables are absent.

The browser-based subject panels are interactive teaching simulators; native Java, C++, and assembly implementations remain in their module folders and can also be compiled and run locally. No payment provider is configured, so payment processing is deliberately unavailable rather than reported as successful.

The backend also exposes `GET /api/academic/cpp-demo`, a public, fixed-fixture demonstration of the native C++ data structures and algorithms. Its passenger, seat, waitlist, hash, and search results come from the compiled `cpp-ds` coursework implementations; all fixtures are classroom demo data, not live bookings. The sort section contains the coursework sort demo's console report. Build the executable locally with `cd airline-backend; npm run build:native`. Render compiles it during deployment; the generated executable is ignored and is not committed.

### Run the web app locally

Set the Supabase URL and publishable key in `frontend/.env.local` and `airline-backend/.env.local` (see `airline-backend/.env.example`), then start the services in separate terminals:

```powershell
cd airline-backend
npm install
npm start
```

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The API health check is at `http://localhost:5000/api/health`.

### Publish the web app

The GitHub Pages workflow builds and publishes the Vue frontend from `main`. The Express API is deployed separately using the Render Blueprint in `render.yaml`.

1. Review `database/supabase_reservations_migration.sql` and apply it through the Supabase SQL Editor only after approving the schema changes. It adds user profiles, passengers, seats, bookings, row-level security, and atomic reservation/check-in/boarding functions without changing or seeding flights. Do not run the legacy `database/supabase_airline_schema.sql` for this setup.
2. In Render, create a new Blueprint from this repository and set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for the API service.
3. In GitHub repository **Settings → Pages**, select **GitHub Actions** as the build and deployment source.
4. In repository **Settings → Secrets and variables → Actions → Variables**, add:
   - `VITE_API_URL`: the Render API base URL, ending in `/api` (for example, `https://airline-reservation-api.onrender.com/api`).
   - `VITE_SUPABASE_URL`: the Supabase project URL.
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: the Supabase publishable key used by the browser client.
5. Push to `main` or run **Deploy dashboard to GitHub Pages** from the Actions tab. The Pages URL for this repository is `https://snowflake2007.github.io/Airline/`.

Do not commit `.env` files or service credentials. The frontend publishable key is intended for browser use; protect database data with Supabase row-level security policies.

### Java API integration

The Java service client in `java-oop/src/service/` calls the Express API using `AIRLINE_API_URL` (defaults to `http://localhost:5000/api`) and a user access token in `AIRLINE_API_TOKEN`. Use a normal Supabase access token with the required account role; never provide a service-role key. The server generates PNRs and verifies reservations. Java API booking calls require the reservation migration and actual seat records. A payment API/provider and the previously referenced `Payment` and `CheckIn` Java classes are not present in this checkout; check-in uses the booking API service, while payment is not simulated.

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
