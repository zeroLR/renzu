export type AiDifficultyId = 'easy' | 'normal';

export interface AiDifficultyProfile {
  id: AiDifficultyId;
  candidateWidth: number;
  attackWeight: number;
  defenseWeight: number;
  abilityWeight: number;
  optimalMoveRate: number;
  blunderTolerance: number;
}

export const AI_DIFFICULTY: Record<AiDifficultyId, AiDifficultyProfile> = {
  easy: {
    id: 'easy',
    candidateWidth: 5,
    attackWeight: 0.85,
    defenseWeight: 0.9,
    abilityWeight: 0.8,
    optimalMoveRate: 0.55,
    blunderTolerance: 0.18,
  },
  normal: {
    id: 'normal',
    candidateWidth: 8,
    attackWeight: 1,
    defenseWeight: 1.08,
    abilityWeight: 1,
    optimalMoveRate: 0.82,
    blunderTolerance: 0.08,
  },
};

export function aiDifficulty(id: AiDifficultyId = 'normal'): AiDifficultyProfile {
  return AI_DIFFICULTY[id];
}
