#!/usr/bin/env bash
set -e

# Master Benchmark Runner Script
# Runs reproducible evaluation benchmarks across scenarios A, B, C, D, E.

BASE_URL="${BENCHMARK_BASE_URL:-http://localhost:8080}"
API_KEY="${BENCHMARK_API_KEY:-benchmark-api-key-secret-12345}"
ENV_ID="${BENCHMARK_ENVIRONMENT_ID:-00000000-0000-0000-0000-000000000003}"
CONCURRENCIES=(${BENCHMARK_CONCURRENCIES:-10 50 100 250 500})
WARMUP_SEC="${BENCHMARK_WARMUP_SEC:-30}"
MEASURE_SEC="${BENCHMARK_MEASURE_SEC:-60}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
RESULTS_DIR="${ROOT_DIR}/benchmark/results/baseline"

mkdir -p "${RESULTS_DIR}"

echo "=================================================="
echo "FLAGS.DEV EVALUATION BENCHMARK SUITE"
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
"${SCRIPT_DIR}/seed.sh"

# 2. Warm Cache
echo "--> Warming Redis cache..."
"${SCRIPT_DIR}/warmup_cache.sh"

export BENCHMARK_BASE_URL="${BASE_URL}"
export BENCHMARK_API_KEY="${API_KEY}"
export BENCHMARK_ENVIRONMENT_ID="${ENV_ID}"
export BENCHMARK_WARMUP_SEC="${WARMUP_SEC}"
export BENCHMARK_MEASURE_SEC="${MEASURE_SEC}"

# Function to execute a scenario
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

# Scenario C: Static Flag + Redis Miss
for c in "${CONCURRENCIES[@]}"; do
  "${SCRIPT_DIR}/invalidate_cache.sh" "${ENV_ID}" "benchmark-static" > /dev/null
  run_scenario "scenario_c_static_miss" "scenario_c_static_miss.js" "${c}" ""
done

# Scenario D: Percentage Rollout + Redis Miss
for c in "${CONCURRENCIES[@]}"; do
  run_scenario "scenario_d_rollout_miss" "scenario_d_rollout_miss.js" "${c}" ""
done

# Scenario E: Bulk Evaluation (N=5, N=20, N=50)
for n in 5 20 50; do
  for c in "${CONCURRENCIES[@]}"; do
    run_scenario "scenario_e_bulk_n${n}" "scenario_e_bulk.js" "${c}" "BENCHMARK_BULK_N=${n}"
  done
done

echo "=================================================="
echo "BENCHMARK RUN COMPLETED"
echo "Results stored in: ${RESULTS_DIR}"
echo "=================================================="
