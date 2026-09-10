import type { PlacementPatternEventKind, PlacementPatternOutcome } from '../../game/rules/placement-pattern';

export interface PatternMasteryRule {
  eventKinds: readonly PlacementPatternEventKind[];
  threshold: number;
}

export interface PatternMasteryProgress {
  value: number;
  threshold: number;
  ready: boolean;
}

export function patternMasteryGain(
  outcome: PlacementPatternOutcome,
  rule: PatternMasteryRule,
): number {
  if (outcome.winning) return 0;
  const accepted = new Set(rule.eventKinds);
  return outcome.events.filter((event) => accepted.has(event.kind)).length;
}

export function advancePatternMastery(
  current: number,
  outcome: PlacementPatternOutcome,
  rule: PatternMasteryRule,
): PatternMasteryProgress {
  const threshold = Math.max(1, Math.floor(rule.threshold));
  const value = Math.min(threshold, Math.max(0, current) + patternMasteryGain(outcome, rule));
  return { value, threshold, ready: value >= threshold };
}

export function spendPatternMastery(progress: PatternMasteryProgress): PatternMasteryProgress {
  if (!progress.ready) return progress;
  return { ...progress, value: 0, ready: false };
}
