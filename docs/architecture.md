# RENZU Architecture

## Product boundary

RENZU is a standalone hero-based tactical board strategy game. Board decisions remain authoritative; active hero systems manipulate board state, economy, targeting, and temporary effects without replacing the board with a separate HP/ATK combat model.

The current product baseline deliberately keeps **turn topology fixed across heroes**.

## Target module map

```text
src/
├─ app/              # bootstrap and application composition
├─ game/
│  ├─ board/         # board representation and line/win rules
│  ├─ match/         # match lifecycle and turn state
│  ├─ action/        # legal actions and action resolution
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

## Fixed-turn topology contract

The active R3 baseline has one logical turn contract for every hero:

```text
Player Action
  ↓
Board / Ability Resolution
  ↓
Passive / Economy / Board Effects
  ↓
Turn Handoff
  ↓
CPU Thinking
  ↓
CPU Action
  ↓
Board / Ability Resolution
  ↓
Passive / Economy / Board Effects
  ↓
Turn Handoff
  ↓
Player
```

`LegalAction` is intentionally limited to placement and ability actions. Every legal action resolves the acting side's logical turn.

The active runtime does not contain:

- precommit phases;
- triggered follow-up phases;
- after-step phases;
- chained same-turn hero actions;
- an explicit `END TURN` action used to escape a hero-specific phase.

Hero differentiation should first come from board manipulation, economy/readiness, passive outcomes, targeting rules, and temporary board effects.

A future hero may change turn topology only after the fixed-turn baseline has been validated and the product benefit clearly justifies the additional rules, AI, UI/UX, and regression complexity. This is a deliberate product decision, not an extension point that every hero is expected to use.

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
Session materializes economy / board effects
  ↓
Turn Handoff
```

The pattern reward follows the validated prototype rule: only lines crossing the newly placed stone qualify; an exact three contributes 1, an exact four contributes 2, qualifying directions accumulate, and a winning five does not grant an additional pattern reward.

This boundary is shared by player and CPU session resolution so passive behavior remains deterministic regardless of presentation or controller path.

## Active hero baseline

R3.1 intentionally evaluates three hero engines before adding roster breadth:

- **Vanguard** — cooldown / defense / protected topology;
- **Arcanist** — Mana / spatial control;
- **Shade** — Pressure / contact disruption.

Architect and Swordmaster are not active runtime/content entities. Their previous formation and Step/Sever experiments remain useful design history, but they are not compatibility requirements for the current product.

## AI tactical evaluation contract

AI must not implement a second copy of ability-resolution rules. Candidate actions come from the shared legal-action surface and tactical evaluation resolves one candidate against a cloned gameplay state through the same session resolver used by runtime play.

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

Because one legal action now equals one logical turn, `resolveCpuTurn()` and one-action tactical simulation share the same unit of work. Difficulty changes candidate selection variance and weighting, not gameplay legality or resolver behavior. Deeper search is a later optimization only if playtesting demonstrates that one-action tactical awareness is insufficient.

## Migration policy

The legacy `gomoku-rpg` implementation is a behavior and design reference, not a target folder structure or compatibility contract.

For each slice:

- preserve validated gameplay behavior unless it is explicitly redesigned;
- add characterization tests before or with extraction;
- remove obsolete compatibility glue when the product decision makes it unnecessary;
- do not copy legacy orchestration merely because the prototype supported it;
- keep the branch buildable and testable.

## Renderer bootstrap contract

The legacy prototype experienced a production blank-screen failure where assets loaded but no canvas was mounted. RENZU therefore keeps these constraints:

- resolve `#app` explicitly;
- renderer initialization has a finite timeout;
- attempt WebGL before WebGPU;
- mount the canvas only after successful initialization;
- emit observable renderer logs;
- render a visible DOM fallback if all renderer attempts fail.

## Hosting contract

RENZU uses GitHub Pages for staging and production.

Canonical paths:

- local development: `/`
- production: `/renzu/`
- staging: `/renzu/staging/`

Vite derives its `base` from `RENZU_DEPLOY_TARGET`. Staging and production must be preserved independently within the same Pages site.

```text
site/
├─ index.html
├─ assets/
└─ staging/
   ├─ index.html
   └─ assets/
```

## Release flow

```text
Feature PR
→ CI
→ main
→ staging
→ device/browser validation
→ release tag
→ production
```

Rules:

1. Pull requests validate tests and target compilation but do not deploy.
2. `main` is the staging source and should remain deployable.
3. A versioned release/tag promotes a tested revision to production.
4. Staging publication must not overwrite production state.
5. Production publication must not remove staging state.
6. GitHub Pages asset paths must be smoke-tested from the deployed URL, not only from local Vite preview.
