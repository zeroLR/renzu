# RENZU

Hero-based tactical board strategy game.

RENZU is the standalone production successor to the `gomoku-rpg` prototype developed in `zeroLR/2D-game-playground`.

## Product principle

Board decisions remain authoritative. Heroes are tactical engines that alter how players read, build, disrupt, and convert board patterns.

## Status

**P1 — Standalone Bootstrap / Core Extraction**

Current foundation:

- PixiJS 8 + TypeScript + Vite + Vitest
- resilient WebGL/WebGPU renderer bootstrap with visible failure fallback
- extracted pure board-rule domain
- strict TypeScript configuration
- PR/main CI validation
- domain-oriented migration architecture
- GitHub Pages selected as the staging/production hosting platform

## Development

```bash
npm install
npm test
npm run build
npm run dev
```

## Migration source

Validated gameplay behavior is being incrementally extracted from:

`zeroLR/2D-game-playground/gomoku-rpg`

The legacy directory structure is intentionally not copied wholesale. See [`docs/architecture.md`](docs/architecture.md).

## Release direction

```text
feature PR -> CI -> main -> GitHub Pages staging -> release tag -> GitHub Pages production
```

Canonical GitHub Pages paths:

- production: `/renzu/`
- staging: `/renzu/staging/`

The Pages publication workflow is implemented as a dedicated infrastructure slice after the standalone foundation is merged.
