# flags.dev Evaluation API Performance Benchmarks

This directory contains the reproducible HTTP performance benchmark suite for **flags.dev**.

---

## 1. Why Benchmarks Exist
Before optimizing code, algorithms, or infrastructure, we must establish empirical baselines under realistic load conditions. This suite measures actual HTTP-level latency, throughput, and error rates of feature evaluation endpoints to guide future optimization decisions based on evidence rather than assumptions.

---

## 2. What Is Being Measured
The benchmark suite evaluates:
1. **Single Static Flag Evaluation**: `GET /api/v1/evaluate/environments/{environmentId}/features/{featureKey}`
2. **Contextual Percentage Rollout Evaluation**: `GET /api/v1/evaluate/environments/{environmentId}/features/{featureKey}?contextKey={contextKey}`
3. **Bulk Feature Evaluation**: `POST /api/v1/evaluate/environments/{environmentId}/bulk` for $N = 5, 20, 50$ features.
4. **Performance Characteristics**:
   - Throughput (requests per second)
   - Latency distribution: p50, p95, p99
   - Error rates under increasing concurrency (10, 50, 100, 250, 500 VUs)
   - Redis cache-hit vs. PostgreSQL cache-miss path latencies

---

## 3. Architecture Being Exercised
The suite exercises the **full production HTTP evaluation flow**:

```
Client (k6 HTTP VU)
       ↓
Spring Boot Security (ApiKeyAuthenticationFilter via X-Api-Key)
       ↓
EvaluationController
       ↓
EvaluationService
       ↓
Redis Cache (RedisEvaluationCache / EvaluationCache)
       ↓
PostgreSQL Database (on Redis cache miss)
       ↓
Deterministic Rollout Evaluator (XXHash64 / murmur3)
       ↓
JSON Response
```

No internal Java methods or evaluators are bypassed.

---

## 4. Tool Selection & Rationale
* **Selected Tool**: Grafana k6 (`k6`)
* **Rationale**:
  * **Lightweight & High Concurrency**: Built in Go, handling hundreds of concurrent Virtual Users (VUs) with minimal CPU overhead on the benchmark client.
  * **Native Metrics**: Automatically calculates p50 (median), p95, p99 latencies, request rates (req/s), and error rates (`http_req_failed`).
  * **Scriptable**: Test scenarios are written in standard JavaScript (`scenario_*.js`) and version-controlled in git.
  * **Response Correctness Assertions**: Verifies HTTP 200, response body schema, `PERCENTAGE_ROLLOUT` reason structure, bucket calculations (`bucket < threshold`), and bulk response array lengths.
  * **Zero Commercial Product Requirement**: Fully open source, running locally.

---

