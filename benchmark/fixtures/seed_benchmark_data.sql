-- Idempotent SQL script to seed benchmark data for flags.dev performance testing.
-- Uses fixed deterministic UUIDs so running this script multiple times is safe and non-destructive.

BEGIN;

-- 1. Create Benchmark User
INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'benchmark-user@flags.dev',
    '$2a$10$7EqJtq986P4Ma7625m1Fcu5e2.59k.8J.7EqJtq986P4Ma7625m1Fc',
    'Benchmark User',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- 2. Create Benchmark Organization
INSERT INTO organizations (id, name, created_by, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Benchmark Organization',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- 3. Create Benchmark Project
INSERT INTO projects (id, organization_id, name, created_by, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Benchmark Project',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- 4. Create Benchmark Environment
-- Plaintext API Key: benchmark-api-key-secret-12345
-- SHA-256 Hash of "benchmark-api-key-secret-12345" in Base64:
-- F0nkJIfzPoeJSINNs3//2sp4MK6E+7EQS+oEZ2S7H6g=
INSERT INTO environments (id, project_id, organization_id, name, api_key_prefix, api_key_hash, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Benchmark Environment',
    'bench_',
    'F0nkJIfzPoeJSINNs3//2sp4MK6E+7EQS+oEZ2S7H6g=',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET 
    api_key_hash = 'F0nkJIfzPoeJSINNs3//2sp4MK6E+7EQS+oEZ2S7H6g=',
    updated_at = NOW();

-- 5. Create Benchmark Static Feature
INSERT INTO features (id, project_id, key, name, description, type, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000002',
    'benchmark-static',
    'Benchmark Static Boolean Flag',
    'Static boolean feature for cache-hit and cache-miss single evaluation benchmarks',
    'BOOLEAN',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

INSERT INTO feature_states (id, feature_id, environment_id, organization_id, enabled, value, rollout_percentage, updated_by, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    true,
    'true'::jsonb,
    NULL,
    '00000000-0000-0000-0000-000000000001',
    NOW()
)
ON CONFLICT (id) DO UPDATE SET enabled = true, rollout_percentage = NULL, updated_at = NOW();

-- 6. Create Benchmark Rollout Feature
INSERT INTO features (id, project_id, key, name, description, type, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000002',
    'benchmark-rollout',
    'Benchmark Percentage Rollout Flag',
    'Percentage rollout feature for contextual evaluation benchmarks',
    'BOOLEAN',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

INSERT INTO feature_states (id, feature_id, environment_id, organization_id, enabled, value, rollout_percentage, updated_by, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    true,
    'true'::jsonb,
    15.55,
    '00000000-0000-0000-0000-000000000001',
    NOW()
)
ON CONFLICT (id) DO UPDATE SET enabled = true, rollout_percentage = 15.55, updated_at = NOW();

-- 7. Create Bulk Evaluation Features (benchmark-bulk-01 .. benchmark-bulk-50)
DO $$
DECLARE
    i INT;
    feat_id UUID;
    state_id UUID;
    key_str TEXT;
BEGIN
    FOR i IN 1..50 LOOP
        key_str := 'benchmark-bulk-' || LPAD(i::text, 2, '0');
        feat_id := gen_random_uuid();
        state_id := gen_random_uuid();

        -- Insert Feature if key doesn't exist
        INSERT INTO features (id, project_id, key, name, description, type, created_at, updated_at)
        SELECT feat_id, '00000000-0000-0000-0000-000000000002', key_str, 'Bulk Feature ' || i, 'Bulk feature for performance benchmarking', 'BOOLEAN', NOW(), NOW()
        WHERE NOT EXISTS (SELECT 1 FROM features WHERE key = key_str AND project_id = '00000000-0000-0000-0000-000000000002');

        -- Insert FeatureState for created feature
        INSERT INTO feature_states (id, feature_id, environment_id, organization_id, enabled, value, rollout_percentage, updated_by, updated_at)
        SELECT 
            state_id,
            f.id,
            '00000000-0000-0000-0000-000000000003',
            '00000000-0000-0000-0000-000000000001',
            true,
            'true'::jsonb,
            NULL,
            '00000000-0000-0000-0000-000000000001',
            NOW()
        FROM features f
        WHERE f.key = key_str AND f.project_id = '00000000-0000-0000-0000-000000000002'
        AND NOT EXISTS (
            SELECT 1 FROM feature_states fs 
            WHERE fs.feature_id = f.id AND fs.environment_id = '00000000-0000-0000-0000-000000000003'
        );
    END LOOP;
END $$;

COMMIT;
