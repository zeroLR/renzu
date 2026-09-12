import { createRenderer } from './app/bootstrap/create-renderer';
import { createProductFlow } from './app/game-session/product-flow';
import { createAppRouter } from './app/routing/router';
import { createBalanceLabController } from './debug/balance/balance-controller';
import { createDebugAppShell } from './debug/balance/debug-app-shell';
import { debugToolsEnabled, heroRosterValidationEnabled } from './platform/environment/runtime-environment';
import { createBrowserPlayerProfileStorage } from './platform/storage/player-profile-storage';
import { createProductShell } from './presentation/screens/product-shell';
import './style.css';

const hostElement = document.querySelector<HTMLElement>('#app');
if (!hostElement) throw new Error('[RENZU] Missing #app mount element');
const host: HTMLElement = hostElement;

function renderBootstrapFailure(error: unknown): void {
  console.error('[RENZU] Renderer bootstrap failed.', error);
  host.replaceChildren();
  const fallback = document.createElement('section');
  fallback.className = 'bootstrap-failure';
  fallback.innerHTML = '<strong>RENZU could not start.</strong><span>Please reload or try another browser.</span>';
  host.append(fallback);
}

async function bootstrap(): Promise<void> {
  try {
    const app = await createRenderer();
    const router = createAppRouter();
    const profileStorage = createBrowserPlayerProfileStorage();
    const flow = createProductFlow(profileStorage, {
      allowLockedFreeBattleHeroes: heroRosterValidationEnabled(),
    });
    const productShell = createProductShell(router, flow);
    const shell = debugToolsEnabled()
      ? createDebugAppShell(productShell, createBalanceLabController())
      : productShell;

    app.stage.addChild(shell.root);
    host.replaceChildren(app.canvas);
    shell.resize(app.screen.width, app.screen.height);

    app.renderer.on('resize', (width, height) => shell.resize(width, height));
    console.info(`[RENZU] Product shell bootstrap complete${debugToolsEnabled() ? ' · DEBUG LAB ENABLED' : ''}.`);
  } catch (error) {
    renderBootstrapFailure(error);
  }
}

void bootstrap();