## 5. Environment Requirements
- **macOS / Linux / Windows**
- **Java 21+** (for Spring Boot backend)
- **Docker & Docker Compose** (for PostgreSQL 17 and Redis 8)
- **k6 CLI** (`brew install k6` or binary from [k6.io](https://k6.io))
- **psql** or `docker exec` for PostgreSQL fixture seeding

---

## 6. How to Start PostgreSQL and Redis
From the repository root:
```bash
docker compose up -d
```
Verify containers are active:
```bash
docker compose ps
```

---

## 7. How to Start Backend Service
From the repository root:
```bash
cd backend
./mvnw spring-boot:run
```
By default, the service listens on port `8080`.

---

## 8. How to Create Benchmark Fixtures
The benchmark data is seeded idempotently via SQL script:
```bash
./benchmark/scripts/seed.sh
```
This script creates deterministic entities:
- **Organization**: `Benchmark Organization` (`00000000-0000-0000-0000-000000000001`)
- **Project**: `Benchmark Project` (`00000000-0000-0000-0000-000000000002`)
- **Environment**: `Benchmark Environment` (`00000000-0000-0000-0000-000000000003`)
- **Plaintext API Key**: `benchmark-api-key-secret-12345`
- **Features**:
  - `benchmark-static` (Boolean static flag)
  - `benchmark-rollout` (Percentage rollout 15.55%)
  - `benchmark-bulk-01` through `benchmark-bulk-50` (Bulk feature flags)

---

## 9. How Cache Hits Are Produced
Cache-hit scenarios evaluate features after warming the Redis cache:
```bash
./benchmark/scripts/warmup_cache.sh
```
The script fires initial evaluation HTTP requests against the backend, populating Redis keys:
- `evaluation:00000000-0000-0000-0000-000000000003:benchmark-static`
- `evaluation:00000000-0000-0000-0000-000000000003:benchmark-rollout:context:<hash>`

---

## 10. How Cache Misses Are Produced
- **Scenario C (Static Miss)**: Controlled eviction of the target feature cache key (`evaluation:<envId>:<featureKey>`) via `./benchmark/scripts/invalidate_cache.sh` prior to test execution without issuing `FLUSHALL` or destroying unrelated Redis data.
- **Scenario D (Rollout Miss)**: Every Virtual User (VU) iteration generates a unique context key (`benchmark-user-miss-vu${__VU}-iter${__ITER}`). Because the context key is dynamic per request, contextual Redis lookup yields a MISS, forcing PostgreSQL query, deterministic rollout calculation, and contextual Redis PUT for every request.

---

## 11. How to Run Scenarios & Change Concurrency

### Run Complete Benchmark Suite (Default Concurrencies: 10, 50, 100, 250, 500 VUs)
```bash
./benchmark/scripts/run_all.sh
```

### Run Individual Scenarios
To run a specific scenario with custom concurrency and durations:
```bash
BENCHMARK_CONCURRENCY=50 \
BENCHMARK_WARMUP_SEC=30 \
BENCHMARK_MEASURE_SEC=60 \
k6 run benchmark/scenarios/scenario_a_static_hit.js
```

Available Scenarios:
- `benchmark/scenarios/scenario_a_static_hit.js` (Static Flag + Redis Hit)
- `benchmark/scenarios/scenario_b_rollout_hit.js` (Percentage Rollout + Redis Hit)
- `benchmark/scenarios/scenario_c_static_miss.js` (Static Flag + Redis Miss)
- `benchmark/scenarios/scenario_d_rollout_miss.js` (Percentage Rollout + Redis Miss)
- `BENCHMARK_BULK_N=20 k6 run benchmark/scenarios/scenario_e_bulk.js` (Bulk Evaluation N=5, 20, 50)

---

## 12. How Results Are Interpreted
k6 outputs real-time summary statistics:
- `http_req_duration`:
  - `med` (p50 median response time)
  - `p(95)` (95th percentile response time)
  - `p(99)` (99th percentile response time)
- `http_reqs`: Throughput in `req/s`
- `http_req_failed`: Percentage of non-200 HTTP responses

Summaries are stored in `benchmark/results/baseline/` and compiled into `benchmark/results/baseline/BASELINE.md`.

---

## 13. How to Reproduce Baseline
1. Ensure docker containers are up: `docker compose up -d`
2. Start Spring Boot application on port 8080.
3. Execute master benchmark script:
   ```bash
   ./benchmark/scripts/run_all.sh
   ```
4. Record metrics in `benchmark/results/baseline/BASELINE.md`.

---

## 14. Known Limitations
1. **Local Network / Loopback Overhead**: Local benchmarking includes loopback interface overhead (`127.0.0.1`).
2. **PostgreSQL Connection Pool**: Under 500 VUs, database connection pool limits (HikariCP default 10 connections) will cause queuing on cache-miss paths, highlighting fallback pool saturation limits.
3. **Single Application Node**: Benchmark measures a single Spring Boot node without load balancer or distributed cache cluster.

---

## 15. Potential Optimization Candidates (For Future Evidence-Based Tasks)
*(Discovered during baseline setup inspection — NOT modified or implemented in this task)*

1. **DB Query Indexing on `feature_states`**:
   - `feature_states` lookup queries filter on `environment_id` and `feature.key`.
2. **Redis Connection Pool Tuning**:
   - High concurrency Lettuce client connection tuning.
3. **HikariCP Connection Pool Sizing**:
   - HikariCP pool size tuning for cache-miss fallback spikes.
4. **Spring Security Filter Chain Optimization**:
   - Optimizing `ApiKeyAuthenticationFilter` environment lookup caching.
