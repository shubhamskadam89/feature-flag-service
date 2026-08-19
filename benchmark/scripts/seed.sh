#!/usr/bin/env bash
set -e

# Benchmark Seed Script
# Safe and idempotent script to populate PostgreSQL with benchmark fixtures.

POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5433}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-feature_flag_service}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIXTURE_SQL="${SCRIPT_DIR}/../fixtures/seed_benchmark_data.sql"

echo "=== Seeding Benchmark Data ==="
echo "Target Host: ${POSTGRES_HOST}:${POSTGRES_PORT}"
echo "Target DB:   ${POSTGRES_DB}"
echo "Fixture SQL: ${FIXTURE_SQL}"

if command -v psql &> /dev/null; then
    PGPASSWORD="${POSTGRES_PASSWORD}" psql \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        -f "${FIXTURE_SQL}"
elif docker ps --format '{{.Names}}' | grep -q "feature-flag-service-postgres"; then
    echo "Local psql not found. Executing via docker container..."
    docker exec -i feature-flag-service-postgres psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" < "${FIXTURE_SQL}"
else
    echo "ERROR: Neither local 'psql' nor running docker container 'feature-flag-service-postgres' found."
    exit 1
fi

echo "=== Benchmark Data Seeded Successfully ==="
