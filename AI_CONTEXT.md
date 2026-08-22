# AI_CONTEXT.md — CareBridge RMS

> Quick-reference context file for AI coding agents (Claude Code, Puku CLI, Cursor, etc.) working on this repo. Read this first before doing anything else.

---

## What is this project?

**CareBridge RMS** — a full-stack Hospital Resource Management System for clinics in South/Southeast Asia.

- **Live frontend:** https://hospital-management-system-eta-nine.vercel.app/
- **Live backend:**  https://openhospital-rms-api.onrender.com
- **Repo:** https://github.com/bikash-20/Hospital-Management-System
- **Type:** Student portfolio project on a free-tier deployment. **Never use with real patient data.**

It replaces paper-based workflows with: patient registration, doctor consultations, prescriptions, lab orders, billing, bed management, real-time queue display.

---

## Tech stack (one-liner per layer)

| Layer | Stack |
|---|---|
| Frontend | React 19 + TypeScript, Vite, Tailwind v4, TanStack React Query, Framer Motion, React Router v6, Oxlint |
| Backend | Spring Boot 4.1, Java 25, Hibernate 7 (JPA), Spring Security + JWT (HS256, 24h), STOMP over SockJS WebSockets, AOP audit logging |
| Database | PostgreSQL 17 (Supabase), Flyway migrations, HikariCP pool (10 conns) |
| Infra | Docker Compose, nginx reverse proxy, multi-stage Dockerfiles |
| Deploy | Vercel (frontend) + Render free-tier (backend) + Supabase (DB), GitHub Actions CI/CD |

Full architectural detail in `README.md` and `ARCHITECTURE.md`.

---

## Project layout

```
Hospital-Management-System/
├── backend/                          # Spring Boot app
│   ├── src/main/java/com/hospital/rms/
│   │   ├── OpenHospitalApplication.java   # main class — also sets JVM tz=Asia/Dhaka, @EnableScheduling
│   │   ├── DataSeeder.java                # one-time initial seed (patients, beds, doctors)
│   │   ├── controller/                    # REST endpoints
│   │   │   ├── DashboardController.java
│   │   │   ├── DemoReseedController.java  # manual reseed, gated by X-Demo-Reset-Token
│   │   │   └── DemoAccountResetController.java
│   │   ├── service/
│   │   │   ├── DashboardService.java      # filters all "today" counters
│   │   │   ├── DemoDataRefresher.java     # auto-reseed (startup + @Scheduled)
│   │   │   └── ...
│   │   ├── entity/                        # JPA entities (Patient, Appointment, Bed, Billing, ...)
│   │   ├── repository/                    # Spring Data repos
│   │   ├── security/                      # JWT filter, UserDetailsService
│   │   ├── aspect/                        # AOP audit logging
│   │   └── config/                        # Security, WebSocket, CORS
│   └── Dockerfile
├── frontend/                         # React SPA — Vite + Tailwind
│   └── src/
│       ├── api/                      # API client + data mappers
│       ├── components/
│       │   ├── layout/               # Sidebar, TopNav, DashboardLayout
│       │   └── ui/                   # Motion helpers, shared
│       ├── context/                  # Auth, Theme contexts
│       ├── pages/                    # 10 route pages
│       └── types/                    # TypeScript interfaces
├── ARCHITECTURE.md                   # Free-tier + production architecture
├── LOAD_TESTING.md                   # Local Docker benchmark
├── docker-compose.yml                # Full-stack local
├── render.yaml                       # Render Blueprint (env vars live here)
└── hospital management prd.md        # Original PRD
```

---

## Critical conventions (don't break these)

### 1. Timezone is **always** Asia/Dhaka
- JVM default is pinned in `OpenHospitalApplication.main()` via `TimeZone.setDefault(...)`.
- All "today" filters (Dashboard, DataSeeder, DemoDataRefresher) use `ZoneId.of("Asia/Dhaka")`.
- `@Scheduled` cron jobs explicitly pass `zone = "Asia/Dhaka"` for the same reason.
- **Why:** Render runs in UTC. Without this, dashboard "today" rolls forward 6h before Bangladesh does, and freshly seeded appointments stop matching the dashboard query.

### 2. RBAC roles (5)
`ADMIN`, `DOCTOR`, `RECEPTIONIST`, `LAB_TECH`, `CASHIER` — see `README.md` §Security Model for the matrix.

### 3. Auth flow
- Login → JWT (HS256, 24h, BCrypt 10 rounds) → `localStorage` (`oh_token`) → `Authorization: Bearer ...`
- Cookie-based auth (`oh_access`) also wired up as fallback — see commit `8e711a7`.

### 4. CORS
- Local: `http://localhost:5173`
- Prod: must set `CORS_ALLOWED_ORIGINS` env var to exact Vercel URL on Render.

### 5. Demo-reset token
Gates `POST /api/setup/reseed-today` and `POST /api/setup/reset-password`. Currently embedded in `render.yaml` as `CareBridgeReset2026Private`. ⚠️ Public repo — anyone can read it. Acceptable because the worst case is "they reset fake demo data." Rotate or move to Render manual config if this ever leaves demo status.

---

## Recent changes log

### `31ed782` — feat(demo): auto-reseed dashboard daily via @Scheduled  *(2026-08-23)*
**Problem solved:** Dashboard counters (Patients Today, Appointments Today, Revenue Today) reset to 0 0 0 every midnight Asia/Dhaka because `DataSeeder` only runs once and froze `appointmentDate`/`prescription.appointmentDate` to the deploy date. `DashboardService` filters by "today" so the frozen records stopped matching.

