import type { AbilityId } from '../../heroes/domain/hero-definition';

const abilityHelp: Record<AbilityId, string> = {
  blink: 'MOVE AN UNGUARDED ALLY TO AN OPEN POINT',
  guard: 'PROTECT A FRIENDLY STONE TEMPORARILY',
  charge: 'ADVANCE 1 · PUSH IF THE NEXT POINT IS OPEN',
  bulwark: 'GUARD AN ANCHOR AND ADJACENT FRIENDLIES',
  seal: 'BLOCK AN EMPTY POINT TEMPORARILY',
  phase: 'PLACE + FLAME THE FOUR CARDINAL POINTS',
  corrupt: 'REMOVE A SUPPORTED ADJACENT ENEMY',
  rally: 'MOVE AN ALLY INTO A SUPPORTED FORMATION',
  lattice: 'SEAL CARDINAL POINTS AROUND A FORMATION',
  step: 'PRESERVE MOMENTUM ON YOUR NEXT PLACEMENT',
  sever: 'PUSH AN ADJACENT UNGUARDED ENEMY ONE POINT',
};

export function abilityHelpText(abilityId: AbilityId): string {
  return abilityHelp[abilityId];
}
