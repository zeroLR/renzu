# RENZU Product Roadmap

## Purpose

This document is the product-level roadmap from the current playable staging build to RENZU v1.0 and post-launch expansion.

The roadmap answers four questions:

1. What product milestone are we currently building toward?
2. What must exist before the next milestone starts?
3. What is intentionally outside the current release scope?
4. What evidence is required to call a milestone complete?

Implementation sequencing lives in [`execution-plan.md`](execution-plan.md). Architecture and deployment details remain in [`architecture.md`](architecture.md) and [`deployment.md`](deployment.md).

---

## Product direction

RENZU is a hero-based tactical board strategy game.

The board remains authoritative. Heroes are tactical engines that alter how players build, defend, disrupt, and convert board patterns; they do not replace board strategy with a separate HP/ATK combat layer.

### Product principles

- **Board decisions remain authoritative.**
- **Heroes are gameplay engines, not stat packages.**
- **Horizontal mastery before vertical power.**
- **Readability before spectacle.**
- **Short-session depth.**
- **Learn through play.**
- **Mobile-first interaction, desktop-compatible presentation.**
- **Staging is part of development, not a release afterthought.**

---

## v1.0 scope lock

The following is the target v1.0 product boundary.

### Modes

- Main Story
- Free Battle

### Core game

- 9×9 intersection-based board
- five-in-a-row victory grammar
- hero abilities that manipulate position, timing, board effects, or tactical economy
- CPU Easy and Normal

### Hero roster

Target: **5 polished heroes**.

| Hero | Engine | Strategic identity |
| --- | --- | --- |
| Vanguard | Cooldown | defense, stability, controlled repositioning |
| Arcanist | Resource / Mana | resource cycling, board-space conversion |
| Shade | Conditional / Pressure | disruption, pressure, enemy-board interaction |
| Architect | Formation | setup, formation, spatial control |
| Swordmaster | Momentum | tempo, chaining, forward pressure |

### Story

Target: **6 chapters**.

Recommended chapter learning arc:

1. Rules and board authority
2. Defense and threat response
3. Resource and timing
4. Disruption and tactical removal
5. Formation and spatial control
6. Mastery and mixed-system encounters

Each chapter should be data-driven and reuse the shared rules engine rather than add chapter-specific combat code.

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
- backend accounts
- cloud save
- ranking / leaderboard
- guilds / social systems
- Roguelike mode
- Hard / Extreme / Manic / Chaos difficulty tiers
- subscriptions / ads / gacha
- native mobile application packaging

These items may be revisited after the core single-player product demonstrates retention and replay value.

---

# Milestone map

```text
R0 Foundation
   ↓
R1 Staging Validation
   ↓
R2 Combat Complete
   ↓
R3 Hero + Story Content Complete
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
   ↓
Post-launch Expansion
```

---

## R0 — Foundation

**Status: complete.**

### Product outcome

RENZU exists as an independent product codebase with stable gameplay/application boundaries rather than as a playground prototype.

### Delivered foundation

- standalone PixiJS + TypeScript + Vite application
- board and match domain
- action/legal-action model
- hero definitions and economy contracts
- board effects and action timing
- AI evaluation / decision foundation
- CPU session orchestration
- progression/profile storage foundation
- Story and Free Battle mode configs
- product routing and portrait-first presentation shell
- interactive battle screen
- Story settlement/rematch/continuation lifecycle
- GitHub Pages staging/production deployment foundation

### Exit condition

Future product work can add content and polish without returning to a monolithic prototype runtime.

---

## R1 — Staging Validation

**Status: current milestone.**

### Goal

Prove that the current vertical slice survives real browsers and real mobile devices, and establish staging as the normal feedback loop for all later milestones.

### Required work

- iPhone Safari smoke
- Android Chrome smoke
- desktop Chrome smoke
- one secondary desktop browser
- safe-area and viewport validation
- touch target validation
- background / foreground resume check
- reload and profile persistence check
- Story E1-1 completion → reload → E1-2 unlock check
- Free Battle complete-match check
- ability targeting check
- renderer boot / visible fallback check
- deployment smoke CI false-positive cleanup

### Exit criteria

A player can, on a real phone:

1. open staging;
2. enter Story;
3. complete E1-1;
4. observe normal CPU turn cadence;
5. see the result lifecycle;
6. reload the browser;
7. confirm progression persisted and E1-2 remains unlocked;
8. continue without developer tooling.

No P0/P1 device or deployment blockers remain.

### Deliberately deferred

- large VFX pass
- full audio set
- extra heroes
- later Story chapters

---

## R2 — Combat Complete

### Goal

Make the shared combat model complete enough that every ability exposed by the v1 hero roster has reliable rules, lifecycle, AI interaction, and tests.

### Required work

#### Ability fidelity

- Bulwark
- Rally
- Lattice
- final Step semantics
- final Sever timing
- Charge edge cases
- Guard / Seal / Corruption / Flame lifetime verification

#### Passive lifecycle

- pattern-aware passive events
- Vanguard pattern reward semantics
- Swordmaster momentum reward/decay semantics
- Architect formation evaluation completion
- Shade pressure lifecycle verification
- Arcanist resource flow verification

#### Legal-action contract

Hero definition → loadout → legal action → resolver must be the source of truth. Presentation must not maintain a parallel ability-rule system.

#### AI ability awareness

AI should recognize tactical outcomes produced by abilities, including:

- ability-generated wins
- ability-generated forced blocks
- threat removal
- board-space denial
- position/topology changes

The target is credible Easy/Normal behavior, not maximum search depth.

### Exit criteria

For every v1 hero:

- placement works;
- passive lifecycle works;
- each exposed ability has legal targeting and resolution;
- economy/cooldown behavior is correct;
- CPU can use the hero without entering invalid states;
- win detection remains authoritative;
- characterization tests cover core behavior;
- staging does not expose fake or unsupported actions.

---

## R3 — Hero + Story Content Complete

### Goal

Turn the vertical slice into a complete single-player game content set.

### R3A — Five-hero gameplay pass

Each hero must feel strategically distinct before content quantity expands.

Quality bar:

- different board-reading priorities;
- different economy/readiness rhythm;
- at least one signature tactical pattern;
- readable counterplay;
- no hero requires bespoke battle-screen architecture.

### R3B — Story content schema

Story content should become data-driven.

Expected encounter contract should support concepts such as:

- encounter id / chapter
- player hero rule
- CPU hero
- CPU difficulty
- optional board preset
- optional mechanic modifier
- rewards
- unlock rule
- teaching concept / copy

### R3C — Six chapters

Target: approximately 6 encounters per chapter, subject to playtest validation rather than a hard content quota.

Suggested shape:

- standard tactical encounters
- one mechanic-focused encounter
- one boss/mastery encounter

### Difficulty

Ship Story with Easy and Normal only.

### Exit criteria

A clean profile can start Chapter 1 and progress through the final Chapter 6 encounter without debug overrides or missing content states.

---

## R4 — Progression Complete

### Goal

Create a replay/progression loop that rewards broader tactical expression instead of raw stat inflation.

### Required work

#### Reward economy

Define and balance:

- Soul earn sources
- Skill Fragment earn sources
- encounter rewards
- repeat-clear policy
- boss / chapter rewards

#### Hero unlock loop

Unlock rules must be understandable and achievable through normal play.

#### Hero Archive

The Heroes route becomes a real product surface for:

- identity
- engine
- passive
- abilities
- unlock state
- mastery / sidegrade visibility

#### Skill Fragments

Preferred use:

- alternate ability unlocks
- loadout breadth
- sidegrades
- mastery choices

Avoid turning the main strategy layer into percentage-stat grinding.

### Exit criteria

The loop is coherent from battle → result → reward → unlock/mastery → next battle, and progression survives reload/version normalization.

---

## R5 — Game Feel Complete

### Goal

Move from “functionally playable” to “recognizably RENZU.”

### Tactical feedback

Prioritize feedback that communicates board state:

- stone placement
- last action
- threat creation / forced defense
- ability targeting and resolution
- board-effect appearance / expiry
- resource gain / spend
- cooldown ready
- victory line
- result transition

### Motion

Motion must not hide board information.

Recommended scale:

- state transitions: short
- stone feedback: very short
- ability resolution: short and legible
- victory/result: longer, but bounded

### Audio

Minimum useful set:

- player stone
- opponent stone
- invalid action
- ability ready
- ability resolve
- threat / important tactical event
- victory
- defeat

### Haptics

