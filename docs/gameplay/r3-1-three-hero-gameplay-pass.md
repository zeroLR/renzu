# R3.1 — Three-Hero Gameplay Pass

## Purpose

R3.1 validates the smallest active hero roster that can prove RENZU's hero layer adds meaningful tactical variety without changing the underlying turn topology.

Active roster:

- Vanguard
- Arcanist
- Shade

Architect and Swordmaster are not part of the active product roster. Blink is also retired from the active ability vocabulary because spending a full turn to relocate an existing stone has not produced enough tactical value under the fixed-turn contract.

## Fixed turn topology

Every successful player or CPU turn resolves exactly once:

```text
Player logical turn
  ↓
resolve placement / full-turn ability
  ↓
CPU THINKING
  ↓
CPU logical turn
  ↓
resolve placement / full-turn ability
  ↓
Player logical turn
```

A low-power placement support may be prepared before placement, but it must resolve inside the same final `PlaceAction`; it does not create an intermediate domain phase or another free-form action.

No active hero may add a triggered follow-up phase, chained after-step phase, or optional end-turn branch during this baseline pass.

## Current gameplay findings

Staging validation exposed an identity/conversion imbalance rather than a simple numerical imbalance:

- **Vanguard:** has the clearest win conversion. Building next to a closed four can make a later Charge finish too easy when cooldown is the only meaningful gate.
- **Arcanist:** Mana and spatial control are understandable, but the route from control to a forced winning continuation is not yet clear.
- **Shade:** Corrupt can repeatedly disrupt the opponent, but disruption does not yet convert cleanly into the Shade player's own winning pressure.
- **Cross-system:** abilities that directly alter stone topology are materially stronger than passive protection or temporary denial and need a correspondingly larger power budget.

The design work therefore focuses on **board-earned entitlement and action-cost fit**, not broad cooldown/Mana tuning.

## R3.1.1 — Hero Power Budget & Pattern Mastery

Authoritative spec: [`r3-1-1-hero-power-budget-pattern-mastery.md`](r3-1-1-hero-power-budget-pattern-mastery.md).

Delivered foundation:

- Blink retired cleanly;
- ability power classified by topology impact;
- semantic pattern events such as open-three, closed-four, open-four, and multi-threat;
- generic Pattern Mastery accumulation without extra actions;
- current passive reward behavior preserved.

R3.1.1 deliberately does not decide the final Charge/Phase/Corrupt mastery thresholds.

## R3.1.2 — Three-Hero Ability Rework

### Action-cost prototype

Authoritative spec: [`r3-1-2-action-cost-rework.md`](r3-1-2-action-cost-rework.md).

The first R3.1.2 slice validates that ability cost can differ without changing logical-turn ownership:

- **Guard:** placement support. Select an existing ally, then make a normal placement. Both resolve as one logical turn.
- **Seal:** remains a full-turn ability but persists for two complete opponent turns.
- **Charge / Bulwark / Phase / Corrupt:** remain full-turn abilities for this slice.

This separates low-topology support value from higher-impact board mutation before Pattern Mastery is connected to finishers.

### Vanguard — Convert

**Question:** What board achievement should entitle the player to a high-impact Charge conversion?

Goal: keep Charge recognizable and powerful without letting cooldown alone turn a near-four into a routine forced finish. Guard should support ordinary board development without competing directly with the value of placing a stone.

### Arcanist — Shape

**Question:** How does accumulated pattern value let the Arcanist remove enough valid responses that a normal Gomoku threat becomes forced?

Goal: establish a clear control → winning continuation loop without giving Arcanist a generic direct finisher. Seal's longer duration should create persistent precision control distinct from Phase's short burst zoning.

### Shade — Break → Exploit

**Question:** How does successful disruption create offensive leverage for Shade rather than only resetting the opponent?

Goal: preserve contact/removal identity while giving the hero a route from disruption to victory.

## Identity quality bar

R3.1 is successful when all three heroes share the same logical-turn structure but differ in:

1. **Board-reading priority** — what positions attract attention.
2. **Economy cadence** — how useful board play earns access to stronger actions.
3. **Conversion loop** — how setup becomes an actual path toward victory.
4. **Action cost** — whether an effect supplements or replaces a normal placement in proportion to its tactical impact.
5. **Counterplay** — how the opponent interrupts that loop through board decisions.
6. **CPU behavior** — Easy / Normal use the same engine in ways that support the intended identity.

Perfect matchup balance is not required at this gate. Strategic identity and understandable conversion are.

## Exit criteria

R3.1 closes when:

- all three heroes are playable on staging through the same fixed logical-turn topology;
- no retired Architect/Swordmaster/Blink gameplay path is active;
- low-power support and full-turn abilities have understandable action costs;
- each hero produces a recognizably different setup → entitlement → conversion loop;
- strong topology-changing abilities have board-earned or tactically constrained power budgets appropriate to their impact;
- each hero has understandable counterplay;
- Easy/Normal CPU behavior does not contradict the hero identity in common situations;
- no P0/P1 hero-specific or turn-flow blocker remains.

Only after this baseline is proven should RENZU evaluate a fourth/fifth hero or reconsider alternate turn topology.
