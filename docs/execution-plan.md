# RENZU Execution Plan

## Purpose

This document converts [`roadmap.md`](roadmap.md) into small, reviewable implementation slices organized around dependencies and release gates rather than calendar promises.

---

# Operating model

```text
feature/* or fix/*
→ Pull Request
→ CI
→ main
→ Staging
→ Device / browser validation
→ Release tag
→ Production
```

Rules:

1. `main` stays releasable.
2. Gameplay changes receive characterization coverage.
3. Presentation consumes shared legal-action/session state instead of duplicating gameplay rules.
4. Staging feedback may reorder the next slice when it exposes a real product blocker.
5. Do not combine unrelated gameplay, balance, UI redesign, deployment, and refactor work.
6. The active hero baseline uses one fixed turn topology; exceptions require explicit product approval.

## Definition of Done

A slice is done when applicable conditions are true:

- behavior uses the intended architecture boundary;
- regression tests cover the important contract;
- tests and target build pass;
- no new boot/black-screen path is introduced;
- mobile interaction remains usable when input/UI changes;
- visible changes are validated on staging;
- durable contracts are documented.

A merged PR is not automatically a completed product slice if staging disproves the intended behavior.

## Severity

- **P0** — release blocking: boot failure, progression loss, unrecoverable save, match cannot complete, deployment cannot publish.
- **P1** — milestone blocking: common legal action wrong, supported mobile input unusable, Story stuck, important ability unreliable, CPU/session stuck.
- **P2** — fix before RC: misleading feedback, balance outlier, readability issue, non-critical browser inconsistency.
- **P3** — polish/backlog.

---

# Completed foundation

## R1 — Staging Validation

Closed by product sign-off. Staging, mobile/browser smoke, Gomoku intersection presentation, CPU thinking cadence, and deployment smoke behavior are established.

## R2 — Combat Complete

Closed by product sign-off. Durable outputs:

- shared legal-action/resolver authority;
- pattern/passive lifecycle;
- board-effect lifetime;
- combat targeting readability;
- one-action tactical AI simulation;
- combat regression gate.

R2 also explored Architect formation and Swordmaster Step/Sever follow-up timing. Those experiments are intentionally **not** compatibility requirements after the three-hero fixed-turn simplification.

---

# Current execution sequence

## R3.1 — Three-Hero Fixed-Turn Gameplay Pass

**Goal:** prove that Vanguard, Arcanist, and Shade create meaningfully different match plans while sharing one clean battle flow.

### Fixed turn contract

```text
Player Action
→ Resolution / Passive / Economy / Effects
→ CPU Thinking
→ CPU Action
→ Resolution / Passive / Economy / Effects
→ Player
```

Every active legal placement or ability completes the acting side's logical turn.

The active runtime must not reintroduce:

- precommit phases;
- Step / after-step;
- triggered follow-up;
- chained same-turn hero actions;
- hero-specific `END TURN` escape actions.

### Active roster

For Vanguard, Arcanist, and Shade define and validate:

- primary tactical question;
- economy/readiness rhythm;
- signature play sequence;
- weakness/counterplay;
- default loadout;
- beginner behavior;
- expected CPU behavior.

### Staging comparison

Required comparisons:

- Vanguard vs Arcanist — protected/cooldown topology vs Mana/spatial control;
- Arcanist vs Shade — spatial control vs contact disruption;
- Vanguard vs Shade — stability/repositioning vs enemy-pressure removal.

Use Issue #31 as the staging matrix.

### Exit criteria

- only Vanguard / Arcanist / Shade are active in runtime and setup;
- legacy profile data safely drops removed hero IDs;
- all three use the same turn topology;
- all three create recognizably different board-reading priorities and economy rhythms;
- default loadouts demonstrate those identities;
- Easy/Normal CPU behavior does not contradict them in common situations;
- no P0/P1 identity or turn-flow blocker remains.

### Decision gate after R3.1

Only after the fixed-turn baseline is validated do we evaluate:

1. whether a fourth/fifth hero is necessary for v1;
2. whether additional differentiation can remain fixed-turn;
3. whether any hero-specific turn-topology change is worth its rules/AI/UX/testing complexity.

Do not assume a topology-changing hero is required.

---

## R3.2 — Story Content Schema

Move encounter definition toward a typed content contract.

Recommended capabilities:

- id / chapter / order
- player hero constraints
- CPU hero / difficulty
- optional board preset
- optional mechanic modifier
- concepts/tutorial copy
- reward definition
- unlock rule
- boss flag

Keep mode orchestration generic and keep encounter content out of battle runtime.

**Exit:** adding a normal encounter does not require editing combat/session code.

---

## R3.3 — Chapters 2–3

Build enough content to validate chapter pacing before producing all remaining chapters.

Focus:

