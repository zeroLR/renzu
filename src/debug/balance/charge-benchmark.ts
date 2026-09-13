import { aiDifficulty, type AiDifficultyProfile } from '../../ai/difficulty/difficulty-profile';
import { resolveAiTurn } from '../../app/game-session/cpu-turn';
import type { AbilityActionState } from '../../game/action/ability-action';
import { createBoard, type Board, type Position } from '../../game/board/board';
import { createMatchState } from '../../game/match/match-state';
import { createAbilityStates } from '../../heroes/economies/ability-state';
import { createSeededRandom } from './balance-simulation';

export interface ChargeBenchmarkCase {
  id: string;
  state: AbilityActionState;
  target: Position;
}

export interface ChargeBenchmarkCaseResult {
  id: string;
  selectedCharge: boolean;
  immediateWin: boolean;
  score: number | null;
  reasons: readonly string[];
}

export interface ChargeBenchmarkResult {
  cases: readonly ChargeBenchmarkCaseResult[];
  total: number;
  chargeSelections: number;
  immediateWins: number;
  chargeSelectionRate: number;
  immediateWinRate: number;
}

function stateFromBoard(board: Board): AbilityActionState {
  return {
    match: createMatchState(board),
    abilities: createAbilityStates(),
    boardEffects: [],
  };
}

function horizontalCase(id: string, row: number, reverse = false): ChargeBenchmarkCase {
  const board = createBoard();
  if (!reverse) {
    for (let col = 0; col <= 3; col += 1) board[row][col] = 1;
    board[row][4] = 2;
    board[row - 1][3] = 1;
    return { id, state: stateFromBoard(board), target: { row, col: 4 } };
  }

  for (let col = 5; col <= 8; col += 1) board[row][col] = 1;
  board[row][4] = 2;
  board[row - 1][5] = 1;
  return { id, state: stateFromBoard(board), target: { row, col: 4 } };
}

function verticalCase(id: string, col: number, reverse = false): ChargeBenchmarkCase {
  const board = createBoard();
  if (!reverse) {
    for (let row = 0; row <= 3; row += 1) board[row][col] = 1;
    board[4][col] = 2;
    board[3][col - 1] = 1;
    return { id, state: stateFromBoard(board), target: { row: 4, col } };
  }

  for (let row = 5; row <= 8; row += 1) board[row][col] = 1;
  board[4][col] = 2;
  board[5][col - 1] = 1;
  return { id, state: stateFromBoard(board), target: { row: 4, col } };
}

export function chargeBenchmarkCases(): readonly ChargeBenchmarkCase[] {
  return [
    horizontalCase('H2-L', 2),
    horizontalCase('H4-L', 4),
    horizontalCase('H6-L', 6),
    horizontalCase('H2-R', 2, true),
    horizontalCase('H4-R', 4, true),
    horizontalCase('H6-R', 6, true),
    verticalCase('V2-T', 2),
    verticalCase('V4-T', 4),
    verticalCase('V6-T', 6),
    verticalCase('V2-B', 2, true),
    verticalCase('V4-B', 4, true),
    verticalCase('V6-B', 6, true),
  ];
}

export function runChargeTacticalBenchmark(
  profile: AiDifficultyProfile = aiDifficulty('normal'),
  seed = 7001,
): ChargeBenchmarkResult {
  const cases = chargeBenchmarkCases().map((scenario, index): ChargeBenchmarkCaseResult => {
    const turn = resolveAiTurn(scenario.state, 1, {
      heroId: 'vanguard',
      profile,
      random: createSeededRandom(seed + index * 7919),
    });
    if (!turn.ok) {
      return {
        id: scenario.id,
        selectedCharge: false,
        immediateWin: false,
        score: null,
        reasons: [turn.error, turn.resolutionError ?? ''],
      };
    }

    const action = turn.decision.action;
    const selectedCharge = action.kind === 'ability'
      && action.abilityId === 'charge'
      && action.target.row === scenario.target.row
      && action.target.col === scenario.target.col;
    return {
      id: scenario.id,
      selectedCharge,
      immediateWin: selectedCharge && turn.state.match.status === 'victory',
      score: turn.decision.score,
      reasons: [...turn.decision.reasons],
    };
  });

  const chargeSelections = cases.filter((scenario) => scenario.selectedCharge).length;
  const immediateWins = cases.filter((scenario) => scenario.immediateWin).length;
  return {
    cases,
    total: cases.length,
    chargeSelections,
    immediateWins,
    chargeSelectionRate: cases.length ? chargeSelections / cases.length : 0,
    immediateWinRate: cases.length ? immediateWins / cases.length : 0,
  };
}
