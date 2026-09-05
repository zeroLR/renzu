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
}

export interface BattleController {
  session(): GameSession;
  interaction(): BattleInteractionState;
  legalActions(): LegalAction[];
  selectAbility(abilityId: AbilityId): void;
  tapCell(at: Position): void;
  clearSelection(): void;
}

const samePosition = (a: Position | undefined, b: Position): boolean => !!a && a.row === b.row && a.col === b.col;

export function createBattleController(session: GameSession, random?: () => number): BattleController {
  let selectedAbilityId: AbilityId | null = null;
  let selectedSource: Position | null = null;
  let lastError: string | null = null;

  const legalActions = (): LegalAction[] => listLegalActions(session.state, session.config.playerHeroId, 1);

  const runCpuUntilPlayer = (): void => {
    let guard = 0;
    while (session.state.match.status === 'playing' && session.state.match.phase === 'opponent' && guard < 4) {
      const result: CpuTurnResult = resolveCpuTurn(session.state, {
        heroId: session.config.cpuHeroId,
        difficulty: session.config.cpuDifficulty,
        random,
      });
      if (!result.ok) {
        lastError = result.error;
        return;
      }
      session.state = result.state;
      guard += 1;
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
    if (result.consumedTurn) runCpuUntilPlayer();
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

    if (abilityId === 'step') apply(candidates[0]);
  };

  const tapCell = (at: Position): void => {
    if (session.state.match.status !== 'playing' || session.state.match.phase !== 'player') return;
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

    const match = candidates.find(
      (action) => samePosition(action.target, at) && (!needsSource || samePosition(action.source, selectedSource!)),
    );
    if (match) apply(match);
    else lastError = 'invalid-target';
  };

  return {
    session: () => session,
    interaction: () => ({ selectedAbilityId, selectedSource, lastError }),
    legalActions,
    selectAbility,
    tapCell,
    clearSelection() {
      selectedAbilityId = null;
      selectedSource = null;
      lastError = null;
    },
  };
}
