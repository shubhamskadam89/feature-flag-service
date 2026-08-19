import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BENCHMARK_BASE_URL || 'http://localhost:8080';
const API_KEY = __ENV.BENCHMARK_API_KEY || 'benchmark-api-key-secret-12345';
const ENV_ID = __ENV.BENCHMARK_ENVIRONMENT_ID || '00000000-0000-0000-0000-000000000003';
const FEATURE_KEY = __ENV.BENCHMARK_STATIC_FEATURE || 'benchmark-static';

const CONCURRENCY = parseInt(__ENV.BENCHMARK_CONCURRENCY || '10', 10);
const WARMUP_SEC = parseInt(__ENV.BENCHMARK_WARMUP_SEC || '5', 10);
const MEASURE_SEC = parseInt(__ENV.BENCHMARK_MEASURE_SEC || '30', 10);

/**
 * Cache Miss Methodology for Scenario C:
 * To measure Redis Cache Miss performance without destroying the Redis server:
 * 1. Controlled cache invalidation is executed before the test run using invalidate_cache.sh.
 * 2. Each iteration evaluates the feature.
 * 3. Note: On a single static feature key, the first request will MISS and subsequent requests will HIT.
 *    To continuously benchmark cache misses under concurrency, cache invalidation can be run periodically
 *    or single cold requests can be measured sequentially after key deletion.
 */

export const options = {
  scenarios: {
    warmup: {
      executor: 'constant-vus',
      vus: CONCURRENCY,
      duration: `${WARMUP_SEC}s`,
      gracefulStop: '0s',
    },
    measurement: {
      executor: 'constant-vus',
      vus: CONCURRENCY,
      duration: `${MEASURE_SEC}s`,
      startTime: `${WARMUP_SEC}s`,
    },
  },
  thresholds: {
    'http_req_failed{scenario:measurement}': ['rate<0.01'],
  },
};

export default function () {
  const url = `${BASE_URL}/api/v1/evaluate/environments/${ENV_ID}/features/${FEATURE_KEY}`;
  const params = {
    headers: {
      'X-Api-Key': API_KEY,
    },
  };

  const res = http.get(url, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'feature key matches': (r) => {
      const body = r.json();
      return body && body.data && body.data.key === FEATURE_KEY;
    },
    'reason is STATIC': (r) => {
      const body = r.json();
      return body && body.data && body.data.reason && body.data.reason.type === 'STATIC';
    },
  });
}
