# RENZU Execution Plan

## Purpose

This document turns the product milestones in [`roadmap.md`](roadmap.md) into an execution sequence that can be implemented as small, reviewable pull requests.

The plan is intentionally organized around **dependencies and release gates**, not calendar promises. Each slice should be small enough to validate independently on CI and, when appropriate, staging.

---

# Operating model

## Branching and release flow

```text
feature/* or fix/*
  ↓
Pull Request
  ↓
CI
  ↓
main
  ↓
Staging
  ↓
Device / browser validation
  ↓
Release tag
  ↓
Production
```

Rules:

1. `main` stays releasable.
2. Feature work lands through focused PRs.
3. Every gameplay rule change gets characterization coverage.
4. Presentation must consume shared legal-action/session state rather than duplicate gameplay rules.
5. Staging feedback can reorder the next slices when it exposes a real product blocker.
6. Do not stack unrelated gameplay, balance, UI redesign, and refactor work in one PR.

---

# Definition of Done for a slice

A slice is done when all applicable conditions are true:

- behavior is implemented through the intended architecture boundary;
- tests cover the important contract or regression;
- `npm test` passes;
- target build passes;
- no known new black-screen / boot failure path is introduced;
- mobile interaction remains usable where the slice changes input/UI;
- staging validation is completed for visible gameplay changes;
- documentation is updated when a durable contract changes.

A merged PR is not automatically a completed product slice if staging disproves the intended behavior.

---

# Priority classification

## P0 — release blocking

- boot failure / black screen
- corrupted or unrecoverable save
- game cannot complete a legal match
- progression loss
- deployment cannot publish the target revision

## P1 — milestone blocking

- common legal action produces wrong state
- input unusable on a supported mobile device
- Story progression cannot continue
- important ability cannot be used reliably
- CPU/session can enter a stuck turn

## P2 — should fix before RC

- misleading feedback
- balance outlier
- visual/readability problem
- non-critical browser inconsistency

## P3 — polish / backlog

- optional animation refinement
- minor copy/layout refinement
- non-essential convenience feature

---

# Current execution sequence

## R1 — Staging Validation

### R1.1 — Device smoke matrix

**Goal:** prove the current vertical slice on real devices.

Validate:

- iPhone Safari
- Android Chrome
- desktop Chrome
- one secondary desktop browser

Flow:

```text
Home
→ Story
→ E1-1
→ player placement
→ CPU thinking / response
→ ability interaction
→ result
→ next / return
→ reload
→ progression persists
```

Also validate:

- safe areas
- browser chrome resize
- accidental scrolling/overscroll
- touch targets near board edges
- background → foreground resume
- renderer boot
- localStorage persistence

**Exit:** no P0/P1 device blockers.

---

### R1.2 — Deployment smoke gate cleanup

**Goal:** make CI report deployment health accurately.

Known constraint: custom-domain HTTP checks may be rejected by the hosting/CDN layer even when the deployed page is browser-accessible.

Preferred contract:

- build/base-path verification remains blocking;
- `actions/deploy-pages` success remains blocking;
- canonical Pages-origin smoke may be blocking if stable;
- custom-domain smoke should not create a false deployment failure unless it represents the actual user-facing availability contract.

**Exit:** successful deployments do not report false-negative failure, and real asset-path failures remain detectable.

---

# R2 — Combat Complete

## R2.1 — Advanced ability completion

Implement the remaining v1 ability semantics through the shared resolver.

Scope:

- Bulwark
- Rally
- Lattice
- Step final semantics
- Sever final timing
- Charge edge cases
- board effect interactions as required

For each ability:

```text
Definition
→ Candidate generation
→ Legal targeting
→ Economy readiness
→ Resolution
→ Timing / turn consumption
→ Board effects
→ History
→ AI availability
```

Tests should focus on legal/illegal target boundaries and lifecycle effects, not every coordinate permutation.

**Do not combine with major balance tuning.**

---

## R2.2 — Pattern/passive lifecycle

Create the stable pattern-event boundary needed by placement passives.

Target responsibilities:

- evaluate meaningful placement outcome once;
- expose a reusable passive context;
- avoid re-scanning the board independently inside each hero;
- keep passive resolution deterministic.

Complete:

- Vanguard fortified reward semantics
- Swordmaster momentum gain/decay semantics
- Architect formation readiness
- Shade pressure verification
- Arcanist flow verification