**What changed:**
- `OpenHospitalApplication.java` — added `@EnableScheduling`.
- `DemoDataRefresher.java`:
  - Extracted logic into `refreshIfStale()` (now package-private, `@Transactional`).
  - Added `scheduledDailyRefresh()` annotated `@Scheduled(cron = "0 5 0 * * *", zone = "Asia/Dhaka")` — fires daily at 00:05 BD time.
  - `refreshIfStale()` now also bumps `Patient.createdDate` to "now" so the "Patients Today" counter works.
- `render.yaml` — added `AUTO_RESEED_DEMO: "true"` and embedded `DEMO_RESET_TOKEN: CareBridgeReset2026Private`.

**Result:** Dashboard auto-updates every day. No more curl. Render free-tier cold-start also triggers the same `refreshIfStale()` on app startup.

**How to verify after deploy:** Render logs should show
```
auto-reseed-demo: no appointments for 2026-08-23 — refreshing demo data
auto-reseed-demo: ✅ Refreshed 6 appointments, 2 prescriptions, 3 billings for 2026-08-23
```

### Earlier commits (most recent first)
- `581ac79` — added a photo
- `9b8f2fc` — fix(cors): proxy /api through Vercel so requests are same-origin
- `8e711a7` — fix(auth): read JWT from oh_access cookie when Authorization header is absent
- `2ed20e3` — fix(timezone): pin Asia/Dhaka so dashboard "today" matches seed "today"
- `c524a98` — fix(demo): permit anonymous access to reseed-today so the token gate works

---

## Current state — known issues / things to improve

### Bugs
- None actively reported as of last change.

### Limitations (from README §Known Limitations)
1. No pagination metadata on collection endpoints.
2. JSON TEXT for `medicines` / `labOrders` / `lineItems` — can't query individual items via SQL.
3. UHID + token counters use JVM synchronization — fine for single-instance free tier, breaks on multi-instance.
4. WebSocket has no auth — queue updates broadcast without verifying subscriber identity.
5. No file upload — prescriptions/lab orders are text-only.
6. Hardcoded UHID prefix `SYL-2026-` — Sylhet-specific, should be configurable per hospital.
7. No offline support / PWA.
8. English-only UI — Bengali/Hindi i18n needed for local deployment.

### Roadmap
- Lab report PDF upload/viewing
- SMS notifications (Twilio/Vonage)
- Multi-hospital tenancy with isolation
- Pharmacy inventory
- Revenue dashboards with date filters
- PDF prescription/invoice printing
- Offline-first PWA with service worker
- i18n (Bengali, Hindi, English)
- Role-based sidebar (hide inaccessible nav)

---

## How to do common tasks

### Run backend locally
```bash
cd backend
mvn clean compile         # verify changes compile
mvn spring-boot:run       # runs with H2 in-memory DB
```

### Run frontend locally
```bash
cd frontend
npm install
npm run dev               # Vite dev server on :5173, proxies /api → :8080
```

### Full stack via Docker
```bash
docker compose --env-file /dev/null up -d --build
# --env-file /dev/null prevents a local .env Supabase connection from being used accidentally
```

### Manual reseed the demo data (escape hatch — should rarely be needed now)
```bash
curl --fail-with-body -X POST \
  "https://openhospital-rms-api.onrender.com/api/setup/reseed-today" \
  -H "X-Demo-Reset-Token: CareBridgeReset2026Private"
```

### Reset a demo account password
```bash
curl --fail-with-body -X POST \
  "https://openhospital-rms-api.onrender.com/api/setup/reset-password" \
  -H "Content-Type: application/json" \
  -H "X-Demo-Reset-Token: CareBridgeReset2026Private" \
  -d '{"username":"admin","password":"newpassword123"}'
```

---

## Environment variables reference

### Required on Render (production)
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Supabase Postgres JDBC URL |
| `DB_USERNAME` / `DB_PASSWORD` | DB creds |
| `JWT_SECRET` | HS256 signing key — **change from default in prod** |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins |

### Demo-only (set on Render for the hosted demo)
| Variable | Purpose | Default |
|---|---|---|
| `AUTO_RESEED_DEMO` | Enables `DemoDataRefresher` (startup + daily) | `false` |
| `DEMO_RESET_TOKEN` | Gates `reseed-today` and `reset-password` endpoints | unset (endpoint returns 404) |

### Frontend (Vercel)
| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Render backend URL, e.g. `https://openhospital-rms-api.onrender.com` |

---

## Git workflow notes

- Single branch: `main`.
- GitHub Actions (`.github/workflows/ci-cd.yml`) runs backend tests + frontend lint/build on every PR and push to `main`.
- On successful push to `main`, a GitHub Actions job hits Render's deploy hook → Render rebuilds & deploys.
- PRs run checks but never deploy.
- Author identity on this machine: `BIKASH TALUKDER <bikashtalukder040@gmail.com>` (= GitHub `bikash-20`). Don't override.

---

## When you're about to make changes — checklist

1. **Read this file first.** It catches you up on context, conventions, and recent work.
2. **Read `README.md`** if you need the full architectural picture.
3. **Read `ARCHITECTURE.md`** if you're touching deployment or infra.
4. **Respect the Asia/Dhaka timezone invariant.** Any new "today" filter must use `ZoneId.of("Asia/Dhaka")`.
5. **Don't add hardcoded demo data** to production paths. New demo fixtures go in `DataSeeder.java` (initial) and `DemoDataRefresher.java` (daily refresh). Keep both in sync.
6. **Test with `mvn clean compile`** before committing. There are no unit tests in this repo (only integration tests against live Postgres on Render).
7. **Don't break the role/RBAC matrix** in `README.md` §Security Model without updating it.
8. **If you change `render.yaml` env vars**, remember Render Blueprint only applies on new service creation — for an existing service you also need to set the var in Render's dashboard manually.

---

*Last updated: 2026-08-23 — after `31ed782`*
