# flags.dev — Product Thesis

## 1. Why flags.dev exists

Feature flags are usually introduced as a release-control mechanism: deploy code safely, keep a capability disabled, target an audience, and gradually increase exposure.

That solves an important engineering problem, but the flag itself is only the mechanism. The harder product question is what the release actually means:

> **Who will receive it, why will they receive it, how large is the impact, and what changes if we alter the release?**

flags.dev is being built to help developers and businesses answer those questions without requiring them to assemble a separate analytics workflow for every release decision.

The product thesis is therefore:

> **flags.dev helps teams make better feature-release decisions by combining deterministic flag evaluation with context-aware release intelligence.**

---

## 2. The problem

A conventional feature-flag workflow looks like:

```text
Create flag
    ↓
Define targeting
    ↓
Set rollout percentage
    ↓
Evaluate
    ↓
User receives variation
```

This answers **whether** a context receives a feature.

It does not automatically answer questions such as:

- How large is the audience matching this targeting rule?
- What does a 15% rollout mean for this particular audience?
- What happens if the rollout changes from 15% to 25%?
- How much does adding another targeting condition shrink the audience?
- Why did a particular context receive this variation?
- Is this release exposing a surprisingly large or important population?
- If I want approximately 50,000 contexts exposed, what rollout percentage should I consider?

Teams with mature analytics infrastructure can answer some of these questions elsewhere. Smaller teams often cannot justify building an analytics/data stack solely to understand the impact of feature releases.

flags.dev should make the release-specific questions easy out of the box.

---

## 3. What flags.dev is — and is not

### flags.dev is

- A multi-tenant feature-flag platform.
- A deterministic evaluation engine.
- A context-native targeting system.
- A release-impact intelligence layer built around customer-provided context data.
- A developer-first system with a strong emphasis on explainability and predictable behavior.
- A platform that can expose the evaluation contract through REST, a Java SDK, and potentially OpenFeature.

### flags.dev is not

- A clone of LaunchDarkly, Unleash, Flagsmith, or another existing platform.
- A generic BI platform.
- A data warehouse.
- A customer-data platform (CDP).
- A demographic-data provider.
- A replacement for a company's existing analytics stack.

The goal is not to reproduce every capability offered by mature feature-management vendors. The goal is to build a deliberately focused system around a different product emphasis: **understanding release impact.**

---

## 4. Product positioning

The initial category is feature flags, but the product promise is broader.

### Traditional framing

> Turn features on safely.

### flags.dev framing

> **Understand what turning a feature on will do.**

Feature flags remain the control mechanism. flags.dev adds context and release intelligence around that mechanism.

A concise positioning statement:

> **flags.dev — feature flags for smarter releases.**

A stronger product promise:

> **Know who you're releasing to, why they qualify, how large the impact is, and what changes before you change production exposure.**

This positioning should guide both product design and future marketing.

---

## 5. Core product pillars

### 5.1 Deterministic evaluation

The same evaluation context and flag configuration should produce a predictable result.

Percentage rollout must be deterministic rather than randomly reshuffling users between requests.

This establishes the correctness foundation for everything above the evaluator.

```text
Context + flag configuration
            ↓
      deterministic decision
            ↓
         variation
```

### 5.2 Explainable decisions

A developer should be able to understand why a context received a particular variation.

Conceptually:

```text
Context
   ↓
Matched targeting
   ↓
Matched rollout / rule
   ↓
Variation
```

The system should eventually be able to expose an evaluation reason without forcing developers to inspect implementation details or logs.

### 5.3 Release intelligence

Customer-provided context data can become useful beyond individual evaluation.

The same context population can support release-specific questions such as:

```text
Targeting rule
      ↓
Eligible context population
      ↓
Rollout percentage
      ↓
Projected exposure
      ↓
Release impact
```

This is not intended to become generic analytics. The analysis should stay tightly connected to feature releases, targeting, and rollout decisions.

---

## 6. Context is a first-class domain concept

A context represents the entity being evaluated.

A minimal context model is expected to contain:

```text
kind
key
name (optional)
attributes
```

For example:

```json
{
  "kind": "user",
  "key": "user-123",
  "attributes": {
    "country": "IN",
    "age": 26,
    "plan": "PRO",
    "platform": "ANDROID"
  }
}
```

The model should remain extensible enough to support organizations, devices, and other entity types later without redesigning evaluation around a hard-coded `userId`.

Contexts serve two related but distinct purposes:

1. **Evaluation input** — determine what variation a particular context receives.
2. **Release intelligence input** — where the customer enables it, analyze a customer-provided context population to estimate and understand release impact.

---

## 7. Customer-system agnostic by design

flags.dev must not require direct access to a customer's application database.

We should not design around:

```text
flags.dev → customer PostgreSQL
flags.dev → customer MongoDB
flags.dev → customer DynamoDB
```

That would couple the platform to customer infrastructure, create security and operational barriers, and move flags.dev toward becoming a data-integration product.

Instead, the boundary is a context contract:

```text
Customer system
      ↓
Context contract
      ↓
flags.dev
```

The customer decides how its data reaches flags.dev. Future ingestion mechanisms may include APIs, SDKs, batch imports, or other integrations, but the core platform should not need to understand the customer's source database.

This is important for mass adoption: **audience intelligence should enhance the product, not become a prerequisite for basic flag evaluation.**

---

## 8. Audience data: what flags.dev can know

We must distinguish several kinds of data.

### Customer-provided context data

This is the primary data source for audience intelligence.

The customer provides context attributes that are useful for evaluation and, where enabled, release analysis.

### flags.dev evaluation metadata

flags.dev can generate operational metadata such as:

