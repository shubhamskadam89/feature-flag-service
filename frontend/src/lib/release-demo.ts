/**
 * Deterministic demo dataset for the landing-page release simulation.
 *
 * No backend, no randomness: the same interaction always produces the same
 * result. Numbers are labelled as "projected" in the UI because they are
 * derived from a constructed context population, not an authoritative one.
 */

export type DimensionId = "country" | "plan" | "platform";

export interface Dimension {
  id: DimensionId;
  chip: string;
  rule: string;
  /** Share of the base context population matching this dimension. */
  factor: number;
}

export const FLAG_KEY = "new-checkout";

/** Total contexts in the demo project. */
export const BASE_CONTEXTS = 4_000_000;

/** The currently released rollout the visitor is comparing against. */
export const BASELINE_ROLLOUT = 15;

export const DIMENSIONS: Dimension[] = [
  { id: "country", chip: "India", rule: 'country == "IN"', factor: 0.35 },
  { id: "plan", chip: "PRO plan", rule: 'plan == "PRO"', factor: 0.4 },
  { id: "platform", chip: "Android", rule: 'platform == "ANDROID"', factor: 0.75 },
];

/** Deterministic bucket for the sampled context shown in the evaluation trace. */
export const SAMPLE_BUCKET = 0.09;
export const SAMPLE_CONTEXT_ID = "ctx_8f21e0a4";

export interface PlanSlice {
  label: string;
  share: number;
}

export interface ReleaseState {
  eligible: number;
  audienceShare: number;
  exposure: number;
  baselineExposure: number;
  delta: number;
  enterpriseExposure: number;
  conflicts: number;
  planMix: PlanSlice[];
}

export function computeRelease(selected: DimensionId[], rollout: number): ReleaseState {
  const factor = DIMENSIONS.filter((d) => selected.includes(d.id)).reduce(
    (acc, d) => acc * d.factor,
    1,
  );

  const eligible = Math.round(BASE_CONTEXTS * factor);
  const exposure = Math.round((eligible * rollout) / 100);
  const baselineExposure = Math.round((eligible * BASELINE_ROLLOUT) / 100);
  const planScoped = selected.includes("plan");

  const planMix: PlanSlice[] = planScoped
    ? [
        { label: "PRO", share: 100 },
        { label: "Starter", share: 0 },
        { label: "Enterprise", share: 0 },
      ]
    : [
        { label: "PRO", share: 48 },
        { label: "Starter", share: 44 },
        { label: "Enterprise", share: 8 },
      ];

  return {
    eligible,
    audienceShare: factor * 100,
    exposure,
    baselineExposure,
    delta: exposure - baselineExposure,
    enterpriseExposure: planScoped ? 0 : Math.round(exposure * 0.08),
    conflicts: selected.length === 3 ? 3 : selected.length === 2 ? 1 : 0,
    planMix,
  };
}

export interface TraceLine {
  rule: string;
  result: string;
  pass: boolean;
}

export function buildTrace(selected: DimensionId[], rollout: number): TraceLine[] {
  const lines: TraceLine[] = DIMENSIONS.filter((d) => selected.includes(d.id)).map((d, i) => ({
    rule: `Rule ${i + 1}: ${d.rule}`,
    result: "match",
    pass: true,
  }));

  const threshold = rollout / 100;
  lines.push({
    rule: `Rule ${lines.length + 1}: bucket_hash < ${threshold.toFixed(2)}`,
    result: SAMPLE_BUCKET < threshold ? "pass" : "excluded",
    pass: SAMPLE_BUCKET < threshold,
  });

  return lines;
}

export function traceVariation(selected: DimensionId[], rollout: number): "ON" | "OFF" {
  return SAMPLE_BUCKET < rollout / 100 && selected.length > 0 ? "ON" : "OFF";
}

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCompact(value: number): string {
  return compact.format(value);
}

export function formatFull(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDelta(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatCompact(Math.abs(value))}`;
}
