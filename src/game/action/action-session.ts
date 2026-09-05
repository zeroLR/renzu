import { advanceBoardEffectsAfterTurn, isBlocked } from '../combat/board-effects';
import { clearFollowUp, createActionTimingState } from './action-timing';
import { resolveAbilityAction, type AbilityActionResult, type AbilityActionState } from './ability-action';
import type { LegalAction } from './legal-action';
import { resolvePlaceAction } from './place-action';
import { advanceAbilityEconomyAfterTurn } from '../../heroes/economies/ability-economy';
import type { HeroId } from '../../heroes/domain/hero-definition';
import { applyAfterPlacePassive } from '../../heroes/domain/passive-engine';

export type SessionActionResult =
  | { ok: true; state: AbilityActionState; consumedTurn: boolean }
  | { ok: false; state: AbilityActionState; consumedTurn: false; error: string };

function resolvePlacementTurn(
  state: AbilityActionState,
  actor: 1 | 2,
  at: { row: number; col: number },
  heroId?: HeroId,
  clearPending = false,
): SessionActionResult {
  if (isBlocked(state.boardEffects, at)) {
    return { ok: false, state, consumedTurn: false, error: 'blocked-target' };
  }

  const placed = resolvePlaceAction(state.match, actor, at);
  if (!placed.ok) return { ok: false, state, consumedTurn: false, error: placed.error };

  let abilities = advanceAbilityEconomyAfterTurn(state.abilities, actor);
  if (heroId) {
    abilities = applyAfterPlacePassive(abilities, heroId, {
      board: placed.state.board,
      actor,
      at,
      patternReward: 0,
    }).states;
  }

  return {
    ok: true,
    consumedTurn: true,
    state: {
      ...state,
      match: placed.state,
      abilities,
      boardEffects: advanceBoardEffectsAfterTurn(state.boardEffects, actor),
      timing: clearPending
        ? clearFollowUp(state.timing ?? createActionTimingState())
        : state.timing ?? createActionTimingState(),
    },
  };
}

export function resolveSessionAction(
  state: AbilityActionState,
  action: LegalAction,
  heroId?: HeroId,
): SessionActionResult {
  if (action.kind === 'ability') {
    const result: AbilityActionResult = resolveAbilityAction(state, action);
    return result.ok
      ? { ok: true, state: result.state, consumedTurn: result.consumedTurn }
      : { ok: false, state, consumedTurn: false, error: result.error };
  }

  if (action.kind === 'follow-up') {
    const pending = state.timing?.pendingFollowUp;
    if (!pending || pending.actor !== action.actor || pending.abilityId !== action.sourceAbilityId) {
      return { ok: false, state, consumedTurn: false, error: 'follow-up-unavailable' };
    }

    if (action.action.kind === 'ability') {
      const result = resolveAbilityAction(state, { ...action.action, followUp: true });
      return result.ok
        ? { ok: true, state: result.state, consumedTurn: result.consumedTurn }
        : { ok: false, state, consumedTurn: false, error: result.error };
    }

    return resolvePlacementTurn(state, action.actor, action.action.at, heroId, true);
  }

  return resolvePlacementTurn(state, action.actor, action.at, heroId);
}
