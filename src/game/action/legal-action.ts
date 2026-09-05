import { activePlayer, type MatchState } from '../match/match-state';
import { isBlocked, type BoardEffect } from '../combat/board-effects';
import type { Player, Position } from '../board/board';
import { heroes, type AbilityId, type HeroId } from '../../heroes/domain/hero-definition';
import type { AbilityActionState } from './ability-action';
import { resolveAbilityAction } from './ability-action';

export type LegalAction = PlaceAction | AbilityAction | FollowUpAction;

export interface PlaceAction {
  kind: 'place';
  actor: Player;
  at: Position;
}

export interface AbilityAction {
  kind: 'ability';
  actor: Player;
  heroId: HeroId;
  abilityId: AbilityId;
  target: Position;
  source?: Position;
}

export interface FollowUpAction {
  kind: 'follow-up';
  actor: Player;
  sourceAbilityId: AbilityId;
  action: PlaceAction | AbilityAction;
}

const SUPPORTED_ABILITIES = new Set<AbilityId>([
  'blink',
  'guard',
  'charge',
  'seal',
  'phase',
  'corrupt',
  'step',
  'sever',
]);

export function listLegalPlaceActions(
  match: MatchState,
  actor: Player,
  effects: readonly BoardEffect[] = [],
): PlaceAction[] {
  if (activePlayer(match) !== actor) return [];
  const actions: PlaceAction[] = [];
  match.board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const at = { row: rowIndex, col: colIndex };
      if (cell === 0 && !isBlocked(effects, at)) actions.push({ kind: 'place', actor, at });
    });
  });
  return actions;
}

function ownPositions(state: AbilityActionState, actor: Player): Position[] {
  const positions: Position[] = [];
  state.match.board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell === actor) positions.push({ row: rowIndex, col: colIndex });
    });
  });
  return positions;
}

function boardPositions(state: AbilityActionState): Position[] {
  return state.match.board.flatMap((row, rowIndex) =>
    row.map((_, colIndex) => ({ row: rowIndex, col: colIndex })),
  );
}

export function listLegalAbilityActions(
  state: AbilityActionState,
  heroId: HeroId,
  actor: Player,
): AbilityAction[] {
  if (activePlayer(state.match) !== actor) return [];

  const actions: AbilityAction[] = [];
  const targets = boardPositions(state);
  const sources = ownPositions(state, actor);
  const abilities = heroes[heroId].skillPool.filter((abilityId) => SUPPORTED_ABILITIES.has(abilityId));

  for (const abilityId of abilities) {
    if (abilityId === 'step') {
      const candidate: AbilityAction = { kind: 'ability', actor, heroId, abilityId, target: { row: 0, col: 0 } };
      if (resolveAbilityAction(state, candidate).ok) actions.push(candidate);
      continue;
    }

    const needsSource = abilityId === 'blink' || abilityId === 'charge' || abilityId === 'sever';
    if (needsSource) {
      for (const source of sources) {
        for (const target of targets) {
          const candidate: AbilityAction = { kind: 'ability', actor, heroId, abilityId, target, source };
          if (resolveAbilityAction(state, candidate).ok) actions.push(candidate);
        }
      }
      continue;
    }

    for (const target of targets) {
      const candidate: AbilityAction = { kind: 'ability', actor, heroId, abilityId, target };
      if (resolveAbilityAction(state, candidate).ok) actions.push(candidate);
    }
  }

  return actions;
}

export function listLegalActions(
  state: AbilityActionState,
  heroId: HeroId,
  actor: Player,
): LegalAction[] {
  const pending = state.timing?.pendingFollowUp;
  if (pending?.actor === actor && pending.kind === 'precommit') {
    return listLegalPlaceActions(state.match, actor, state.boardEffects).map((action) => ({
      kind: 'follow-up' as const,
      actor,
      sourceAbilityId: pending.abilityId,
      action,
    }));
  }

  const place = listLegalPlaceActions(state.match, actor, state.boardEffects);
  const abilities = listLegalAbilityActions(state, heroId, actor);
  return [...place, ...abilities];
}
