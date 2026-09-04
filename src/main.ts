import { createRenderer } from './app/bootstrap/create-renderer';
import { createAppRouter } from './app/routing/router';
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
    const shell = createProductShell(router);

    app.stage.addChild(shell.root);
    host.replaceChildren(app.canvas);
    shell.resize(app.screen.width, app.screen.height);

    app.renderer.on('resize', (width, height) => shell.resize(width, height));
    console.info('[RENZU] Product shell bootstrap complete.');
  } catch (error) {
    renderBootstrapFailure(error);
  }
}

void bootstrap();
