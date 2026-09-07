import { describe, expect, it } from 'vitest';
import { createMatchState } from '../src/game/match/match-state';
import { createAbilityStates } from '../src/heroes/economies/ability-state';
import { setAbilityResource } from '../src/heroes/economies/ability-economy';
import { listLegalActions } from '../src/game/action/legal-action';
import type { AbilityActionState } from '../src/game/action/ability-action';
import { aiDifficulty } from '../src/ai/difficulty/difficulty-profile';
import { chooseAction } from '../src/ai/decision/action-decision';

function createState(): AbilityActionState {
  const match = createMatchState();
  match.phase = 'opponent';
  return { match, abilities: createAbilityStates(), boardEffects: [] };
}

describe('AI decision and evaluation', () => {
  it('always takes an immediate win even on Easy', () => {
    const state = createState();
    state.match.board[4][1] = 2;
    state.match.board[4][2] = 2;
    state.match.board[4][3] = 2;
    state.match.board[4][4] = 2;
    const actions = listLegalActions(state, 'vanguard', 2);

    const decision = chooseAction(state, actions, 2, 'vanguard', aiDifficulty('easy'), () => 0.99);

    expect(decision?.action).toMatchObject({ kind: 'place', at: { row: 4, col: 0 } });
    expect(decision?.decisionReason).toBe('FORCED_TACTICAL');
    expect(decision?.regret).toBe(0);
  });

  it('always blocks an immediate player win even on Easy', () => {
    const state = createState();
    state.match.board[3][1] = 1;
    state.match.board[3][2] = 1;
    state.match.board[3][3] = 1;
    state.match.board[3][4] = 1;
    const actions = listLegalActions(state, 'vanguard', 2);

    const decision = chooseAction(state, actions, 2, 'vanguard', aiDifficulty('easy'), () => 0.99);

    expect(decision?.action).toMatchObject({ kind: 'place', at: { row: 3, col: 0 } });
    expect(decision?.decisionReason).toBe('FORCED_TACTICAL');
  });

  it('recognizes a Charge push that creates an immediate win', () => {
    const state = createState();
    state.match.board[4][0] = 2;
    state.match.board[4][1] = 2;
    state.match.board[4][2] = 1;
    state.match.board[4][3] = 2;
    state.match.board[4][4] = 2;
    state.match.board[3][2] = 2;
    const actions = listLegalActions(state, 'vanguard', 2);

    const decision = chooseAction(state, actions, 2, 'vanguard', aiDifficulty('easy'), () => 0.99);

    expect(decision?.action).toMatchObject({
      kind: 'ability',
      abilityId: 'charge',
      source: { row: 3, col: 2 },
      target: { row: 4, col: 2 },
    });
    expect(decision?.reasons).toContain('IMMEDIATE_WIN');
    expect(decision?.decisionReason).toBe('FORCED_TACTICAL');
  });

  it('uses Corrupt when removing one shared stone clears multiple immediate threats', () => {
    const state = createState();
    state.abilities = setAbilityResource(state.abilities, 2, 'pressure', 3);
    for (const col of [1, 2, 3, 4]) state.match.board[4][col] = 1;
    for (const row of [1, 2, 3]) state.match.board[row][4] = 1;
    state.match.board[5][5] = 2;
    const actions = listLegalActions(state, 'shade', 2);

    const decision = chooseAction(state, actions, 2, 'shade', aiDifficulty('normal'), () => 0);

    expect(decision?.action).toMatchObject({ kind: 'ability', abilityId: 'corrupt', target: { row: 4, col: 4 } });
    expect(decision?.reasons).toContain('FORCED_BLOCK');
    expect(decision?.decisionReason).toBe('FORCED_TACTICAL');
  });

  it('returns null when there are no legal actions', () => {
    const state = createState();
    const decision = chooseAction(state, [], 2, 'vanguard', aiDifficulty('normal'), () => 0);
    expect(decision).toBeNull();
  });

  it('keeps Easy and Normal decisions inside the legal action set', () => {
    const state = createState();
    state.match.board[4][4] = 1;
    const actions = listLegalActions(state, 'vanguard', 2);

    const easy = chooseAction(state, actions, 2, 'vanguard', aiDifficulty('easy'), () => 0.99);
    const normal = chooseAction(state, actions, 2, 'vanguard', aiDifficulty('normal'), () => 0);

    expect(actions).toContainEqual(easy?.action);
    expect(actions).toContainEqual(normal?.action);
  });

  it('exposes bounded decision regret for difficulty variance', () => {
    const state = createState();
    const actions = listLegalActions(state, 'vanguard', 2);
    const decision = chooseAction(state, actions, 2, 'vanguard', aiDifficulty('easy'), () => 0.99);

    expect(decision).not.toBeNull();
    expect(decision!.regret).toBeGreaterThanOrEqual(0);
    expect(decision!.regret).toBeLessThanOrEqual(decision!.bestScore * aiDifficulty('easy').blunderTolerance + 0.0001);
  });
});
