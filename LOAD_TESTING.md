# Local Load Testing

## Scope

The benchmark runs against the local Docker Compose stack:

- PostgreSQL 16 container
- Spring Boot 4.1 backend container
- Java 25 runtime
- Flyway-managed schema
- No Redis, CDN, or cloud network

The committed runner is `loadtest/load-test.mjs`. It uses Node's built-in `fetch`, so no paid tool or package is required.

## Run It

Start the local stack with local PostgreSQL defaults:

```bash
docker compose --env-file /dev/null up -d --build
```

Check the backend:

```bash
curl http://localhost:8080/health
```

Run the requested 300-concurrent-user baseline:

```bash
DURATION_SECONDS=30 CONCURRENCY=300 BASE_URL=http://localhost:8080 \
  node loadtest/load-test.mjs
```

Optional higher-concurrency check:

```bash
DURATION_SECONDS=30 CONCURRENCY=600 BASE_URL=http://localhost:8080 \
  node loadtest/load-test.mjs
```

## Recorded Results

These results were measured locally on 2026-08-19 against `GET /health`.

| Concurrency | Duration | Requests | Successful | Errors | Throughput | P50 | P95 | P99 | Max |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 300 | 30.099 s | 344,901 | 344,901 | 0 | 11,458.89 RPS | 23.57 ms | 40.24 ms | 68.42 ms | 1,072.61 ms |
| 600 | 30.134 s | 277,298 | 277,298 | 0 | 9,202.16 RPS | 66.15 ms | 104.96 ms | 167.81 ms | 350.03 ms |

## Interpretation

- The local health endpoint did not break at 300 or 600 concurrent workers.
- The 300-user target was met for this infrastructure baseline with zero failed requests.
- The 600-worker result shows increasing latency and lower throughput, but it is not the application breaking point.
- The health endpoint does not exercise authentication, BCrypt, JPA, PostgreSQL queries, pagination, WebSocket connections, or transactional writes.
- These numbers must not be presented as the hospital system's clinical API capacity.

## What Is Still Needed for a Meaningful Capacity Test

A second benchmark should use an isolated test database and a seeded JWT token, then mix realistic workloads:

- Patient search and paginated patient reads
- Appointment queue reads
- Patient registration
- Appointment creation and status changes
- Prescription reads
- Billing reads and payments
- Login bursts separately, because BCrypt is intentionally CPU-expensive
- Queue display clients and WebSocket connections

Acceptance targets for the design exercise are 100 sustained requests/sec, P95 under 500 ms, P99 under 1 second, less than 1% errors, and no duplicate UHIDs or appointment tokens. The current recorded benchmark is a fast baseline, not evidence that those targets have been met.

Stop the stack after testing:

```bash
docker compose --env-file /dev/null down
```
