import { chooseAction, type AiDecision } from '../../ai/decision/action-decision';
import { aiDifficulty, type AiDifficultyId } from '../../ai/difficulty/difficulty-profile';
import { listLegalActions } from '../../game/action/legal-action';
import { resolveSessionAction, type SessionActionResult } from '../../game/action/action-session';
import type { AbilityActionState } from '../../game/action/ability-action';
import type { HeroId } from '../../heroes/domain/hero-definition';

export interface CpuTurnConfig {
  heroId: HeroId;
  difficulty: AiDifficultyId;
  random?: () => number;
}

export type CpuTurnResult =
  | {
      ok: true;
      state: AbilityActionState;
      decision: AiDecision;
      consumedTurn: boolean;
    }
  | {
      ok: false;
      state: AbilityActionState;
      error: 'not-cpu-turn' | 'no-legal-action' | 'resolution-failed';
      resolutionError?: string;
    };

export function resolveCpuTurn(state: AbilityActionState, config: CpuTurnConfig): CpuTurnResult {
  if (state.match.status !== 'playing' || state.match.phase !== 'opponent') {
    return { ok: false, state, error: 'not-cpu-turn' };
  }

  const actor = 2 as const;
  const actions = listLegalActions(state, config.heroId, actor);
  const decision = chooseAction(
    state.match.board,
    actions,
    actor,
    aiDifficulty(config.difficulty),
    config.random,
  );

  if (!decision) return { ok: false, state, error: 'no-legal-action' };

  const resolved: SessionActionResult = resolveSessionAction(state, decision.action);
  if (!resolved.ok) {
    return {
      ok: false,
      state,
      error: 'resolution-failed',
      resolutionError: resolved.error,
    };
  }

  return {
    ok: true,
    state: resolved.state,
    decision,
    consumedTurn: resolved.consumedTurn,
  };
}
