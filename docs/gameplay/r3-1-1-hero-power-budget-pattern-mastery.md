# R3.1.1 — Hero Power Budget & Pattern Mastery

## Purpose

R3.1.1 establishes a shared design grammar for hero power before RENZU adds or rewrites more abilities.

The fixed-turn contract remains authoritative:

```text
Player action
→ resolve
→ CPU action
→ resolve
→ Player
```

Hero depth should first come from what is earned on the board, how that value is converted, and what counterplay remains. This slice does not introduce extra actions, follow-up phases, or hero-specific turn topology.

## Observed gameplay findings

Current staging play indicates three different problems rather than one generic balance problem:

| Hero | Observed strength | Identity gap |
| --- | --- | --- |
| Vanguard | converts an existing near-winning shape into victory very efficiently with Charge | conversion is available too directly; cooldown alone does not price the tactical power |
| Arcanist | has Mana generation and spatial control | control does not yet expose a clear route from board setup to a winning continuation |
| Shade | can repeatedly disrupt enemy plans with Corrupt | disruption can prolong the match without creating a clear disruption → own advantage → win conversion |

This means R3.1 should not be solved by adjusting resource costs alone. Each hero needs a coherent **setup → entitlement → conversion → counterplay** loop.

## Blink retirement

Blink is removed from the active ability vocabulary.

Within the fixed-turn baseline, spending a full logical turn to relocate one existing friendly stone is usually dominated by placing a new stone. Making Blink competitive would likely require free-action or special-timing treatment, which conflicts with the current goal of proving depth without changing turn topology.

The active ability set after removal is:

- Vanguard: Guard / Charge / Bulwark
- Arcanist: Seal / Phase
- Shade: Corrupt

Loadouts may contain one or two active abilities during the identity pass. A missing second button is preferable to introducing a weak or redundant placeholder ability.

## Ability power budget

Ability cost should be proportional to how directly it changes the tactical truth of the five-in-a-row board.

### Tier A — Protection

Examples: Guard, Bulwark.

Changes survivability or interaction constraints around existing stones without creating a new stone or removing an enemy stone.

**Default budget:** cooldown/resource gating can be sufficient.

### Tier B — Space denial

Examples: Seal and temporary blocking effects.

Changes where future moves may occur but does not directly change stone ownership or count.

**Default budget:** resource or pattern-derived economy is normally sufficient; duration is part of the power budget.

### Tier C — Self topology change

Moves or transforms existing friendly topology without increasing stone count.

No active R3.1 ability currently needs this tier after Blink retirement.

**Default budget:** should require a meaningful board condition if reintroduced because the effect can convert existing shapes immediately.

### Tier D — Enemy topology change

Examples: Charge push, Corrupt removal.

Directly changes enemy stone position or existence and can invalidate threats immediately.

**Default budget:** cooldown/resource alone should not automatically be assumed sufficient. Strong implementations should usually require a board-earned prerequisite or constrained tactical condition.

### Tier E — Placement plus additional effect

Example: Phase places a friendly stone and creates Flame denial.

This combines normal turn value with an additional board effect and therefore has very high conversion potential.

**Default budget:** should require meaningful board-earned economy/entitlement and clear counterplay.

## Pattern Event grammar

Placement evaluation remains a shared game rule. Hero systems consume facts; they do not rescan the board independently.

For a contiguous exact three or four crossing the newly placed stone, the evaluator records how many endpoints remain tactically open. An endpoint is open only when it is:

- inside the board;
- empty; and
- not temporarily blocked by a board effect.

The shared event vocabulary is:

- `open-three` — exact contiguous three with two open endpoints
- `closed-three` — exact contiguous three with one open endpoint
- `open-four` — exact contiguous four with two open endpoints
- `closed-four` — exact contiguous four with one open endpoint
- `multi-threat` — one placement creates qualifying patterns in at least two directions

A winning five suppresses further pattern reward/mastery events for that placement because the match is already resolved.

This vocabulary intentionally starts with **observable contiguous patterns**. More advanced Gomoku concepts such as broken threes, jump fours, or compound threat classes should only be added when an actual hero/content requirement needs them.

## Pattern Mastery contract

Pattern Mastery is a generic board-earned entitlement mechanism:

```text
qualifying Pattern Event
        ↓
Mastery +N
        ↓
threshold reached
        ↓
POWER READY
        ↓
normal ability action consumes entitlement
```

Important constraints:

1. Mastery never grants a free action by itself.
2. Mastery never changes turn ownership.
3. Progress is capped at the threshold unless a future design explicitly requires overflow.
4. Which events count is defined by a hero/power rule, not by the pattern evaluator.
5. Spending a ready entitlement resets that entitlement; exact hero integration is deferred to R3.1.2.
6. Pattern Mastery should reward useful Gomoku play rather than ask players to construct shapes with no five-in-a-row value merely to charge a meter.

## Candidate hero loops for R3.1.2

These are design targets, not final implementation specifications.

### Vanguard — Convert

```text
useful pattern / threat achievement
→ earn conversion entitlement
→ Charge becomes available
→ convert an existing line into a tactical finish
```

Goal: preserve Charge as a recognizable finisher while removing the current pattern where cooldown recovery alone makes a near-four trivially convertible.

### Arcanist — Shape

```text
build productive pattern
→ earn Mana / mastery
→ deny a key response or create a constrained continuation
→ win through the resulting normal board threat
```

Goal: Arcanist should not need a direct damage/finisher equivalent. Its win plan should be that control removes enough correct answers for a normal threat to become forced.

### Shade — Break → Exploit

```text
contest enemy topology
→ earn Pressure
→ Corrupt a meaningful threat
→ convert successful disruption into own attacking leverage
```

Goal: stop Shade from being only an attrition engine. The second half of the loop must create offensive leverage without granting free stones or extra turns.

## R3.1.1 exit criteria

R3.1.1 is complete when:

- Blink is absent from the active runtime, Hero definitions, legal-action surface, HUD, and Story concepts;
- one-ability and two-ability validation loadouts are legal;
- placement outcomes expose open/closed three/four event semantics and multi-direction threat events;
- temporary blocked endpoints are not classified as open;
- generic Pattern Mastery accumulation can count selected event kinds, cap at a threshold, become ready, and be spent without changing turn topology;
- the ability power-tier model and three observed hero identity gaps are documented;
- existing Vanguard / Arcanist / Shade passive reward behavior remains unchanged;
- full tests and staging build remain green.

R3.1.1 does **not** assign final mastery thresholds, rebalance Charge/Phase/Corrupt, add Shade's next conversion mechanic, or redesign battle HUD meters. Those belong to R3.1.2 after this grammar is stable.
