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

## Placement pattern / passive contract

Meaningful placement outcomes are evaluated once through `game/rules` and then consumed by hero passives. Hero implementations must not independently rescan the board for the same placement facts.

```text
Place Action
  ↓
evaluatePlacementPattern
  ↓
PlacementPatternOutcome
  ├─ qualifying 3/4 lines + reward
  ├─ winning-line flag
  ├─ adjacent-friendly count
  └─ adjacent-enemy flag
  ↓
Hero Passive Engine
  ↓
PassiveOutcome
  ↓
Session materializes economy / board effects / follow-up timing
```

The v1 pattern reward follows the validated prototype rule: only lines crossing the newly placed stone qualify; an exact three contributes 1, an exact four contributes 2, qualifying directions accumulate, and a winning five does not grant an additional pattern reward.

This boundary is shared by player and CPU session resolution so passive behavior remains deterministic regardless of presentation or controller path.

## AI tactical evaluation contract

AI must not implement a second copy of ability-resolution rules. Candidate actions come from the shared legal-action surface and tactical ability evaluation resolves one candidate against a cloned gameplay state through the same session resolver used by runtime play.

```text
AbilityActionState
  ↓
listLegalActions
  ↓
AI candidate
  ↓
clone state
  ↓
resolveSessionAction
  ↓
Tactical outcome
  ├─ immediate win
  ├─ enemy immediate threats before / after
  ├─ own line topology change
  ├─ enemy line reduction
  ├─ enemy stones removed
  └─ denial effects created
  ↓
Difficulty-weighted ranking
```

R2/v1 intentionally keeps this to one-action simulation. Difficulty changes candidate selection variance and weighting, not gameplay legality or resolver behavior. Deeper search is a later optimization only if playtesting demonstrates that one-action tactical awareness is insufficient.

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

## Hosting contract

RENZU uses GitHub Pages as its production hosting platform, continuing the deployment technology validated by the `gomoku-rpg` prototype.

Because `zeroLR/renzu` is a GitHub Project Pages repository, deployed assets must not assume `/` hosting.

Canonical paths:

- local development: `/`
- production: `/renzu/`
- staging: `/renzu/staging/`

Vite derives its `base` from `RENZU_DEPLOY_TARGET` so staging and production builds emit correct asset URLs.

The deployment infrastructure should preserve both environments in one Pages site rather than treating every deployment as a destructive replacement. This follows the useful part of the legacy playground `pages-state` model while removing its multi-game complexity.

Target site state:

```text
site/
├─ index.html            # production RENZU
├─ assets/               # production assets
└─ staging/
   ├─ index.html         # staging RENZU
   └─ assets/            # staging assets
```

## Release flow

```mermaid
flowchart LR
  A[Feature PR] --> B[CI]
  B --> C[main]
  C --> D[Build Staging]
  D --> E[Publish /renzu/staging/]
  E --> F[Release Tag]
  F --> G[Build Production]
  G --> H[Publish /renzu/]
```

Rules:

1. Pull requests validate tests and production compilation but do not deploy.
2. `main` is the staging source and should remain deployable.
3. A versioned release/tag promotes a tested revision to production.
4. Staging publication must not overwrite production state.
5. Production publication must not remove staging state.
6. GitHub Pages asset paths must be smoke-tested from the deployed URL, not only from local Vite preview.

The actual Pages workflow is implemented as a dedicated infrastructure slice after the standalone foundation is merged.
