#!/usr/bin/env bash
set -e

# Selective Benchmark Runner Script (12 targeted runs)
# Scenarios: A, B, D, E (N=50) at Concurrencies: 100, 250, 500

BASE_URL="${BENCHMARK_BASE_URL:-http://localhost:8080}"
API_KEY="${BENCHMARK_API_KEY:-benchmark-api-key-secret-12345}"
ENV_ID="${BENCHMARK_ENVIRONMENT_ID:-00000000-0000-0000-0000-000000000003}"
CONCURRENCIES=(100 250 500)
WARMUP_SEC="${BENCHMARK_WARMUP_SEC:-10}"
MEASURE_SEC="${BENCHMARK_MEASURE_SEC:-30}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
RESULTS_DIR="${1:-${ROOT_DIR}/benchmark/results/selective_instrumented}"

mkdir -p "${RESULTS_DIR}"

echo "=================================================="
echo "SELECTIVE BENCHMARK SUITE (12 TARGETED RUNS)"
echo "=================================================="
echo "Base URL:      ${BASE_URL}"
echo "Environment:   ${ENV_ID}"
echo "Concurrencies: ${CONCURRENCIES[*]}"
echo "Warmup Time:   ${WARMUP_SEC}s"
echo "Measure Time:  ${MEASURE_SEC}s"
echo "Results Dir:   ${RESULTS_DIR}"
echo "=================================================="

# 1. Seed Database Fixtures
echo "--> Seeding database fixtures..."
"${SCRIPT_DIR}/seed.sh" > /dev/null

export BENCHMARK_BASE_URL="${BASE_URL}"
export BENCHMARK_API_KEY="${API_KEY}"
export BENCHMARK_ENVIRONMENT_ID="${ENV_ID}"
export BENCHMARK_WARMUP_SEC="${WARMUP_SEC}"
export BENCHMARK_MEASURE_SEC="${MEASURE_SEC}"

run_scenario() {
  local scenario_name="$1"
  local script_file="$2"
  local conc="$3"
  local extra_env="$4"

  local out_json="${RESULTS_DIR}/${scenario_name}_c${conc}.json"
  echo ">>> Running [${scenario_name}] with Concurrency=${conc}..."

  env ${extra_env} BENCHMARK_CONCURRENCY="${conc}" k6 run \
    --summary-export="${out_json}" \
    "${ROOT_DIR}/benchmark/scenarios/${script_file}"
}

# Scenario A: Static Flag + Redis Hit
for c in "${CONCURRENCIES[@]}"; do
  "${SCRIPT_DIR}/warmup_cache.sh" > /dev/null
  run_scenario "scenario_a_static_hit" "scenario_a_static_hit.js" "${c}" ""
done

# Scenario B: Percentage Rollout + Redis Hit
for c in "${CONCURRENCIES[@]}"; do
  "${SCRIPT_DIR}/warmup_cache.sh" > /dev/null
  run_scenario "scenario_b_rollout_hit" "scenario_b_rollout_hit.js" "${c}" ""
done

# Scenario D: Percentage Rollout + Redis Miss
for c in "${CONCURRENCIES[@]}"; do
  run_scenario "scenario_d_rollout_miss" "scenario_d_rollout_miss.js" "${c}" ""
done

# Scenario E: Bulk Evaluation (N=50)
for c in "${CONCURRENCIES[@]}"; do
  run_scenario "scenario_e_bulk_n50" "scenario_e_bulk.js" "${c}" "BENCHMARK_BULK_N=50"
done

echo "=================================================="
echo "SELECTIVE BENCHMARK COMPLETED"
echo "Results stored in: ${RESULTS_DIR}"
echo "=================================================="
