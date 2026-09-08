import { resolveCpuTurn, type CpuTurnResult } from './cpu-turn';
import type { GameSession } from './create-game-session';
import { resolveSessionAction } from '../../game/action/action-session';
import { listLegalActions, type AbilityAction, type LegalAction } from '../../game/action/legal-action';
import type { Position } from '../../game/board/board';
import type { AbilityId } from '../../heroes/domain/hero-definition';

export interface BattleInteractionState {
  selectedAbilityId: AbilityId | null;
  selectedSource: Position | null;
  lastError: string | null;
  cpuThinking: boolean;
}

export type BattleTargetingPhase = 'idle' | 'select-source' | 'select-target';

export interface BattleTargetingState {
  abilityId: AbilityId | null;
  phase: BattleTargetingPhase;
  sources: readonly Position[];
  targets: readonly Position[];
}

export interface CpuChoreographyOptions {
  thinkDelayMs?: number;
  delay?: (ms: number) => Promise<void>;
}

export interface BattleController {
  session(): GameSession;
  interaction(): BattleInteractionState;
  targeting(): BattleTargetingState;
  legalActions(): LegalAction[];
  selectAbility(abilityId: AbilityId): void;
  tapCell(at: Position): void;
  advanceCpuTurn(onStep?: () => void, options?: CpuChoreographyOptions): Promise<void>;
  clearSelection(): void;
}

const samePosition = (a: Position | undefined, b: Position): boolean => !!a && a.row === b.row && a.col === b.col;
const defaultDelay = (ms: number): Promise<void> => new Promise((resolve) => globalThis.setTimeout(resolve, ms));

function uniquePositions(positions: readonly Position[]): Position[] {
  const seen = new Set<string>();
  const unique: Position[] = [];
  for (const position of positions) {
    const key = `${position.row}:${position.col}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(position);
  }
  return unique;
}

export function createBattleController(session: GameSession, random?: () => number): BattleController {
  let selectedAbilityId: AbilityId | null = null;
  let selectedSource: Position | null = null;
  let lastError: string | null = null;
  let cpuThinking = false;
  let cpuSequence = 0;

  const legalActions = (): LegalAction[] => listLegalActions(session.state, session.config.playerHeroId, 1);

  const targeting = (): BattleTargetingState => {
    if (!selectedAbilityId) {
      return { abilityId: null, phase: 'idle', sources: [], targets: [] };
    }

    const candidates = legalActions().filter(
      (action): action is AbilityAction => action.kind === 'ability' && action.abilityId === selectedAbilityId,
    );
    const sourced = candidates.filter((action) => action.source !== undefined);

    if (sourced.length > 0) {
      if (!selectedSource) {
        return {
          abilityId: selectedAbilityId,
          phase: 'select-source',
          sources: uniquePositions(sourced.flatMap((action) => action.source ? [action.source] : [])),
          targets: [],
        };
      }

      return {
        abilityId: selectedAbilityId,
        phase: 'select-target',
        sources: [selectedSource],
        targets: uniquePositions(
          sourced
            .filter((action) => samePosition(action.source, selectedSource!))
            .map((action) => action.target),
        ),
      };
    }

    return {
      abilityId: selectedAbilityId,
      phase: 'select-target',
      sources: [],
      targets: uniquePositions(candidates.map((action) => action.target)),
    };
  };

  const advanceCpuTurn = async (
    onStep?: () => void,
    options: CpuChoreographyOptions = {},
  ): Promise<void> => {
    if (cpuThinking || session.state.match.status !== 'playing' || session.state.match.phase !== 'opponent') return;

    cpuThinking = true;
    const sequence = ++cpuSequence;
    const delay = options.delay ?? defaultDelay;
    const thinkDelayMs = options.thinkDelayMs ?? 520;
    onStep?.();

    await delay(thinkDelayMs);
    if (sequence !== cpuSequence) return;

    const result: CpuTurnResult = resolveCpuTurn(session.state, {
      heroId: session.config.cpuHeroId,
      difficulty: session.config.cpuDifficulty,
      random,
    });
    if (!result.ok) {
      lastError = result.error;
    } else {
      session.state = result.state;
      lastError = null;
    }

    if (sequence === cpuSequence) {
      cpuThinking = false;
      onStep?.();
    }
  };

  const apply = (action: LegalAction): void => {
    const result = resolveSessionAction(session.state, action, session.config.playerHeroId);
    if (!result.ok) {
      lastError = result.error;
      return;
    }
    session.state = result.state;
    selectedAbilityId = null;
    selectedSource = null;
    lastError = null;
  };

  const selectAbility = (abilityId: AbilityId): void => {
    const candidates = legalActions().filter(
      (action): action is AbilityAction => action.kind === 'ability' && action.abilityId === abilityId,
    );
    if (candidates.length === 0) {
      lastError = 'ability-unavailable';
      return;
    }
    selectedAbilityId = abilityId;
    selectedSource = null;
    lastError = null;
  };

  const tapCell = (at: Position): void => {
    if (cpuThinking || session.state.match.status !== 'playing' || session.state.match.phase !== 'player') return;
    const actions = legalActions();

    if (!selectedAbilityId) {
      const direct = actions.find((action) => action.kind === 'place' && samePosition(action.at, at));
      if (direct) apply(direct);
      else lastError = 'invalid-target';
      return;
    }

    const candidates = actions.filter(
      (action): action is AbilityAction => action.kind === 'ability' && action.abilityId === selectedAbilityId,
    );
    const needsSource = candidates.some((action) => action.source !== undefined);

    if (needsSource && !selectedSource) {
      if (candidates.some((action) => samePosition(action.source, at))) {
        selectedSource = at;
        lastError = null;
      } else {
        lastError = 'invalid-source';
      }
      return;
    }

    const match = candidates.find((action) =>
      samePosition(action.target, at) && (!needsSource || samePosition(action.source, selectedSource!)),
    );
    if (match) apply(match);
    else lastError = 'invalid-target';
  };

  return {
    session: () => session,
    interaction: () => ({ selectedAbilityId, selectedSource, lastError, cpuThinking }),
    targeting,
    legalActions,
    selectAbility,
    tapCell,
    advanceCpuTurn,
    clearSelection() {
      selectedAbilityId = null;
      selectedSource = null;
      lastError = null;
    },
  };
}
