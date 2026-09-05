import { Container, Graphics } from 'pixi.js';
import { createBattleController, type BattleController } from '../../app/game-session/battle-controller';
import type { GameSession } from '../../app/game-session/create-game-session';
import { actionButton, label, surface } from '../../design-system/components/primitives';
import { color, layout, type } from '../../design-system/tokens/tokens';
import type { AbilityAction } from '../../game/action/legal-action';
import { heroes, type AbilityId } from '../../heroes/domain/hero-definition';
import { boardLineBounds, boardPoint, boardSpacing, type BoardGeometry } from './board-geometry';

const controllers = new WeakMap<GameSession, BattleController>();
const BOARD: BoardGeometry = {
  originX: 33,
  originY: 190,
  size: 324,
  inset: 18,
  logicalSize: 9,
};

export interface BattleResultActions {
  canNext: boolean;
  onRematch(): void;
  onNext(): void;
  onReturn(): void;
}

function controllerFor(session: GameSession): BattleController {
  const existing = controllers.get(session);
  if (existing) return existing;
  const created = createBattleController(session);
  controllers.set(session, created);
  return created;
}

export function renderBattleScreen(
  root: Container,
  session: GameSession,
  onChange: () => void,
  resultActions?: BattleResultActions,
): void {
  const controller = controllerFor(session);
  const state = session.state;
  const interaction = controller.interaction();
  const playerTurn = state.match.status === 'playing' && state.match.phase === 'player';
  const cpuTurn = state.match.status === 'playing' && state.match.phase === 'opponent';

  const mode = session.config.mode.kind === 'story' ? `STORY · ${session.config.mode.encounterId}` : 'FREE BATTLE';
  const modeNode = label(mode, type.caption, color.gold, '700');
  modeNode.position.set(33, 92);
  const turnNode = label(
    state.match.status === 'playing'
      ? playerTurn
        ? `TURN ${state.match.turn} · YOUR MOVE`
        : `TURN ${state.match.turn} · CPU THINKING`
      : state.match.status.toUpperCase(),
    type.heading,
    color.ink,
    '700',
  );
  turnNode.position.set(33, 116);
  const matchup = label(`${session.config.playerHeroId.toUpperCase()}  VS  ${session.config.cpuHeroId.toUpperCase()} · ${session.config.cpuDifficulty.toUpperCase()}`, 10, color.inkSoft, '600');
  matchup.position.set(33, 151);
  root.addChild(modeNode, turnNode, matchup);

  const boardSurface = new Graphics()
    .roundRect(BOARD.originX - 8, BOARD.originY - 8, BOARD.size + 16, BOARD.size + 16, 12)
    .fill(0x171a20)
    .stroke({ color: color.edge, width: 1 });
  root.addChild(boardSurface);

  const bounds = boardLineBounds(BOARD);
  const spacing = boardSpacing(BOARD);
  const grid = new Graphics();
  for (let index = 0; index < BOARD.logicalSize; index += 1) {
    const offset = index * spacing;
    grid.moveTo(bounds.left + offset, bounds.top).lineTo(bounds.left + offset, bounds.bottom);
    grid.moveTo(bounds.left, bounds.top + offset).lineTo(bounds.right, bounds.top + offset);
  }
  grid.stroke({ color: 0x3a3e47, width: 1 });
  root.addChild(grid);

  state.match.board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const at = { row: rowIndex, col: colIndex };
      const point = boardPoint(BOARD, at);
      const hit = new Graphics().circle(point.x, point.y, spacing * 0.46).fill({ color: color.ink, alpha: 0.001 });
      hit.eventMode = playerTurn ? 'static' : 'none';
      if (playerTurn) hit.cursor = 'pointer';
      hit.on('pointertap', () => {
        controller.tapCell(at);
        onChange();
        if (session.state.match.status === 'playing' && session.state.match.phase === 'opponent') {
          void controller.advanceCpuTurn(onChange);
        }
      });
      root.addChild(hit);

      if (cell !== 0) {
        const stone = new Graphics()
          .circle(point.x, point.y, 12)
          .fill(cell === 1 ? 0xe8ddc3 : 0x747c91)
          .stroke({ color: cell === 1 ? 0xf6f0e1 : 0xaab2c4, width: 1 });
        root.addChild(stone);
      }
    });
  });

  const lastAction = state.match.actionHistory[state.match.actionHistory.length - 1];
  if (lastAction) {
    const point = boardPoint(BOARD, lastAction.at);
    const marker = new Graphics().circle(point.x, point.y, 4).fill(lastAction.actor === 1 ? color.gold : color.inkSoft);
    root.addChild(marker);
  }

  state.boardEffects.forEach((effect) => {
    const point = boardPoint(BOARD, effect.at);
    const marker = new Graphics()
      .circle(point.x, point.y, 15)
      .stroke({ color: effect.kind === 'guard' ? color.gold : color.danger, width: 2 });
    marker.alpha = 0.8;
    root.addChild(marker);
  });

  if (interaction.selectedSource) {
    const point = boardPoint(BOARD, interaction.selectedSource);
    root.addChild(new Graphics().circle(point.x, point.y, 17).stroke({ color: color.gold, width: 2 }));
  }

  if (cpuTurn) {
    const pulse = new Graphics().circle(BOARD.originX + BOARD.size - 22, 164, interaction.cpuThinking ? 4 : 3).fill(color.gold);
    pulse.alpha = interaction.cpuThinking ? 0.9 : 0.5;
    root.addChild(pulse);
  }

  const hud = surface(layout.contentWidth, 206, true);
  hud.position.set(layout.horizontalInset, 550);
  root.addChild(hud);

  const hero = heroes[session.config.playerHeroId];
  const heroNode = label(`${hero.id.toUpperCase()} · ${hero.economy.kind.toUpperCase()}`, type.caption, color.inkSoft, '700');
  heroNode.position.set(43, 568);
  const instruction = label(
    cpuTurn
      ? 'OPPONENT IS CONSIDERING THE BOARD'
      : interaction.selectedAbilityId
        ? interaction.selectedSource
          ? `${interaction.selectedAbilityId.toUpperCase()} · SELECT TARGET`
          : `${interaction.selectedAbilityId.toUpperCase()} · SELECT ${interaction.selectedAbilityId === 'blink' || interaction.selectedAbilityId === 'sever' ? 'SOURCE' : 'TARGET'}`
        : 'PLACE A STONE OR USE AN ABILITY',
    10,
    cpuTurn || interaction.selectedAbilityId ? color.gold : color.muted,
    '700',
  );
  instruction.position.set(43, 592);
  root.addChild(heroNode, instruction);

  const legal = controller.legalActions();
  const legalAbilities = legal.filter((action): action is AbilityAction => action.kind === 'ability');
  hero.defaultLoadout.forEach((abilityId: AbilityId, index: number) => {
    const ready = playerTurn && legalAbilities.some((action) => action.abilityId === abilityId);
    const selected = interaction.selectedAbilityId === abilityId;
    const cooldown = state.abilities[1].cooldowns[abilityId] ?? 0;
    const title = cooldown > 0 ? `${abilityId.toUpperCase()} · ${cooldown}` : abilityId.toUpperCase();
    const button = actionButton(title, 145, 52, () => {
      if (!ready && !selected) return;
      if (selected) controller.clearSelection();
      else controller.selectAbility(abilityId);
      onChange();
    }, selected || ready);
    button.position.set(43 + index * 158, 622);
    if (!ready && !selected) button.alpha = 0.35;
    root.addChild(button);
  });

  const resourceId = hero.economy.resourceId;
  if (resourceId) {
    const current = state.abilities[1].resources[resourceId];
    const resource = label(`${resourceId.toUpperCase()}  ${current}${hero.economy.max ? ` / ${hero.economy.max}` : ''}`, type.caption, color.inkSoft, '600');
    resource.position.set(43, 692);
    root.addChild(resource);
  }

  if (lastAction) {
    const actionText = lastAction.kind === 'ability' && lastAction.abilityId
      ? `LAST · ${lastAction.actor === 1 ? 'YOU' : 'CPU'} · ${lastAction.abilityId.toUpperCase()}`
      : `LAST · ${lastAction.actor === 1 ? 'YOU' : 'CPU'} · PLACE`;
    const recent = label(actionText, 10, color.muted, '600');
    recent.position.set(43, 716);
    root.addChild(recent);
  }

  if (interaction.lastError) {
    const error = label(interaction.lastError.replaceAll('-', ' ').toUpperCase(), 10, color.danger, '700');
    error.position.set(190, 716);
    root.addChild(error);
  }

  if (state.match.status !== 'playing') {
    const overlay = new Graphics().roundRect(50, 286, 290, 208, 12).fill({ color: 0x0f1115, alpha: 0.96 }).stroke({ color: color.gold, width: 1 });
    const result = label(state.match.status === 'victory' ? 'VICTORY' : state.match.status === 'draw' ? 'DRAW' : 'DEFEAT', 28, state.match.status === 'victory' ? color.gold : color.ink, '700');
    result.anchor.set(0.5);
    result.position.set(layout.referenceWidth / 2, 326);
    const detail = label(`MATCH ENDED · TURN ${state.match.turn}`, 10, color.inkSoft, '600');
    detail.anchor.set(0.5);
    detail.position.set(layout.referenceWidth / 2, 360);
    root.addChild(overlay, result, detail);

    if (resultActions) {
      const rematch = actionButton('REMATCH', 126, 44, resultActions.onRematch);
      rematch.position.set(66, 390);
      const secondary = actionButton(resultActions.canNext ? 'NEXT' : 'RETURN', 126, 44, resultActions.canNext ? resultActions.onNext : resultActions.onReturn, true);
      secondary.position.set(198, 390);
      const exit = actionButton('BACK TO STORY', 258, 36, resultActions.onReturn);
      exit.position.set(66, 442);
      root.addChild(rematch, secondary, exit);
    }
  }
}
