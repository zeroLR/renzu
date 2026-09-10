import type { Player, Position } from '../board/board';
import { activePlayer } from '../match/match-state';
import { createBoardEffect, isGuarded, type BoardEffect } from '../combat/board-effects';
import {
  canActivate,
  consumeActivation,
  type AbilityActivationRule,
} from '../../heroes/economies/ability-economy';
import type { AbilityStates } from '../../heroes/economies/ability-state';
import { heroes, isAbilityAccessible, type HeroId } from '../../heroes/domain/hero-definition';
import type { AbilityActionState } from './ability-action';

export type PlacementSupportAbilityId = 'guard';

export interface PlacementSupport {
  abilityId: PlacementSupportAbilityId;
  target: Position;
}

export type PlacementSupportError =
  | 'wrong-phase'
  | 'ability-unavailable'
  | 'activation-unavailable'
  | 'invalid-target';

export type PreparedPlacementSupport = {
  support: PlacementSupport;
  activation: AbilityActivationRule;
  effect: BoardEffect;
};

function activationFor(heroId: HeroId, abilityId: PlacementSupportAbilityId): AbilityActivationRule | null {
  return heroes[heroId].activationOverrides[abilityId] ?? null;
}

export function listLegalPlacementSupportTargets(
  state: AbilityActionState,
  heroId: HeroId,
  actor: Player,
  abilityId: PlacementSupportAbilityId = 'guard',
): Position[] {
  if (state.match.status !== 'playing' || activePlayer(state.match) !== actor) return [];
  if (!isAbilityAccessible(heroId, abilityId)) return [];

  const activation = activationFor(heroId, abilityId);
  if (!activation || !canActivate(state.abilities, actor, activation, abilityId).ready) return [];

  const targets: Position[] = [];
  state.match.board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const target = { row: rowIndex, col: colIndex };
      if (cell === actor && !isGuarded(state.boardEffects, target)) targets.push(target);
    });
  });
  return targets;
}

export function preparePlacementSupport(
  state: AbilityActionState,
  heroId: HeroId | undefined,
  actor: Player,
  support: PlacementSupport,
): { ok: true; prepared: PreparedPlacementSupport } | { ok: false; error: PlacementSupportError } {
  if (state.match.status !== 'playing' || activePlayer(state.match) !== actor) {
    return { ok: false, error: 'wrong-phase' };
  }
  if (!heroId || !isAbilityAccessible(heroId, support.abilityId)) {
    return { ok: false, error: 'ability-unavailable' };
  }

  const activation = activationFor(heroId, support.abilityId);
  if (!activation || !canActivate(state.abilities, actor, activation, support.abilityId).ready) {
    return { ok: false, error: 'activation-unavailable' };
  }

  const { target } = support;
  if (state.match.board[target.row]?.[target.col] !== actor || isGuarded(state.boardEffects, target)) {
    return { ok: false, error: 'invalid-target' };
  }

  return {
    ok: true,
    prepared: {
      support,
      activation,
      effect: createBoardEffect('guard', target, actor, { kind: 'owner-turns', remaining: 2 }),
    },
  };
}

export function consumePlacementSupport(
  abilities: AbilityStates,
  actor: Player,
  prepared: PreparedPlacementSupport,
): AbilityStates {
  return consumeActivation(
    abilities,
    actor,
    prepared.activation,
    prepared.support.abilityId,
  );
}
