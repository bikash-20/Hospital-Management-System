# OpenHospital RMS

> Student portfolio project. The live-demo deployment is intentionally a low-cost free-tier setup and must not be used with real patient data.

## Current Deployment Plan

- Frontend: deploy `frontend/` to Vercel. Set `VITE_API_URL` to the deployed Fly.io API URL.
- Backend: deploy `backend/` to Fly.io using `backend/fly.toml` and `backend/Dockerfile`.
- Database: use the existing Supabase PostgreSQL connection string through Fly secrets.
- Schema: production uses Flyway migrations and `ddl-auto=validate`.
- CORS: set `CORS_ALLOWED_ORIGINS` to the exact Vercel URL.
- Redis, multiple backend instances, and a reverse proxy are intentionally excluded from the demo.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the free-tier design and the larger production architecture, and [LOAD_TESTING.md](LOAD_TESTING.md) for the local Docker benchmark.

For local Docker with PostgreSQL defaults, use `docker compose --env-file /dev/null up -d --build`. The `--env-file /dev/null` flag prevents a local `.env` Supabase connection from being used accidentally.

**Resource & Patient Workflow Management System** — a full-stack hospital operations platform for clinics and regional hospitals in South/Southeast Asia.

Built to replace paper-based workflows with a unified digital system covering patient registration, doctor consultations, prescriptions, lab orders, billing, bed management, and real-time queue display.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Data Flow](#data-flow)
- [Tech Stack & Tradeoffs](#tech-stack--tradeoffs)
- [Security Model](#security-model)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Development](#development)
- [Known Limitations & Future Work](#known-limitations--future-work)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                     │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │ Desktop  │  │ Tablet   │  │ Mobile   │  │ Public Queue     │    │
│  │ Browser  │  │ Browser  │  │ Browser  │  │ Display (TV)     │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘    │
│       └──────────────┴─────────────┴─────────────────┘              │
│                              │ HTTPS                                │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────────┐
│                     NGINX REVERSE PROXY                             │
│                              │                                      │
│   ┌──────────────────────────┼──────────────────────────┐           │
│   │  Static assets (1yr cache, gzip)                    │           │
│   │  SPA fallback (try_files → index.html)              │           │
│   │  /api/*  ──────────────────►  proxy → backend:8080  │           │
│   │  /ws/*   ──────────────────►  WebSocket upgrade     │           │
│   └──────────────────────────┬──────────────────────────┘           │
│                              │                                      │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────────┐
│                     SPRING BOOT BACKEND                             │
│                              │                                      │
│   ┌──────────────────────────┼──────────────────────────┐           │
│   │         SECURITY LAYER                                │           │
│   │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │           │
│   │  │ CORS Filter │  │ JWT Filter  │  │ RBAC Gate  │  │           │
│   │  │ (allowlist) │  │ (BCrypt +   │  │ (role-based│  │           │
│   │  │             │  │  HS256 JWT) │  │  endpoint  │  │           │
│   │  │             │  │             │  │  security) │  │           │
│   │  └─────────────┘  └─────────────┘  └────────────┘  │           │
│   └──────────────────────────┬──────────────────────────┘           │
│                              │                                      │
│   ┌──────────────────────────┼──────────────────────────┐           │
│   │         SERVICE LAYER                                │           │
│   │                                                       │           │
│   │  ┌──────────┐ ┌───────────┐ ┌───────────┐           │           │
│   │  │ Patient  │ │Appointment│ │Prescription│           │           │
│   │  │ Service  │ │  Service  │ │  Service   │           │           │
│   │  └────┬─────┘ └─────┬─────┘ └─────┬─────┘           │           │
│   │       │              │              │                  │           │
│   │  ┌────┴─────┐ ┌─────┴─────┐ ┌─────┴─────┐           │           │
│   │  │ Billing  │ │   Bed     │ │   Auth    │           │           │
│   │  │ Service  │ │  Service  │ │  Service  │           │           │
│   │  └────┬─────┘ └─────┬─────┘ └─────┬─────┘           │           │
│   │       │              │              │                  │           │
│   └───────┼──────────────┼──────────────┼──────────────────┘           │
│           │              │              │                            │
│   ┌───────┼──────────────┼──────────────┼──────────────────┐         │
│   │       │    AUDIT ASPECT (AOP)       │                  │         │
│   │  Intercepts all Repository.save() calls                │         │
│   │  Logs: entity, operation, userId, timestamp, values    │         │
│   └───────┼──────────────┼──────────────┼──────────────────┘         │
│           │              │              │                            │
│   ┌───────┼──────────────┼──────────────┼──────────────────┐         │
│   │       │   REPOSITORY LAYER (Spring Data JPA)           │         │
│   │  ┌────┴─────┐ ┌─────┴─────┐ ┌─────┴─────┐            │         │
│   │  │ Patient  │ │Appointment│ │Prescription│            │         │
│   │  │   Repo   │ │   Repo    │ │   Repo     │            │         │
│   │  └────┬─────┘ └─────┬─────┘ └─────┬─────┘            │         │
│   │       │              │              │                  │         │
│   │  ┌────┴─────┐ ┌─────┴─────┐ ┌─────┴─────┐            │         │
│   │  │ Billing  │ │   Bed     │ │   User    │            │         │
│   │  │   Repo   │ │   Repo    │ │   Repo    │            │         │
│   │  └────┬─────┘ └─────┬─────┘ └─────┬─────┘            │         │
│   └───────┼──────────────┼──────────────┼──────────────────┘         │
│           │              │              │                            │
│   ┌───────┼──────────────┼──────────────┼──────────────────┐         │
│   │       │    HikariCP CONNECTION POOL (10 connections)   │         │
│   │       │    spring.jpa.open-in-view=false                │         │
│   │       │    spring.jpa.hibernate.ddl-auto=validate        │         │
│   └───────┼──────────────┼──────────────┼──────────────────┘         │
│           │              │              │                            │
│   ┌───────┼──────────────┼──────────────┼──────────────────┐         │
│   │       │   WEBSOCKET (STOMP over SockJS)                │         │
│   │  /topic/queue/{doctorId}  ← broadcasts queue updates   │         │
│   │  /app/*                   ← client send destinations   │         │
│   └─────────────────────────────────────────────────────────┘         │
│                                                                      │
└──────────────────────────────┼───────────────────────────────────────┘
                               │ JDBC (SSL)
┌──────────────────────────────┼───────────────────────────────────────┐
│                     PostgreSQL 17                                    │
│                     (Supabase Pooler)                                │
│                                                                      │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│   │ patients │ │appoint-  │ │prescrip- │ │ billing  │              │
│   │          │ │  ments   │ │  tions   │ │          │              │
│   ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤              │
│   │ id (PK)  │ │ id (PK)  │ │ id (PK)  │ │ id (PK)  │              │
│   │ uhid (U) │ │ patient→ │ │ appoint→ │ │ patient→ │              │
│   │ fullName │ │ doctor→  │ │ patient→ │ │ invoice# │              │
│   │ mobile   │ │ date     │ │ doctor→  │ │ amount   │              │
│   │ dob      │ │ token#   │ │ diagno.. │ │ status   │              │
│   │ gender   │ │ status   │ │ medicin..│ │ lineItems│              │
│   │ nid      │ │          │ │ labOrder.│ │          │              │
│   │ address  │ │          │ │          │ │          │              │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
│                                                                      │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐                           │
│   │  beds    │ │  users   │ │audit_logs│                           │
│   ├──────────┤ ├──────────┤ ├──────────┤                           │
│   │ id (PK)  │ │ id (PK)  │ │ id (PK)  │                           │
│   │ bedNum   │ │ username │ │ entity   │                           │
│   │ ward     │ │ password │ │ operatio.│                           │
│   │ status   │ │ fullName │ │ entityId │                           │
│   │ patient→ │ │ email    │ │ userId   │                           │
│   │          │ │ role     │ │ newValues│                           │
│   │          │ │ enabled  │ │ timestamp│                           │
│   └──────────┘ └──────────┘ └──────────┘                           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Authentication Flow

```
┌─────────┐         ┌─────────┐         ┌──────────┐         ┌──────────┐
│ Browser │         │  nginx  │         │ Backend  │         │   DB     │
└────┬────┘         └────┬────┘         └────┬─────┘         └────┬─────┘
     │  POST /api/auth/login                 │                    │
     │─────────────────►│───────────────────►│                    │
     │                  │                    │  SELECT user       │
     │                  │                    │───────────────────►│
     │                  │                    │  ◄──── user + hash │
     │                  │                    │                    │
     │                  │                    │  BCrypt.matches()  │
     │                  │                    │  Generate HS256 JWT│
     │                  │                    │  {sub, role, exp}  │
     │                  │                    │                    │
     │  200 { token }   │  200 { token }    │                    │
     │◄─────────────────│◄──────────────────│                    │
     │                  │                    │                    │
     │  localStorage.setItem('oh_token')    │                    │
     │                  │                    │                    │
     │  GET /api/patients                   │                    │
     │  Authorization: Bearer <token>       │                    │
     │─────────────────►│───────────────────►│                    │
     │                  │                    │  JWT Filter:       │
     │                  │                    │  - Parse token     │
     │                  │                    │  - Verify expiry   │
     │                  │                    │  - Set SecurityCtx │
     │                  │                    │                    │
     │                  │                    │  SELECT patients   │
     │                  │                    │───────────────────►│
     │                  │                    │  ◄──── result      │
     │  200 [patients]  │  200 [patients]   │                    │
     │◄─────────────────│◄──────────────────│                    │
```

### 2. Appointment → Queue → Real-time Update Flow

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│Reception │      │ Backend  │      │ Database │      │ Doctor's │
│  Screen  │      │          │      │          │      │  Screen  │
└────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
     │                 │                  │                  │
     │ POST /api/appointments            │                  │
     │ {patientId, doctorId, date}       │                  │
     │────────────────►│                  │                  │
     │                 │                  │                  │
     │                 │ 1. Find max token for doctor today  │
     │                 │─────────────────►│                  │
     │                 │ ◄──── max=4      │                  │
     │                 │                  │                  │
     │                 │ 2. Save appointment (token=5)       │
     │                 │─────────────────►│                  │
     │                 │ ◄──── saved      │                  │
     │                 │                  │                  │
     │                 │ 3. Build queue response              │
     │                 │    (all WAITING + IN_CONSULTATION)   │
     │                 │                  │                  │
     │                 │ 4. STOMP broadcast:                  │
     │                 │    /topic/queue/{doctorId}           │
     │                 │─────────────────────────────────────►│
     │                 │                  │                  │
     │  201 Created    │                  │  ◄──── live     │
     │◄────────────────│                  │      update     │
     │                 │                  │                  │
     │                 │                  │  Doctor sees new │
     │                 │                  │  patient in queue│
```

### 3. Consultation → Prescription → Billing Flow

```
┌─────────┐      ┌─────────┐      ┌──────────┐      ┌──────────┐
│ Doctor  │      │ Backend │      │ Database │      │ Cashier  │
└────┬────┘      └────┬────┘      └────┬─────┘      └────┬─────┘
     │                │                 │                  │
     │ POST /api/prescriptions         │                  │
     │ {appointmentId, diagnosis,      │                  │
     │  medicines, labOrders}          │                  │
     │───────────────►│                 │                  │
     │                │                 │                  │
     │                │ 1. Mark appointment COMPLETED       │
     │                │─────────────────►│                  │
     │                │                  │                  │
     │                │ 2. Save prescription                 │
     │                │─────────────────►│                  │
     │                │                  │                  │
     │                │ 3. Auto-dispatch:                    │
     │                │    - Lab orders → Lab Tech queue     │
     │                │    - Billing line items              │
     │                │                  │                  │
     │  201 Created   │                  │                  │
     │◄───────────────│                  │                  │
     │                │                  │                  │
     │                │  Meanwhile, billing is created:     │
     │                │  POST /api/billing                  │
     │                │─────────────────►│                  │
     │                │                  │  Invoice: INV-... │
     │                │                  │  Status: UNPAID   │
     │                │                  │                  │
     │                │                  │  GET /api/billing/unpaid
     │                │                  │  ◄────────────────│
     │                │                  │  [unpaid bills]   │
```

### 4. Bed Management Flow

```
┌─────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│ Admin   │      │ Backend  │      │ Database │      │ All      │
│         │      │          │      │          │      │ Clients  │
└────┬────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
     │                │                  │                  │
     │ PATCH /api/beds/{id}/status      │                  │
     │ {status: "OCCUPIED"}             │                  │
     │───────────────►│                  │                  │
     │                │                  │                  │
     │                │ 1. Find bed       │                  │
     │                │─────────────────►│                  │
     │                │ ◄──── bed         │                  │
     │                │                  │                  │
     │                │ 2. Update status  │                  │
     │                │─────────────────►│                  │
     │                │                  │                  │
     │                │ 3. Audit log      │                  │
     │                │─────────────────►│                  │
     │                │                  │                  │
     │  200 Updated   │                  │                  │
     │◄───────────────│                  │                  │
     │                │                  │                  │
     │  All clients refetch on next mount / stale interval  │
     │                │                  │  GET /api/beds   │
     │                │                  │  ◄───────────────│
```

---

## Tech Stack & Tradeoffs

### Frontend

| Technology | Choice | Why | Tradeoff |
|-----------|--------|-----|----------|
| **Framework** | React 19 + TypeScript | Largest ecosystem, strong typing, team familiarity | Heavier bundle vs. Svelte/Vue; runtime overhead of virtual DOM |
| **Build Tool** | Vite 8 | Sub-second HMR, native ESM, fast builds | Newer = less battle-tested than Webpack in enterprise |
| **Styling** | Tailwind CSS v4 | Utility-first = fewer custom CSS files, rapid iteration | Verbose class lists; learning curve for team |
| **State** | TanStack React Query | Server-state caching, deduplication, background refetch | Extra dependency; overkill for simple apps (perfect here) |
| **Animation** | Framer Motion | Declarative animations, layout animations, AnimatePresence | ~30KB bundle cost; alternatives (CSS animations) are lighter |
| **Routing** | React Router v6 | Nested layouts, protected routes, outlet pattern | Client-side only; no SSR/SSG benefits |
| **Linting** | Oxlint | 10-50x faster than ESLint; Rust-based | Smaller plugin ecosystem; some rules missing |

### Backend

| Technology | Choice | Why | Tradeoff |
|-----------|--------|-----|----------|
| **Framework** | Spring Boot 4.1 | Enterprise-grade, massive ecosystem, built-in security | JVM startup time (~4-8s); higher memory vs. Go/Node |
| **Language** | Java 25 | LTS support, strong typing, mature tooling | Verbose; record-based DTOs mitigate this |
| **ORM** | Hibernate 7 (JPA) | Automatic DDL, lazy loading, connection pooling | N+1 query risk; `open-in-view=false` requires careful `@Transactional` |
| **Security** | Spring Security + JWT | Stateless auth, RBAC, BCrypt | JWT can't be revoked server-side without a blacklist |
| **WebSocket** | STOMP over SockJS | Fallback for proxies that don't support WS | Higher overhead than raw WS; SockJS adds HTTP polling fallback |
| **Audit** | AOP Aspect | Cross-cutting concern; doesn't pollute business logic | Reflection-based (minor perf cost); silent failures on audit errors |

### Database

| Technology | Choice | Why | Tradeoff |
|-----------|--------|-----|----------|
| **Production** | Supabase PostgreSQL 17 | Free tier (500MB), managed backups, SSL, connection pooling | 60 connection limit; cold starts on free tier |
| **Development** | H2 in-memory | Zero setup, instant schema creation | No persistence; can't test PostgreSQL-specific features |
| **Schema** | Flyway + `ddl-auto=validate` | Versioned SQL migrations with startup validation | Requires migration discipline; safer for production |
| **Pool** | HikariCP (10 conns) | Battle-tested, fast, respects Supabase limits | 10 connections may bottleneck under high concurrency |

### Infrastructure

| Technology | Choice | Why | Tradeoff |
|-----------|--------|-----|----------|
| **Reverse Proxy** | nginx:alpine | 2MB image, gzip, WebSocket proxy, SPA fallback | Manual config vs. Traefik/Caddy auto-discovery |
| **Containerization** | Docker Compose | Single command to start full stack | No orchestration; not production-ready without k8s/Swarm |
| **Frontend Serving** | nginx (multi-stage build) | Tiny image (~25MB), aggressive caching | No SSR; SEO irrelevant for internal hospital tool |
| **Backend Runtime** | JRE Alpine (~180MB) | Smaller than JDK, includes all needed runtime | Can't compile Java at runtime (not needed) |

---

## Security Model

### Authentication

- **JWT (HS256)** with 24-hour expiry
- Tokens stored in `localStorage` (accessible to JS; httpOnly cookies would be more secure but add CSRF complexity)
- BCrypt password hashing (10 rounds)
- Stateless sessions — no server-side session store needed

### Authorization (RBAC)

| Endpoint Pattern | Access |
|-----------------|--------|
| `POST /api/auth/login` | Public |
| `GET /ws/**` | Public (WebSocket) |
| `GET/OPTIONS /api/**` | Authenticated |
| `POST/PATCH/DELETE /api/**` | Authenticated |
| `/api/admin/**` | ADMIN only |

### Role Permissions

| Role | Can Do |
|------|--------|
| `ADMIN` | Everything + user management + bed management + audit logs |
| `DOCTOR` | Consultations, prescriptions, view queue |
| `RECEPTIONIST` | Patient registration, appointments, view queue |
| `LAB_TECH` | View lab orders, update lab order status |
| `CASHIER` | View billing, process payments, view reports |

### Known Security Limitations

1. **JWT in localStorage** — vulnerable to XSS. Mitigated by CSP headers (not yet implemented) and same-origin policy.
2. **No token revocation** — a compromised token is valid until expiry. For this scale, acceptable. For production, add a Redis blacklist.
3. **CORS is environment-configured** — local development allows `http://localhost:5173`; production must set `CORS_ALLOWED_ORIGINS` to the deployed frontend origin.
4. **Flyway migrations** — production uses versioned SQL and `ddl-auto=validate`; rollback still requires a reviewed down-migration or restore plan.

---

## Database Schema

### Entity Relationship

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    users     │     │  patients    │     │    beds      │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (PK, UUID)│     │ id (PK, UUID)│     │ id (PK, UUID)│
│ username (U) │     │ uhid (U, idx)│     │ bedNumber    │
│ password     │◄──┐ │ fullName     │◄──┐ │ wardName     │
│ fullName     │   │ │ mobileNumber │   │ │ status (enum)│
│ email (U)    │   │ │ dob          │   │ │ patient_id ──│──► patients
│ role (enum)  │   │ │ gender       │   │ └──────────────┘
│ enabled      │   │ │ nid          │   │
└──────┬───────┘   │ │ address      │   │
       │           │ │ createdDate  │   │
       │           │ └──────────────┘   │
       │           │                    │
       │           │ ┌──────────────┐   │
       │           │ │appointments  │   │
       │           │ ├──────────────┤   │
       │           │ │ id (PK, UUID)│   │
       │           │ │ patient_id ──│───┘
       │◄──────────┤ │ doctor_id ───│──► users
       │           │ │ appointmentDt│
       │           │ │ tokenNumber  │
       │           │ │ status (enum)│
       │           │ │ createdDate  │
       │           │ └──────┬───────┘
       │           │        │
       │           │ ┌──────┴───────┐
       │           │ │prescriptions │
       │           │ ├──────────────┤
       │           │ │ id (PK, UUID)│
       │           │ │ appointment─ │──► appointments (1:1)
       │           │ │ patient_id ──│──► patients
       │           │ │ doctor_id ───│──► users
       │           │ │ diagnosis    │
       │           │ │ chiefComplaints (JSON TEXT)
       │           │ │ medicines    │ (JSON TEXT)
       │           │ │ labOrders    │ (JSON TEXT)
       │           │ └──────────────┘
       │           │
       │           │ ┌──────────────┐
       │           │ │   billing    │
       │           │ ├──────────────┤
       │           │ │ id (PK, UUID)│
       │           │ │ patient_id ──│──► patients
       │           │ │ invoiceNumber│ (unique, idx)
       │           │ │ totalAmount  │
       │           │ │ discount     │
       │           │ │ paidAmount   │
       │           │ │ status (enum)│
       │           │ │ lineItems    │ (JSON TEXT)
       │           │ └──────────────┘
       │           │
       │           │ ┌──────────────┐
       │           │ │ audit_logs   │
       │           │ ├──────────────┤
       │           │ │ id (PK, UUID)│
       └───────────┤ │ entityName   │
                   │ │ operation    │
                   │ │ entityId     │
                   │ │ userId       │
                   │ │ newValues    │
                   │ │ timestamp    │
                   │ └──────────────┘
```

### Key Design Decisions

- **JSON TEXT columns** for `medicines`, `labOrders`, `lineItems` — avoids join tables for variable-length lists. Tradeoff: can't query individual items efficiently.
- **`uhid` as business key** — human-readable IDs (SYL-2026-00001) for hospital staff. UUID for internal PKs.
- **No soft deletes** — records are immutable for audit compliance. Status changes track state.
- **`open-in-view=false`** — prevents lazy initialization exceptions outside transactions. Requires `@Transactional(readOnly=true)` on all read methods.

---

## Deployment

### Option A: Docker Compose (Recommended)

```bash
# Local PostgreSQL (zero config)
docker compose up --build

# With Supabase (add .env credentials)
docker compose --profile supabase up --build
```

### Option B: Standalone JAR

```bash
cd backend
mvn clean package -DskipTests
java -jar target/*.jar \
  --spring.profiles.active=prod \
  --spring.datasource.url="jdbc:postgresql://..." \
  --spring.datasource.username="..." \
  --spring.datasource.password="..."
```

### Option C: Development Mode

```bash
# Terminal 1: Backend
cd backend && mvn spring-boot:run

# Terminal 2: Frontend (with Vite proxy)
cd frontend && npm run dev
# Opens at http://localhost:5173
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes (prod) | `jdbc:postgresql://localhost:5432/openhospital` | PostgreSQL JDBC URL |
| `DB_USERNAME` | Yes (prod) | `postgres` | Database username |
| `DB_PASSWORD` | Yes (prod) | `postgres` | Database password |
| `JWT_SECRET` | Optional | Built-in default | HS256 signing key (CHANGE IN PRODUCTION) |
| `JWT_EXPIRATION_MS` | Optional | `86400000` (24h) | Token expiry in milliseconds |

---

## Development

### Prerequisites

- Java 21+ (JDK for building, JRE for running)
- Node.js 22+
- Maven 3.9+ (or use `./mvnw`)
- Docker (optional, for containerized deployment)

### Project Structure

```
popular/
├── backend/                    # Spring Boot application
│   ├── src/main/java/com/hospital/rms/
│   │   ├── config/            # Security, WebSocket, CORS
│   │   ├── controller/        # REST endpoints
│   │   ├── dto/               # Request/Response DTOs
│   │   ├── entity/            # JPA entities
│   │   ├── enums/             # Status/role enums
│   │   ├── repository/        # Spring Data JPA repos
│   │   ├── security/          # JWT filter, UserDetailsService
│   │   ├── service/           # Business logic
│   │   ├── aspect/            # Audit logging (AOP)
│   │   ├── DataSeeder.java    # Demo data population
│   │   └── OpenHospitalApplication.java
│   └── Dockerfile             # Multi-stage: JDK build → JRE run
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── api/               # API client, data mappers
│   │   ├── components/        # Reusable UI components
│   │   │   ├── layout/        # Sidebar, TopNav, DashboardLayout
│   │   │   └── ui/            # Motion helpers, shared components
│   │   ├── context/           # Auth, Theme contexts
│   │   ├── pages/             # Route pages (10 total)
│   │   └── types/             # TypeScript interfaces
│   └── Dockerfile             # Multi-stage: Node build → nginx run
├── docker-compose.yml         # Full stack orchestration
└── README.md                  # This file
```

### Running Tests

```bash
# Backend (unit + integration)
cd backend && mvn test

# Frontend (lint)
cd frontend && npx oxlint

# Frontend (type check)
cd frontend && npx tsc --noEmit
```

---

## Known Limitations & Future Work

### Current Limitations

1. **Pagination metadata is not returned yet** — collection endpoints now use bounded `page` and `size` queries, but retain array responses for frontend compatibility.
2. **JSON TEXT for structured data** — `medicines`, `labOrders`, `lineItems` stored as JSON strings. Can't query individual items via SQL.
3. **One-instance counter allocation** — UHID and appointment token counters use locked rows and JVM synchronization for the single free-tier backend. Multi-instance deployment needs an atomic shared counter operation.
4. **No WebSocket authentication** — queue updates are broadcast without verifying the subscriber's identity.
5. **No file upload** — prescriptions/lab orders are text-only. No PDF/image upload for reports.
6. **Hardcoded UHID prefix** — `SYL-2026-` is Sylhet-specific. Should be configurable per hospital.
7. **No offline support** — SPA requires network. No service worker or IndexedDB caching.
8. **No i18n** — UI is English-only. Should add Bengali/Hindi for local deployment.

### Production Hardening Needed

| Area | Current | Needed |
|------|---------|--------|
| **Auth** | JWT in localStorage | httpOnly cookies + CSRF tokens |
| **Token Revocation** | None | Redis blacklist or short-lived refresh tokens |
| **Rate Limiting** | None | Spring RateLimiter or nginx limit_req |
| **Input Validation** | Basic @Valid | Jakarta Bean Validation + SQL injection prevention |
| **Logging** | Console only | Structured JSON → ELK/Datadog |
| **Monitoring** | None | Micrometer + Prometheus/Grafana |
| **Database Migrations** | Flyway + ddl-auto=validate | Versioned SQL scripts in `backend/src/main/resources/db/migration` |
| **HTTPS** | Termination at LB | Certbot / Let's Encrypt for self-hosted |
| **Backup** | Supabase auto-backups | Point-in-time recovery + offsite copies |
| **CORS** | Environment-configured allowlist | Set `CORS_ALLOWED_ORIGINS` to the production domain |

### Feature Roadmap

- [ ] Lab report PDF upload and viewing
- [ ] SMS notifications for queue updates (Twilio/Vonage)
- [ ] Multi-hospital support with tenant isolation
- [ ] Inventory management for pharmacy
- [ ] Revenue dashboards with date range filters
- [ ] Print prescriptions and invoices (PDF generation)
- [ ] Offline-first PWA with service worker
- [ ] Internationalization (Bengali, Hindi, English)
- [ ] Role-based sidebar (hide inaccessible nav items by role)

---

## License

MIT
