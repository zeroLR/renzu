# R3.1.2 — Action Cost Rework

## Purpose

R3.1.1 established that ability power cannot be balanced only by cooldown or resource cost. R3.1.2 begins applying that principle to the active three-hero roster while preserving RENZU's fixed logical-turn topology.

This first slice validates two changes from playtesting:

- Guard is useful when it supplements a normal placement instead of replacing it.
- Seal needs enough duration to create an actual spatial-control plan rather than a one-response inconvenience.

## Action-cost vocabulary

Active abilities currently use two action-cost classes.

### Placement support

A placement-support ability is selected before the normal placement, but the entire sequence resolves as one domain action and one logical turn.

```text
Select Support
→ Select Support Target
→ Place Stone
→ Resolve Placement + Support
→ Opponent Turn
```

There is no intermediate domain phase, no free-form second action, and no optional follow-up branch.

**Current placement-support ability:** Guard.

### Full-turn ability

A full-turn ability replaces the normal placement for that logical turn.

**Current examples:** Charge, Bulwark, Seal, Phase, Corrupt.

This classification is part of the ability power budget. A low-topology protection effect can justify a lower action cost than an effect that moves, removes, or places stones.

## Guard contract

Guard is no longer a standalone `AbilityAction`.

Player interaction:

```text
GUARD
→ select an existing unguarded friendly stone
→ GUARD SET · PLACE A STONE
→ choose any otherwise-legal placement
→ one logical turn resolves
```

Rules:

- selecting the Guard target does not mutate game state;
- an invalid final placement consumes nothing;
- the final domain action is a `PlaceAction` carrying Guard support;
- Guard cooldown is consumed only after the placement succeeds;
- existing cooldowns advance once, while the newly activated Guard cooldown starts at its full value;
- Guard protects the selected existing stone through the opponent response and until the end of the owner's following turn;
- Guard cannot be chained into Charge or another ability in the same turn.

CPU behavior does not expand every Guard-target × placement combination into the AI candidate set. The CPU first chooses its normal tactical action; when that action is a placement and Guard is ready, Vanguard may attach Guard to the strongest existing friendly line. The composite action is still validated by the same session resolver.

## Seal contract

Seal remains a full-turn Arcanist ability.

Its duration changes from one to **two opponent turns**:

```text
Arcanist: Seal point
→ Opponent turn #1: blocked
→ Arcanist turn: still blocked
→ Opponent turn #2: blocked
→ expire after opponent turn #2
```

This distinguishes Seal from Phase:

- **Seal:** precise, persistent denial of one intersection.
- **Phase:** immediate stone placement plus short burst denial around that placement.

## Fixed-turn invariant

This slice must not reintroduce the removed Swordmaster-style turn topology.

The authoritative runtime invariant remains:

```text
one successful PlaceAction or full-turn AbilityAction
→ exactly one logical turn consumed
→ opponent
```

Placement support is part of the PlaceAction; it is not a separate logical action.

## Deliberately deferred

This slice does not yet:

- gate Charge behind Pattern Mastery;
- change Phase entitlement;
- add Shade's second conversion tool;
- rebalance all cooldown/resource numbers;
- introduce additional placement-support abilities.

Those decisions should follow staging validation of this action-cost model.

## Exit criteria

- Guard targeting visibly transitions into a normal-placement step without handing control to CPU early;
- Guard + placement produces exactly one history placement and one turn handoff;
- invalid Guard support sequences do not partially mutate state;
- Vanguard CPU can use Guard support without expanding the general AI candidate surface;
- Seal blocks the chosen point for two complete opponent turns;
- Phase remains short-lived and distinct from Seal;
- tests, staging build, and asset verification pass;
- no P0/P1 turn-flow regression is introduced.
