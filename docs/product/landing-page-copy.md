# flags.dev — Landing Page Copy & Messaging

## 1. Purpose

This document defines the approved messaging direction and copy for the flags.dev landing page.

It translates the product positioning and conversion-first wireframe into concise customer-facing language. It does not define visual styling or implementation.

---

## 2. Messaging Objective

The landing page must communicate one idea quickly:

> **A rollout is a decision about exposure. flags.dev helps you understand that exposure before you change it.**

Feature flags remain the product category. Release exposure is the differentiated value.

---

## 3. Primary Positioning

### Category

**Feature flag platform**

### Differentiated promise

**Understand the impact of your rollout before you change it.**

### Supporting promise

**See who your release affects, how much exposure it creates, what changes when you adjust targeting or rollout, and why a context received a variation.**

### Short brand line

> **Don't just control your rollout. Understand its impact.**

The short brand line may be used as supporting brand language, but the primary hero should communicate the concrete product outcome.

---

## 4. Hero Copy

### Eyebrow

**Feature flags for informed releases**

### Headline

# Know what your release will affect.

### Supporting text

> Define your audience, see the exposure your rollout creates, and understand how targeting or rollout changes affect it — before you make the change.

### Primary CTA

**Try flags.dev**

### Secondary CTA

**View on GitHub**

The hero must establish the release problem rather than leading with implementation details, performance claims, or a generic feature-flag statement.

---

## 5. Problem Section

### Heading

# A rollout percentage is a control. It is not an answer.

### Body

> Setting a feature to 15% tells your system how to distribute exposure. It does not tell you what that exposure means for your audience.

### Supporting questions

**Who gets it?**  
See the contexts that match your targeting.

**How much?**  
Understand the exposure created by your rollout.

**What if?**  
Compare the impact of changing targeting or rollout before applying it.

**Why?**  
Trace an evaluation to understand why a context received a variation.

---

## 6. Interactive Release Preview

This section is the primary product demonstration and should contain the strongest visual interaction on the page.

### Section heading

# See the impact before you change the release.

### Supporting text

> Configure a target audience and rollout. See the resulting exposure. Change the rollout and immediately compare the projected impact.

### Demonstration copy

```text
new-checkout

Country       India
Plan          PRO
Platform      Android

Eligible contexts      420,000
Rollout                     15%
Projected exposure       ~63,000
```

When the visitor changes the rollout:

```text
15%  →  25%

Projected exposure
~63,000  →  ~105,000

Additional exposure
~42,000
```

### Supporting label

**Projected exposure**

Use "projected" or "estimated" whenever the underlying context population does not represent a complete authoritative population.

---

## 7. Release Workflow Section

### Heading

# From configuration to release decision.

### Supporting text

> flags.dev connects targeting, exposure, deterministic evaluation, and evaluation reasoning into one release workflow.

### Workflow labels

**Define**  
Choose the contexts your release should reach.

**Understand**  
See the audience and projected exposure.

**Simulate**  
Compare the impact of proposed targeting or rollout changes.

**Release**  
Evaluate contexts deterministically in your application.

**Explain**  
Understand why an individual context received a variation.

---

## 8. Developer Experience Section

### Heading

# Built for developers. Designed around the release.

### Supporting text

> Integrate feature evaluation into your application without coupling flags.dev to your application's database or business logic.

### Java SDK

**Evaluate where your application needs it.**

```java
flags.evaluate("new-checkout", context);
```

Supporting text:

> Keep evaluation close to your application while flags.dev manages the release configuration and evaluation contract.

### OpenFeature

If the OpenFeature provider is implemented and verified:

**Use a standard evaluation interface.**

If it is not implemented, do not present OpenFeature as an available integration. It should remain part of future-facing documentation rather than current capability claims.

---

## 9. Engineering Proof Section

### Heading

# The release experience is backed by production-oriented infrastructure.

### Supporting text

> Fast evaluation is only useful when the underlying system is deterministic, isolated, and predictable under load.

### Proof categories

**Deterministic evaluation**  
The same context and configuration produce a predictable variation.

**Context-aware targeting**  
Target releases using structured evaluation context rather than a user-only model.

**Low-latency evaluation**  
Evaluation is designed for application runtime paths.

**Cache-backed infrastructure**  
Frequently accessed evaluation data can be served efficiently without coupling runtime evaluation to configuration storage.

Only publish quantitative performance or scale claims when they have been benchmarked and can be reproduced.

---

