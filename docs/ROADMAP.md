# flags.dev — Product & Engineering Roadmap

## Product thesis

flags.dev is not being built as a clone of an existing feature-flag platform.

Feature flags are the mechanism. The product goal is to help developers and businesses make **better release decisions**.

Traditional feature-flag workflows answer:

> "Should this context receive this feature?"

flags.dev aims to answer the larger release question:

> "Who will receive this release, why will they receive it, how large is the impact, and what will change if I modify the rollout?"

This leads to three product principles:

- **Deterministic evaluation** — the same context and configuration should produce a predictable result.
- **Explainable decisions** — developers should be able to understand why a context received a variation.
- **Release intelligence** — the platform should use customer-provided context data to help estimate, simulate, and understand the impact of release decisions.

The platform should remain **customer-system agnostic**. flags.dev owns the evaluation and context contract; it must not require direct access to a customer's application database or dictate how the customer stores users.

## Scope discipline

This is no longer a fixed-hour learning project or a 30-day exploration exercise. Development time is intentionally open-ended and will be driven by product value, engineering evidence, and the quality of the resulting system.

We will prioritize:

```
Product value → Core correctness → Evaluation engine → Security → Performance
→ Developer experience → Release intelligence → Polish
```

A feature being technically interesting is not sufficient justification to build it. Every major feature should answer:

1. What real developer or business problem does this solve?
2. Why does it belong in flags.dev rather than a generic analytics/data platform?
3. What architectural boundary does it introduce?
4. How will we prove that it works?
5. Does it strengthen the product thesis?

We will prefer **deep, well-bounded capabilities** over a large checklist of copied platform features.

## Product boundaries

flags.dev should not attempt to become a generic data warehouse, BI platform, CDP, or demographic-data provider.

Customer context data may be used for feature evaluation and, where enabled, release-impact analysis. Audience insights should remain tightly coupled to feature releases and targeting decisions.

The platform should not require customer database credentials or direct database access. Future audience ingestion may support multiple mechanisms, but the core contract remains customer-provided contexts.

## Current product direction

The core product model is evolving toward:

```
Customer Context
      ↓
Targeting / Evaluation
      ↓
Deterministic Rollout
      ↓
Variation Decision
      ↓
Release Impact
      ↓
Developer / Business Insight
```

The long-term product loop is:

```
Define release
      ↓
Understand audience
      ↓
Preview / simulate impact
      ↓
Roll out
      ↓
Observe outcome
      ↓
Make next release decision
```

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
- [x] User registration and authentication
- [x] Login → JWT issuance
- [x] Organization context on management requests
- [x] Tenant isolation enforced at repository layer
- [x] ADMIN/MEMBER authorization
- [x] Environment API keys (hash + prefix, never plaintext)

> **Current model:** authentication creates the user identity. Organization creation and organization membership are separate domain operations; registration must not implicitly create an organization for every user.

### Phase 3 — Feature Management
- [x] Project CRUD
- [x] Environment CRUD
- [x] Feature CRUD
- [x] Toggle feature state
- [x] Validation
- [x] Audit events on every mutation

### Phase 4 — Evaluation Engine
- [x] Bulk evaluation API
- [x] Redis cache-aside, Postgres fallback on miss
- [x] Cache invalidation on mutation
- [x] Cache resilience (fail-open to PostgreSQL on Redis connection/serialization failures)
- [ ] Evaluation Context model
- [ ] Deterministic percentage rollout
- [ ] Evaluation pipeline / strategy boundaries
- [ ] Evaluation reason / explainability contract
- [x] Evaluation tests (including concurrency)
- [ ] Performance benchmarks: throughput, p50/p95/p99 latency, cache hit rate

**Goal:** establish a deterministic, context-native evaluation engine that can become the foundation for both the Java SDK and release-intelligence capabilities.

### Phase 5 — Public Service Hardening
- [ ] Rate limiting (evaluation, login, registration)
- [ ] Resource limits (flags/environments per project)
- [ ] Abuse protection
- [ ] Error handling and consistent API error shape
- [ ] Observability (structured logs, basic metrics)
- [ ] Health checks
- [ ] Production configuration

### Phase 6 — Context & Release Intelligence Foundation

Build the minimum data infrastructure required to understand release impact without coupling flags.dev to customer databases.

- [ ] Define context ingestion contract
- [ ] Define which context attributes may be retained/indexed for audience analysis
- [ ] Context retention and tenant-isolation policy
- [ ] Context ingestion independent of flag evaluation
- [ ] Context storage/indexing strategy
- [ ] Audience query primitives
- [ ] Known/available context population semantics
- [ ] Audience estimation from customer-provided context data
- [ ] Deterministic rollout projection against a context population
- [ ] Privacy, deletion, and retention controls

**Important boundary:** audience analysis must operate on customer-provided context data available to flags.dev. It must not require direct access to a customer's database.

### Phase 7 — Release Intelligence

Turn the context and evaluation foundations into capabilities that are specifically useful for feature releases rather than generic analytics.

- [ ] Release Impact Preview
- [ ] Targeting audience size estimation
- [ ] Rollout impact projection
- [ ] What-if rollout simulation (for example 10% → 25%)
- [ ] Targeting-rule impact comparison
- [ ] Audience composition relevant to a release
- [ ] Explainable evaluation details
- [ ] Recommended rollout based on desired exposure size
- [ ] Release safety signals / warnings where sufficient data exists

**Product goal:** help a developer answer "what will this release do?" before changing production exposure.

### Phase 8 — Developer Experience
- [ ] OpenAPI documentation
- [ ] Java SDK (remote evaluation)
- [ ] Evaluation Context API in the SDK
- [ ] Integration example (sample application using the SDK)
- [ ] Evaluation contract / conformance test vectors
- [ ] OpenFeature provider evaluation
- [ ] Public deployment with demo environment

### Phase 9 — Optional Extensions
Only after the core product thesis is validated and the preceding phases are stable.

- [ ] String / JSON flag values
- [ ] Advanced targeting rules / segments
- [ ] Multivariate flags
- [ ] SSE real-time updates
- [ ] Local SDK evaluation
- [ ] Advanced release analytics
- [ ] Progressive / guarded rollouts
- [ ] Experimentation capabilities
- [ ] Additional SDKs

These are not automatically part of the product. Each extension must be evaluated against the flags.dev thesis and demonstrated user value.

## Success criteria

flags.dev is successful when an external developer can:

```
Create account / authenticate
   → Create organization / project / environment
   → Create feature flag
   → Configure evaluation
   → Obtain environment API key
   → Provide an Evaluation Context
   → Evaluate the flag
   → Receive a deterministic result
   → Understand why the result occurred
   → Preview the release audience / impact
   → Simulate rollout changes
   → Integrate the Java SDK
```

while the system maintains:

- tenant isolation
- correct authorization
- persistent configuration
- deterministic evaluation
- resilient and fast evaluation
- secure context handling
- predictable rollout behavior
- rate limiting and abuse protection
- audit history
- evidence-backed performance characteristics

## North-star question

For every significant feature we build, ask:

> **Does this help a developer or business make a better feature-release decision?**

If the answer is no, it should not enter the core roadmap merely because another feature-flag platform has it.
