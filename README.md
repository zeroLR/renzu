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
feature PR -> CI -> main -> staging -> release tag -> production
```

Staging and production deployment are a separate infrastructure slice so hosting/environment decisions remain independent from gameplay migration.
