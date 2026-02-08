## NEO Monitoring

Full-stack Near-Earth Object (NEO) monitoring app powered by NASA NeoWs.

### What it does

- **Dashboard:** shows today’s NEO feed and basic risk signals
- **Watchlist:** save NEOs you care about and track them over time
- **Alerts:** notifications generated for saved items (read/unread)
- **Auth:** register + login (JWT) to access protected pages

### Tech stack

- **Backend:** FastAPI + SQLAlchemy + JWT auth + APScheduler
- **Frontend:** React + Vite + React Router + Axios
- **Database:** Postgres (Docker)
- **Data source:** NASA NeoWs (feed + lookup)

### Run (Docker Compose)

From the repo root:

```bash
docker compose up -d --build
```

Services:
- Backend: http://localhost:8000
- Backend OpenAPI: http://localhost:8000/docs
- Frontend: http://localhost:${FRONTEND_PORT:-5173}

Environment variables:
- `NASA_API_KEY` (optional): NASA NeoWs API key. If not set, `docker-compose.yml` provides a default.
- `FRONTEND_PORT` (optional): defaults to `5173`.

Notes:
- If you hit NASA rate limits, the backend returns an HTTP `429` with a clear message.

### Run (Local development)

Backend:

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```bash
cd frontend/neo-dashboard
npm install
npm run dev
```

### API Endpoints (Backend)

NEO:
- `GET /neo/today` — Feed (supports `start_date` + `end_date` query params as `YYYY-MM-DD`)
- `GET /neo/lookup/{neo_id}` — Lookup a specific NEO (optional `start_date` + `end_date` for approach selection)

Auth / User Profile:
- `POST /auth/register` — Register (`email` + `password` as query params)
- `POST /auth/login` — OAuth2 password flow (`application/x-www-form-urlencoded`: `username`, `password`)
- `GET /auth/me` — Current user profile (requires Bearer token)

Watchlist:
- `POST /auth/watch` — Save a NEO to watchlist (requires Bearer token)
- `GET /auth/watchlist` — List watchlist (requires Bearer token)
- `PUT /auth/watch/{watch_id}/alert-settings` — Update alert thresholds (requires Bearer token)
- `DELETE /auth/watch/{watch_id}` — Delete watchlist entry (requires Bearer token)

Alerts:
- `GET /alerts` — List alerts (default `unread_only=true`) (requires Bearer token)
- `POST /alerts/mark-read` — Mark all alerts as read (requires Bearer token)

### UI notes

- The login page uses an animated **Galaxy** background (WebGL via `ogl`).
- The “Know your space rocks” section displays JPEGs from:
	- `frontend/neo-dashboard/public/space-rocks/`
	- Filenames used by default: `asteroid.jpeg`, `comet.jpeg`, `meteor.jpeg`, `meteorite.jpeg`, `bolide.jpeg`

### Postman Collection

To test all backend endpoints, import:
- Collection: `postman/NEO-Monitoring.postman_collection.json`
- (Optional) Environment: `postman/NEO-Monitoring.postman_environment.json`

#### How to use

1) Start the backend (see Docker Compose above)
2) In Postman:
	- Import the collection JSON
	- (Optional) Import the environment JSON and select it
3) Set variables (collection variables or environment variables):
	- `baseUrl` (default: `http://localhost:8000`)
	- `email`, `password`
4) Run requests in this order:
	- **Auth → Register** (optional, only once)
	- **Auth → Login** (stores JWT into `token` automatically)
	- Now run any protected endpoints (Watchlist, Alerts, Profile)

Notes:
- The login endpoint expects `username` + `password` (OAuth2PasswordRequestForm).
- **NEO → GET /neo/today** stores a sample `neo_id` into a collection variable so you can run **NEO → Lookup** immediately.

