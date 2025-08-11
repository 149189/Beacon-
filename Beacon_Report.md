# Beacon — Technical & Development Report

**Prepared for:** Beacon Project Stakeholders  
**Prepared by:** Kaustubh Ratwadkar 
**Date:** 2025-08-11 (UTC)  
**Repository (as provided):** `https://github.com/149189/Beacon-` *(please confirm full repo path if truncated)*

---

## Table of contents

1. [Executive Summary](#executive-summary)  
2. [Project scope & assumptions](#project-scope--assumptions)  
3. [Updated tech stack](#updated-tech-stack)  
4. [High-level milestones](#high-level-milestones)  
5. [Sprint-by-sprint development plan (detailed)](#sprint-by-sprint-development-plan-detailed)  
6. [Detailed technical architecture](#detailed-technical-architecture)  
7. [API design & endpoints (spec)](#api-design--endpoints-spec)  
8. [Database schema & data models](#database-schema--data-models)  
9. [Mobile app design & UX](#mobile-app-design--ux)  
10. [Admin panel: requirements & UX](#admin-panel-requirements--ux)  
11. [DevOps, CI/CD & deployment strategy](#devops-cicd--deployment-strategy)  
12. [Testing & QA strategy](#testing--qa-strategy)  
13. [Security & privacy](#security--privacy)  
14. [Acceptance criteria & demo plan](#acceptance-criteria--demo-plan)  
15. [Time & resource estimates](#time--resource-estimates)  
16. [Risks & mitigations](#risks--mitigations)  
17. [Next steps & immediate action items](#next-steps--immediate-action-items)  
18. [Appendices — checklist, commands, samples](#appendices---checklist-commands-samples)

---

## Executive Summary

Beacon is an MVP built as a **software-only** product in this phase (no beacon hardware). It consists of:

- **Mobile**: React Native (Android-first). Expo recommended for faster iteration.  
- **Backend**: Django + Django REST Framework (DRF).  
- **Database**: MySQL (as requested).  
- **Admin Panel**: Next.js (React) for polished UI, or Django Admin as a fast MVP fallback.  
- **Push Notifications**: Firebase Cloud Messaging (FCM) with Firebase Admin SDK on backend.  
- **Optional**: Celery + Redis for background/scheduled jobs.

**Primary flow:** Admin creates content → backend stores & schedules sends → mobile registers FCM tokens & receives push → user opens content → backend logs analytics and admin sees basic metrics.

This document is a complete blueprint to implement, test, deploy, and demo Beacon for pitching.

---

## Project scope & assumptions

**MVP scope**

- Mobile application (Android-first) using React Native.  
- Backend APIs and business logic using Django + DRF.  
- Admin panel for content + notification management.  
- Push notifications via FCM.  
- Basic analytics (delivery + opens).  
- Deployable demo (backend + admin URLs, APK).

**Key assumptions**

- MySQL will be used for dev & production (you requested MySQL).  
- JWT (SimpleJWT) is the authentication method (access + refresh tokens).  
- Expo is recommended unless a native-only library is required.  
- Django Admin may be used as a fast admin MVP; Next.js admin is for a more polished product.  
- Cloud hosting is acceptable (Render / DigitalOcean / Railway / Vercel for admin).

---

## Updated tech stack

- **Mobile:** React Native (Android-first). Expo recommended; alternatively RN CLI with `@react-native-firebase/messaging`.  
- **Backend:** Django + Django REST Framework (Python 3.10+).  
- **Database:** MySQL (managed in production).  
- **Notifications:** Firebase Cloud Messaging (FCM) + Firebase Admin SDK on backend.  
- **Admin Panel:** Next.js (React) or Django Admin for rapid MVP.  
- **Background jobs:** Celery + Redis (optional).  
- **CI/CD:** GitHub Actions.  
- **Hosting:** Dockerized backend; Render / DigitalOcean / Railway / VPS. Admin on Vercel/Netlify.  
- **Storage:** S3-compatible for media.  
- **Monitoring:** Sentry for errors; provider logs for infrastructure.  
- **Auth:** JWT via SimpleJWT.  
- **Local dev:** docker-compose.

---

## High-level milestones

1. Project setup & skeletons (repos, docker-compose, CI).  
2. Core backend: auth, models, CRUD APIs, device token handling.  
3. Mobile MVP: auth, content list/detail, FCM registration & handling.  
4. Admin panel: content composer, scheduling, notification composer & dashboard.  
5. Integrations: FCM sending, analytics capture.  
6. QA, E2E tests, production deployment & APK build.  
7. Pitch assets: slides, demo script, short video.

---

## Sprint-by-sprint development plan (detailed)

*Estimated timeline (solo dev): ~8–11 weeks. Each sprint ≈ 2 weeks unless noted.*

### Sprint 0 — Prep (3–5 days)
- Finalize stack versions.  
- Create GitHub repos: `beacon-backend`, `beacon-mobile`, `beacon-admin`.  
- Setup project board (GitHub Projects/Trello).  
- Add base `README.md`, `.gitignore`, LICENSE.  
- Create Dockerfiles and `docker-compose.yml`.  
- Add GitHub Actions skeleton for lint + tests.

### Sprint 1 — Backend skeleton & Auth (2 weeks)
- Initialize Django project and DRF.  
- Configure MySQL in `docker-compose` and `.env`.  
- Implement custom `User` model (email unique).  
- Add JWT auth using SimpleJWT (access + refresh).  
- Implement endpoints: `register`, `login`, `refresh`, `profile`.  
- Add Swagger/OpenAPI docs.  
- Unit tests for auth flows.

### Sprint 2 — Core models & APIs (2 weeks)
- Implement models: `Content`, `DeviceToken`, `NotificationLog`, `AnalyticsEvent`.  
- CRUD endpoints for content (admin-only writes).  
- Endpoint to register FCM device tokens.  
- Pagination & filtering for content endpoints (date, active, geo).  
- Unit + serializer tests.

### Sprint 3 — Mobile MVP (part 1) (2 weeks)
- Setup React Native project (Expo recommended).  
- Implement auth screens + secure token storage (expo-secure-store / encrypted storage).  
- Implement content list & detail screens.  
- Register device token with backend on login.  
- Minimal location permission flow if geo-targeting is used.

### Sprint 4 — Admin panel & notifications (2 weeks)
- Fast MVP: Django Admin customizations OR build Next.js admin.  
- Admin features: content CRUD, schedule vs immediate send, user management.  
- Integrate Firebase Admin SDK on backend to send notifications.  
- Log sends in `NotificationLog`.

### Sprint 5 — Mobile MVP (part 2) & polish (2 weeks)
- Notification handling & deep-linking into content.  
- In-app notifications center (persisted).  
- Analytics events (screen view, notification open).  
- Robust offline handling & retries.  
- Test on multiple Android devices.

### Sprint 6 — QA, docs & deploy (1–2 weeks)
- CI runs tests & lint.  
- Production configuration, secrets management.  
- Deploy backend (Docker) to chosen host; managed MySQL.  
- Deploy admin to Vercel or expose Django Admin (auth-protected).  
- Build APK (EAS or RN CLI) and test.  
- Prepare pitch slide deck & demo video.

---

## Detailed technical architecture

**Components**

- **Mobile App (React Native)** — auth, FCM registration & handling, content display, optional map, analytics, settings.  
- **Backend (Django + DRF)** — REST API, JWT auth, device token registration, notification orchestration (FCM), scheduled tasks (Celery), analytics ingestion.  
- **Admin Panel** — content management, notification composer, scheduling, dashboard metrics.  
- **Database (MySQL)** — persistent storage for users, content, tokens, logs, analytics.  
- **FCM** — push delivery mechanism for Android clients.  
- **Optional** — Celery + Redis for background & scheduled tasks.

**Sequence flow (high level)**

1. Admin creates content / schedules notifications via admin panel.  
2. Backend writes content and enqueues job (immediate or scheduled).  
3. Mobile client registers FCM token (`POST /api/device-token/`).  
4. Backend calls FCM to deliver notifications to target devices and logs each send.  
5. User taps notification → app opens content → app calls backend to record open event.  
6. Admin dashboard reads `NotificationLog` & `AnalyticsEvent` for metrics.

---

## API design & endpoints (spec)

> All protected endpoints require `Authorization: Bearer <access_token>`.

### Authentication
- `POST /api/auth/register`  
  **Payload:** `{ "name": "...", "email": "...", "password": "..." }`  
  **Response:** `201 Created` or tokens depending on policy.

- `POST /api/auth/login`  
  **Payload:** `{ "email": "...", "password": "..." }`  
  **Response:** `{ "access": "<jwt>", "refresh": "<jwt>" }`

- `POST /api/auth/refresh`  
  **Payload:** `{ "refresh": "<refresh_token>" }`  
  **Response:** `{ "access": "<new_access>" }`

- `GET /api/auth/profile`  
  **Response:** `{ "id", "name", "email", ... }`

### Content
- `GET /api/content/`  
  **Query params:** `page, per_page, lat, lng, radius_m, active, start_at, end_at`  
  **Response:** Paginated content list.

- `GET /api/content/{id}/`  
  **Response:** Content details.

- `POST /api/content/` (admin)  
  **Payload:** `{ "title", "body", "lat", "lng", "radius_m", "start_at", "end_at", "meta" }`

- `PUT /api/content/{id}/` (admin)  
- `DELETE /api/content/{id}/` (admin, soft-delete)

### Device & Notifications
- `POST /api/device-token/`  
  **Payload:** `{ "token": "fcm_token", "platform": "android", "app_version": "1.0.0" }`  
  **Behavior:** create/update device token for logged-in user.

- `POST /api/notify/` (admin)  
  **Payload examples:**  
  - Send to all: `{ "content_id": 12, "target": { "all": true } }`  
  - Geo target: `{ "content_id": 12, "target": { "lat": 12.34, "lng": 56.78, "radius_m": 100 } }`

- `GET /api/notifications/`  
  **Response:** list of `NotificationLog` entries for current user.

### Analytics
- `POST /api/analytics/`  
  **Payload:** `{ "event_type": "content_open", "content_id": 12, "meta": {...} }`

---

## Database schema & data models

**User**
- `id` (PK)  
- `name`  
- `email` (unique)  
- `password_hash`  
- `role` (`admin` / `user`)  
- `created_at`  
- `last_login`

**Content**
- `id` (PK)  
- `title`  
- `body` (text / markdown)  
- `type` (`announcement`, `event`, etc.)  
- `lat`, `lng` (nullable)  
- `radius_m` (nullable)  
- `start_at`, `end_at` (datetime)  
- `meta_json` (JSON)  
- `created_by` (FK -> User)  
- `is_active` (bool)  
- `created_at`

**DeviceToken**
- `id` (PK)  
- `user_id` (FK -> User)  
- `token` (FCM token)  
- `platform` (`android`)  
- `app_version`  
- `created_at` / `updated_at`

**NotificationLog**
- `id` (PK)  
- `content_id` (FK -> Content)  
- `user_id` (FK -> User)  
- `sent_at`  
- `delivered_at` (nullable)  
- `opened_at` (nullable)  
- `status` (`queued`, `sent`, `delivered`, `failed`)

**AnalyticsEvent**
- `id` (PK)  
- `user_id` (nullable)  
- `event_type`  
- `meta_json`  
- `timestamp`

**Indexing & notes**
- Index commonly filtered columns (e.g., `is_active`, `start_at`, `end_at`).  
- For geo queries consider MySQL spatial features & spatial indexes if usage grows.  
- Use soft deletes (`is_active`) for safe recovery.

---

## Mobile app design & UX

**Goals**
- Fast onboarding and clear permission justifications.  
- Demonstrate push notification end-to-end quickly for the demo/pitch.  
- Provide graceful fallbacks if permissions denied.

**Core screens**
- Onboarding (permission explanations).  
- Login / Signup / Profile.  
- Home / Content list (sorting: recent / nearby).  
- Map view (optional) to visualize nearby content.  
- Content detail (supports media and links).  
- Notifications center (history).  
- Settings & privacy controls.

**UX details**
- Request permissions with short explanation screens; if user denies, show fallback messaging.  
- Notification tap deep-links into content detail and logs the open event.  
- Cache last-fetched content for offline viewing with stale indicators.  
- Store tokens securely and handle refresh token flow transparently.

**Recommended libraries**
- `react-navigation`  
- `axios` (or `fetch`)  
- `expo-secure-store` or `react-native-encrypted-storage`  
- `expo-notifications` (Expo) or `@react-native-firebase/messaging` (RN CLI)  
- `expo-location` or `react-native-geolocation-service` (if using geo)

---

## Admin panel — requirements & UX

**Must-have features (MVP)**
- Content composer (title, body, images, schedule).  
- Geo-targeting (lat/lng + radius).  
- Immediate send and scheduled send controls.  
- Notification preview & test send (to emulator/test device).  
- User management (search, deactivate).  
- Dashboard: active users, notifications sent, delivery rate, opens.

**Implementation approaches**
- **Fast MVP:** Use Django Admin with custom `ModelAdmin` and admin actions to send notifications and view logs.  
- **Polished UI:** Next.js admin using Tailwind / ShadCN, charts with Recharts, and polished UX.

---

## DevOps, CI/CD & deployment strategy

**Local development**
- `docker-compose` with services: `web` (Django), `db` (MySQL), `redis` (optional), `celery-worker` (optional).

**CI/CD (GitHub Actions)**
- On PR: run lint & unit tests.  
- On merge to `main`: build Docker image, optionally push to registry, deploy via host provider.

**Production**
- Managed MySQL (DigitalOcean / AWS RDS).  
- Host backend on Render / DigitalOcean / Railway / VPS (Docker).  
- Deploy admin on Vercel (Next.js) or expose Django Admin behind auth.  
- Use S3-compatible storage for media.  
- Use Sentry for error tracking.  
- Automated backups: daily DB snapshots, retention policy (e.g., 30 days).  
- Health checks and uptime monitoring.

**Secrets**
- Store in host secret manager / GitHub Secrets; do not commit secrets to repo.  
- Rotate keys regularly (Firebase Admin, DB credentials, etc.).

---

## Testing & QA strategy

**Automated**
- Unit tests for backend models, serializers, utils.  
- Integration tests for API endpoints (DRF `APITestCase`).  
- CI runs test suite on PRs.

**Manual & E2E**
- Manual QA checklist includes auth, permission denial handling, notification flows, offline mode.  
- E2E mobile tests (Detox or Appium) for critical flows (login, open notification, view content).  
- Beta testing: closed Play Store track for internal testers.

**Performance**
- Load testing for push sending (batch sends) and DB performance on expected pilot scale.  
- Monitor memory & latency; optimize queries & add indices where necessary.

---

## Security & privacy

**Security**
- TLS for all API endpoints.  
- Use Django secure defaults for password hashing (consider Argon2).  
- Rate-limit auth endpoints.  
- Input validation & payload sanitization.  
- RBAC for admin-only endpoints.

**Privacy**
- Minimize PII; anonymize analytics where possible.  
- Explicit consent for push & location collection; store consent state.  
- In-app privacy policy & account data deletion/export endpoints (for compliance).

---

## Acceptance criteria & demo plan

**Acceptance (MVP)**
- Users can register/login, access resources with JWT, refresh tokens work.  
- Admin can create content and schedule or send notifications.  
- Mobile registers FCM token and receives push notifications.  
- Notification tap deep-links to correct content; open event logged.  
- Admin dashboard displays basic delivery & open metrics.  
- System deployed with accessible backend & admin URLs and APK for demo.

**Demo script (2–3 minutes)**
1. Launch mobile app and log in as test user.  
2. Admin panel: create content and press “Send Notification”.  
3. Mobile device receives push; tap it and show content detail.  
4. Show admin dashboard updated (deliveries / opens).  
5. Close with roadmap slide describing beacon + drone phases next.

---

## Time & resource estimates

- **Solo developer:** ~8–11 weeks (setup, backend, mobile, admin, QA, deploy).  
- **With one additional developer:** ~4–6 weeks (parallelize mobile & backend).  

**Rough breakdown**
- Setup & auth: 1 week  
- Core backend & APIs: 2 weeks  
- Mobile basic app: 3–4 weeks  
- Admin & notifications: 2 weeks  
- QA & deployment: 1–2 weeks

---

## Risks & mitigations

- **Push reliability** — test FCM across Android versions, implement retries & logging, monitor with Sentry.  
- **Low permission opt-in** — improve onboarding, clearly explain value, fallback behavior for denied permissions.  
- **Scope creep** — freeze MVP features; maintain separate backlog for enhancements.  
- **Device fragmentation** — test on low-end and modern devices; monitor crash analytics.  
- **DB migration/data loss** — use staging, test migrations, perform regular backups.

---

## Next steps & immediate action items

1. Confirm full GitHub repo path (current: `https://github.com/149189/Beacon-` — looks truncated).  
2. Create repositories: `beacon-backend`, `beacon-mobile`, `beacon-admin`.  
3. Decide: **Expo** (recommended) vs **React Native CLI**.  
4. If you want, I can **scaffold starter repos** (Django + DRF + Docker, Expo React Native skeleton, Next.js admin). Reply **`Scaffold`** to proceed.  
5. Start Sprint 1: implement auth endpoints and mobile login flow.

---

## Appendices — checklist, commands, samples

### Quick MVP checklist
- [ ] Repositories created & linked to project board.  
- [ ] Docker compose with `web` + `db` (MySQL).  
- [ ] Auth endpoints implemented & tested.  
- [ ] Device token registration endpoint present.  
- [ ] Admin can send push; mobile receives push.  
- [ ] APK built & tested on ≥2 devices.  
- [ ] Basic analytics endpoints working.

### Useful commands
```bash
# Run dev environment
docker-compose up --build

# Apply migrations
docker-compose exec web python manage.py migrate

# Create superuser
docker-compose exec web python manage.py createsuperuser

# Run mobile in Expo (dev)
cd beacon-mobile
expo start

# Build Android production APK (EAS)
eas build -p android --profile production

# Lint & test backend (example)
docker-compose exec web flake8 .
docker-compose exec web pytest




pandoc Beacon_Report.md -o Beacon_Report.pdf --pdf-engine=xelatex -V geometry:margin=1in
