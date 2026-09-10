# Fixed-Turn Hero Baseline

## Decision

RENZU currently standardizes combat on one fixed **logical-turn topology**:

```text
Player logical turn → CPU logical turn → Player logical turn
```

A logical turn resolves its board mutation, economy, passive effects, board-effect lifetime, and turn handoff exactly once.

Most abilities are full-turn actions that replace the normal placement. A low-power support may instead be prepared and resolved inside the same final `PlaceAction`; this does not create another logical action or an intermediate domain phase.

Current example:

```text
Guard target selection
→ normal placement
→ resolve PlaceAction + Guard support once
→ CPU logical turn
```

## Why

The active product needs to prove how much hero variety can come from the shared board itself before hero-specific phases are introduced.

The current baseline keeps three strategically different engines:

- Vanguard — cooldown / defense / conversion
- Arcanist — Mana / spatial control
- Shade — Pressure / disruption

This lets future design work compare board manipulation, passive triggers, resource cadence, action cost, temporary effects, and targeting restrictions without also changing turn ownership or creating hero-specific follow-up phases.

## Constraint

No active v1 hero should introduce precommit, triggered follow-up, after-step, optional end-turn, or chained free-form action phases during this baseline.

Placement support is allowed only when it is atomic with the final turn action: selecting/preparing support must not mutate authoritative game state, and invalid/cancelled preparation must not partially consume economy or effects.

A future hero-specific topology change must be justified as a combat-flow product decision with clear strategic value, counterplay, UX readability, AI behavior, and testability. It should not be introduced only to make a hero mechanically different.
