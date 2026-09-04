import { advanceBoardEffectsAfterTurn } from '../combat/board-effects';
import { clearFollowUp, createActionTimingState } from './action-timing';
import { resolveAbilityAction, type AbilityActionResult, type AbilityActionState } from './ability-action';
import type { LegalAction } from './legal-action';
import { resolvePlaceAction } from './place-action';

export type SessionActionResult =
  | { ok: true; state: AbilityActionState; consumedTurn: boolean }
  | { ok: false; state: AbilityActionState; consumedTurn: false; error: string };

export function resolveSessionAction(state: AbilityActionState, action: LegalAction): SessionActionResult {
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

    const placed = resolvePlaceAction(state.match, action.actor, action.action.at);
    if (!placed.ok) return { ok: false, state, consumedTurn: false, error: placed.error };

    return {
      ok: true,
      consumedTurn: true,
      state: {
        ...state,
        match: placed.state,
        boardEffects: advanceBoardEffectsAfterTurn(state.boardEffects, action.actor),
        timing: clearFollowUp(state.timing ?? createActionTimingState()),
      },
    };
  }

  const placed = resolvePlaceAction(state.match, action.actor, action.at);
  if (!placed.ok) return { ok: false, state, consumedTurn: false, error: placed.error };

  return {
    ok: true,
    consumedTurn: true,
    state: {
      ...state,
      match: placed.state,
      boardEffects: advanceBoardEffectsAfterTurn(state.boardEffects, action.actor),
      timing: state.timing ?? createActionTimingState(),
    },
  };
}
