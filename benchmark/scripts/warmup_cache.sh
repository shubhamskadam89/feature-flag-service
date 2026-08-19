#!/usr/bin/env bash
set -e

# Benchmark Cache Warmup Script
# Sends HTTP requests to populate Redis cache for static, rollout, and bulk features.

BASE_URL="${BENCHMARK_BASE_URL:-http://localhost:8080}"
API_KEY="${BENCHMARK_API_KEY:-benchmark-api-key-secret-12345}"
ENV_ID="${BENCHMARK_ENVIRONMENT_ID:-00000000-0000-0000-0000-000000000003}"

echo "=== Warming Redis Cache ==="
echo "Base URL: ${BASE_URL}"
echo "Environment ID: ${ENV_ID}"

# 1. Warm Static Feature Cache
echo -n "Warming static feature cache... "
curl -s -f -H "X-Api-Key: ${API_KEY}" \
    "${BASE_URL}/api/v1/evaluate/environments/${ENV_ID}/features/benchmark-static" > /dev/null
echo "Done."

# 2. Warm Percentage Rollout Feature Cache for fixed context
echo -n "Warming percentage rollout feature cache... "
curl -s -f -H "X-Api-Key: ${API_KEY}" \
    "${BASE_URL}/api/v1/evaluate/environments/${ENV_ID}/features/benchmark-rollout?contextKey=benchmark-user-123" > /dev/null
echo "Done."

# 3. Warm Bulk Features Cache
echo -n "Warming bulk features cache... "
BULK_BODY='{"context": {"key": "benchmark-user-123"}, "keys": ["benchmark-bulk-01", "benchmark-bulk-02", "benchmark-bulk-03", "benchmark-bulk-04", "benchmark-bulk-05"]}'
curl -s -f -H "X-Api-Key: ${API_KEY}" -H "Content-Type: application/json" \
    -d "${BULK_BODY}" \
    "${BASE_URL}/api/v1/evaluate/environments/${ENV_ID}/bulk" > /dev/null
echo "Done."

echo "=== Cache Warmup Complete ==="
