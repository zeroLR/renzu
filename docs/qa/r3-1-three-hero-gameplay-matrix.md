# R3.1 Three-Hero Gameplay Matrix

Use this matrix on staging while R3.1 identity work is active.

## Shared fixed-turn flow

- [ ] player logical turn hands off to CPU exactly once
- [ ] CPU THINKING appears before one CPU logical turn
- [ ] CPU action returns control to player when the match continues
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

## R3.1.2 Action cost

### Guard placement support

- [ ] Guard is unavailable before Vanguard owns a valid stone to protect
- [ ] selecting Guard highlights only valid unguarded friendly targets
- [ ] selecting a Guard target keeps the match in the player's logical turn
- [ ] HUD changes to `GUARD SET · PLACE A STONE`
- [ ] the next legal placement resolves Guard + placement together
- [ ] exactly one placement is added to action history and control passes to CPU once
- [ ] Guard cooldown starts at its full value after the composite turn
- [ ] cancelling Guard before placement leaves board/economy unchanged
- [ ] Vanguard CPU can attach Guard to a normal placement without a second CPU action

### Seal persistence

- [ ] Seal blocks the selected intersection during opponent turn #1
- [ ] Seal remains visible/blocked through the following Arcanist turn
- [ ] Seal blocks the same intersection during opponent turn #2
- [ ] Seal expires after opponent turn #2
- [ ] Phase Flame still expires after its short one-opponent-turn window
- [ ] Seal and Phase now feel tactically distinct: persistent precision vs short burst zoning

## Vanguard

- [ ] qualifying pattern visibly produces Fortified Guard
- [ ] Guard support feels useful without competing against the value of making a normal placement
- [ ] Charge remains a clear conversion tool
- [ ] cooldown pacing is readable without extra logical-turn phases
- [ ] observe whether Charge remains too easy to convert from a near-winning shape
- [ ] identify which board-earned prerequisite would make Charge feel earned rather than merely cooled down

## Arcanist

- [ ] qualifying patterns naturally produce Mana
- [ ] low-Mana and high-Mana board states lead to different decisions
- [ ] two-turn Seal / short Phase create a clear spatial-control plan
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
- [ ] action cost feels proportional to tactical impact
- [ ] no two heroes feel like the same plan with a different meter
- [ ] each hero remains understandable under the same logical-turn topology

## Exit

R3.1 closes only after later R3.1.2 work gives all three heroes a distinct and understandable setup → entitlement → conversion loop. This action-cost slice closes when Guard placement support and two-opponent-turn Seal are stable in CI and staging without reintroducing multi-action turn topology.
