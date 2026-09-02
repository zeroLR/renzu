# RENZU Architecture

## Product boundary

RENZU is a standalone hero-based tactical board strategy game. Board decisions remain authoritative; hero systems manipulate board state, action timing, or tactical opportunity rather than replacing the board with a separate HP/ATK combat model.

## Target module map

```text
src/
├─ app/              # bootstrap and application composition
├─ game/
│  ├─ board/         # board representation and line/win rules
│  ├─ match/         # match lifecycle and turn state
│  ├─ action/        # action resolution and timing
│  └─ rules/         # reusable tactical rules
├─ heroes/
│  ├─ domain/
│  ├─ abilities/
│  ├─ economies/
│  └─ content/
├─ ai/
│  ├─ decision/
│  ├─ evaluation/
│  └─ difficulty/
├─ progression/
├─ modes/
├─ presentation/
├─ design-system/
├─ platform/
└─ shared/
```

## Dependency rules

1. `game/` contains pure gameplay rules and must not import PixiJS or browser UI code.
2. `heroes/` may depend on reusable gameplay contracts, but presentation must not be part of hero definitions.
3. `ai/` consumes game/hero state and returns decisions; board rules must not depend on AI.
4. `presentation/` projects application/domain state into PixiJS views and sends intents back through application/runtime boundaries.
5. `platform/` owns storage, analytics, environment, and other browser/service integration.
6. `app/` composes modules and owns bootstrap/navigation orchestration.

## Migration policy

The legacy `gomoku-rpg` implementation is a behavior reference, not a target folder structure. Migration happens incrementally:

```mermaid
flowchart LR
  A[Board Rules] --> B[Match State]
  B --> C[Action Resolution]
  C --> D[Hero Ability Economy]
  D --> E[AI]
  E --> F[Progression / Modes]
  F --> G[Presentation Rebuild]
```

For each slice:

- preserve validated gameplay behavior unless explicitly redesigned;
- add characterization tests before or with extraction;
- remove obsolete compatibility glue when the new domain boundary makes it unnecessary;
- do not copy the legacy `main.ts` orchestration model;
- keep the branch buildable and testable.

## Renderer bootstrap contract

The legacy prototype experienced a production blank-screen failure where assets loaded but no canvas was mounted. RENZU therefore keeps these constraints from day one:

- resolve `#app` explicitly;
- renderer initialization has a finite timeout;
- attempt WebGL before WebGPU;
- mount the canvas only after successful initialization;
- emit observable renderer logs;
- render a visible DOM fallback if all renderer attempts fail.

## Release direction

Target promotion flow:

```mermaid
flowchart LR
  A[Feature PR] --> B[CI]
  B --> C[main]
  C --> D[Staging]
  D --> E[Release Tag]
  E --> F[Production]
```

CI is established in P1. Staging/production deployment is intentionally handled as its own infrastructure slice after the hosting target is selected.
