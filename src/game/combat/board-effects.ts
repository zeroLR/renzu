import type { Player, Position } from '../board/board';

export type BoardEffectKind = 'guard' | 'seal' | 'corruption';
export type EffectExpiry =
  | { kind: 'owner-turns'; remaining: number }
  | { kind: 'opponent-turns'; remaining: number }
  | { kind: 'match' };

export interface BoardEffect {
  kind: BoardEffectKind;
  at: Position;
  owner: Player;
  expiry: EffectExpiry;
}

export function createBoardEffect(
  kind: BoardEffectKind,
  at: Position,
  owner: Player,
  expiry: EffectExpiry,
): BoardEffect {
  return { kind, at, owner, expiry };
}

export function samePosition(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

export function hasBoardEffect(
  effects: readonly BoardEffect[],
  kind: BoardEffectKind,
  at: Position,
): boolean {
  return effects.some((effect) => effect.kind === kind && samePosition(effect.at, at));
}

export function isGuarded(effects: readonly BoardEffect[], at: Position): boolean {
  return hasBoardEffect(effects, 'guard', at);
}

export function isBlocked(effects: readonly BoardEffect[], at: Position): boolean {
  return effects.some(
    (effect) =>
      (effect.kind === 'seal' || effect.kind === 'corruption') && samePosition(effect.at, at),
  );
}

export function advanceBoardEffectsAfterTurn(
  effects: readonly BoardEffect[],
  actor: Player,
): readonly BoardEffect[] {
  return effects.flatMap((effect) => {
    if (effect.expiry.kind === 'match') return [effect];

    const shouldAdvance =
      effect.expiry.kind === 'owner-turns'
        ? effect.owner === actor
        : effect.owner !== actor;

    if (!shouldAdvance) return [effect];

    const remaining = Math.max(0, effect.expiry.remaining - 1);
    return remaining > 0
      ? [{ ...effect, expiry: { ...effect.expiry, remaining } }]
      : [];
  });
}
