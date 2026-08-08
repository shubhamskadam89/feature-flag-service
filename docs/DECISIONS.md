# Engineering Decisions

A living log. Before implementing a significant subsystem, answer these questions here — not as a one-time exercise, but as an ongoing record of *why* the system looks the way it does. Each entry should be added when the decision is made, not reconstructed afterward.

## Template

```
## [Subsystem/decision name] — YYYY-MM-DD

**Domain**
- Why does this exist?
- What invariant does it enforce?
- Who owns this data?
- What happens when it's deleted?

**API** (if applicable)
- Who calls this endpoint?
- What authentication does it use?
- Management operation or evaluation operation?

**Performance**
- Is this on the hot path?
- How frequently is it called?
- Can it hit PostgreSQL directly, or must it be cached?
- What consistency guarantee does it need?

**Security**
- Can one tenant access another tenant's data through this?
- Can a credential involved here be leaked, and what's the blast radius?

**Reliability**
- What happens if its dependencies are unavailable?
- What happens under concurrent access?

**Alternatives considered**
- What else did I consider, and why did I reject it?

**Decision**
- What was actually decided.
```

---

## Feature / FeatureState split — 2026-08-08

**Domain**
- `Feature` exists to define a flag once per project (key, name, type). `FeatureState` exists because the same flag has different values per environment.
- Invariant: exactly one `FeatureState` per `(feature_id, environment_id)` pair.
- Owned by the project (`Feature`) and the environment (`FeatureState`) respectively.
- Deletion: soft-delete on `Feature` (`deleted_at`) so `FeatureState` and `AuditLog` rows referencing it remain valid history.

**Alternatives considered**
- Single table with an `environment_id` column and duplicated flag metadata per row — rejected because it either duplicates `name`/`description`/`type` per environment or forces awkward nullable environment scoping on a "global" flag record.

**Decision**
- Two tables, `UNIQUE(feature_id, environment_id)` on `feature_states`, `UNIQUE(project_id, key)` on `features`.

---

## Tenant ID denormalization — 2026-08-08

**Performance**
- `FeatureState` lookups happen on the evaluation hot path, which is the most frequently called part of the system by orders of magnitude over management operations.

**Security**
- Tenant check must be airtight even under high call volume; a join chain doesn't change the security guarantee, just the cost of checking it.

**Alternatives considered**
- Fully normalized schema, deriving `organization_id` via `FeatureState → Feature → Project → Organization` joins on every read — rejected because it adds avoidable join cost to the single hottest query path, for a query that runs on every evaluation call.

**Decision**
- Denormalize `organization_id` onto `Project`, `Environment`, and `FeatureState` directly, populated at write time. Evaluated for correctness via a service-layer guarantee that it always matches the parent chain; a DB check constraint or trigger is a candidate hardening step if it proves necessary.

---

## Database choice: PostgreSQL over MySQL — 2026-08-08

**Decision drivers**
- JSONB support for audit log diffs and future non-boolean flag values.
- Stronger constraint and partial/composite index tooling.
- Row-level security available as a future defense-in-depth layer on top of app-level tenant checks.
- No engineering value in introducing a second relational database for variety — the learning budget goes to the evaluation architecture instead.

**Decision**
- PostgreSQL, managed via Flyway migrations, no `ddl-auto`.

---

## Bulk evaluation endpoint over per-flag — 2026-08-08

**Performance**
- A typical page load checks 5–10 flags. Per-flag evaluation would mean 5–10 round trips per page load from every client.

**Decision**
- `GET /api/v1/evaluate/{environmentKey}` returns all flags for that environment in one response. Cache key is per-environment (`flags:{environmentKey}`), not per-flag, which also simplifies invalidation to one key per environment change.

---

_Add new entries above this line as decisions are made._