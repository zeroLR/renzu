import type { AbilityId } from '../../heroes/domain/hero-definition';
import type { Player } from '../board/board';

export type AbilityActionTiming =
  | 'standard'
  | 'free'
  | 'precommit-follow-up'
  | 'triggered-follow-up';

export interface PendingFollowUp {
  actor: Player;
  abilityId: AbilityId;
  kind: 'precommit' | 'triggered';
}

export interface ActionTimingState {
  pendingFollowUp: PendingFollowUp | null;
}

export const createActionTimingState = (): ActionTimingState => ({ pendingFollowUp: null });

export function beginAbilityTiming(
  state: ActionTimingState,
  actor: Player,
  abilityId: AbilityId,
  timing: AbilityActionTiming,
): ActionTimingState {
  if (timing === 'precommit-follow-up') {
    return { pendingFollowUp: { actor, abilityId, kind: 'precommit' } };
  }
  if (timing === 'triggered-follow-up') {
    return { pendingFollowUp: { actor, abilityId, kind: 'triggered' } };
  }
  return state;
}

export function clearFollowUp(state: ActionTimingState): ActionTimingState {
  return state.pendingFollowUp ? { pendingFollowUp: null } : state;
}

export function abilityConsumesTurn(timing: AbilityActionTiming): boolean {
  return timing === 'standard' || timing === 'triggered-follow-up';
}

export function canResolveFollowUp(state: ActionTimingState, actor: Player): boolean {
  return state.pendingFollowUp?.actor === actor;
}
