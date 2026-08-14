# Roadmap

## Scope discipline

Approximate development budget: **~105 engineering hours, ~30 days, ~3.5 hrs/day.**

Priority order when time runs short:

```
Core correctness → Evaluation engine → Security → Performance → Developer experience → Polish
```

A feature being technically interesting is not sufficient justification to build it. If something doesn't move the needle on the above, in that order, it waits for a "Phase 7" pass or gets cut entirely.

## Non-goals for v1

OAuth/social login, SSO, billing, advanced RBAC, organization invitations, complex segmentation, arbitrary targeting DSL, multivariate flags, Server-Sent Events, webhooks, local/offline SDK evaluation, enterprise administration, feature flag analytics, experimentation platform, complex user profiles.

These may become extensions later, but only once the core system is stable and actually used.

## Phases

### Phase 0 — Foundation
- [x] Repository initialization
- [x] README + architecture documentation
- [x] Spring Boot project skeleton
- [x] Docker Compose (PostgreSQL + Redis)
- [x] CI pipeline

### Phase 1 — Core Domain
- [x] `User`, `Organization`, `OrganizationMembership`
- [x] `Project`, `Environment`
- [x] `Feature`, `FeatureState`
- [x] `AuditLog`
- [x] Database constraints (see `ARCHITECTURE.md`)
- [x] Flyway migrations


### Phase 2 — Authentication & Authorization
- [x] Registration → auto-create organization → ADMIN membership
- [x] Login → JWT issuance
- [x] Organization context on every management request
- [x] Tenant isolation enforced at repository layer
- [x] ADMIN/MEMBER authorization
- [x] Environment API keys (hash + prefix, never plaintext)

### Phase 3 — Feature Management
- [x] Project CRUD
- [x] Environment CRUD
- [x] Feature CRUD
- [x] Toggle feature state
- [x] Validation
- [x] Audit events on every mutation

### Phase 4 — Evaluation Engine
- [ ] Bulk evaluation API
- [ ] Redis cache-aside, Postgres fallback on miss
- [ ] Cache invalidation on mutation
- [ ] Deterministic percentage rollout
- [ ] Evaluation tests (including concurrency)
- [ ] Performance benchmarks: throughput, p50/p95/p99 latency, cache hit rate

### Phase 5 — Public Service Hardening
- [ ] Rate limiting (evaluation, login, registration)
- [ ] Resource limits (flags/environments per project)
- [ ] Abuse protection
- [ ] Error handling and consistent API error shape
- [ ] Observability (structured logs, basic metrics)
- [ ] Health checks
- [ ] Production configuration

### Phase 6 — Developer Experience
- [ ] OpenAPI documentation
- [ ] Java SDK (remote evaluation)
- [ ] Integration example (sample app using the SDK)
- [ ] Public deployment with demo banner

### Phase 7 — Optional Extensions (only after core is complete)
- [ ] String / JSON flag values
- [ ] Targeting rules / segments
- [ ] Multivariate flags
- [ ] SSE real-time updates
- [ ] Local SDK evaluation
- [ ] Advanced analytics

## Success criteria

The project is successful when an external developer can, end to end:

```
Register → Auto-create organization → Create project → Create environment
   → Create feature flag → Toggle it → Obtain environment API key
   → Call the evaluation API → Get the correct result → Integrate the Java SDK
```

while the system maintains tenant isolation, correct authorization, persistent configuration, fast evaluation, deterministic rollouts, rate limiting, and audit history throughout.