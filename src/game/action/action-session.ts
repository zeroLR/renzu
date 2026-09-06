import { advanceBoardEffectsAfterTurn, isBlocked } from '../combat/board-effects';
import { completeTurn } from '../match/match-state';
import { clearFollowUp, createActionTimingState, type ActionTimingState } from './action-timing';
import { resolveAbilityAction, type AbilityActionResult, type AbilityActionState } from './ability-action';
import { listLegalAbilityActions, type LegalAction } from './legal-action';
import { resolvePlaceAction } from './place-action';
import { advanceAbilityEconomyAfterTurn, getAbilityResource } from '../../heroes/economies/ability-economy';
import type { HeroId } from '../../heroes/domain/hero-definition';
import { applyAfterPlacePassive } from '../../heroes/domain/passive-engine';

export type SessionActionResult =
  | { ok: true; state: AbilityActionState; consumedTurn: boolean }
  | { ok: false; state: AbilityActionState; consumedTurn: false; error: string };

function finishLogicalTurn(state: AbilityActionState, actor: 1 | 2): AbilityActionState {
  return {
    ...state,
    match: completeTurn(state.match, actor),
    abilities: advanceAbilityEconomyAfterTurn(state.abilities, actor),
    boardEffects: advanceBoardEffectsAfterTurn(state.boardEffects, actor),
    timing: clearFollowUp(state.timing ?? createActionTimingState()),
  };
}

function triggeredSeverTiming(actor: 1 | 2): ActionTimingState {
  return { pendingFollowUp: { actor, abilityId: 'sever', kind: 'triggered' } };
}

function canOpenTriggeredSever(state: AbilityActionState, actor: 1 | 2, heroId?: HeroId): boolean {
  if (heroId !== 'swordmaster' || state.match.status !== 'playing') return false;
  if (getAbilityResource(state.abilities, actor, 'momentum') < 3) return false;
  const candidate = { ...state, timing: triggeredSeverTiming(actor) };
  return listLegalAbilityActions(candidate, 'swordmaster', actor).some((action) => action.abilityId === 'sever');
}

function resolvePlacementTurn(
  state: AbilityActionState,
  actor: 1 | 2,
  at: { row: number; col: number },
  heroId?: HeroId,
): SessionActionResult {
  if (isBlocked(state.boardEffects, at)) {
    return { ok: false, state, consumedTurn: false, error: 'blocked-target' };
  }

  const pending = state.timing?.pendingFollowUp;
  const precommittedStep = pending?.actor === actor && pending.kind === 'precommit' && pending.abilityId === 'step';
  const placed = resolvePlaceAction(state.match, actor, at, { completeTurn: false });
  if (!placed.ok) return { ok: false, state, consumedTurn: false, error: placed.error };

  let abilities = state.abilities;
  if (heroId) {
    abilities = applyAfterPlacePassive(abilities, heroId, {
      board: placed.state.board,
      actor,
      at,
      patternReward: 0,
      preserveMomentum: precommittedStep,
    }).states;
  }

  const afterPlacement: AbilityActionState = {
    ...state,
    match: placed.state,
    abilities,
    timing: precommittedStep
      ? clearFollowUp(state.timing ?? createActionTimingState())
      : state.timing ?? createActionTimingState(),
  };

  if (placed.state.status !== 'playing') {
    return {
      ok: true,
      consumedTurn: true,
      state: {
        ...afterPlacement,
        abilities: advanceAbilityEconomyAfterTurn(afterPlacement.abilities, actor),
        boardEffects: advanceBoardEffectsAfterTurn(afterPlacement.boardEffects, actor),
        timing: clearFollowUp(afterPlacement.timing ?? createActionTimingState()),
      },
    };
  }

  if (canOpenTriggeredSever(afterPlacement, actor, heroId)) {
    return {
      ok: true,
      consumedTurn: false,
      state: { ...afterPlacement, timing: triggeredSeverTiming(actor) },
    };
  }

  return { ok: true, consumedTurn: true, state: finishLogicalTurn(afterPlacement, actor) };
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

  if (action.kind === 'end-follow-up') {
    const pending = state.timing?.pendingFollowUp;
    if (!pending || pending.actor !== action.actor || pending.abilityId !== action.sourceAbilityId || pending.kind !== 'triggered') {
      return { ok: false, state, consumedTurn: false, error: 'follow-up-unavailable' };
    }
    return { ok: true, state: finishLogicalTurn(state, action.actor), consumedTurn: true };
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

    return resolvePlacementTurn(state, action.actor, action.action.at, heroId);
  }

  return resolvePlacementTurn(state, action.actor, action.at, heroId);
}
