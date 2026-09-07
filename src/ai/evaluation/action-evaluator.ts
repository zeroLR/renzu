import { longestLine, type Board, type Player, type Position } from '../../game/board/board';
import type { LegalAction } from '../../game/action/legal-action';
import type { AbilityActionState } from '../../game/action/ability-action';
import type { HeroId } from '../../heroes/domain/hero-definition';
import type { AiDifficultyProfile } from '../difficulty/difficulty-profile';
import { simulateTacticalAction } from './tactical-simulation';

export interface ActionScoreBreakdown {
  attack: number;
  defense: number;
  position: number;
  ability: number;
  total: number;
}

export interface EvaluatedAction {
  action: LegalAction;
  score: number;
  breakdown: ActionScoreBreakdown;
  reasons: readonly string[];
}

const WIN_SCORE = 1_000_000;
const BLOCK_SCORE = 900_000;

function centerScore(board: Board, at: Position): number {
  const center = (board.length - 1) / 2;
  return 40 - (Math.abs(at.row - center) + Math.abs(at.col - center)) * 4;
}

function linePotential(board: Board, at: Position, player: Player): number {
  if (board[at.row]?.[at.col] !== 0) return Number.NEGATIVE_INFINITY;
  const next = board.map((row) => [...row]);
  next[at.row][at.col] = player;
  const length = longestLine(next, at, player);
  if (length >= 5) return 100_000;
  if (length === 4) return 18_000;
  if (length === 3) return 3_200;
  if (length === 2) return 280;
  return 12;
}

function actionTarget(action: Exclude<LegalAction, { kind: 'end-follow-up' }>): Position {
  if (action.kind === 'place') return action.at;
  if (action.kind === 'follow-up') return action.action.kind === 'place' ? action.action.at : action.action.target;
  return action.target;
}

function placementLike(action: LegalAction): boolean {
  return action.kind === 'place' || (action.kind === 'follow-up' && action.action.kind === 'place');
}

function evaluatePlacement(
  state: AbilityActionState,
  action: LegalAction,
  actor: Player,
  heroId: HeroId,
  profile: AiDifficultyProfile,
): EvaluatedAction {
  if (action.kind === 'end-follow-up') {
    return {
      action,
      score: 0,
      breakdown: { attack: 0, defense: 0, position: 0, ability: 0, total: 0 },
      reasons: ['FOLLOW_UP_SKIP'],
    };
  }

  const board = state.match.board;
  const target = actionTarget(action);
  const enemy: Player = actor === 1 ? 2 : 1;
  const reasons: string[] = [];
  const attack = linePotential(board, target, actor);
  const defense = linePotential(board, target, enemy);
  const position = centerScore(board, target);
  const simulation = simulateTacticalAction(state, action, actor, heroId);

  if (simulation?.immediateWin || attack >= 100_000) {
    return { action, score: WIN_SCORE, breakdown: { attack, defense, position, ability: 0, total: WIN_SCORE }, reasons: ['IMMEDIATE_WIN'] };
  }
  if (simulation && simulation.enemyThreatsBefore > 0 && simulation.enemyThreatsAfter === 0) {
    return { action, score: BLOCK_SCORE, breakdown: { attack, defense: BLOCK_SCORE, position, ability: 0, total: BLOCK_SCORE }, reasons: ['FORCED_BLOCK'] };
  }

  const total = attack * profile.attackWeight + defense * profile.defenseWeight + position;
  if (attack >= 3_200) reasons.push('ATTACK_PATTERN');
  if (defense >= 3_200) reasons.push('DEFEND_PATTERN');
  if (simulation && simulation.enemyThreatsAfter < simulation.enemyThreatsBefore) reasons.push('THREAT_REDUCTION');
  if (position >= 32) reasons.push('CENTER_CONTROL');
  if (!reasons.length) reasons.push('POSITIONAL');
  return { action, score: total, breakdown: { attack, defense, position, ability: 0, total }, reasons };
}

