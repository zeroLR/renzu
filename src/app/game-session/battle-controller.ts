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
  followUpDelayMs?: number;
  delay?: (ms: number) => Promise<void>;
}

export interface BattleController {
  session(): GameSession;
  interaction(): BattleInteractionState;
  targeting(): BattleTargetingState;
  legalActions(): LegalAction[];
  selectAbility(abilityId: AbilityId): void;
  tapCell(at: Position): void;
  endFollowUp(): void;
  advanceCpuTurn(onStep?: () => void, options?: CpuChoreographyOptions): Promise<void>;
  clearSelection(): void;
}

const samePosition = (a: Position | undefined, b: Position): boolean => !!a && a.row === b.row && a.col === b.col;
const defaultDelay = (ms: number): Promise<void> => new Promise((resolve) => globalThis.setTimeout(resolve, ms));

function abilityFrom(action: LegalAction): AbilityAction | null {
  if (action.kind === 'ability') return action;
  if (action.kind === 'follow-up' && action.action.kind === 'ability') return action.action;
  return null;
}

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

    const candidates = legalActions()
      .map(abilityFrom)
      .filter((action): action is AbilityAction => action?.abilityId === selectedAbilityId);
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
    const followUpDelayMs = options.followUpDelayMs ?? 280;
    onStep?.();

    let guard = 0;
    while (sequence === cpuSequence && session.state.match.status === 'playing' && session.state.match.phase === 'opponent' && guard < 4) {
      await delay(guard === 0 ? thinkDelayMs : followUpDelayMs);
      if (sequence !== cpuSequence) break;

      const result: CpuTurnResult = resolveCpuTurn(session.state, {
        heroId: session.config.cpuHeroId,
        difficulty: session.config.cpuDifficulty,
        random,
      });
      if (!result.ok) {
        lastError = result.error;
        break;
      }

      session.state = result.state;
      lastError = null;
      guard += 1;
      onStep?.();
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
    const candidates = legalActions().filter((action) => abilityFrom(action)?.abilityId === abilityId);
    if (candidates.length === 0) {
      lastError = 'ability-unavailable';
      return;
    }
    selectedAbilityId = abilityId;
    selectedSource = null;
    lastError = null;

    if (abilityId === 'step') apply(candidates[0]);
  };

  const tapCell = (at: Position): void => {
    if (cpuThinking || session.state.match.status !== 'playing' || session.state.match.phase !== 'player') return;
    const actions = legalActions();

    if (!selectedAbilityId) {
      const direct = actions.find((action) => {
        if (action.kind === 'place') return samePosition(action.at, at);
        if (action.kind === 'follow-up' && action.action.kind === 'place') return samePosition(action.action.at, at);
        return false;
      });
      if (direct) apply(direct);
      else lastError = 'invalid-target';
      return;
    }

    const candidates = actions.filter((action) => abilityFrom(action)?.abilityId === selectedAbilityId);
    const needsSource = candidates.some((action) => abilityFrom(action)?.source !== undefined);

    if (needsSource && !selectedSource) {
      if (candidates.some((action) => samePosition(abilityFrom(action)?.source, at))) {
        selectedSource = at;
        lastError = null;
      } else {
        lastError = 'invalid-source';
      }
      return;
    }

    const match = candidates.find((action) => {
      const ability = abilityFrom(action);
      return ability
        ? samePosition(ability.target, at) && (!needsSource || samePosition(ability.source, selectedSource!))
        : false;
    });
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
    endFollowUp() {
      const end = legalActions().find((action) => action.kind === 'end-follow-up');
      if (end) apply(end);
      else lastError = 'follow-up-unavailable';
    },
    advanceCpuTurn,
    clearSelection() {
      selectedAbilityId = null;
      selectedSource = null;
      lastError = null;
    },
  };
}
