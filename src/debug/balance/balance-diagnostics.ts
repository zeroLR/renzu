import { aiDifficulty, type AiDifficultyProfile } from '../../ai/difficulty/difficulty-profile';
import { resolveAiTurn } from '../../app/game-session/cpu-turn';
import { createGameSession } from '../../app/game-session/create-game-session';
import { listLegalActions } from '../../game/action/legal-action';
import type { Player } from '../../game/board/board';
import { activePlayer } from '../../game/match/match-state';
import type { BoardEffectKind } from '../../game/combat/board-effects';
import type { HeroId } from '../../heroes/domain/hero-definition';
import { createSeededRandom } from './balance-simulation';

export interface BalanceDiagnosticConfig {
  p1Hero: HeroId;
  p2Hero: HeroId;
  seed: number;
  maxActions?: number;
  profile?: AiDifficultyProfile;
}

export interface BalanceFailureDiagnostic {
  reason: 'not-actor-turn' | 'no-legal-action' | 'resolution-failed';
  resolutionError?: string;
  actionIndex: number;
  actor: Player;
  heroId: HeroId;
  legalActionCount: number;
  emptyCells: number;
  blockedEmptyCells: number;
  boardEffects: Readonly<Record<BoardEffectKind, number>>;
  mana: number;
  pressure: number;
}

export interface BalanceDiagnosticResult {
  completed: boolean;
  actions: number;
  failure: BalanceFailureDiagnostic | null;
}

function summarizeEffects(kinds: readonly { kind: BoardEffectKind }[]): Record<BoardEffectKind, number> {
  const counts: Record<BoardEffectKind, number> = { guard: 0, seal: 0, corruption: 0, flame: 0 };
  for (const effect of kinds) counts[effect.kind] += 1;
  return counts;
}

export function diagnoseBalanceMatch(config: BalanceDiagnosticConfig): BalanceDiagnosticResult {
  const session = createGameSession({
    mode: { kind: 'free-battle' },
    playerHeroId: config.p1Hero,
    cpuHeroId: config.p2Hero,
    cpuDifficulty: 'normal',
  });
  let state = session.state;
  const random = createSeededRandom(config.seed);
  const profile = config.profile ?? aiDifficulty('normal');
  const maxActions = config.maxActions ?? 120;

  for (let actionIndex = 0; actionIndex < maxActions && state.match.status === 'playing'; actionIndex += 1) {
    const actor = activePlayer(state.match);
    if (!actor) break;
    const heroId = actor === 1 ? config.p1Hero : config.p2Hero;
    const legalActions = listLegalActions(state, heroId, actor);
    const turn = resolveAiTurn(state, actor, { heroId, profile, random });

    if (!turn.ok) {
      let emptyCells = 0;
      let blockedEmptyCells = 0;
      for (let row = 0; row < state.match.board.length; row += 1) {
        for (let col = 0; col < state.match.board[row].length; col += 1) {
          if (state.match.board[row][col] !== 0) continue;
          emptyCells += 1;
          const blocked = state.boardEffects.some((effect) =>
            (effect.kind === 'seal' || effect.kind === 'flame' || effect.kind === 'corruption')
            && effect.at.row === row
            && effect.at.col === col,
          );
          if (blocked) blockedEmptyCells += 1;
        }
      }

      return {
        completed: false,
        actions: actionIndex,
        failure: {
          reason: turn.error,
          resolutionError: turn.resolutionError,
          actionIndex,
          actor,
          heroId,
          legalActionCount: legalActions.length,
          emptyCells,
          blockedEmptyCells,
          boardEffects: summarizeEffects(state.boardEffects),
          mana: state.abilities[actor].resources.mana,
          pressure: state.abilities[actor].resources.pressure,
        },
      };
    }

    state = turn.state;
  }

  return {
    completed: state.match.status !== 'playing',
    actions: state.match.actionHistory.length,
    failure: null,
  };
}
