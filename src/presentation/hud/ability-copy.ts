import type { AbilityId } from '../../heroes/domain/hero-definition';

const abilityHelp: Record<AbilityId, string> = {
  guard: 'PROTECT AN ALLY · THEN PLACE A STONE',
  charge: 'ADVANCE 1 · PUSH IF THE NEXT POINT IS OPEN',
  bulwark: 'GUARD AN ANCHOR AND ADJACENT FRIENDLIES',
  seal: 'BLOCK ONE POINT FOR 2 OPPONENT TURNS',
  phase: 'PLACE + FLAME THE FOUR CARDINAL POINTS',
  corrupt: 'REMOVE A SUPPORTED ADJACENT ENEMY',
};

export function abilityHelpText(abilityId: AbilityId): string {
  return abilityHelp[abilityId];
}
