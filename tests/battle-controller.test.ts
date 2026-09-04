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
  it('resolves a player placement and CPU response through the shared session pipeline', () => {
    const game = session();
    const controller = createBattleController(game, () => 0);

    controller.tapCell({ row: 4, col: 4 });

    expect(game.state.match.board[4][4]).toBe(1);
    expect(game.state.match.phase).toBe('player');
    expect(game.state.match.board.flat().filter((cell) => cell === 2).length).toBe(1);
    expect(game.state.match.turn).toBe(2);
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
