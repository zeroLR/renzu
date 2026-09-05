import { describe, expect, it } from 'vitest';
import { boardLineBounds, boardPoint, boardSpacing } from '../src/presentation/screens/board-geometry';

const geometry = {
  originX: 33,
  originY: 190,
  size: 324,
  inset: 18,
  logicalSize: 9,
};

describe('gomoku board geometry', () => {
  it('maps nine logical positions onto nine line intersections', () => {
    expect(boardSpacing(geometry)).toBe(36);
    expect(boardPoint(geometry, { row: 0, col: 0 })).toEqual({ x: 51, y: 208 });
    expect(boardPoint(geometry, { row: 4, col: 4 })).toEqual({ x: 195, y: 352 });
    expect(boardPoint(geometry, { row: 8, col: 8 })).toEqual({ x: 339, y: 496 });
  });

  it('uses the first and last intersections as the visible line bounds', () => {
    expect(boardLineBounds(geometry)).toEqual({ left: 51, top: 208, right: 339, bottom: 496 });
  });
});
