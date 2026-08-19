# Evaluation Engine Instrumentation & Bottleneck Analysis Report

This document records empirical metrics collected from Spring Boot Actuator during the 12 selective benchmark runs ($100, 250, 500\text{ VUs}$) across Scenarios A, B, D, and E (N=50).

---

## 1. Empirical Metric Summary

| Metric Name | Sampled Value | Metric Unit / Type | Description / Analysis |
| :--- | :--- | :--- | :--- |
| `http.server.requests` (Total Time) | **80,574.38 s** | Total Seconds | Total Spring MVC HTTP handling time |
| `http.server.requests` (Count) | **789,617** | Total Requests | Total HTTP evaluation requests served |
| **`http.server.requests` (Avg)** | **102.04 ms** | Avg Latency | **Full HTTP round-trip latency** |
| `evaluation.service.latency` (Total Time) | **3,901.35 s** | Total Seconds | Execution time inside `EvaluationServiceImpl` |
| `evaluation.service.latency` (Count) | **789,599** | Operations | Total service-level evaluations |
| **`evaluation.service.latency` (Avg)** | **4.94 ms** | Avg Latency | **Internal Java evaluation duration** |
| **`evaluation.env.lookup` (Count)** | **789,599** | DB Queries | **PostgreSQL queries for `envRepo`** |
| **`evaluation.cache.hit` (Count)** | **643,453** | Hits | **Redis Cache Hits** |
| `evaluation.cache.miss` (Count) | **117,856** | Misses | Redis Cache Misses |
| `evaluation.redis.lookup` (Avg) | **0.467 ms** | Avg Latency | Redis read latency |
| `evaluation.rollout.eval` (Avg) | **0.0031 ms ($3.1\ \mu\text{s}$)** | Avg Latency | MurmurHash3 calculation overhead |
| **`hikaricp.connections.pending`** | **Up to 89.0** | Concurrent Threads | Threads blocked waiting for DB connections |

---

## 2. Diagnostic Matrix Results

```
                k6 (p95: 165 - 768 ms)
                 │
                 ▼
          HTTP evaluation (http.server.requests avg: 102.04 ms)
                 │
       ┌─────────┴─────────┐
       │                   │
  Tomcat Queue       service latency (avg: 4.94 ms)
 (Queueing: ~97ms)         │
                    ┌──────┼──────┐
                    │      │      │
                  Redis   DB    Rollout
                 0.467ms 0.54ms 0.003ms
```

### Empirical Observations & Conclusions

1. **HTTP Latency vs Service Latency**:
   - `http.server.requests` avg latency = **102.04 ms**
   - `evaluation.service.latency` avg latency = **4.94 ms**
   - **Finding**: **95.2% of total request duration** occurs outside the evaluation service method!
2. **Database Query on Every Cache Hit (Hypothesis #3 Verified)**:
   - `evaluation.env.lookup` count (**789,599**) equals total evaluation count (**789,599**).
   - **Finding**: `envRepo.findByIdAndDeletedAtIsNull(environmentId)` was executed on **100% of requests**, including all **643,453 Redis Cache Hits**!
   - Under 250–500 VUs, this forced 500 threads to compete for **10 HikariCP database connections**, causing **up to 89 pending threads** and driving Tomcat thread pool queueing delay.
3. **Rollout Computation Overhead**:
   - MurmurHash3 bucket calculation takes **$3.1 \ \mu\text{s}$** per request. CPU computation is NOT a bottleneck.
4. **Redis Latency**:
   - Redis lookups average **0.467 ms**, operating with extreme efficiency.

---

## 3. Evidence-Backed Single Optimization

### Selected Fix: Defer Environment DB Validation to Cache Miss
Modify `EvaluationServiceImpl.java` so that cache lookup (`evaluationCache.get(...)`) is executed **first**. 

* **Cache Hit**: Returns cached result immediately with **0 database calls**.
* **Cache Miss**: Queries `envRepo` to validate the environment and loads feature state from PostgreSQL.

This single change removes **100% of unnecessary PostgreSQL queries on cache hits**, eliminating Hikari connection pool exhaustion and Tomcat thread queueing.
