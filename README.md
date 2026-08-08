# Feature Flag Service

A self-hosted, multi-tenant feature flag platform — Java, Spring Boot, PostgreSQL, Redis. Sign up, create an organization, define flags, grab an environment API key, and evaluate flags from your own application in real time.

Not an attempt to clone LaunchDarkly, Flagsmith, or Unleash. A scoped-down system that follows their core patterns — tenant isolation, environment-scoped configuration, cached low-latency evaluation, deterministic rollouts — while deliberately cutting everything that doesn't fit a solo, ~100-hour build.

> **Status:** Phase 1 — Core Platform / Initial Design. Not yet deployed.

**Live demo:** _coming soon_
**Docs:** [Architecture](docs/ARCHITECTURE.md) · [Decisions](docs/DECISIONS.md) · [Roadmap](docs/ROADMAP.md)

---

## Why

Feature flags decouple deployment from release — ship code with a feature OFF, turn it on when ready, roll it out gradually, kill it instantly if it misbehaves. The interesting engineering problem isn't storing a boolean in Postgres — it's evaluating that boolean **quickly, safely, and consistently**, for many independent tenants, under load.

## Architecture at a glance

```
Dashboard ──JWT──▶ Management API ──▶ PostgreSQL   (source of truth)
                                            │
Application ──API Key──▶ Evaluation API ──▶ Redis   (cache + rate limiting)
```

Two separate paths, two different latency budgets:
- **Management path** — infrequent, authenticated by JWT, writes go straight to Postgres.
- **Evaluation path** — the hot path, hit on every request from every SDK, authenticated by environment API key, served from Redis with Postgres as fallback on cache miss.

Full breakdown of the domain model, schema, and API surface: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Tech stack

| Layer | Choice |
|---|---|
| Language / Framework | Java 21, Spring Boot |
| Database | PostgreSQL |
| Migrations | Flyway (no `ddl-auto`) |
| Cache / rate limiting | Redis |
| Auth | Spring Security, JWT |
| SDK | Java (reference implementation, remote evaluation only in v1) |
| Frontend | React |

## Quick start (local)

Requires Java 21, Maven, Docker, Docker Compose.

```bash
docker compose up -d       # starts PostgreSQL + Redis
./mvnw spring-boot:run     # starts the app, Flyway migrations run automatically
```

_(Exact commands will be finalized once the project skeleton exists — this section will be kept current.)_

## What's explicitly not in v1

OAuth/social login, SSO, billing, advanced RBAC, org invitations, segments/targeting DSL, multivariate flags, SSE, webhooks, local SDK evaluation. Rationale and full scope discipline: [`docs/ROADMAP.md`](docs/ROADMAP.md).

## License

TBD.