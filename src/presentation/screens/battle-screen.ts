import { Container, Graphics } from 'pixi.js';
import { createBattleController, type BattleController } from '../../app/game-session/battle-controller';
import type { GameSession } from '../../app/game-session/create-game-session';
import { actionButton, label, surface } from '../../design-system/components/primitives';
import { color, layout, type } from '../../design-system/tokens/tokens';
import type { AbilityAction } from '../../game/action/legal-action';
import { heroes, type AbilityId } from '../../heroes/domain/hero-definition';

const controllers = new WeakMap<GameSession, BattleController>();
const BOARD_X = 33;
const BOARD_Y = 190;
const BOARD_SIZE = 324;
const CELL = BOARD_SIZE / 9;

function controllerFor(session: GameSession): BattleController {
  const existing = controllers.get(session);
  if (existing) return existing;
  const created = createBattleController(session);
  controllers.set(session, created);
  return created;
}

export function renderBattleScreen(root: Container, session: GameSession, onChange: () => void): void {
  const controller = controllerFor(session);
  const state = session.state;
  const interaction = controller.interaction();
  const playerTurn = state.match.status === 'playing' && state.match.phase === 'player';

  const mode = session.config.mode.kind === 'story' ? `STORY · ${session.config.mode.encounterId}` : 'FREE BATTLE';
  const modeNode = label(mode, type.caption, color.gold, '700');
  modeNode.position.set(33, 92);
  const turnNode = label(
    state.match.status === 'playing' ? (playerTurn ? `TURN ${state.match.turn} · YOUR MOVE` : `TURN ${state.match.turn} · CPU`) : state.match.status.toUpperCase(),
    type.heading,
    color.ink,
    '700',
  );
  turnNode.position.set(33, 116);
  const matchup = label(`${session.config.playerHeroId.toUpperCase()}  VS  ${session.config.cpuHeroId.toUpperCase()} · ${session.config.cpuDifficulty.toUpperCase()}`, 10, color.inkSoft, '600');
  matchup.position.set(33, 151);
  root.addChild(modeNode, turnNode, matchup);

  const boardSurface = new Graphics().roundRect(BOARD_X - 8, BOARD_Y - 8, BOARD_SIZE + 16, BOARD_SIZE + 16, 12).fill(0x171a20).stroke({ color: color.edge, width: 1 });
  root.addChild(boardSurface);

  const grid = new Graphics();
  for (let index = 0; index <= 9; index += 1) {
    const offset = index * CELL;
    grid.moveTo(BOARD_X + offset, BOARD_Y).lineTo(BOARD_X + offset, BOARD_Y + BOARD_SIZE);
    grid.moveTo(BOARD_X, BOARD_Y + offset).lineTo(BOARD_X + BOARD_SIZE, BOARD_Y + offset);
  }
  grid.stroke({ color: 0x3a3e47, width: 1 });
  root.addChild(grid);

  state.match.board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const x = BOARD_X + colIndex * CELL;
      const y = BOARD_Y + rowIndex * CELL;
      const hit = new Graphics().rect(x, y, CELL, CELL).fill({ color: color.ink, alpha: 0.001 });
      hit.eventMode = playerTurn ? 'static' : 'none';
      if (playerTurn) hit.cursor = 'pointer';
      hit.on('pointertap', () => {
        controller.tapCell({ row: rowIndex, col: colIndex });
        onChange();
      });
      root.addChild(hit);

      if (cell !== 0) {
        const stone = new Graphics().circle(x + CELL / 2, y + CELL / 2, 12).fill(cell === 1 ? 0xe8ddc3 : 0x747c91).stroke({ color: cell === 1 ? 0xf6f0e1 : 0xaab2c4, width: 1 });
        root.addChild(stone);
      }
    });
  });

  state.boardEffects.forEach((effect) => {
    const x = BOARD_X + effect.at.col * CELL + CELL / 2;
    const y = BOARD_Y + effect.at.row * CELL + CELL / 2;
    const marker = new Graphics().circle(x, y, 15).stroke({ color: effect.kind === 'guard' ? color.gold : color.danger, width: 2 });
    marker.alpha = 0.8;
    root.addChild(marker);
  });

  if (interaction.selectedSource) {
    const x = BOARD_X + interaction.selectedSource.col * CELL;
    const y = BOARD_Y + interaction.selectedSource.row * CELL;
    root.addChild(new Graphics().rect(x + 2, y + 2, CELL - 4, CELL - 4).stroke({ color: color.gold, width: 2 }));
  }

  const hud = surface(layout.contentWidth, 206, true);
  hud.position.set(layout.horizontalInset, 550);
  root.addChild(hud);

  const hero = heroes[session.config.playerHeroId];
  const heroNode = label(`${hero.id.toUpperCase()} · ${hero.economy.kind.toUpperCase()}`, type.caption, color.inkSoft, '700');
  heroNode.position.set(43, 568);
  const instruction = label(
    interaction.selectedAbilityId
      ? interaction.selectedSource
        ? `${interaction.selectedAbilityId.toUpperCase()} · SELECT TARGET`
        : `${interaction.selectedAbilityId.toUpperCase()} · SELECT ${interaction.selectedAbilityId === 'blink' || interaction.selectedAbilityId === 'sever' ? 'SOURCE' : 'TARGET'}`
      : 'PLACE A STONE OR USE AN ABILITY',
    10,
    interaction.selectedAbilityId ? color.gold : color.muted,
    '700',
  );
  instruction.position.set(43, 592);
  root.addChild(heroNode, instruction);

  const legal = controller.legalActions();
  const legalAbilities = legal.filter((action): action is AbilityAction => action.kind === 'ability');
  hero.defaultLoadout.forEach((abilityId: AbilityId, index: number) => {
    const ready = legalAbilities.some((action) => action.abilityId === abilityId);
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

  if (interaction.lastError) {
    const error = label(interaction.lastError.replaceAll('-', ' ').toUpperCase(), 10, color.danger, '700');
    error.position.set(43, 716);
    root.addChild(error);
  }

  if (state.match.status !== 'playing') {
    const overlay = new Graphics().roundRect(58, 310, 274, 128, 12).fill({ color: 0x0f1115, alpha: 0.94 }).stroke({ color: color.gold, width: 1 });
    const result = label(state.match.status === 'victory' ? 'VICTORY' : state.match.status === 'draw' ? 'DRAW' : 'DEFEAT', 28, state.match.status === 'victory' ? color.gold : color.ink, '700');
    result.anchor.set(0.5);
    result.position.set(layout.referenceWidth / 2, 354);
    const detail = label(`MATCH ENDED · TURN ${state.match.turn}`, 10, color.inkSoft, '600');
    detail.anchor.set(0.5);
    detail.position.set(layout.referenceWidth / 2, 394);
    root.addChild(overlay, result, detail);
  }
}