- flag
- environment
- context identity
- evaluation result
- evaluation reason
- rollout bucket
- source / SDK
- evaluation timestamp

This supports explainability, debugging, and operational analysis.

### External demographic data

External population or demographic datasets are not part of the core product model. flags.dev should not pretend to know a customer's total market population unless that information is explicitly provided by the customer or a future integration.

This keeps audience estimates technically honest.

---

## 9. Known audience vs total customer population

Audience analysis must clearly communicate what the numbers represent.

If flags.dev has access to 2 million customer-provided contexts and 400,000 match a targeting rule, the product should say:

> **400,000 known/available contexts match this targeting rule.**

It should not claim:

> "Your company has exactly 400,000 eligible users."

unless the customer has provided a complete authoritative population and we can establish that guarantee.

This distinction matters for product trust.

---

## 10. Release Intelligence: the differentiated layer

The context query itself is not the product.

A generic query such as:

```sql
SELECT COUNT(*)
FROM users
WHERE country = 'IN'
AND age BETWEEN 21 AND 30;
```

is something a customer can already do in its own data stack.

flags.dev creates value by combining audience information with **the actual release configuration**.

### Release Impact Preview

Given:

```text
country = IN
age = 21–30
plan = PRO
rollout = 15%
```

flags.dev should eventually be able to show:

```text
Matching context population     1,200,000
Rollout                               15%
Projected exposure                 ~180,000
```

### What-if rollout simulation

```text
Current rollout       15%       ~180K
Proposed rollout      25%       ~300K
Additional exposure             ~120K
```

### Targeting-rule impact

```text
Current targeting      1.2M
Add plan = PRO          420K
Audience change         -65%
```

### Explainable evaluation

```text
Flag: new-checkout
Context: user-123

Matched: country = IN
Matched: age = 26
Matched rule: India + 21–30
Rollout bucket: within threshold
Result: ON
```

### Exposure-oriented recommendations

If a customer wants approximately 50,000 contexts exposed and the eligible population is 420,000, flags.dev could eventually calculate a candidate rollout near:

```text
50,000 / 420,000 ≈ 11.9%
```

This is a release decision aid, not generic analytics.

---

## 11. The product loop

The long-term experience is:

```text
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
      ↓
Repeat
```

This is the product loop we want to strengthen over time.

Feature flags are the mechanism that controls exposure inside this loop.

---

## 12. Why this can matter to smaller teams

Large companies may already have dedicated data engineering, analytics, experimentation, and release-management infrastructure.

Smaller companies often have limited engineering capacity and still need to answer the same release questions.

flags.dev should provide useful release intelligence without asking a small team to build an entire data platform first.

The opportunity is not to compete with a company's warehouse or BI tooling. It is to make feature-release-specific analysis **immediately useful and operationally close to the release decision.**

---

## 13. Technical thesis

The product thesis creates an engineering thesis.

The same domain model should support:

```text
                    flags.dev
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
   Context Model   Evaluation Core   Audience Engine
        │               │                │
        ▼               ▼                ▼
  Customer data    Deterministic      Release
                   decisions          analysis
        │               │                │
        └───────────────┼────────────────┘
                        ▼
                Release Intelligence
```

The evaluation core should remain independent from storage and infrastructure concerns where practical. Redis is an acceleration mechanism; PostgreSQL is currently the configuration source of truth. Future context storage should not leak customer-system assumptions into evaluation semantics.

This separation lets us evolve:

- REST evaluation
- Java SDK
- OpenFeature provider
- context ingestion
- audience indexing
- release simulation

without turning them into one tightly coupled subsystem.

---

## 14. Differentiation strategy

flags.dev should not claim that existing feature-flag platforms lack contexts, rollouts, evaluation reasons, analytics, or release tooling. Mature products already provide many of these capabilities.

Our differentiation is **what we optimize for and how the pieces fit together**.

We want the system to be:

- evaluation-first
- context-native
- deterministic
- explainable
- release-impact aware
- customer-system agnostic
- developer-first
- portable across SDKs and evaluation interfaces

The goal is not feature-count competition.

> **Build fewer capabilities deeply, and make each capability reinforce the release-decision loop.**

---

## 15. Developer-facing direction

The developer experience should eventually look like:

```java
EvaluationContext context = EvaluationContext.builder()
        .kind("user")
        .key("user-123")
        .attribute("country", "IN")
        .attribute("plan", "PRO")
        .build();

FlagEvaluation result =
        flags.evaluate("new-checkout", context);
```

The Java SDK is the reference implementation. A future OpenFeature provider can expose the same evaluation semantics through a vendor-neutral interface.

A formal evaluation contract and cross-language conformance vectors are desirable so that the same context and configuration produce the same result across supported clients.

---

## 16. What we deliberately will not optimize for

We should resist adding capabilities solely because a competitor has them.

In particular, we should not allow the project to drift into:

- generic BI
- generic user analytics
- a full CDP
- demographic intelligence unrelated to releases
- enterprise administration for its own sake
- feature-count parity with mature vendors
- speculative AI features without a concrete release problem

Every significant addition should be evaluated against the north-star question:

> **Does this help a developer or business make a better feature-release decision?**

If not, it needs a compelling separate justification or it waits.

---

## 17. What success looks like

A successful flags.dev experience should let a developer move from:

```text
"I want to release this feature."
```

to:

```text
"I understand who will receive it."

"I understand why they qualify."

"I know approximately how large the exposure is."

"I can simulate changing the rollout."

"I can explain an individual evaluation."

"I can integrate the same semantics into my application."
```

That is the product we are trying to build.

Not simply a service that stores feature flags, but a platform that makes feature releases **more understandable, predictable, and deliberate**.