Use where supported, with graceful fallback.

### UX polish

- disabled and targeting states
- readable economy meters
- clear turn state
- result continuation hierarchy
- settings/accessibility surface as required by beta feedback

### Exit criteria

A full match has deliberate pacing and feedback without debug-style presentation or ambiguous action state.

---

## R6 — Closed Beta

### Goal

Validate comprehension, retention signals, difficulty, and browser/device stability with external players.

### Audience

Start small. A focused group is more useful than broad acquisition before telemetry and content stability exist.

### Diagnostics / analytics

Stabilize an event schema around:

- session start/end
- mode start
- encounter start/end
- placement
- ability use
- match result
- rematch
- hero unlock
- difficulty
- duration / turn count

### Balance questions

Measure:

- encounter fail rate
- boss churn points
- average turn count
- match duration
- hero usage / win patterns
- ability usage
- rematch rate
- progression drop-off

### Save hardening

Before beta expands:

- profile versioning
- migrations
- corrupted-save fallback
- reset profile
- useful diagnostics export

### Exit criteria

- no open P0 issues;
- P1 issues are understood and bounded;
- save upgrades are safe;
- core Story is completable on supported browsers;
- balance no longer depends only on developer intuition.

---

## R7 — Release Candidate

### Goal

Freeze v1 product scope and prove a candidate revision can be promoted directly to production.

### Feature freeze

Do not add:

- heroes
- abilities
- chapters
- new progression systems
- major navigation/layout changes

Allowed work:

- P0/P1 fixes
- balance
- performance
- copy
- accessibility fixes
- small UX corrections

### Release hardening

- content lock
- version/build SHA visibility
- release notes process
- production smoke
- rollback procedure
- supported-browser QA matrix
- performance/memory check
- persistence migration check

### Exit criteria

An RC tag passes CI, staging validation, production-candidate smoke, and the agreed QA matrix without known release blockers.

---

## R8 — v1.0 Production

### Goal

Ship the locked v1 scope as the first public production release.

### Release contents

- Main Story
- Free Battle
- 5 polished heroes
- 6 Story chapters
- Easy / Normal CPU
- Soul / Skill Fragment progression
- Hero unlock / Archive
- mobile + desktop web support
- production monitoring/diagnostics sufficient to detect boot and fatal-session issues

### Success condition

The product is stable enough that subsequent work is chosen from player evidence rather than unfinished v1 foundation work.

---

# Post-launch tracks

Post-launch work should be selected by observed player behavior rather than precommitted as v1 scope.

## Track A — Low-cost replayability

- Daily Puzzle
- Weekly Challenge
- boss remixes
- board presets
- Hero mastery challenges

These reuse the existing deterministic board/action engine and are the preferred first live-content experiments.

## Track B — Roguelike expansion

Roguelike is the preferred first major mode expansion if the hero/board interaction proves replayable.

Potential loop:

```text
Hero selection
  ↓
Battle
  ↓
Tactical modifier / sidegrade
  ↓
Battle / Elite
  ↓
Build evolution
  ↓
Boss
```

Keep it on the same game-domain and legal-action foundation.

## Track C — Higher difficulty

Hard / Extreme / Manic / Chaos should change decision policy and encounter pressure, not simply increase opaque numbers.

## Track D — Online era

Only after the single-player product justifies the investment:

- account
- cloud save
- authoritative online match
- matchmaking
- ranking
- reconnect
- anti-cheat
- spectating

Do not pre-build this infrastructure during v1 unless a concrete requirement appears.

---

# Roadmap governance

## Scope rule

A feature enters the active milestone only when it is necessary for that milestone's exit criteria.

## Architecture rule

Refactor only when one of these is true:

- current architecture blocks the next product slice;
- duplicated rules risk divergent gameplay behavior;
- a staging/beta defect exposes a real boundary problem;
- the change measurably improves delivery safety.

Avoid architecture work whose main value is aesthetic cleanliness.

## Development allocation target

From R1 onward, the default investment mix should trend toward:

- ~20% architecture / hardening
- ~50% gameplay + content
- ~30% UX / feel / QA

This is directional, not a time-tracking requirement.

## Milestone gate rule

Do not call a milestone complete because its feature list exists. It is complete only when its exit criteria can be demonstrated on staging or the relevant release environment.
