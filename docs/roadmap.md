# RENZU Product Roadmap

## Purpose

This document defines the product-level path from the current playable staging build to RENZU v1.0. Implementation sequencing lives in [`execution-plan.md`](execution-plan.md); architecture and deployment contracts live in [`architecture.md`](architecture.md) and [`deployment.md`](deployment.md).

---

## Product direction

RENZU is a hero-based tactical board strategy game.

The board remains authoritative. Heroes change how players build, defend, control, and disrupt patterns; they do not replace board strategy with a separate combat layer.

### Product principles

- **Board decisions remain authoritative.**
- **Heroes are gameplay engines, not stat packages.**
- **Consistency before special-case flow.**
- **Horizontal mastery before vertical power.**
- **Readability before spectacle.**
- **Short-session depth.**
- **Learn through play.**
- **Mobile-first interaction, desktop-compatible presentation.**
- **Staging is part of development.**

---

## v1.0 scope lock

### Modes

- Main Story
- Free Battle

### Core game

- 9×9 intersection-based board
- five-in-a-row victory grammar
- one shared fixed turn topology across active heroes
- hero abilities that manipulate position, board effects, targeting, or tactical economy
- CPU Easy and Normal

### Active hero roster

Target baseline: **3 polished heroes**.

| Hero | Engine | Strategic identity |
| --- | --- | --- |
| Vanguard | Cooldown | defense, stability, controlled repositioning |
| Arcanist | Mana | resource cycling, spatial control |
| Shade | Pressure | disruption, contact, enemy-board interaction |

Architect and Swordmaster are removed from the active v1 baseline. Replacement or additional heroes are not required until the three-hero fixed-turn gameplay pass proves how much differentiation is achievable without changing turn topology.

### Turn topology baseline

```text
Player Action
→ Turn Resolution
→ CPU Thinking
→ CPU Action
→ Player
```

The active runtime does not use precommit, after-step, triggered follow-up, chained same-turn hero actions, or hero-specific END TURN phases.

A future hero may propose a different turn topology only after R3.1 validates the fixed-turn baseline and the product benefit clearly outweighs the added rules, AI, UX, and QA complexity.

### Story

Target: **6 chapters**, subject to content pacing validation.

Recommended learning arc:

1. Rules and board authority
2. Defense and threat response
3. Resource conversion
4. Disruption and tactical removal
5. Spatial control and matchup adaptation
6. Mastery and mixed-system encounters

Each chapter must reuse the shared rules/session engine rather than introduce chapter-specific combat flow.

### Progression

- local-first player profile
- Soul
- Skill Fragments
- hero unlocks
- Hero Archive / mastery surface
- sidegrades and tactical breadth preferred over raw percentage power escalation

### Platforms

- Mobile Web
- Desktop Web
- PWA-ready architecture

### Explicitly not in v1.0

- Online PvP
- backend accounts / cloud save
- ranking / leaderboard
- guild/social systems
- Roguelike mode
- Hard / Extreme / Manic / Chaos
- subscriptions / ads / gacha
- native mobile packaging

---

# Milestone map

```text
R0 Foundation                  ✅
   ↓
R1 Staging Validation          ✅ product sign-off
   ↓
R2 Combat Complete             ✅ product sign-off
   ↓
R3 Hero + Story Content        ← current
   ↓
R4 Progression Complete
   ↓
R5 Game Feel Complete
   ↓
R6 Closed Beta
   ↓
R7 Release Candidate
   ↓
R8 v1.0 Production
```

---

## R0 — Foundation

**Status: complete.**

RENZU exists as an independent PixiJS + TypeScript product with stable board, match, legal-action, hero, AI, progression, presentation, and deployment boundaries.

---

## R1 — Staging Validation

**Status: complete by product sign-off.**

Established staging deployment, mobile/browser validation, intersection-based Gomoku board presentation, CPU thinking cadence, and deploy health gates.

Remaining device checks may continue as regression QA but no longer block the roadmap.

---

## R2 — Combat Complete

**Status: complete, then simplified by product decision.**

R2 proved the reusable combat stack:

- legal-action authority
- board-effect lifetime
- pattern/passive lifecycle
- targeting readability
- ability-aware one-action AI simulation
- combat characterization gate

Architect/Swordmaster and their follow-up timing experiments were valid prototype/R2 exploration, but are intentionally removed from the active product baseline. R2's durable output is the shared combat architecture, not preservation of every experimental hero mechanic.

---

## R3 — Hero + Story Content Complete

### Goal

Prove the active hero model is strategically rich under one clean battle flow, then scale Story content on top of that stable contract.

### R3.1 — Three-Hero Fixed-Turn Gameplay Pass

Validate Vanguard, Arcanist, and Shade in Free Battle.

For each hero, prove:

- a distinct board-reading priority;
- a distinct economy/readiness rhythm;
- at least one signature tactical sequence;
- understandable counterplay;
- a default loadout that demonstrates the engine;
- Easy/Normal CPU behavior consistent with the same identity.

