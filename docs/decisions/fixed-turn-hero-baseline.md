# Fixed-Turn Hero Baseline

## Decision

RENZU currently standardizes combat on one fixed action topology:

```text
Player action → CPU turn → CPU action → Player turn
```

Every successful action resolves its board mutation, economy, passive effects, board-effect lifetime, and turn handoff exactly once.

## Why

The active product needs to prove how much hero variety can come from the shared board itself before hero-specific phases are introduced.

The current baseline keeps three strategically different engines:

- Vanguard — cooldown / defense / repositioning
- Arcanist — Mana / spatial control
- Shade — Pressure / disruption

This lets future design work compare board manipulation, passive triggers, resource cadence, temporary effects, and targeting restrictions without also changing the match's turn topology.

## Constraint

No active v1 hero should introduce precommit, triggered follow-up, after-step, or chained action phases during this baseline.

A future hero-specific topology change must be justified as a combat-flow product decision with clear strategic value, counterplay, UX readability, AI behavior, and testability. It should not be introduced only to make a hero mechanically different.
