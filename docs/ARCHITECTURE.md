# Architecture

## High-level diagram

```
                    ┌──────────────────┐
                    │     Dashboard     │
                    │   (React / UI)    │
                    └─────────┬─────────┘
                              │  JWT
                              ▼
                    ┌──────────────────┐
                    │  Management API   │  Auth · Orgs · Projects
                    │   (Spring Boot)   │  Environments · Features
                    └─────────┬─────────┘
                              │
                              ▼
                       ┌────────────┐
                       │ PostgreSQL │  ← source of truth
                       └─────┬──────┘
                             │
                             ▼
                       ┌────────────┐
                       │   Redis    │  ← evaluation cache + rate limiting
                       └─────▲──────┘
                             │
Applications ──API Key──▶ Evaluation API ──▶ Feature Result
```

PostgreSQL is canonical. Redis is a derived acceleration layer and must never become the only authoritative copy of feature configuration. On a cache miss, the evaluation path falls through to Postgres, repopulates Redis, and returns the result — it does not simply fail.

## Domain model

```
User
  │
  └── OrganizationMembership (role: ADMIN | MEMBER)
        │
        └── Organization
              │
              └── Project
                    │
                    ├── Feature
                    │     └── FeatureState (per Environment)
                    │
                    └── Environment
                          └── FeatureState

AuditLog — references org / environment / feature / user, survives deletion of any of them
```

### Why `Feature` and `FeatureState` are separate

A `Feature` is defined once per project — its key, name, type. Its **state** (enabled, rollout %) differs per environment: `checkout-flow` can be ON in staging and OFF in production. Collapsing these into one table would either duplicate flag metadata per environment or remove per-environment toggling entirely. This split is the single most load-bearing schema decision in the project.

### Tenant isolation

A user authenticated against Organization A must never read or mutate Organization B's data, even with a guessed or leaked UUID. This is enforced at the repository/service boundary, not just implied by the schema:

```java
// Trusts a bare client-supplied ID — wrong:
featureRepository.findById(featureId)

// Tenant boundary is explicit in the query — correct:
featureRepository.findByIdAndProjectOrganizationId(featureId, organizationId)
```

`organization_id` is denormalized directly onto `Project`, `Environment`, and `FeatureState` — not only derivable through joins — specifically because the evaluation endpoint is the hottest path in the system and shouldn't pay a multi-table join to confirm tenant scope on every call.

## Schema

```sql
users
├── id (UUID)
├── email
├── password_hash
└── created_at

organizations
├── id (UUID)
├── name
└── created_at

organization_memberships
├── organization_id (FK)
├── user_id (FK)
├── role            -- ADMIN | MEMBER
└── created_at

projects
├── id (UUID)
├── organization_id (FK)
├── name
└── created_at

environments
├── id (UUID)
├── project_id (FK)
├── organization_id (FK)   -- denormalized for hot-path checks
├── name                   -- e.g. "production", "staging", "dev"
├── api_key_prefix          -- e.g. "ff_prod_7a91" — safe to log/display
├── api_key_hash            -- never store the raw key
└── created_at

features
├── id (UUID)
├── project_id (FK)
├── key                     -- machine-readable, e.g. "checkout-flow"
├── name
├── description
├── type                    -- BOOLEAN (v1); STRING/JSON later
├── deleted_at              -- soft delete
└── created_at

feature_states
├── id (UUID)
├── feature_id (FK)
├── environment_id (FK)
├── organization_id (FK)    -- denormalized for hot-path checks
├── enabled
├── value                   -- nullable, for non-boolean types later
├── rollout_percentage       -- nullable, 0–100
├── updated_at
└── updated_by (FK → users)

audit_logs
├── id (UUID)
├── organization_id (FK)
├── environment_id (FK)
├── feature_id (FK)
├── user_id (FK)
├── action
├── old_value (JSONB)
├── new_value (JSONB)
└── created_at
```

### Constraints that matter

| Constraint | Why |
|---|---|
| `UNIQUE(project_id, key)` on `features` | Flag keys are the evaluation contract (`isEnabled("checkout-flow")`). The DB must guarantee this string is unambiguous within a project rather than relying on user discipline — closes a race-condition window on concurrent creates. |
| `UNIQUE(project_id, name)` on `environments` | No two environments in a project silently collide. |
| `UNIQUE(feature_id, environment_id)` on `feature_states` | Exactly one state for a feature in an environment — no ambiguity at evaluation time. |
| API keys as `hash + prefix`, never plaintext | Public deployment — a DB leak must not hand out working credentials. Same treatment as password hashing. |
| Soft delete (`deleted_at`) on `features` / `projects` | A hard delete would break `audit_logs` referential continuity and force the evaluation endpoint to handle "flag vanished mid-flight" as an error case. |