The key product question is:

> Can board manipulation + economy + passive + targeting + temporary effects create enough hero depth without changing turn topology?

**Exit:** all three heroes are recognizably different on staging with no P0/P1 identity or turn-flow blockers.

Only after this exit may we evaluate a fourth/fifth hero concept or a hero that changes turn topology.

### R3.2 — Story Content Schema

Move Story encounters to a content-oriented contract supporting:

- encounter id / chapter / order
- player hero rule
- CPU hero + difficulty
- optional board preset
- optional mechanic modifier
- teaching concept / copy
- rewards / unlock rule
- boss flag

**Exit:** adding a normal encounter does not require editing battle runtime code.

### R3.3 — Chapters 2–3

Validate chapter pacing before producing the full content graph.

Focus:

- defense / threat response
- resource conversion / spatial control
- tutorial readability without text walls
- Easy/Normal placement

### R3.4 — Chapters 4–6

Complete the Story only after the first-half structure is validated.

Focus:

- disruption
- matchup adaptation
- mixed mastery
- boss/mastery encounters

### R3.5 — Story / Easy-Normal Balance Pass

Tune encounter policy after the complete Story graph exists.

**R3 exit:** a clean profile can progress from Chapter 1 through the final Chapter 6 encounter without debug overrides or missing content states.

---

## R4 — Progression Complete

### Goal

Create a replay/progression loop that broadens tactical expression rather than inflating stats.

Required work:

- Soul and Skill Fragment reward policy
- first-clear / repeat-clear / boss rewards
- hero unlock loop for the active roster
- Hero Archive
- sidegrades / alternate loadout breadth
- profile normalization and migration hardening

**Exit:** battle → result → reward → unlock/mastery → next battle is coherent and persists safely.

---

## R5 — Game Feel Complete

### Goal

Move from functionally playable to recognizably RENZU.

Priority feedback:

- stone placement
- last action
- threat / forced defense
- ability targeting and resolution
- board-effect appearance / expiry
- resource gain / spend
- cooldown ready
- victory line / result transition

Add a restrained shared motion/audio/haptic vocabulary. Gameplay state must remain readable and the fixed turn flow must never become obscured by presentation.

**Exit:** a complete match feels deliberate, responsive, and unambiguous without debug-style presentation.

---

## R6 — Closed Beta

### Goal

Validate comprehension, retention signals, difficulty, and browser/device stability with external players.

Stabilize diagnostics around:

- session / mode / encounter start-end
- hero matchup
- placement / ability use
- result / rematch
- duration / turn count
- progression

Harden profile versioning, migrations, corrupted-save fallback, reset, and diagnostics export.

**Exit:** no open P0; P1 issues are understood and bounded; core Story is completable on supported browsers.

---

## R7 — Release Candidate

Freeze v1 product scope.

Do not add heroes, abilities, chapters, progression systems, or major navigation/layout changes after content freeze unless they resolve a release blocker.

Required hardening:

- browser/performance QA
- accessibility/settings minimum
- version/build SHA visibility
- content lock
- migration check
- rollback procedure
- release notes / known issues
- production-candidate smoke

---

## R8 — v1.0 Production

Release contents:

- Main Story
- Free Battle
- **3 polished active heroes**
- 6 Story chapters
- Easy / Normal CPU
- Soul / Skill Fragment progression
- Hero unlock / Archive
- mobile + desktop web support
- boot/fatal-session diagnostics

Success means subsequent development is chosen from player evidence rather than unfinished v1 foundation work.

---

# Post-launch / future exploration

## Hero expansion

A fourth/fifth hero is evaluated after R3.1, not assumed in advance.

Preferred order of exploration:

1. new fixed-turn board/economy identity;
2. new targeting or board-effect grammar;
3. only then, if necessary, altered turn topology.

## Low-cost replayability

- Daily Puzzle
- Weekly Challenge
- boss remixes
- board presets
- mastery challenges

## Roguelike

Preferred first major mode expansion if hero/board interaction proves replayable.

## Higher difficulty

Hard+ should change decision policy and encounter pressure rather than add opaque stat scaling.

## Online era

Only after the single-player product justifies account/cloud/matchmaking infrastructure.

---

# Roadmap governance

## Scope rule

A feature enters the active milestone only when it is necessary for that milestone's exit criteria.

## Architecture rule

Refactor only when current architecture blocks the next product slice, duplicated rules risk divergence, staging/beta exposes a real boundary defect, or the change measurably improves delivery safety.

## Turn-topology rule

Do not create hero-specific phases because they are novel. First attempt to express the identity through the fixed-turn primitives. A topology exception requires explicit product justification and a staging validation plan.

## Milestone gate rule

A milestone is complete only when its exit criteria can be demonstrated on staging or the relevant release environment.