- defense / threat response;
- resource conversion / spatial control;
- teaching through play rather than text walls;
- Easy/Normal placement.

Use staging to decide whether the assumed encounter count per chapter is appropriate.

**Exit:** first half of Story has coherent pacing and no content-schema blocker.

---

## R3.4 — Chapters 4–6

Complete the remaining content only after Chapters 2–3 validate the structure.

Focus:

- disruption;
- matchup adaptation;
- mixed mastery;
- boss/mastery encounters.

**Exit:** a clean profile can reach the ending through normal progression.

---

## R3.5 — Story / Easy-Normal Balance Pass

Tune after the complete content graph exists.

Track:

- fail rate;
- turn count;
- repeated failure points;
- boss spikes;
- hero matchup pressure.

Do not create Hard+ during this pass.

---

# R4 — Progression Complete

## R4.1 — Reward Economy

Define before implementing UI numbers:

- Soul source/sinks;
- Skill Fragment source/sinks;
- first-clear / repeat-clear rewards;
- chapter/boss rewards;
- unlock costs/conditions.

Then implement idempotent settlement through profile boundaries.

## R4.2 — Hero Unlock Loop

Connect Story/rewards to active hero availability.

Requirements:

- understandable unlock path;
- no impossible state;
- Free Battle respects ownership;
- normalization preserves valid active unlocks and removes retired IDs.

## R4.3 — Hero Archive

Replace the placeholder Heroes screen with:

- identity / engine;
- passive;
- abilities;
- economy/readiness explanation;
- unlock state;
- mastery/sidegrade visibility.

## R4.4 — Skill Fragment Sidegrades

Introduce breadth only after the active hero baseline is stable.

Preferred outcome: alternate tactical choices, not percentage-stat grind.

---

# R5 — Game Feel Complete

## R5.1 — Tactical Motion

Create a small shared motion vocabulary for:

- stone placement;
- source/target selection;
- CPU turn handoff;
- ability resolve;
- board-effect appear/expire;
- result transition.

## R5.2 — Audio Foundation

Add an autoplay-safe audio boundary and a minimal sound set for stone, invalid action, ability, and result events.

## R5.3 — Haptics / Mobile Feedback

Capability-detected only; never required for understanding gameplay.

## R5.4 — Battle / Result Polish

Integrate motion/audio/haptics without obscuring board state or weakening the fixed turn cadence.

---

# R6 — Closed Beta

## R6.1 — Diagnostics / Analytics Contract

Minimum dimensions:

- build/version;
- mode / encounter;
- hero matchup;
- difficulty;
- turn count / duration;
- action type / ability id;
- result.

Avoid unnecessary personal data.

## R6.2 — Save Migration / Recovery

- versioned migrations;
- corrupted-save fallback;
- reset profile;
- safe defaults;
- diagnostics/export snapshot;
- old-profile fixtures, including retired hero IDs.

## R6.3 — Closed Beta Run

Collect comprehension, Story churn, hero preference, ability usage, difficulty, device/browser failures, and qualitative “why did this happen?” feedback.

## R6.4 — Beta Balance + UX

Prioritize observed friction over feature-request volume.

---

# R7 — Release Candidate

## R7.1 — Browser / Performance QA

Validate boot, renderer fallback, resize/safe-area, repeated rematches, memory growth, background/resume, and save persistence.

## R7.2 — Accessibility / Settings Minimum

Finalize required audio, reduced-motion, contrast, non-color-only states, and reset/diagnostics controls from beta evidence.

## R7.3 — Content Freeze

Lock the approved active hero roster, ability set, Story chapters, progression rules, and UI structure.

Do not hard-code a five-hero freeze; the approved roster is whatever passes the R3 product gate.

## R7.4 — RC Promotion

```text
main
→ staging validation
→ v1.0.0-rc.N
→ production candidate smoke
→ final approval
→ v1.0.0
```

---

# R8 — v1.0 Production

Launch gate:

- scope matches roadmap lock;
- CI green;
- staging/device matrix green;
- save migration green;
- production build/deploy/browser smoke green;
- no open P0;
- accepted P1 list empty;
- release notes published.

---

# Cross-cutting rules

## Design System

Extend existing tokens/components only when repeated product patterns justify it. Do not create screen-specific visual rules when the existing system can express the interaction.

## Content tooling

Prefer typed content definitions and validation before building visual editors.

## Performance

Profile before optimizing.

## Backend

No backend exists in v1 scope; do not introduce account/security architecture without a product requirement.

## PR sizing

Default to one product behavior or architecture boundary per PR, with tests and staging-visible validation included when applicable.

## New-idea filter

Ask:

1. Does it block the active milestone?
2. Does it fix a P0/P1 problem?
3. Does it strengthen RENZU's board + hero identity?
4. Can it wait without creating rework?

If 1 and 2 are both no, it normally belongs later.