### Deliberately not doing

- No `ON DELETE CASCADE` sprayed across every relationship — audit history must survive deletion of the thing it references.
- No manufactured junction tables beyond what relationships actually require.
- No Redis-shaped thinking in the Postgres schema — Postgres is canonical, Redis is derived, and the two are not designed to mirror each other.

## API surface

### Management API (JWT, tenant-scoped)

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login

GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/{projectId}
DELETE /api/v1/projects/{projectId}

GET    /api/v1/projects/{projectId}/environments
POST   /api/v1/projects/{projectId}/environments
DELETE /api/v1/projects/{projectId}/environments/{environmentId}

GET    /api/v1/projects/{projectId}/features
POST   /api/v1/projects/{projectId}/features
GET    /api/v1/projects/{projectId}/features/{featureId}
DELETE /api/v1/projects/{projectId}/features/{featureId}

PATCH  /api/v1/environments/{envId}/features/{featureKey}   -- toggle / update rollout
GET    /api/v1/environments/{envId}/audit-log
```

### Evaluation API (environment API key, public-facing, cached)

```
GET /api/v1/evaluate/{environmentKey}?userId=xyz
Headers: X-Environment-Key: <server-side key>

Response:
{
  "flags": {
    "checkout-flow": { "enabled": true },
    "dark-mode":     { "enabled": false },
    "new-pricing":   { "enabled": true }
  }
}
```

Bulk, not per-flag — a page checking 5–10 flags costs one round trip. `userId` is optional at the endpoint level but becomes load-bearing once percentage rollout ships: the cached value is the *raw* flag config (enabled + rollout %), and per-user bucketing resolves on top of it at read time — not baked into the cache, which would need an entry per user and wouldn't scale.

This is an initial contract, not a final one — it will be reviewed before implementation locks it in.

## Caching strategy

```
Key:   flags:{environmentKey}
Value: { "checkout-flow": { enabled: true, rollout: 25 }, ... }
```

- Cache-aside on read; on miss, read Postgres, populate Redis, return.
- On any flag mutation, invalidate the single environment-scoped cache key — not per-flag keys. Reduces invalidation to "one key per environment changed."
- Exact key structure may change once benchmarked against real access patterns.

## Deterministic percentage rollout

Bucket assignment via a stable hash of `userId + featureKey`, mapped to `0–99`, compared against the flag's `rollout_percentage`. Same user always gets the same bucket for the same flag — no flip-flopping between requests. Hashing algorithm and exact evaluation contract to be documented in `docs/DECISIONS.md` before implementation.

## Java SDK

The REST API is language-agnostic by design — curl, Python, Node, anything can call it directly. The Java SDK is a thin, documented reference wrapper, not a requirement:

```java
FeatureFlagClient client = new FeatureFlagClient("ff_prod_abc123...");
client.refresh(userId);              // one bulk call, populates an in-memory map
client.isEnabled("checkout-flow");   // reads from local map, zero network cost
```

No full local rule-evaluation engine in v1 — local evaluation introduces cache synchronization, staleness handling, background refresh, and failure semantics that don't fit the current budget. "Fetch once per session, read many times" is the scoped-down version of the pattern LaunchDarkly's SDKs use.

## Public-deployment requirements

- Real signup/login (JWT, Spring Security), real organizations auto-created on signup — no shared/seeded org.
- Strict tenant isolation, enforced at the service layer, tested explicitly.
- Environment-scoped API keys, hashed at rest.
- Rate limiting on evaluation, signup, and login (Redis token bucket, keyed by API key / IP).
- Resource caps (max flags per project, max environments per project) to prevent abuse.
- Visible banner on the deployed instance: *"Public demo — data may be periodically cleared, not for production use."*

## Reliability questions this system needs to answer

- What happens when Redis is unavailable? → Evaluation falls through to Postgres directly; degraded latency, not degraded correctness.
- What happens when Postgres is unavailable? → Evaluation can still serve from Redis if warm; management API fails closed.
- What happens on concurrent feature updates? → Last-write-wins at the DB row level; audit log captures both attempts via `updated_at` ordering.
- What happens if an API key is compromised? → Key rotation regenerates `api_key_hash`/`api_key_prefix`; old key stops resolving immediately (no grace period in v1).

## Project structure (planned)

```
src/
└── main/
    ├── java/com/featureflag/platform/
    │   ├── auth/
    │   ├── organization/
    │   ├── project/
    │   ├── environment/
    │   ├── feature/
    │   ├── evaluation/
    │   ├── audit/
    │   ├── ratelimit/
    │   ├── common/
    │   └── config/
    └── resources/
        ├── db/migration/
        ├── application.yml
        └── application-local.yml
```