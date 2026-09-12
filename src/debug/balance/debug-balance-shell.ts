import { Container, Graphics } from 'pixi.js';
import { createBattleController } from '../../app/game-session/battle-controller';
import { actionButton, label } from '../../design-system/components/primitives';
import { color, layout, type } from '../../design-system/tokens/tokens';
import { renderBattleScreen } from '../../presentation/screens/battle-screen';
import { renderBalanceLabScreen, type BalanceLabView } from './balance-screen';
import type { BalanceLabController } from './balance-controller';

export interface DebugBalanceShell {
  root: Container;
  render(): void;
  resize(width: number, height: number): void;
}

export function createDebugBalanceShell(
  controller: BalanceLabController,
  onExit: () => void,
): DebugBalanceShell {
  const viewport = new Container();
  const content = new Container();
  viewport.addChild(content);
  let view: BalanceLabView = 'setup';
  let takeover = false;

  const enterTakeover = (): void => {
    const snapshot = controller.snapshot();
    const session = snapshot.takeoverSession;
    if (!session) return;
    if (snapshot.result) session.cpuProfileOverride = { ...snapshot.result.config.profile };
    takeover = true;
    render();
  };

  const leaveTakeover = (): void => {
    takeover = false;
    controller.clearTakeover();
    view = 'inspect';
    render();
  };

  const renderTakeover = (): void => {
    const snapshot = controller.snapshot();
    const session = snapshot.takeoverSession;
    if (!session) {
      takeover = false;
      view = 'inspect';
      render();
      return;
    }

    const back = actionButton('‹', 48, 48, leaveTakeover);
    back.position.set(layout.horizontalInset, 24);
    const badge = label('DEBUG TAKEOVER', 10, color.violet, '700');
    badge.anchor.set(1, 0);
    badge.position.set(layout.referenceWidth - layout.horizontalInset, 40);
    content.addChild(back, badge);

    renderBattleScreen(content, session, () => render(), {
      canNext: false,
      onRematch: () => {
        if (controller.createTakeover()) enterTakeover();
      },
      onNext: leaveTakeover,
      onReturn: leaveTakeover,
    });
  };

  const render = (): void => {
    content.removeChildren();
    content.addChild(new Graphics().rect(0, 0, layout.referenceWidth, layout.referenceHeight).fill(color.canvas));
    if (takeover) {
      renderTakeover();
      return;
    }

    renderBalanceLabScreen(content, controller, view, {
      onBack() {
        if (view === 'inspect') {
          view = 'results';
          render();
          return;
        }
        if (view === 'results') {
          view = 'setup';
          render();
          return;
        }
        onExit();
      },
      onChange: render,
      onRunComplete() {
        view = 'results';
        render();
      },
      onInspect() {
        view = 'inspect';
        render();
      },
      onTakeover: enterTakeover,
    });
  };

  const resize = (width: number, height: number): void => {
    const scale = Math.min(width / layout.referenceWidth, height / layout.referenceHeight);
    viewport.scale.set(scale);
    viewport.position.set(
      Math.floor((width - layout.referenceWidth * scale) / 2),
      Math.floor((height - layout.referenceHeight * scale) / 2),
    );
  };

  render();
  return { root: viewport, render, resize };
}