function evaluateAbility(
  state: AbilityActionState,
  action: LegalAction,
  actor: Player,
  heroId: HeroId,
  profile: AiDifficultyProfile,
): EvaluatedAction {
  if (action.kind === 'end-follow-up') {
    return {
      action,
      score: 0,
      breakdown: { attack: 0, defense: 0, position: 0, ability: 0, total: 0 },
      reasons: ['FOLLOW_UP_SKIP'],
    };
  }

  const target = actionTarget(action);
  const simulation = simulateTacticalAction(state, action, actor, heroId);
  if (!simulation) {
    return {
      action,
      score: Number.NEGATIVE_INFINITY,
      breakdown: { attack: 0, defense: 0, position: 0, ability: Number.NEGATIVE_INFINITY, total: Number.NEGATIVE_INFINITY },
      reasons: ['SIMULATION_FAILED'],
    };
  }

  if (simulation.immediateWin) {
    return {
      action,
      score: WIN_SCORE,
      breakdown: { attack: WIN_SCORE, defense: 0, position: 0, ability: 0, total: WIN_SCORE },
      reasons: ['IMMEDIATE_WIN', 'ABILITY_OUTCOME'],
    };
  }

  const threatsRemoved = Math.max(0, simulation.enemyThreatsBefore - simulation.enemyThreatsAfter);
  if (simulation.enemyThreatsBefore > 0 && simulation.enemyThreatsAfter === 0) {
    return {
      action,
      score: BLOCK_SCORE,
      breakdown: { attack: 0, defense: BLOCK_SCORE, position: 0, ability: 0, total: BLOCK_SCORE },
      reasons: ['FORCED_BLOCK', 'ABILITY_OUTCOME'],
    };
  }

  const ownLineGain = Math.max(0, simulation.ownLineAfter - simulation.ownLineBefore);
  const enemyLineReduction = Math.max(0, simulation.enemyLineBefore - simulation.enemyLineAfter);
  const attack = ownLineGain * 6_000 * profile.attackWeight
    + (simulation.ownLineAfter >= 4 ? 12_000 : simulation.ownLineAfter >= 3 ? 2_400 : 0);
  const defense = threatsRemoved * 120_000 * profile.defenseWeight
    + enemyLineReduction * 7_000 * profile.defenseWeight
    + simulation.enemyStonesRemoved * 5_000 * profile.defenseWeight;
  const position = centerScore(state.match.board, target) * 0.25;
  const ability = (160 + simulation.newDenials * 700) * profile.abilityWeight;
  const total = attack + defense + position + ability;
  const reasons: string[] = ['ABILITY_OUTCOME'];

  if (threatsRemoved > 0) reasons.push('THREAT_REDUCTION');
  if (simulation.enemyStonesRemoved > 0) reasons.push('ENEMY_STONE_REMOVED');
  if (ownLineGain > 0) reasons.push('TOPOLOGY_GAIN');
  if (enemyLineReduction > 0) reasons.push('TOPOLOGY_DENIAL');
  if (simulation.newDenials > 0) reasons.push('DENIAL_VALUE');
  if (reasons.length === 1) reasons.push('ABILITY_OPPORTUNITY');

  return { action, score: total, breakdown: { attack, defense, position, ability, total }, reasons };
}

export function evaluateAction(
  state: AbilityActionState,
  action: LegalAction,
  actor: Player,
  heroId: HeroId,
  profile: AiDifficultyProfile,
): EvaluatedAction {
  return placementLike(action)
    ? evaluatePlacement(state, action, actor, heroId, profile)
    : evaluateAbility(state, action, actor, heroId, profile);
}

export function rankActions(
  state: AbilityActionState,
  actions: readonly LegalAction[],
  actor: Player,
  heroId: HeroId,
  profile: AiDifficultyProfile,
): EvaluatedAction[] {
  return actions.map((action) => evaluateAction(state, action, actor, heroId, profile)).sort((a, b) => b.score - a.score);
}
