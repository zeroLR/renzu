import { describe, expect, it } from 'vitest';
import { createBattleController } from '../src/app/game-session/battle-controller';
import { createGameSession } from '../src/app/game-session/create-game-session';

const session = () => createGameSession({
  mode: { kind: 'free-battle' },
  playerHeroId: 'vanguard',
  cpuHeroId: 'vanguard',
  cpuDifficulty: 'normal',
});

describe('battle interaction controller', () => {
  it('leaves a visible opponent phase before resolving the CPU response', async () => {
    const game = session();
    const controller = createBattleController(game, () => 0);

    controller.tapCell({ row: 4, col: 4 });

    expect(game.state.match.board[4][4]).toBe(1);
    expect(game.state.match.phase).toBe('opponent');
    expect(game.state.match.board.flat().filter((cell) => cell === 2).length).toBe(0);
    expect(controller.interaction().cpuThinking).toBe(false);

    const phases: string[] = [];
    await controller.advanceCpuTurn(
      () => phases.push(game.state.match.phase),
      { delay: async () => undefined, thinkDelayMs: 0, followUpDelayMs: 0 },
    );

    expect(game.state.match.phase).toBe('player');
    expect(game.state.match.board.flat().filter((cell) => cell === 2).length).toBe(1);
    expect(game.state.match.turn).toBe(2);
    expect(phases).toContain('opponent');
    expect(phases.at(-1)).toBe('player');
    expect(controller.interaction().cpuThinking).toBe(false);
  });

  it('derives ability readiness from legal actions', () => {
    const controller = createBattleController(session(), () => 0);
    const abilities = controller.legalActions().filter((action) => action.kind === 'ability');
    expect(abilities.every((action) => action.actor === 1)).toBe(true);
  });

  it('reports an unavailable ability without mutating the match', () => {
    const game = session();
    const controller = createBattleController(game, () => 0);
    controller.selectAbility('blink');

    expect(controller.interaction().lastError).toBe('ability-unavailable');
    expect(game.state.match.turn).toBe(1);
    expect(game.state.match.board.flat().every((cell) => cell === 0)).toBe(true);
  });
});
