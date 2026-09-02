import { describe, expect, it } from 'vitest';
import { createMatchState } from '../src/game/match/match-state';
import { resolvePlaceAction } from '../src/game/action/place-action';

describe('place action resolution', () => {
  it('places for the active player, records history, and hands off the turn', () => {
    const result = resolvePlaceAction(createMatchState(), 1, { row: 4, col: 4 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.board[4][4]).toBe(1);
    expect(result.state.phase).toBe('opponent');
    expect(result.state.turn).toBe(2);
    expect(result.state.actionHistory).toEqual([
      { turn: 1, actor: 1, kind: 'place', at: { row: 4, col: 4 } },
    ]);
  });

  it('rejects occupied cells without consuming the turn or mutating the board', () => {
    const first = resolvePlaceAction(createMatchState(), 1, { row: 0, col: 0 });
    if (!first.ok) throw new Error('expected initial placement to succeed');
    const opponent = resolvePlaceAction(first.state, 2, { row: 0, col: 0 });
    expect(opponent.ok).toBe(false);
    if (opponent.ok) return;
    expect(opponent.error).toBe('occupied');
    expect(opponent.consumedTurn).toBe(false);
    expect(opponent.state.phase).toBe('opponent');
    expect(opponent.state.actionHistory).toHaveLength(1);
  });

  it('rejects actions from the wrong actor', () => {
    const result = resolvePlaceAction(createMatchState(), 2, { row: 0, col: 0 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('wrong-phase');
  });

  it('ends the match immediately when the player completes five in a row', () => {
    let state = createMatchState();
    const playerMoves = [0, 1, 2, 3, 4];
    for (let index = 0; index < playerMoves.length; index += 1) {
      const player = resolvePlaceAction(state, 1, { row: 0, col: playerMoves[index] });
      if (!player.ok) throw new Error('player move should succeed');
      state = player.state;
      if (index === playerMoves.length - 1) break;
      const opponent = resolvePlaceAction(state, 2, { row: 1, col: index });
      if (!opponent.ok) throw new Error('opponent move should succeed');
      state = opponent.state;
    }
    expect(state.status).toBe('victory');
    expect(state.phase).toBe('over');
    expect(state.actionHistory).toHaveLength(9);
  });
});