## 10. Differentiation Section

### Heading

# Feature flags that show you the consequences of using them.

### Body

> flags.dev is not built to replace your analytics platform, customer database, or data warehouse. It focuses on the release-specific questions those systems do not answer on their own.

### Questions to emphasize

- Who will this release affect?
- How much exposure will it create?
- What changes if I alter the rollout?
- Why did this context receive this variation?

Avoid naming competitors as the primary comparison. The product should communicate its own value rather than defining itself as an alternative to another vendor.

---

## 11. Trust Section

### Heading

# Built with evidence, not marketing numbers.

### Body

> flags.dev is an engineering-first platform. Performance, reliability, and security claims are supported by implementation and reproducible evidence rather than decorative benchmarks.

Only include the following when verified:

- benchmark results,
- test coverage,
- architecture details,
- repository activity,
- documented security controls,
- real adoption numbers,
- real customer feedback.

Do not use fabricated testimonials, unsupported customer counts, unsupported SLA claims, or certification claims that have not been achieved.

---

## 12. Final CTA

### Heading

# Make your next rollout a decision, not a guess.

### Supporting text

> Start with feature flags. See the exposure. Understand the decision.

### Primary CTA

**Try flags.dev**

### Secondary CTA

**Explore the documentation**

The final CTA should reinforce the product outcome rather than repeat generic language such as "Get started with feature flags."

---

## 13. FAQ Copy

### What is flags.dev?

> flags.dev is a feature-flag platform that helps engineering teams control releases and understand the exposure created by their targeting and rollout decisions.

### Is flags.dev a replacement for our analytics platform?

> No. flags.dev focuses on release-specific exposure and evaluation. Your existing analytics, warehouse, and customer-data systems remain the source of broader product and business analysis.

### Does flags.dev need access to our database?

> No. flags.dev is designed around an explicit evaluation-context contract rather than requiring direct access to your application database.

### Are exposure numbers exact?

> Evaluation decisions are deterministic. Population and exposure figures may be estimates when they are calculated from an incomplete or sampled context population. flags.dev should make that distinction explicit.

### Does flags.dev support percentage rollouts?

> Percentage rollout is part of the release model and is implemented using deterministic evaluation semantics. Availability should only be advertised once the capability is implemented and verified.

### Does flags.dev support SDKs?

> Developer SDK support is part of the product direction, beginning with Java. Only implemented and documented SDKs should be presented as generally available.

---

## 14. Navigation Copy

Primary navigation should remain intentionally small:

- **Product**
- **Docs**
- **GitHub**
- **Sign in**
- **Try flags.dev**

Avoid navigation items that require the visitor to understand internal product terminology before understanding the product.

---

## 15. Copy Principles

1. **Lead with the customer problem.** Do not lead with implementation.
2. **Use concrete release language.** Prefer "15% rollout" and "projected exposure" over abstract claims.
3. **Explain before promoting.** The visitor should understand the value before seeing a feature list.
4. **Use developer language without unnecessary jargon.** Terms such as context, rollout, evaluation, and targeting are appropriate; vague terms such as "next-generation intelligence" are not.
5. **Avoid competitor-dependent messaging.** Define flags.dev by its own value.
6. **Never present planned capabilities as available.** Copy must reflect verified product state.
7. **Never present estimates as facts.** Label estimated or projected audience figures honestly.
8. **Prefer evidence over adjectives.** Replace "blazing fast" with measured latency when evidence exists.
9. **Keep the customer as the subject.** The page should describe what the customer can understand or accomplish.
10. **Keep the story focused.** Every section should reinforce release exposure, release decisions, or the infrastructure that makes those capabilities trustworthy.

---

## 16. Messaging Hierarchy

The page should communicate in this order:

```text
Customer problem
      ↓
Release exposure
      ↓
Concrete product interaction
      ↓
Who / How much / What if / Why
      ↓
Developer integration
      ↓
Engineering proof
      ↓
Trust
      ↓
Call to action
```

Do not reverse this order by opening with architecture, SDKs, benchmarks, or a long feature inventory.

---

## 17. Claims That Require Verification

Before implementation, review all customer-facing claims against the actual repository state.

In particular:

- percentage rollout,
- context targeting,
- audience estimation,
- rollout simulation,
- explainable evaluation,
- Java SDK,
- OpenFeature provider,
- performance figures,
- availability/reliability figures,
- customer/adoption figures,
- security certifications.

The landing page is a product surface, not a place to advertise future work as completed work.
