# R3.1 Three-Hero Gameplay Matrix

Use this matrix on staging while R3.1 identity work is active.

## Shared fixed-turn flow

- [ ] player action always hands off to CPU exactly once
- [ ] CPU THINKING appears before one CPU action
- [ ] CPU action always returns control to player when the match continues
- [ ] no STEP ARMED / FOLLOW-UP / END TURN state appears
- [ ] ability targeting remains readable and cancellable
- [ ] board effects expire on the expected logical turn
- [ ] Blink is absent from Hero loadouts, targeting, HUD copy, and Story concepts

## R3.1.1 Pattern grammar

- [ ] open-three / closed-three distinctions match actual open endpoints
- [ ] open-four / closed-four distinctions match actual open endpoints
- [ ] Seal / Flame on an endpoint prevents that endpoint from counting as open
- [ ] a multi-direction placement can produce a multi-threat event
- [ ] winning five does not generate further mastery entitlement

## Vanguard

- [ ] qualifying pattern visibly produces Fortified Guard
- [ ] Guard / Charge create meaningful protection and conversion decisions
- [ ] cooldown pacing is readable without extra turn phases
- [ ] observe whether Charge remains too easy to convert from a near-winning shape
- [ ] identify which board-earned prerequisite would make Charge feel earned rather than merely cooled down

## Arcanist

- [ ] qualifying patterns naturally produce Mana
- [ ] low-Mana and high-Mana board states lead to different decisions
- [ ] Seal / Phase create a clear spatial-control plan
- [ ] Flow refund is understandable through normal HUD feedback
- [ ] identify whether control creates a recognizable forced continuation toward victory

## Shade

- [ ] enemy adjacency produces Pressure in a predictable way
- [ ] Corrupt rewards tactically useful contact instead of generic ability use
- [ ] spacing provides understandable counterplay
- [ ] observe whether repeated disruption produces offensive leverage or only prolongs the match
- [ ] one active ability remains usable in the current HUD without placeholder second-skill pressure

## Cross-roster identity

- [ ] Vanguard reads protection / conversion opportunities first
- [ ] Arcanist reads pattern-to-resource / space-control opportunities first
- [ ] Shade reads contested-contact / removal opportunities first
- [ ] topology-changing abilities feel materially more valuable than protection/denial abilities
- [ ] no two heroes feel like the same plan with a different meter
- [ ] each hero remains understandable under the same turn topology

## Exit

R3.1 closes only after R3.1.2 gives all three heroes a distinct and understandable setup → entitlement → conversion loop. R3.1.1 itself closes when Blink retirement, semantic Pattern Events, Pattern Mastery grammar, and the power-budget specification are stable and regression-tested.
