# RENZU

Hero-based tactical board strategy game.

RENZU is the standalone production successor to the `gomoku-rpg` prototype developed in `zeroLR/2D-game-playground`.

## Product principle

Board decisions remain authoritative. Heroes are tactical engines that alter how players read, build, disrupt, and convert board patterns.

## Status

**R1 — Playable Staging / Device Validation**

Current product foundation includes:

- PixiJS 8 + TypeScript + Vite + Vitest
- resilient WebGL/WebGPU renderer bootstrap with visible failure fallback
- 9×9 intersection-based board and match domain
- legal-action / ability / board-effect lifecycle
- hero economy and passive foundations
- Easy / Normal CPU decision and turn orchestration
- Story and Free Battle product flows
- portrait-first battle screen and HUD
- result / rematch / Story continuation lifecycle
- local-first player profile persistence
- GitHub Pages staging / production deployment pipeline

The current priority is to validate the vertical slice on real devices, then complete combat fidelity before scaling hero and Story content.

## Product planning

- [`docs/roadmap.md`](docs/roadmap.md) — product milestones, v1 scope lock, exit criteria, and post-launch tracks
- [`docs/execution-plan.md`](docs/execution-plan.md) — PR-sized execution sequence, quality gates, and release plan
- [`docs/architecture.md`](docs/architecture.md) — module boundaries and dependency rules
- [`docs/deployment.md`](docs/deployment.md) — staging / production deployment model

## Development

```bash
npm install
npm test
npm run build
npm run dev
```

## Migration source

Validated gameplay behavior was incrementally extracted from:

`zeroLR/2D-game-playground/gomoku-rpg`

The legacy directory structure is intentionally not copied wholesale. See [`docs/architecture.md`](docs/architecture.md).

## Release direction

```text
feature PR -> CI -> main -> GitHub Pages staging -> release tag -> GitHub Pages production
```

Canonical Pages paths:

- production: `/renzu/`
- staging: `/renzu/staging/`

`main` should remain releasable; production tags are promoted only after staging/device validation.
