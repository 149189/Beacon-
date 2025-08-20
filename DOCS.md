## Beacon System: Features, APIs, WebSockets, Setup, and Status

### Overview
- `server/`: Django REST API + Django Channels WebSockets
- `admin_client/`: Admin dashboard (Vite + React)
- `companion/`: Flutter companion app (mobile/web)

### Core Features
- Panic alerts with live location updates
- Two-way operator chat via WebSockets
- Real-time alert lifecycle updates
- JWT authentication

### Backend API (prefix: `/api/auth/`)
- POST `login/` → returns `{ tokens: { access, refresh }, user, profile }`
- POST `panic/create/` → create alert → `{ success, alert_id, alert }`
- GET/POST `alerts/` → list/create alerts
- POST `alerts/<uuid:alert_id>/cancel/`
- POST `alerts/<uuid:alert_id>/location/`
- GET `dashboard/stats/` (staff only)

### WebSockets
- Base: `ws://127.0.0.1:8000`
- Channels:
  - `/ws/user/{user_id}/`
  - `/ws/alerts/{alert_id}/`
  - `/ws/location/{alert_id}/`
  - `/ws/chat/{alert_id}/`
- Auth: JWT via `?token=<ACCESS_TOKEN>` query; enabled by custom middleware.

### Companion App Config
- `lib/utils/constants.dart`:
  - `baseUrl = 'http://127.0.0.1:8000'`
  - `wsBaseUrl = 'ws://127.0.0.1:8000'`
  - Endpoints helpers fixed to use `{alertId}` placeholders.

### Companion App Services
- `AuthService`: stores tokens and current user in `SharedPreferences`.
- `ApiService`: wraps HTTP `get/post` with `Authorization: Bearer <token>`.
- `LocationService`: stubbed location provider for now.
- `WebSocketService`: multi-channel client with heartbeat and reconnection.
- `PanicService`: alert creation, periodic location updates, and chat.

### Known Limitations
- Placeholder UI screens are used to compile; replace with real screens.
- Device info, network info, battery level, persistence are stubs/TODOs.

### Run Instructions
- Backend: `cd server/beacon_server && python manage.py runserver`
- Admin client: see `admin_client/beacon_user/README.md`
- Flutter app: install Flutter, then in `companion/` run `flutter pub get && flutter run`

### Testing WebSockets
- App: navigate to `/websocket-test` route
- Script: `python companion/test_websocket_backend.py`

### Status
- WebSocket auth fixed server-side; query-token supported.
- Companion constants and service layer corrected; builds with placeholder screens.