**Exit:** no placeholder pattern reward remains in the v1 runtime.

---

## R2.3 — Ability-aware AI evaluation

Extend AI evaluation from generic ability opportunity to simulated tactical outcome where necessary.

Priority cases:

1. ability-created immediate win
2. ability-created forced block
3. enemy threat removal
4. position/topology movement
5. blocking/denial value

Keep Easy / Normal bounded and readable. Avoid deep search work unless profiling proves it is needed.

**Exit:** CPU no longer ignores obviously winning/defensive ability outcomes.

---

## R2.4 — Combat characterization gate

Create one milestone-focused regression pass covering:

- all five hero engines
- legal placements
- ability lifecycle
- cooldown/resources
- board-effect expiry
- Step/follow-up chain
- CPU full-turn return
- match ending from normal and ability actions

This is a gate PR/test pass, not an architecture redesign.

**Exit:** R2 staging combat matrix is green.

---

# R3 — Hero + Story Content Complete

## R3.1 — Five-hero gameplay pass

Before multiplying Story content, validate each hero's identity in Free Battle.

For each hero define:

- primary tactical question
- economy rhythm
- signature play pattern
- weakness/counterplay
- default loadout
- expected beginner behavior
- expected CPU behavior

The objective is differentiation, not perfect balance.

**Exit:** each hero creates a recognizably different match plan.

---

## R3.2 — Story content schema

Move encounter definition toward a content-oriented contract.

Recommended fields/capabilities:

- id
- chapter
- sequence/order
- player hero constraints
- CPU hero
- difficulty
- optional board preset
- optional encounter modifier
- concepts/tutorial copy
- reward definition
- unlock rule
- boss flag

Keep mode orchestration generic.

**Exit:** adding a normal encounter does not require editing battle runtime code.

---

## R3.3 — Chapters 2–3

Build enough content to validate pacing and chapter structure before producing all remaining chapters.

Focus:

- Chapter 2: defense / threat response
- Chapter 3: resource / timing

Use staging to answer:

- are six encounters per chapter too many or too few?
- are teaching concepts visible without tutorials becoming walls of text?
- does Normal difficulty belong only at mastery/boss points or more broadly?

**Exit:** first half of Story has coherent pacing.

---

## R3.4 — Chapters 4–6

Produce the remaining content only after the Chapter 2–3 structure is validated.

Focus:

- Chapter 4: disruption
- Chapter 5: formation
- Chapter 6: mixed mastery

**Exit:** a clean profile can reach the ending through normal progression.

---

## R3.5 — Story / Easy-Normal balance pass

Tune encounter policy and CPU profile after the complete content graph exists.

Balance targets should consider:

- fail rate
- turn count
- repeated failures
- boss spikes
- hero matchup pressure

Avoid creating Hard+ during this pass.

---

# R4 — Progression Complete

## R4.1 — Reward economy specification + implementation

First define reward policy before adding numbers to UI.

Specify:

- Soul source/sinks
- Skill Fragment source/sinks
- first-clear rewards
- repeat-clear rewards
- chapter/boss rewards
- unlock costs / conditions

Then implement result settlement through profile boundaries.

**Exit:** reward values have an explicit design rationale and are persisted idempotently.

---

## R4.2 — Hero unlock loop

Connect Story/rewards to hero availability.

Requirements:

- understandable unlock path
- no hidden impossible state
- Free Battle respects ownership
- profile normalization preserves valid unlocks

---

## R4.3 — Hero Archive

Replace the placeholder Heroes screen.

Minimum surface:

- hero identity
- role / engine
- passive
- abilities
- readiness/economy explanation
- unlocked/locked state
- mastery/sidegrade status

Keep it tactical and concise rather than inventory-like.

---

## R4.4 — Skill Fragment sidegrades

Introduce breadth only after the core five-hero roster is stable.

Preferred outcomes:

- alternate loadout choices
- different tactical approach
- no mandatory percentage-stat grind

**Exit:** progression changes available decisions rather than simply making old decisions numerically stronger.

---

# R5 — Game Feel Complete

## R5.1 — Tactical motion system

Create a small motion vocabulary shared by presentation components.

Priority:

- stone placement
- selected target/source
- CPU turn handoff
- ability resolve
- board-effect appear/expire
- result transition

Do not create a general-purpose animation framework beyond what these interactions need.

---

## R5.2 — Audio foundation

Add an audio service under `platform/` and a minimal sound set.

Requirements:

- browser autoplay-safe initialization
- mute/settings-ready boundary
- player/CPU stone distinction if useful
- invalid action
- ability resolve/readiness
- result sounds

---

## R5.3 — Haptics + mobile feedback

Add capability-detected haptic feedback where supported.

Never make haptics necessary to understand gameplay.

---

## R5.4 — Battle/result polish pass

Integrate motion/audio/haptics into one staging feel pass.

Check:

- no feedback obscures board state;
- no animation blocks input longer than intended;
- CPU cadence still feels natural;
- result actions remain immediate and clear.

---

# R6 — Closed Beta

## R6.1 — Diagnostics / analytics contract

Define event schema before selecting or expanding analytics infrastructure.

Minimum dimensions:

- build/version
- mode
- encounter
- hero matchup
- difficulty
- turn count
- duration
- action type
- ability id
- result

Avoid sending unnecessary personal data.

---

## R6.2 — Save migration / recovery

Required before wider testing:

- versioned migrations
- corrupted save fallback
- reset profile
- safe defaults
- debug/export snapshot

Add migration tests using old fixture shapes.

---

## R6.3 — Closed beta run

Start with a small controlled group.

Collect:

- comprehension issues
- Story churn points
- hero preference
- ability usage
- difficulty outliers
- device/browser failures
- qualitative “why did this happen?” feedback

---

## R6.4 — Beta balance + UX pass

Prioritize fixes by observed player friction rather than feature requests alone.

A requested feature should not automatically enter v1 if the underlying problem can be solved by better readability, pacing, or content tuning.

---

# R7 — Release Candidate

## R7.1 — Browser/performance QA

Validate agreed supported matrix and long-session behavior.

Check:

- boot time
- renderer fallback
- resize/safe area
- repeated rematches
- memory growth
- background/resume
- save persistence

---

## R7.2 — Accessibility / settings minimum

Based on beta findings, finalize required controls such as:

- audio mute/level
- reduced motion if needed
- readable state contrast
- non-color-only critical states
- reset data / diagnostics access

---

## R7.3 — Content freeze

Lock:

- five heroes
- ability set
- Story chapters
- progression rules
- UI structure

After this point, new ideas go to post-launch backlog unless they solve a release blocker.

---

## R7.4 — RC release procedure

Suggested promotion sequence:

```text
main
→ staging validation
→ v1.0.0-rc.N
→ production candidate smoke
→ final approval
→ v1.0.0
```

Required artifacts/process:

- release notes
- build SHA/version
- rollback path
- known issues list
- migration confirmation
- production smoke checklist

---

# R8 — v1.0 Production

## Launch checklist

- v1 scope matches roadmap lock
- CI green
- staging smoke green
- supported device/browser matrix green
- save migration green
- production build/base verification green
- production deploy green
- production browser smoke green
- no open P0
- accepted P1 list empty
- release notes published

After launch, use observed behavior to choose post-launch work.

---

# Cross-cutting workstreams

These are not separate milestones; they support the active milestone only when needed.

## Design System

Add components only when repeated product patterns exist.

Likely additions over time:

- disabled action state
- segmented selector
- selection card
- ability button
- economy meter
- turn indicator
- modal/sheet

Avoid building a complete abstract component library in advance.

## Content tooling

Prefer typed content definitions and validation before building a visual editor.

A content editor is justified only when hand-authored typed content becomes a measurable bottleneck.

## Performance

Profile before optimizing. Primary risks are likely renderer/device behavior and presentation churn, not pure board-rule computation.

## Security / backend

No backend exists in v1 scope. Do not introduce account/security architecture without a product requirement.

---

# Recommended PR sizing

Default target:

- one product behavior or architecture boundary per PR;
- tests included in the same PR;
- staging-visible changes easy to explain and verify;
- avoid PRs that simultaneously touch combat rules, progression economy, major presentation redesign, and deployment.

If a slice grows beyond a clear review narrative, split it by dependency rather than by arbitrary file count.

---

# Decision rules for new ideas

When a new feature appears during development, classify it with these questions:

1. Does it block the active milestone exit criteria?
2. Does it fix a P0/P1 staging/beta problem?
3. Does it strengthen RENZU's core board + hero identity?
4. Can it be postponed without creating rework?

If the answer to 1 and 2 is no, it normally belongs in a later milestone or post-launch backlog.

This rule is intended to protect the path to a complete v1 rather than suppress experimentation.
