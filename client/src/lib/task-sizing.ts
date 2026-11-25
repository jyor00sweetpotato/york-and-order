import { STRATEGIC_IMPACTS, type StrategicImpact } from "@shared/schema";

export const IMPACT_LABELS: Record<StrategicImpact, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function impactLabel(value: string | null | undefined): string | null {
  return value && (STRATEGIC_IMPACTS as readonly string[]).includes(value)
    ? IMPACT_LABELS[value as StrategicImpact]
    : null;
}

/** 2.5 -> "2.5h", 3 -> "3h". */
export function formatHours(hours: number): string {
  return `${Math.round(hours * 100) / 100}h`;
}
