import { chooseAction, type AiDecision } from '../../ai/decision/action-decision';
import { aiDifficulty, type AiDifficultyId, type AiDifficultyProfile } from '../../ai/difficulty/difficulty-profile';
import { activePlayer } from '../../game/match/match-state';
import { longestLine, type Player, type Position } from '../../game/board/board';
import { listLegalActions, type LegalAction } from '../../game/action/legal-action';
import { listLegalPlacementSupportTargets } from '../../game/action/placement-support';
import { resolveSessionAction, type SessionActionResult } from '../../game/action/action-session';
import type { AbilityActionState } from '../../game/action/ability-action';
import type { HeroId } from '../../heroes/domain/hero-definition';

export interface AiTurnConfig {
  heroId: HeroId;
  profile: AiDifficultyProfile;
  random?: () => number;
}

export interface CpuTurnConfig {
  heroId: HeroId;
  difficulty: AiDifficultyId;
  profile?: AiDifficultyProfile;
  random?: () => number;
}

export type AiTurnResult =
  | {
      ok: true;
      state: AbilityActionState;
      decision: AiDecision;
      consumedTurn: boolean;
    }
  | {
      ok: false;
      state: AbilityActionState;
      error: 'not-actor-turn' | 'no-legal-action' | 'resolution-failed';
      resolutionError?: string;
    };

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

function centerDistance(size: number, at: Position): number {
  const center = (size - 1) / 2;
  return Math.abs(at.row - center) + Math.abs(at.col - center);
}

function chooseGuardTarget(state: AbilityActionState, actor: Player, heroId: HeroId): Position | null {
  const targets = listLegalPlacementSupportTargets(state, heroId, actor, 'guard');
  if (!targets.length) return null;

  return [...targets].sort((a, b) => {
    const lineDelta = longestLine(state.match.board, b, actor) - longestLine(state.match.board, a, actor);
    if (lineDelta !== 0) return lineDelta;
    return centerDistance(state.match.board.length, a) - centerDistance(state.match.board.length, b);
  })[0] ?? null;
}

function attachPlacementSupport(
  state: AbilityActionState,
  action: LegalAction,
  actor: Player,
  heroId: HeroId,
): LegalAction {
  if (heroId !== 'vanguard' || action.kind !== 'place') return action;
  const target = chooseGuardTarget(state, actor, heroId);
  return target
    ? { ...action, support: { abilityId: 'guard', target } }
    : action;
}

export function resolveAiTurn(state: AbilityActionState, actor: Player, config: AiTurnConfig): AiTurnResult {
  if (state.match.status !== 'playing' || activePlayer(state.match) !== actor) {
    return { ok: false, state, error: 'not-actor-turn' };
  }

  const actions = listLegalActions(state, config.heroId, actor);
  const decision = chooseAction(
    state,
    actions,
    actor,
    config.heroId,
    config.profile,
    config.random,
  );

  if (!decision) return { ok: false, state, error: 'no-legal-action' };

  const executionAction = attachPlacementSupport(state, decision.action, actor, config.heroId);
  const resolved: SessionActionResult = resolveSessionAction(state, executionAction, config.heroId);
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
    decision: executionAction === decision.action ? decision : { ...decision, action: executionAction },
    consumedTurn: resolved.consumedTurn,
  };
}

export function resolveCpuTurn(state: AbilityActionState, config: CpuTurnConfig): CpuTurnResult {
  if (state.match.status !== 'playing' || state.match.phase !== 'opponent') {
    return { ok: false, state, error: 'not-cpu-turn' };
  }

  const result = resolveAiTurn(state, 2, {
    heroId: config.heroId,
    profile: config.profile ?? aiDifficulty(config.difficulty),
    random: config.random,
  });

  if (!result.ok) {
    return {
      ...result,
      error: result.error === 'not-actor-turn' ? 'not-cpu-turn' : result.error,
    };
  }

  return result;
}
