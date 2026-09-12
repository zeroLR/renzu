import { Container } from 'pixi.js';
import type { ProductShell } from '../../presentation/screens/product-shell';
import { actionButton } from '../../design-system/components/primitives';
import { createDebugBalanceShell } from './debug-balance-shell';
import type { BalanceLabController } from './balance-controller';

export interface DebugAppShell {
  root: Container;
  resize(width: number, height: number): void;
}

export function createDebugAppShell(
  productShell: ProductShell,
  controller: BalanceLabController,
): DebugAppShell {
  const root = new Container();
  const lab = createDebugBalanceShell(controller, showGame);
  const launcher = actionButton('LAB', 72, 44, showLab, true);
  root.addChild(productShell.root, lab.root, launcher);
  lab.root.visible = false;

  function showLab(): void {
    productShell.root.visible = false;
    launcher.visible = false;
    lab.root.visible = true;
    lab.render();
  }

  function showGame(): void {
    lab.root.visible = false;
    productShell.root.visible = true;
    launcher.visible = true;
  }

  const resize = (width: number, height: number): void => {
    productShell.resize(width, height);
    lab.resize(width, height);
    launcher.position.set(Math.max(8, width - 84), 12);
  };

  return { root, resize };
}
