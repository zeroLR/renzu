import { Application } from 'pixi.js';

const RENDERER_TIMEOUT_MS = 5_000;

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(
      () => reject(new Error(`${label} timed out after ${RENDERER_TIMEOUT_MS}ms`)),
      RENDERER_TIMEOUT_MS,
    );

    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function createRenderer(): Promise<Application> {
  const attempts = [
    { label: 'WebGL 1', options: { preference: 'webgl' as const, preferWebGLVersion: 1 as const } },
    { label: 'WebGL', options: { preference: 'webgl' as const } },
    { label: 'WebGPU', options: { preference: 'webgpu' as const } },
  ];

  let lastError: unknown;

  for (const attempt of attempts) {
    const candidate = new Application();
    try {
      console.info(`[RENZU] Initializing ${attempt.label} renderer.`);
      await withTimeout(
        candidate.init({
          resizeTo: window,
          antialias: true,
          background: '#0f1115',
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          ...attempt.options,
        }),
        `${attempt.label} renderer initialization`,
      );
      console.info(`[RENZU] ${attempt.label} renderer ready.`);
      return candidate;
    } catch (error) {
      lastError = error;
      console.warn(`[RENZU] ${attempt.label} renderer initialization failed.`, error);
      try {
        candidate.destroy(true);
      } catch {
        // Ignore cleanup failure and continue to the next renderer.
      }
    }
  }

  throw lastError ?? new Error('No renderer could be initialized');
}
