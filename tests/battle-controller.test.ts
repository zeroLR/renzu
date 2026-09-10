import { describe, expect, it } from 'vitest';
import { createBattleController } from '../src/app/game-session/battle-controller';
import { createGameSession } from '../src/app/game-session/create-game-session';

const session = () => createGameSession({
  mode: { kind: 'free-battle' }, playerHeroId: 'vanguard', cpuHeroId: 'vanguard', cpuDifficulty: 'normal',
});

describe('battle interaction controller', () => {
  it('leaves a visible opponent phase before resolving exactly one CPU response', async () => {
    const game = session();
    const controller = createBattleController(game, () => 0);
    controller.tapCell({ row: 4, col: 4 });
    expect(game.state.match.board[4][4]).toBe(1);
    expect(game.state.match.phase).toBe('opponent');
    expect(game.state.match.board.flat().filter((cell) => cell === 2).length).toBe(0);

    const phases: string[] = [];
    await controller.advanceCpuTurn(() => phases.push(game.state.match.phase), { delay: async () => undefined, thinkDelayMs: 0 });

    expect(game.state.match.phase).toBe('player');
    expect(game.state.match.board.flat().filter((cell) => cell === 2).length).toBe(1);
    expect(game.state.match.turn).toBe(2);
    expect(game.state.match.actionHistory).toHaveLength(2);
    expect(phases).toContain('opponent');
    expect(phases.at(-1)).toBe('player');
    expect(controller.interaction().cpuThinking).toBe(false);
  });

  it('derives ability readiness from legal actions', () => {
    const controller = createBattleController(session(), () => 0);
    const abilities = controller.legalActions().filter((action) => action.kind === 'ability');
    expect(abilities.every((action) => action.actor === 1)).toBe(true);
  });

  it('projects legal sources first, then targets for a source-target ability', () => {
    const game = session();
    game.state.match.board[4][4] = 1;
    const controller = createBattleController(game, () => 0);
    controller.selectAbility('charge');
    const sourceStep = controller.targeting();
    expect(sourceStep).toMatchObject({ abilityId: 'charge', phase: 'select-source' });
    expect(sourceStep.sources).toEqual([{ row: 4, col: 4 }]);
    expect(sourceStep.targets).toEqual([]);

    controller.tapCell({ row: 4, col: 4 });
    const targetStep = controller.targeting();
    expect(targetStep).toMatchObject({ abilityId: 'charge', phase: 'select-target' });
    expect(targetStep.sources).toEqual([{ row: 4, col: 4 }]);
    expect(targetStep.targets).toHaveLength(8);
    expect(targetStep.targets).toContainEqual({ row: 4, col: 5 });
    expect(targetStep.targets).toContainEqual({ row: 3, col: 3 });
  });

  it('projects targets directly for an ability without a source-selection step', () => {
    const game = session();
    game.state.match.board[4][4] = 1;
    const controller = createBattleController(game, () => 0);
    controller.selectAbility('guard');
    expect(controller.targeting()).toEqual({ abilityId: 'guard', phase: 'select-target', sources: [], targets: [{ row: 4, col: 4 }] });
    controller.clearSelection();
    expect(controller.targeting()).toEqual({ abilityId: null, phase: 'idle', sources: [], targets: [] });
  });

  it('reports a hero-inaccessible ability without mutating the match', () => {
    const game = session();
    const controller = createBattleController(game, () => 0);
    controller.selectAbility('corrupt');
    expect(controller.interaction().lastError).toBe('ability-unavailable');
    expect(game.state.match.turn).toBe(1);
    expect(game.state.match.board.flat().every((cell) => cell === 0)).toBe(true);
  });
});
