# R3.1 — Three-Hero Gameplay Pass

## Purpose

R3.1 validates the smallest active hero roster that can prove RENZU's hero layer adds meaningful tactical variety without changing the underlying turn topology.

Active roster:

- Vanguard
- Arcanist
- Shade

Architect and Swordmaster are not part of the active product roster. Their previous gameplay introduced either turn-flow complexity or strategic overlap that should not remain in the baseline while the core hero model is still being evaluated.

## Fixed turn topology

For the active baseline, every legal player or CPU action completes exactly one logical turn:

```text
Player action
  ↓
resolve board / economy / passive
  ↓
CPU THINKING
  ↓
CPU action
  ↓
resolve board / economy / passive
  ↓
Player turn
```

No active hero may add a precommit phase, triggered follow-up phase, chained after-step phase, or optional end-turn branch.

Hero-specific turn-topology changes may be reconsidered only after the fixed-flow roster demonstrates enough depth through board manipulation, economy, passive timing, targeting, and counterplay.

## Vanguard — Cooldown / Defense

**Primary question:** Which existing stones should I protect, reposition, or push to stabilize a useful line?

**Economy rhythm:** Abilities are reliable but gated by cooldown recovery.

**Signature sequence:** Build a pattern → gain Fortified protection → use Blink / Charge to preserve or convert position.

**Counterplay:** Guarded stones trade mobility for protection; opponents can pressure elsewhere while key movement tools cool down.

**Identity risk to watch:** Vanguard already owns the clearest movement/push identity. New heroes should not duplicate this plan under a different resource name.

## Arcanist — Mana / Control

**Primary question:** Which patterns are worth building now to fund stronger spatial control later?

**Economy rhythm:** Pattern creation produces Mana; ability use spends Mana while Flow partially refunds ability activity.

**Signature sequence:** Create three/four pattern → gain Mana → use Seal / Phase to convert resource into board-space control.

**Counterplay:** Deny clean pattern-building and force low-Mana defensive turns.

## Shade — Pressure / Disruption

**Primary question:** When is it worth playing near enemy stones to create enough Pressure for disruption?

**Economy rhythm:** Pressure grows through contested adjacency rather than isolated pattern building.

**Signature sequence:** Enter contested space → build Pressure → Corrupt a tactically important supported enemy stone.

**Counterplay:** Maintain spacing, reduce valuable contact points, and avoid exposing a single stone whose removal collapses multiple threats.

## Identity quality bar

R3.1 is successful when all three heroes share the same turn structure but still differ in:

1. **Board-reading priority** — what positions attract attention.
2. **Economy cadence** — when abilities become available.
3. **Signature sequence** — the repeatable 2–3 decision pattern that expresses the hero.
4. **Counterplay** — how an opponent can disrupt that plan through board decisions.
5. **CPU behavior** — Easy / Normal should use the same engine in ways that support, not contradict, the hero identity.

Perfect matchup balance is not required at this gate. Strategic identity is.

## Deferred design question

After Vanguard / Arcanist / Shade are proven under the fixed turn topology, evaluate whether hero depth is sufficient through:

- board manipulation;
- passive triggers;
- resource/cooldown constraints;
- temporary board effects;
- targeting restrictions;
- tactical opportunity and counterplay.

Only then decide whether a future hero merits changing action topology. Such a change should be treated as a product-level combat-flow decision, not simply another ability mechanic.

## Exit criteria

- all three heroes are selectable on staging for validation;
- normal production ownership rules remain intact;
- every successful action ends the acting side's turn exactly once;
- no Step / Sever / follow-up timing state remains in the active runtime;
- each hero produces a recognizably different match plan on the same board;
- no P0/P1 hero-specific or turn-flow blocker remains.
