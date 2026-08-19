#!/usr/bin/env bash
set -e

# Benchmark Redis Cache Invalidation Script
# Controlled eviction of specific evaluation cache keys from Redis without FLUSHALL.

REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
ENV_ID="${1:-00000000-0000-0000-0000-000000000003}"
FEATURE_KEY="${2:-benchmark-static}"

KEY_PREFIX="evaluation:${ENV_ID}:${FEATURE_KEY}"

echo "=== Controlled Cache Eviction ==="
echo "Evicting base key: ${KEY_PREFIX}"
echo "Evicting contextual keys matching: ${KEY_PREFIX}:context:*"

if command -v redis-cli &> /dev/null; then
    redis-cli -h "${REDIS_HOST}" -p "${REDIS_PORT}" DEL "${KEY_PREFIX}" > /dev/null
    # Delete contextual keys via SCAN
    KEYS=$(redis-cli -h "${REDIS_HOST}" -p "${REDIS_PORT}" --scan --pattern "${KEY_PREFIX}:context:*")
    if [ -n "$KEYS" ]; then
        echo "$KEYS" | xargs redis-cli -h "${REDIS_HOST}" -p "${REDIS_PORT}" DEL > /dev/null
    fi
elif docker ps --format '{{.Names}}' | grep -q "feature-flag-service-redis"; then
    docker exec feature-flag-service-redis redis-cli DEL "${KEY_PREFIX}" > /dev/null
    KEYS=$(docker exec feature-flag-service-redis redis-cli --scan --pattern "${KEY_PREFIX}:context:*")
    if [ -n "$KEYS" ]; then
        docker exec feature-flag-service-redis redis-cli DEL $KEYS > /dev/null
    fi
else
    echo "ERROR: Neither local 'redis-cli' nor running docker container 'feature-flag-service-redis' found."
    exit 1
fi

echo "=== Cache Invalidation Completed for ${FEATURE_KEY} ==="
