import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BENCHMARK_BASE_URL || 'http://localhost:8080';
const API_KEY = __ENV.BENCHMARK_API_KEY || 'benchmark-api-key-secret-12345';
const ENV_ID = __ENV.BENCHMARK_ENVIRONMENT_ID || '00000000-0000-0000-0000-000000000003';
const FEATURE_KEY = __ENV.BENCHMARK_STATIC_FEATURE || 'benchmark-static';

const CONCURRENCY = parseInt(__ENV.BENCHMARK_CONCURRENCY || '10', 10);
const WARMUP_SEC = parseInt(__ENV.BENCHMARK_WARMUP_SEC || '30', 10);
const MEASURE_SEC = parseInt(__ENV.BENCHMARK_MEASURE_SEC || '60', 10);

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
    'http_req_failed{scenario:measurement}': ['rate<0.01'], // <1% errors
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

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'feature key matches': (r) => {
      const body = r.json();
      return body && body.data && body.data.key === FEATURE_KEY;
    },
    'enabled is true': (r) => {
      const body = r.json();
      return body && body.data && body.data.enabled === true;
    },
    'reason is STATIC': (r) => {
      const body = r.json();
      return body && body.data && body.data.reason && body.data.reason.type === 'STATIC';
    },
  });
}
