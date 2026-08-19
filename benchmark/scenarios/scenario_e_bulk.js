import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BENCHMARK_BASE_URL || 'http://localhost:8080';
const API_KEY = __ENV.BENCHMARK_API_KEY || 'benchmark-api-key-secret-12345';
const ENV_ID = __ENV.BENCHMARK_ENVIRONMENT_ID || '00000000-0000-0000-0000-000000000003';
const BULK_N = parseInt(__ENV.BENCHMARK_BULK_N || '5', 10);

const CONCURRENCY = parseInt(__ENV.BENCHMARK_CONCURRENCY || '10', 10);
const WARMUP_SEC = parseInt(__ENV.BENCHMARK_WARMUP_SEC || '30', 10);
const MEASURE_SEC = parseInt(__ENV.BENCHMARK_MEASURE_SEC || '60', 10);

// Generate feature keys list [benchmark-bulk-01, benchmark-bulk-02, ..., benchmark-bulk-N]
const keysList = [];
for (let i = 1; i <= BULK_N; i++) {
  const numStr = i < 10 ? `0${i}` : `${i}`;
  keysList.push(`benchmark-bulk-${numStr}`);
}

const payload = JSON.stringify({
  context: {
    key: 'benchmark-user-123',
    attributes: {
      country: 'IN',
      plan: 'PRO',
    },
  },
  keys: keysList,
});

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
  const url = `${BASE_URL}/api/v1/evaluate/environments/${ENV_ID}/bulk`;
  const params = {
    headers: {
      'X-Api-Key': API_KEY,
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'bulk results array returned': (r) => {
      const body = r.json();
      return body && body.data && Array.isArray(body.data.results);
    },
    'bulk result count matches N': (r) => {
      const body = r.json();
      return body && body.data && body.data.results && body.data.results.length === BULK_N;
    },
  });
}
