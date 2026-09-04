import { longestLine, type Board, type Player, type Position } from '../../game/board/board';
import type { LegalAction } from '../../game/action/legal-action';
import type { AiDifficultyProfile } from '../difficulty/difficulty-profile';

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

function actionTarget(action: LegalAction): Position {
  if (action.kind === 'place') return action.at;
  if (action.kind === 'follow-up') return action.action.kind === 'place' ? action.action.at : action.action.target;
  return action.target;
}

function placementLike(action: LegalAction): boolean {
  return action.kind === 'place' || (action.kind === 'follow-up' && action.action.kind === 'place');
}

export function evaluateAction(
  board: Board,
  action: LegalAction,
  actor: Player,
  profile: AiDifficultyProfile,
): EvaluatedAction {
  const target = actionTarget(action);
  const enemy: Player = actor === 1 ? 2 : 1;
  const reasons: string[] = [];

  if (placementLike(action)) {
    const attack = linePotential(board, target, actor);
    const defense = linePotential(board, target, enemy);
    const position = centerScore(board, target);

    if (attack >= 100_000) {
      return { action, score: WIN_SCORE, breakdown: { attack, defense, position, ability: 0, total: WIN_SCORE }, reasons: ['IMMEDIATE_WIN'] };
    }
    if (defense >= 100_000) {
      return { action, score: BLOCK_SCORE, breakdown: { attack, defense, position, ability: 0, total: BLOCK_SCORE }, reasons: ['FORCED_BLOCK'] };
    }

    const total = attack * profile.attackWeight + defense * profile.defenseWeight + position;
    if (attack >= 3_200) reasons.push('ATTACK_PATTERN');
    if (defense >= 3_200) reasons.push('DEFEND_PATTERN');
    if (position >= 32) reasons.push('CENTER_CONTROL');
    if (!reasons.length) reasons.push('POSITIONAL');
    return { action, score: total, breakdown: { attack, defense, position, ability: 0, total }, reasons };
  }

  const ability = 160 * profile.abilityWeight + centerScore(board, target) * 0.25;
  return {
    action,
    score: ability,
    breakdown: { attack: 0, defense: 0, position: 0, ability, total: ability },
    reasons: ['ABILITY_OPPORTUNITY'],
  };
}

export function rankActions(
  board: Board,
  actions: readonly LegalAction[],
  actor: Player,
  profile: AiDifficultyProfile,
): EvaluatedAction[] {
  return actions.map((action) => evaluateAction(board, action, actor, profile)).sort((a, b) => b.score - a.score);
}
