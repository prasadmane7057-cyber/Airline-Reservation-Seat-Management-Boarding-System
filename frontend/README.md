# SkyWings Airline Reservation Frontend

The Vue 3 application is the browser interface for the integrated airline reservation project. Its home page includes flight search and a project-module overview; the rest of the app covers passenger booking and airline administration.

## Browser workflows

- Search and filter flights by route, date, class, and fare.
- Register or sign in, select seats, enter passenger details, and make a payment.
- Review, retrieve, and cancel bookings; access booking confirmations and boarding passes.
- Check in passengers and manage flights, airports, passengers, bookings, and boarding operations through the admin screens.

The home page also maps the companion source modules: Java airline domain and persistence examples, C++ passenger/seat/waitlist structures, assembly and COA calculations, computer-graphics route and seat-map demos, and the Express/MySQL data layer. Those standalone academic demos are described in the frontend; they are not executed by the browser.

## Run locally

Open two terminals from the project root:

```powershell
Set-Location .\airline-backend
npm run dev
```

```powershell
Set-Location .\frontend
npm run dev
```

Open **http://localhost:5173**. The API health check is at **http://localhost:5000/api/health**. The frontend uses `http://localhost:5000/api` by default; set `VITE_API_URL` in a local frontend `.env` file to use another API URL.

The backend uses its in-memory demo database for airline operations when MySQL is unavailable. In that fallback mode, new account registrations are persisted in a private `airline-backend/data/users.csv` file (or the path set with `CSV_USERS_PATH`); passwords are stored only as bcrypt hashes. Keep this file private and out of version control. A deployed CSV-backed service needs a persistent disk, and CSV storage is intended for a single backend instance; use MySQL for multi-instance production deployments. With MySQL configured, user accounts are stored in MySQL instead. For MySQL setup, initialize it using [`../database/README.md`](../database/README.md).

Demo sign-in: `passenger@airline.com` / `pass123` or `admin@airline.com` / `admin123`.

## Publish with GitHub Pages

The repository's `main` branch deploys the static Vue frontend to GitHub Pages using `.github/workflows/deploy-pages.yml`. The workflow builds the app with the repository URL as its base path and includes a `404.html` fallback for Vue Router routes.

Once the first Pages workflow run succeeds, the site is available at:
`https://prasadmane7057-cyber.github.io/Airline-Reservation-Seat-Management-Boarding-System/`

GitHub Pages hosts only the frontend. The repository includes a Render Blueprint at [`../render.yaml`](../render.yaml) for deploying the API with a persistent private disk for CSV-backed accounts. In Render, create a Blueprint Instance from this repository and review the plan and disk charges before deploying. Set the GitHub repository Actions variable `VITE_API_URL` to the deployed backend URL followed by `/api` (for example, `https://your-api-service.onrender.com/api`), then run the **Deploy frontend to GitHub Pages** workflow to rebuild the site. The workflow rejects a missing URL so API requests are not accidentally sent to GitHub Pages. Before configuring the variable, verify that the backend's `/api/health` endpoint returns the airline API's JSON health response. Do not use localhost as the public API URL.

## Build and lint

```sh
npm run build
npm run lint
```
