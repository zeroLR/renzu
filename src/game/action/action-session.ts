import { advanceBoardEffectsAfterTurn, createBoardEffect, isBlocked } from '../combat/board-effects';
import { completeTurn } from '../match/match-state';
import { evaluatePlacementPattern } from '../rules/placement-pattern';
import { resolveAbilityAction, type AbilityActionResult, type AbilityActionState } from './ability-action';
import type { LegalAction } from './legal-action';
import {
  consumePlacementSupport,
  preparePlacementSupport,
  type PlacementSupport,
  type PreparedPlacementSupport,
} from './placement-support';
import { resolvePlaceAction } from './place-action';
import { advanceAbilityEconomyAfterTurn } from '../../heroes/economies/ability-economy';
import type { HeroId } from '../../heroes/domain/hero-definition';
import { applyAfterPlacePassive } from '../../heroes/domain/passive-engine';

export type SessionActionResult =
  | { ok: true; state: AbilityActionState; consumedTurn: true }
  | { ok: false; state: AbilityActionState; consumedTurn: false; error: string };

function advanceAfterLogicalTurn(
  state: AbilityActionState,
  actor: 1 | 2,
  preparedSupport?: PreparedPlacementSupport,
  complete = true,
): AbilityActionState {
  const advancedAbilities = advanceAbilityEconomyAfterTurn(state.abilities, actor);
  return {
    ...state,
    match: complete ? completeTurn(state.match, actor) : state.match,
    abilities: preparedSupport
      ? consumePlacementSupport(advancedAbilities, actor, preparedSupport)
      : advancedAbilities,
    boardEffects: advanceBoardEffectsAfterTurn(state.boardEffects, actor),
  };
}

function resolvePlacementTurn(
  state: AbilityActionState,
  actor: 1 | 2,
  at: { row: number; col: number },
  heroId?: HeroId,
  support?: PlacementSupport,
): SessionActionResult {
  if (isBlocked(state.boardEffects, at)) {
    return { ok: false, state, consumedTurn: false, error: 'blocked-target' };
  }

  const preparedSupport = support
    ? preparePlacementSupport(state, heroId, actor, support)
    : null;
  if (preparedSupport && !preparedSupport.ok) {
    return { ok: false, state, consumedTurn: false, error: preparedSupport.error };
  }

  const placed = resolvePlaceAction(state.match, actor, at, { completeTurn: false });
  if (!placed.ok) return { ok: false, state, consumedTurn: false, error: placed.error };

  const pattern = evaluatePlacementPattern(placed.state.board, at, actor, state.boardEffects);
  let abilities = state.abilities;
  let boardEffects = state.boardEffects;
  if (heroId) {
    const passive = applyAfterPlacePassive(abilities, heroId, { pattern });
    abilities = passive.states;
    if (passive.boardEffect === 'guard') {
      boardEffects = [
        ...boardEffects,
        createBoardEffect('guard', at, actor, { kind: 'opponent-turns', remaining: 1 }),
      ];
    }
  }

  const prepared = preparedSupport?.ok ? preparedSupport.prepared : undefined;
  if (prepared) boardEffects = [...boardEffects, prepared.effect];

  const afterPlacement: AbilityActionState = {
    ...state,
    match: placed.state,
    abilities,
    boardEffects,
  };

  if (afterPlacement.match.status !== 'playing') {
    return {
      ok: true,
      consumedTurn: true,
      state: advanceAfterLogicalTurn(afterPlacement, actor, prepared, false),
    };
  }

  return {
    ok: true,
    consumedTurn: true,
    state: advanceAfterLogicalTurn(afterPlacement, actor, prepared),
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
      ? { ok: true, state: result.state, consumedTurn: true }
      : { ok: false, state, consumedTurn: false, error: result.error };
  }

  return resolvePlacementTurn(state, action.actor, action.at, heroId, action.support);
}
