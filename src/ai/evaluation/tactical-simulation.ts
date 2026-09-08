import { isBlocked, type BoardEffect } from '../../game/combat/board-effects';
import { isWinningMove, longestLine, type Board, type Player, type Position } from '../../game/board/board';
import { resolveSessionAction } from '../../game/action/action-session';
import type { LegalAction } from '../../game/action/legal-action';
import type { AbilityActionState } from '../../game/action/ability-action';
import type { AbilityStates } from '../../heroes/economies/ability-state';
import type { HeroId } from '../../heroes/domain/hero-definition';

export interface TacticalSimulation {
  state: AbilityActionState;
  immediateWin: boolean;
  enemyThreatsBefore: number;
  enemyThreatsAfter: number;
  ownLineBefore: number;
  ownLineAfter: number;
  enemyLineBefore: number;
  enemyLineAfter: number;
  enemyStonesRemoved: number;
  newDenials: number;
}

function cloneAbilities(abilities: AbilityStates): AbilityStates {
  return {
    1: {
      resources: { ...abilities[1].resources },
      cooldowns: { ...abilities[1].cooldowns },
      conditions: { ...abilities[1].conditions },
      charges: { ...abilities[1].charges },
      usesSpent: { ...abilities[1].usesSpent },
    },
    2: {
      resources: { ...abilities[2].resources },
      cooldowns: { ...abilities[2].cooldowns },
      conditions: { ...abilities[2].conditions },
      charges: { ...abilities[2].charges },
      usesSpent: { ...abilities[2].usesSpent },
    },
  };
}

function cloneState(state: AbilityActionState): AbilityActionState {
  return {
    match: {
      ...state.match,
      board: state.match.board.map((row) => [...row]),
      actionHistory: state.match.actionHistory.map((action) => ({
        ...action,
        at: { ...action.at },
        source: action.source ? { ...action.source } : undefined,
      })),
    },
    abilities: cloneAbilities(state.abilities),
    boardEffects: state.boardEffects.map((effect) => ({ ...effect, at: { ...effect.at }, expiry: { ...effect.expiry } })),
  };
}

function countStones(board: Board, player: Player): number {
  return board.reduce((total, row) => total + row.filter((cell) => cell === player).length, 0);
}

function maxLine(board: Board, player: Player): number {
  let best = 0;
  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell === player) best = Math.max(best, longestLine(board, { row: rowIndex, col: colIndex }, player));
    });
  });
  return best;
}

function immediateWinningTargets(board: Board, effects: readonly BoardEffect[], player: Player): Position[] {
  const targets: Position[] = [];
  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell !== 0) return;
      const at = { row: rowIndex, col: colIndex };
      if (isBlocked(effects, at)) return;
      const next = board.map((boardRow) => [...boardRow]);
      next[rowIndex][colIndex] = player;
      if (isWinningMove(next, at, player)) targets.push(at);
    });
  });
  return targets;
}

function denialCount(effects: readonly BoardEffect[], owner: Player): number {
  return effects.filter((effect) => effect.owner === owner && (effect.kind === 'seal' || effect.kind === 'corruption' || effect.kind === 'flame')).length;
}

export function simulateTacticalAction(
  state: AbilityActionState,
  action: LegalAction,
  actor: Player,
  heroId: HeroId,
): TacticalSimulation | null {
  const enemy: Player = actor === 1 ? 2 : 1;
  const enemyThreatsBefore = immediateWinningTargets(state.match.board, state.boardEffects, enemy).length;
  const ownLineBefore = maxLine(state.match.board, actor);
  const enemyLineBefore = maxLine(state.match.board, enemy);
  const enemyStonesBefore = countStones(state.match.board, enemy);
  const denialsBefore = denialCount(state.boardEffects, actor);

  const resolved = resolveSessionAction(cloneState(state), action, heroId);
  if (!resolved.ok) return null;

  const next = resolved.state;
  const actorWinStatus = actor === 1 ? 'victory' : 'defeat';

  return {
    state: next,
    immediateWin: next.match.status === actorWinStatus,
    enemyThreatsBefore,
    enemyThreatsAfter: next.match.status === 'playing'
      ? immediateWinningTargets(next.match.board, next.boardEffects, enemy).length
      : 0,
    ownLineBefore,
    ownLineAfter: maxLine(next.match.board, actor),
    enemyLineBefore,
    enemyLineAfter: maxLine(next.match.board, enemy),
    enemyStonesRemoved: Math.max(0, enemyStonesBefore - countStones(next.match.board, enemy)),
    newDenials: Math.max(0, denialCount(next.boardEffects, actor) - denialsBefore),
  };
}
